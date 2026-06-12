#!/usr/bin/env python3
"""把所有 preset 各渲染一遍，输出 out/preset_all/<preset>.mp4（720x480）。

与 render_all.py 互为镜像：render_all 固定 bg-anim、随机 preset；本脚本固定
preset 与背景，逐个展示各 preset 自带的配色/特效（不覆盖字色，仅字体随机）：
    node src/cli.mjs --audio example/cn-3.mp3 --lyrics example/cn-3.srt \\
        --title "歌名" --preset <name> --bg-anim digital-dust --no-bg-anim-beat \\
        --font random --res 720x480 --output out/preset_all/<name>.mp4

增量：同名 mp4 已存在则跳过（可中断后续跑）。单个失败不影响其余，末尾汇总。

用法：
    python3 scripts/preset_all.py                 # 渲染全部 preset
    python3 scripts/preset_all.py fx-001-word-by  # 仅渲染指定 preset（可多个，用于测试）
"""
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PRESET_DIR = REPO / "src" / "preset"
OUT_DIR = REPO / "out" / "preset_all"

AUDIO = "example/cn-3.mp3"
LYRICS = "example/cn-3.srt"
TITLE = " 沧海一声笑"
RES = "720x480"


def list_presets() -> list[str]:
    """src/preset/ 下所有含 index.ts 的目录名（跳过下划线开头的共享/引擎目录），按名排序。"""
    if not PRESET_DIR.is_dir():
        return []
    return sorted(
        d.name for d in PRESET_DIR.iterdir()
        if d.is_dir() and not d.name.startswith("_") and (d / "index.ts").exists()
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    presets = list_presets()
    if not presets:
        print(f"未找到任何 preset（{PRESET_DIR} 下无含 index.ts 的目录）")
        sys.exit(1)

    # 可选位置参数：仅渲染指定的 preset（便于只测一个视频）。
    wanted = sys.argv[1:]
    if wanted:
        unknown = [p for p in wanted if p not in presets]
        if unknown:
            print(f"未知 preset：{', '.join(unknown)}")
            print(f"可用 preset 共 {len(presets)} 个。")
            sys.exit(1)
        presets = wanted

    print(f"共 {len(presets)} 个 preset 待渲染 → {OUT_DIR}（{RES}）\n")
    ok = fail = skip = 0
    failures: list[str] = []

    for i, preset in enumerate(presets, 1):
        out_file = OUT_DIR / f"{preset}.mp4"
        prefix = f"[{i}/{len(presets)}] {preset}"
        if out_file.exists():
            skip += 1
            print(f"{prefix} → 跳过（已存在）")
            continue

        print(f"{prefix} → 渲染中…")
        # 固定背景、随机字体；不传字色 → 保留各 preset 自带配色/描边/发光。
        cmd = [
            "node", "src/cli.mjs",
            "--audio", AUDIO,
            "--lyrics", LYRICS,
            "--title", TITLE,
            "--preset", preset,
            "--bg-anim", "digital-dust",
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
            failures.append(preset)
            print(f"{prefix} → ✗ 失败（exit {result.returncode}）")

    print(f"\n完成：共 {len(presets)}，渲染 {ok}，跳过 {skip}，失败 {fail}")
    if failures:
        print("失败列表：" + ", ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
