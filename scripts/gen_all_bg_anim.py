#!/usr/bin/env python3
"""把所有 bg-anim 各渲染一遍，输出 out/render_all/<label>.mp4（720x480）。

每个 bg-anim 固定为该 label，preset、font 与文字颜色随机（沿用基准命令）：
    node src/cli.mjs --audio example/cn-3.mp3 --lyrics example/cn-3.srt \\
        --title "歌名" --preset random --bg-anim <label> --no-bg-anim-beat --font random \\
        --font-fg-color <随机CSS颜色> --font-bg-color <随机CSS颜色> \\
        --res 720x480 --output out/render_all/<label>.mp4

增量：同名 mp4 已存在则跳过（可中断后续跑）。单个失败不影响其余，末尾汇总。

用法：
    python3 scripts/gen_all_bg_anim.py
"""
import random
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
        # 填充色与勾边色随机且互不相同（相同会让勾边不可见）。
        fg_color, bg_color = random.sample(CSS_COLORS, 2)
        cmd = [
            "node", "src/cli.mjs",
            "--audio", AUDIO,
            "--lyrics", LYRICS,
            "--title", TITLE,
            "--preset", "random",
            "--bg-anim", label,
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
            failures.append(label)
            print(f"{prefix} → ✗ 失败（exit {result.returncode}）")

    print(f"\n完成：共 {len(labels)}，渲染 {ok}，跳过 {skip}，失败 {fail}")
    if failures:
        print("失败列表：" + ", ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
