# /// script
# requires-python = ">=3.9"
# dependencies = ["fonttools", "brotli", "pillow", "arabic-reshaper", "python-bidi"]
# ///
"""把 font/ 各语言子目录下的字体渲染成预览 jpg。

- en：26 个字母大小写
- zh_CN：毛主席《沁园春·雪》（简体）
- zh_TW / zh_HK：毛主席《沁园春·雪》（繁体）
- ja：いろは歌 + 假名 + 汉字
- kr：韩文全字母句 + 谚文
- ar：阿拉伯文全字母句（自动整形 + RTL 右对齐）

预览图直接输出为 jpg，与字体文件同目录（如 zh_CN/Foo.woff2 -> zh_CN/Foo.jpg）。
多进程并行(绕开 GIL)，最多并发 8。增量：同名 jpg 已存在则跳过。

用法：
    uv run render_preview.py
"""
import io
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

# 字体目录在仓库根的 font/（脚本位于 scripts/fonts/）。
FONT_ROOT = Path(__file__).resolve().parents[2] / "font"
MAX_WORKERS = 8
JPG_QUALITY = 92

EN_LINES = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
]
ZH_CN_LINES = [  # 简体
    "沁园春·雪    毛泽东",
    "北国风光，千里冰封，万里雪飘。",
    "望长城内外，惟余莽莽；大河上下，顿失滔滔。",
    "山舞银蛇，原驰蜡象，欲与天公试比高。",
    "须晴日，看红装素裹，分外妖娆。",
    "江山如此多娇，引无数英雄竞折腰。",
    "惜秦皇汉武，略输文采；唐宗宋祖，稍逊风骚。",
    "一代天骄，成吉思汗，只识弯弓射大雕。",
    "俱往矣，数风流人物，还看今朝。",
]
ZH_TW_LINES = [  # 繁体（zh_TW / zh_HK 共用）
    "沁園春·雪    毛澤東",
    "北國風光，千里冰封，萬里雪飄。",
    "望長城內外，惟餘莽莽；大河上下，頓失滔滔。",
    "山舞銀蛇，原馳蠟象，欲與天公試比高。",
    "須晴日，看紅裝素裹，分外妖嬈。",
    "江山如此多嬌，引無數英雄競折腰。",
    "惜秦皇漢武，略輸文采；唐宗宋祖，稍遜風騷。",
    "一代天驕，成吉思汗，只識彎弓射大雕。",
    "俱往矣，數風流人物，還看今朝。",
]
JA_LINES = [
    "いろはにほへと ちりぬるを",
    "わかよたれそ つねならむ",
    "うゐのおくやま けふこえて",
    "あさきゆめみし ゑひもせす",
    "アイウエオ カキクケコ サシスセソ",
    "日本語 永字八法 春はあけぼの",
]
KR_LINES = [
    "다람쥐 헌 쳇바퀴에 타고파",
    "키스의 고유 조건은 입술끼리 만나야",
    "하고 특별한 기술은 필요치 않다",
    "가나다라마바사 아자차카타파하",
    "한글 훈민정음 안녕하세요",
]
AR_LINES = [
    "نص حكيم له سر قاطع وذو شأن",
    "عظيم مكتوب على ثوب أخضر",
    "أبجد هوز حطي كلمن سعفص قرشت",
    "السلام عليكم ورحمة الله",
]

# 子目录 -> (文案, 字号, 是否 RTL 阿拉伯文)
SPECS = {
    "en": (EN_LINES, 44, False),
    "zh_CN": (ZH_CN_LINES, 40, False),
    "zh_TW": (ZH_TW_LINES, 40, False),
    "zh_HK": (ZH_TW_LINES, 40, False),
    "ja": (JA_LINES, 40, False),
    "kr": (KR_LINES, 40, False),
    "ar": (AR_LINES, 44, True),
}

PADDING = 40
FG = (20, 20, 20)
BG = (255, 255, 255)


def load_font(woff2_path: Path, size: int) -> ImageFont.FreeTypeFont:
    """woff2 -> 内存 ttf -> Pillow 字体，规避 FreeType 对 woff2 支持的不确定性。"""
    tt = TTFont(woff2_path)
    tt.flavor = None
    # 个别字体 hinting 程序超限(too many function definitions)，去掉指令表绕过
    for tag in ("fpgm", "prep", "cvt "):
        if tag in tt:
            del tt[tag]
    buf = io.BytesIO()
    tt.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def render(woff2_path: Path, lines: list[str], out_jpg: Path, size: int, rtl: bool) -> str:
    if rtl:  # 阿拉伯文：连写整形 + 双向重排，得到可直接绘制的视觉顺序
        lines = [get_display(arabic_reshaper.reshape(ln)) for ln in lines]

    font = load_font(woff2_path, size)
    line_h = int(size * 1.5)

    # 先测量，确定画布大小
    tmp = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    widths = [tmp.textlength(ln, font=font) for ln in lines]
    width = int(max(widths)) + PADDING * 2
    height = line_h * len(lines) + PADDING * 2

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    for i, ln in enumerate(lines):
        x = width - PADDING - widths[i] if rtl else PADDING  # 阿拉伯文右对齐
        draw.text((x, PADDING + i * line_h), ln, font=font, fill=FG)

    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_jpg, quality=JPG_QUALITY)
    return f"[ok] {woff2_path.parent.name}/{woff2_path.name} -> {out_jpg.name}"


def main() -> None:
    jobs = []  # (woff2_path, lines, out_jpg, size, rtl)
    skip = 0
    for sub, (lines, size, rtl) in SPECS.items():
        src_dir = FONT_ROOT / sub
        if not src_dir.is_dir():
            continue
        for src in sorted(src_dir.glob("*.woff2")):
            out_jpg = src.with_suffix(".jpg")  # 预览图与字体同目录
            if out_jpg.exists():  # 增量：已渲染则跳过
                skip += 1
                continue
            jobs.append((src, lines, out_jpg, size, rtl))

    ok = fail = 0
    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(render, *job): job[0] for job in jobs}
        for fut in as_completed(futures):
            src = futures[fut]
            try:
                print(fut.result())
                ok += 1
            except Exception as e:  # noqa: BLE001
                fail += 1
                print(f"[fail] {src.parent.name}/{src.name}: {e}")

    print(f"\n完成：共 {len(jobs) + skip} 个，渲染 {ok}，跳过 {skip}，失败 {fail}")


if __name__ == "__main__":
    main()
