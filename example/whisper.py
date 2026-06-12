import sys
import json
from pathlib import Path

import mlx_whisper


def sec_to_srt_time(sec: float) -> str:
    ms = int(round(sec * 1000))
    h = ms // 3_600_000
    ms %= 3_600_000
    m = ms // 60_000
    ms %= 60_000
    s = ms // 1000
    ms %= 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(result: dict, out_path: str):
    lines = []
    for i, seg in enumerate(result.get("segments", []), 1):
        start = float(seg["start"])
        end = float(seg["end"])
        text = seg["text"].strip()

        # 兜底过滤：零时长、极短、空文本
        if not text:
            continue
        if end <= start:
            continue
        if end - start < 0.15:
            continue

        lines.append(str(i))
        lines.append(f"{sec_to_srt_time(start)} --> {sec_to_srt_time(end)}")
        lines.append(text)
        lines.append("")

    Path(out_path).write_text("\n".join(lines), encoding="utf-8")


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcribe_mlx.py input.mp3 [output.srt]")
        sys.exit(1)

    audio = sys.argv[1]
    out_srt = sys.argv[2] if len(sys.argv) >= 3 else Path(audio).with_suffix(".srt")

    result = mlx_whisper.transcribe(
        audio,
        path_or_hf_repo="mlx-community/whisper-large-v3-turbo",
        language="zh",
        temperature=0.0,

        # 关键：减少尾部重复幻觉
        condition_on_previous_text=False,
        compression_ratio_threshold=2.0,
        logprob_threshold=-0.8,
        no_speech_threshold=0.8,

        # 有些 mlx-whisper 版本未实现 hallucination_silence_threshold；
        # 如果报 TypeError，就删掉这一行。
        word_timestamps=True,
        hallucination_silence_threshold=1.0,
    )

    write_srt(result, str(out_srt))
    print(f"saved: {out_srt}")


if __name__ == "__main__":
    main()
