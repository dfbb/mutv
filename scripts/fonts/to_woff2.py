# /// script
# requires-python = ">=3.9"
# dependencies = ["fonttools", "brotli"]
# ///
"""把 en/、zh/、ja/、kr/ 下的 ttc/ttf/otf 字体转成 woff2，输出到 woff2/<子目录>。

特性：
- 增量模式：目标 woff2 已存在且比源文件新则跳过
- 多线程：最多并发 8 个任务

用法：
    uv run to_woff2.py
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.ttLib.ttCollection import TTCollection

ROOT = Path(__file__).parent
SUBDIRS = [ "ja", "kr"]
EXTS = {".ttc", ".ttf", ".otf"}
MAX_WORKERS = 8


def up_to_date(src: Path, dst: Path) -> bool:
    """目标已存在且不旧于源文件，则视为已转换。"""
    return dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime


def convert(src: Path, out_dir: Path) -> str:
    """转换单个源文件，返回状态描述。"""
    if src.suffix.lower() == ".ttc":
        coll = TTCollection(src)
        # 全部分片都已是最新才跳过
        dsts = [out_dir / f"{src.stem}_{i}.woff2" for i in range(len(coll.fonts))]
        if dsts and all(up_to_date(src, d) for d in dsts):
            return f"[skip] {src.parent.name}/{src.name}"
        for font, dst in zip(coll.fonts, dsts):
            font.flavor = "woff2"
            font.save(dst)
        return f"[ok] {src.parent.name}/{src.name} -> {len(dsts)} 个 woff2"

    dst = out_dir / f"{src.stem}.woff2"
    if up_to_date(src, dst):
        return f"[skip] {src.parent.name}/{src.name}"
    font = TTFont(src)
    font.flavor = "woff2"
    font.save(dst)
    return f"[ok] {src.parent.name}/{src.name} -> woff2/{src.parent.name}/{dst.name}"


def main() -> None:
    jobs = []
    for sub in SUBDIRS:
        src_dir = ROOT / sub
        if not src_dir.is_dir():
            continue
        out_dir = ROOT / "woff2" / sub
        out_dir.mkdir(parents=True, exist_ok=True)
        for src in sorted(src_dir.iterdir()):
            if src.suffix.lower() in EXTS:
                jobs.append((src, out_dir))

    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(convert, src, out_dir): src for src, out_dir in jobs}
        for fut in as_completed(futures):
            src = futures[fut]
            try:
                msg = fut.result()
                print(msg)
                if msg.startswith("[skip]"):
                    skip += 1
                else:
                    ok += 1
            except Exception as e:  # noqa: BLE001
                fail += 1
                print(f"[fail] {src.parent.name}/{src.name}: {e}")

    print(f"\n完成：共 {len(jobs)} 个，转换 {ok}，跳过 {skip}，失败 {fail}")


if __name__ == "__main__":
    main()
