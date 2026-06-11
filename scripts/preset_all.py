#!/usr/bin/env python3
"""把所有 preset 各渲染一遍，输出 out/preset_all/<preset>.mp4（720x480）。

与 render_all.py 互为镜像：render_all 固定 bg-anim、随机 preset；本脚本固定
preset、随机 bg-anim/font/文字颜色（沿用基准命令）：
    node src/cli.mjs --audio example/cn-3.mp3 --lyrics example/cn-3.srt \\
        --title "歌名" --preset <name> --bg-anim random --no-bg-anim-beat --font random \\
        --font-fg-color <随机CSS颜色> --font-bg-color <随机CSS颜色> \\
        --res 720x480 --output out/preset_all/<name>.mp4

增量：同名 mp4 已存在则跳过（可中断后续跑）。单个失败不影响其余，末尾汇总。

用法：
    python3 scripts/preset_all.py                 # 渲染全部 preset
    python3 scripts/preset_all.py fx-001-word-by  # 仅渲染指定 preset（可多个，用于测试）
"""
import random
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

# CSS 命名颜色（CSS3 extended color keywords），去掉 black（文字颜色不能为黑色）。
CSS_COLORS = [
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque",
    "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue",
    "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson",
    "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen",
    "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid",
    "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
    "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray",
    "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia",
    "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green",
    "greenyellow", "honeydew", "hotpink", "indianred", "indigo", "ivory",
    "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon",
    "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray",
    "lightgreen", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue",
    "lightslategray", "lightsteelblue", "lightyellow", "lime", "limegreen",
    "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue",
    "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue",
    "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue",
    "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace",
    "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod",
    "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff",
    "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple", "red",
    "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen",
    "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "snow",
    "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
    "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
]


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
        # bg-anim、font 随机；填充色与勾边色随机且互不相同（相同会让勾边不可见）。
        fg_color, bg_color = random.sample(CSS_COLORS, 2)
        cmd = [
            "node", "src/cli.mjs",
            "--audio", AUDIO,
            "--lyrics", LYRICS,
            "--title", TITLE,
            "--preset", preset,
            "--bg-anim", "random",
            "--no-bg-anim-beat",
            "--font", "random",
            "--font-fg-color", fg_color,
            "--font-bg-color", bg_color,
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
