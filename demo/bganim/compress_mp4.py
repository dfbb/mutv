#!/usr/bin/env python3
"""把本目录所有 mp4 压缩到 30M 以下（必要时降分辨率）。

用法:
    ./compress_mp4.py                  压缩 >30M 的文件到 compressed/
    ./compress_mp4.py --target-mb 20   自定义目标大小
    ./compress_mp4.py --preset fast    更快(同码率画质略降)
"""
import argparse
import subprocess
import sys
import tempfile
import os
from pathlib import Path


def ffprobe(args):
    return subprocess.run(
        ["ffprobe", "-v", "error", *args],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def get_duration(f):
    return float(ffprobe(["-show_entries", "format=duration", "-of", "csv=p=0", str(f)]))


def get_resolution(f):
    out = ffprobe(["-select_streams", "v:0", "-show_entries",
                   "stream=width,height", "-of", "csv=p=0", str(f)])
    w, h = out.split(",")[:2]
    return int(w), int(h)


def pick_max_w(vbps):
    """按视频码率决定最大宽度(码率低则降分辨率保画质)。"""
    if vbps >= 3_000_000:
        return 1920
    if vbps >= 1_500_000:
        return 1280
    if vbps >= 800_000:
        return 854
    return 640


def compress(f, outdir, target_mb, audio_kbps, safety, preset):
    size = f.stat().st_size
    limit = target_mb * 1024 * 1024
    if size <= limit:
        print(f"✓ 跳过(已 ≤{target_mb}M): {f.name}")
        return "skipped"

    dur = get_duration(f)
    w, h = get_resolution(f)

    # 目标总码率(bps) = 目标大小*8 / 时长, 乘安全系数; 再减音频
    total_bps = int(target_mb * 1024 * 1024 * 8 / dur * safety)
    vbps = max(total_bps - audio_kbps * 1000, 100_000)  # 视频码率下限 100k
    maxw = pick_max_w(vbps)
    vf = f"scale='min({maxw},iw)':-2:flags=lanczos"  # 只缩不放, 保宽高比, 宽高取偶数

    print(f"→ 压缩: {f.name}  ({w}x{h}, {dur:.0f}s, {size//1024//1024}M)  "
          f"目标 vbps={vbps//1000}k maxW={maxw}")

    out = outdir / f.name
    with tempfile.TemporaryDirectory() as tmp:
        passlog = os.path.join(tmp, "ff2pass")
        common = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(f),
                  "-c:v", "libx264", "-b:v", str(vbps), "-passlogfile", passlog,
                  "-vf", vf, "-preset", preset]
        try:
            subprocess.run(common + ["-pass", "1", "-an", "-f", "mp4", os.devnull], check=True)
            subprocess.run(common + ["-pass", "2", "-c:a", "aac",
                                     "-b:a", f"{audio_kbps}k", "-movflags", "+faststart",
                                     str(out)], check=True)
        except subprocess.CalledProcessError:
            print(f"   ✘ 失败: {f.name}")
            return "failed"

    print(f"   ✔ 完成: {out.stat().st_size//1024//1024}M  → {out}")
    return "done"


def main():
    p = argparse.ArgumentParser(description="把本目录所有 mp4 压缩到目标大小以下")
    p.add_argument("--target-mb", type=int, default=30, help="目标上限(MB), 默认 30")
    p.add_argument("--audio-kbps", type=int, default=128, help="音频码率, 默认 128")
    p.add_argument("--safety", type=float, default=0.94, help="安全系数, 默认 0.94")
    p.add_argument("--preset", default="medium", help="x264 preset, 默认 medium")
    p.add_argument("--outdir", default="compressed", help="输出目录(不覆盖原文件)")
    p.add_argument("--dir", default=".", help="待处理目录, 默认当前目录")
    a = p.parse_args()

    src = Path(a.dir)
    outdir = src / a.outdir
    outdir.mkdir(exist_ok=True)

    files = sorted(src.glob("*.mp4"))
    if not files:
        print("未找到 mp4 文件")
        return

    stats = {"done": 0, "skipped": 0, "failed": 0}
    for f in files:
        if f.resolve().parent == outdir.resolve():
            continue  # 跳过输出目录里的文件
        stats[compress(f, outdir, a.target_mb, a.audio_kbps, a.safety, a.preset)] += 1

    print("---------------------------------------------")
    print(f"共 {len(files)} 个 | 压缩 {stats['done']} | "
          f"跳过 {stats['skipped']} | 失败 {stats['failed']}")
    print(f"输出目录: {outdir}/")


if __name__ == "__main__":
    sys.exit(main())
