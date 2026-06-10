#!/usr/bin/env python3
"""把所有 bg-anim 各渲染一遍，输出 out/render_all/<label>.mp4（720x480）。

每个 bg-anim 固定为该 label，preset 与 font 随机（沿用基准命令）：
    node src/cli.mjs --audio example/cn-3.mp3 --lyrics example/cn-3.srt \\
        --title "歌名" --preset random --bg-anim <label> --no-bg-anim-beat --font random \\
        --res 720x480 --output out/render_all/<label>.mp4

增量：同名 mp4 已存在则跳过（可中断后续跑）。单个失败不影响其余，末尾汇总。

用法：
    python3 scripts/render_all.py
"""
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ANIMBG = REPO / "src" / "animbg"
OUT_DIR = REPO / "out" / "render_all"

AUDIO = "example/cn-3.mp3"
LYRICS = "example/cn-3.srt"
TITLE = " 沧海一声笑"
RES = "720x480"

# 跳过的 bg-anim（渲染效果不佳，不纳入批量）。
EXCLUDE = {"an-adamfx", "aderrasi-storm"}


def list_labels() -> list[str]:
    """src/animbg/ 下所有含 index.html 的目录名（去掉 EXCLUDE），按名排序。"""
    if not ANIMBG.is_dir():
        return []
    return sorted(
        d.name for d in ANIMBG.iterdir()
        if d.is_dir() and (d / "index.html").exists() and d.name not in EXCLUDE
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    labels = list_labels()
    if not labels:
        print(f"未找到任何 bg-anim（{ANIMBG} 下无含 index.html 的目录）")
        sys.exit(1)

    print(f"共 {len(labels)} 个 bg-anim 待渲染 → {OUT_DIR}（{RES}）\n")
    ok = fail = skip = 0
    failures: list[str] = []

    for i, label in enumerate(labels, 1):
        out_file = OUT_DIR / f"{label}.mp4"
        prefix = f"[{i}/{len(labels)}] {label}"
        if out_file.exists():
            skip += 1
            print(f"{prefix} → 跳过（已存在）")
            continue

        print(f"{prefix} → 渲染中…")
        cmd = [
            "node", "src/cli.mjs",
            "--audio", AUDIO,
            "--lyrics", LYRICS,
            "--title", TITLE,
            "--preset", "random",
            "--bg-anim", label,
            "--no-bg-anim-beat",
            "--font", "random",
            "--res", RES,
            "--output", str(out_file),
        ]
        result = subprocess.run(cmd, cwd=REPO)
        if result.returncode == 0 and out_file.exists():
            ok += 1
            print(f"{prefix} → ✓ {out_file.name}")
        else:
            fail += 1
            failures.append(label)
            print(f"{prefix} → ✗ 失败（exit {result.returncode}）")

    print(f"\n完成：共 {len(labels)}，渲染 {ok}，跳过 {skip}，失败 {fail}")
    if failures:
        print("失败列表：" + ", ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
