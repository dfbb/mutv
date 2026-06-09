#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-$PWD}"
export OUT
mkdir -p "$OUT"/{ja,kr,tmp}

need() { command -v "$1" >/dev/null || { echo "Missing: $1"; exit 1; }; }
need curl
need unzip
need python3

# 断点续传下载：
# - GitHub release/raw 等静态文件支持 Range，用 -C - 从断点续传，已完整文件返回 416/exit 0。
# - GitHub archive/refs 动态归档不支持 Range，对 -C - 会从头重发导致 curl 报错，
#   故这类 URL 不加 -C -，靠 .done 标记跳过已完成项、未完成则整体重下。
fetch() {
  local url="$1"
  local out="$2"

  case "$url" in
    *"/archive/refs/"*)
      # 动态归档不支持 Range，不能加 -C -（否则服务器从头重发，curl 报错）
      curl -L --fail --retry 3 -o "$out" "$url"
      ;;
    *)
      curl -L --fail --retry 3 -C - -o "$out" "$url"
      ;;
  esac
}

download_zip() {
  local name="$1"
  local url="$2"
  local dir="$3"

  echo "==> $name"
  local zip="$OUT/tmp/$name.zip"
  local folder="$OUT/tmp/$name"
  local done="$OUT/tmp/$name.done"

  if [ -f "$done" ]; then
    echo "    已完成，跳过"
    return
  fi

  fetch "$url" "$zip"
  rm -rf "$folder"
  mkdir -p "$folder"
  unzip -oq "$zip" -d "$folder"

  find "$folder" \
    \( -iname "*.ttf" -o -iname "*.otf" -o -iname "*.ttc" -o -iname "*.otc" \) \
    -exec cp {} "$OUT/$dir/" \;

  : > "$done"
}

download_file() {
  local name="$1"
  local url="$2"
  local dir="$3"

  echo "==> $name"
  local done="$OUT/tmp/$name.done"

  if [ -f "$done" ]; then
    echo "    已完成，跳过"
    return
  fi

  fetch "$url" "$OUT/$dir/$name"
  : > "$done"
}

# ---------------- 日文 / Japanese ----------------
# Source Han（思源）日文字形已含在 download-font.sh 的 VF 包中，此处不再重复。

# M PLUS（M PLUS 1 / 2 / Code / Rounded Mplus 等全家族）
download_zip "MPLUS" "https://github.com/coz-m/MPLUS_FONTS/archive/refs/heads/master.zip" "ja"

# 森泽 BIZ UD（屏显公文体，Gothic + Mincho）
download_zip "BIZUDGothic" "https://github.com/googlefonts/morisawa-biz-ud-gothic/archive/refs/heads/main.zip" "ja"
download_zip "BIZUDMincho" "https://github.com/googlefonts/morisawa-biz-ud-mincho/archive/refs/heads/main.zip" "ja"

# ---------------- 韩文 / Korean ----------------
# Pretendard（最主流的韩文/拉丁混排无衬线）
download_zip "Pretendard" "https://github.com/orioncactus/pretendard/releases/latest/download/Pretendard-1.3.9.zip" "kr"

# Spoqa Han Sans Neo（Spoqa 韩文无衬线）
download_zip "SpoqaHanSans" "https://github.com/spoqa/spoqa-han-sans/archive/refs/heads/master.zip" "kr"

# SUIT / SUITE（sunn.us 现代韩文家族）
download_zip "SUIT" "https://github.com/sunn-us/SUIT/archive/refs/heads/main.zip" "kr"
download_zip "SUITE" "https://github.com/sunn-us/SUITE/archive/refs/heads/main.zip" "kr"

# D2Coding（Naver 等宽编程字体，含韩文）
download_zip "D2Coding" "https://github.com/naver/d2codingfont/releases/latest/download/D2Coding-Ver1.3.2-20180524.zip" "kr"

# ---------------- Google Fonts API：额外下载更多歌词可用字体 ----------------
# macOS 上 urllib 会触达 Obj-C 框架，fork 出的子进程会因 +[... initialize] 崩溃，
# 故对多进程下载关闭 fork 安全检查（仅影响本段子进程）。
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
python3 - <<'PY'
import os, re, urllib.request, urllib.parse, urllib.error
import concurrent.futures as cf
import multiprocessing as mp
from pathlib import Path

out = Path(os.path.expanduser(os.environ.get("OUT", ""))) if os.environ.get("OUT") else Path.home() / "Downloads" / "mtv-fonts"
ja_dir = out / "ja"
kr_dir = out / "kr"

families_ja = [
    "Noto Sans JP", "Noto Serif JP",
    "M PLUS 1", "M PLUS 1p", "M PLUS 2", "M PLUS Rounded 1c", "M PLUS 1 Code",
    "Kosugi", "Kosugi Maru",
    "Sawarabi Gothic", "Sawarabi Mincho",
    "Zen Maru Gothic", "Zen Kaku Gothic New", "Zen Old Mincho",
    "Zen Antique", "Zen Kurenaido",
    "Shippori Mincho", "Klee One", "Kaisei Tokumin",
    "BIZ UDPGothic", "BIZ UDPMincho",
    "DotGothic16", "Yusei Magic", "Hina Mincho", "Dela Gothic One",
    "RocknRoll One", "Mochiy Pop One", "Kiwi Maru", "Stick",
    "Reggae One", "Train One", "Yuji Syuku", "Hachi Maru Pop",
    "Potta One", "Murecho", "IBM Plex Sans JP",
]

families_kr = [
    "Noto Sans KR", "Noto Serif KR",
    "Nanum Gothic", "Nanum Myeongjo", "Nanum Gothic Coding",
    "Nanum Pen Script", "Nanum Brush Script",
    "Gowun Batang", "Gowun Dodum",
    "Black Han Sans", "Do Hyeon", "Jua", "Gamja Flower", "Gaegu",
    "Hi Melody", "Cute Font", "Single Day", "Song Myung", "Stylish",
    "Sunflower", "Yeon Sung", "Poor Story", "Dokdo", "East Sea Dokdo",
    "Kirang Haerang", "Gugi", "Dongle", "Gasoek One", "Hahmlet",
    "IBM Plex Sans KR",
]

UA = {"User-Agent": "Mozilla/5.0"}
RETRIES = 3          # 每个文件最多重试 3 次
WORKERS = 8          # 多进程并发数


def fetch_css(family):
    """取字体 css2，优先带 wght 轴，失败再退回基础款。"""
    fam = urllib.parse.quote(family)
    for url in (
        f"https://fonts.googleapis.com/css2?family={fam}:wght@100..900&display=swap",
        f"https://fonts.googleapis.com/css2?family={fam}&display=swap",
    ):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
        except Exception:
            continue
    return ""


def resolve_family(args):
    """解析单个字体家族，返回 [(url, dest), ...] 待下载列表。"""
    family, target_str = args
    target = Path(target_str)
    target.mkdir(parents=True, exist_ok=True)

    css = fetch_css(family)
    if not css:
        print("skip", family, "(css 获取失败)")
        return []

    urls = sorted(set(re.findall(r"url\((https://[^)]+)\)", css)))
    if not urls:
        print("no font urls", family)
        return []

    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", family)
    return [(u, str(target / f"{safe}_{i:02d}.woff2")) for i, u in enumerate(urls)]


def download_one(args):
    """下载单个 woff2：跳过已完成、支持断点续传、最多重试 RETRIES 次。"""
    url, dest_str = args
    dest = Path(dest_str)
    part = dest.with_name(dest.name + ".part")

    # 已完整下载，跳过
    if dest.exists() and dest.stat().st_size > 0:
        return ("skip", dest.name)

    last = None
    for _ in range(RETRIES):
        have = part.stat().st_size if part.exists() else 0
        headers = dict(UA)
        if have:
            headers["Range"] = f"bytes={have}-"   # 断点续传

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as resp:
                status = getattr(resp, "status", None) or resp.getcode()
                if status == 206:                  # 服务器接受续传，追加写
                    cr = resp.headers.get("Content-Range", "")
                    total = int(cr.rsplit("/", 1)[-1]) if "/" in cr else None
                    mode = "ab"
                else:                              # 200：服务器忽略 Range，从头写
                    total = int(resp.headers.get("Content-Length") or 0) or None
                    mode = "wb"

                with open(part, mode) as f:
                    while True:
                        chunk = resp.read(1 << 16)
                        if not chunk:
                            break
                        f.write(chunk)

            size = part.stat().st_size
            if total is None or size >= total:     # 下载完整，落盘
                os.replace(part, dest)
                return ("ok", dest.name)
            last = f"未完整 {size}/{total}"
        except urllib.error.HTTPError as e:
            if e.code == 416 and part.exists() and part.stat().st_size > 0:
                os.replace(part, dest)             # Range 越界 => 本就已完整
                return ("ok", dest.name)
            last = e
        except Exception as e:
            last = e

    return ("fail", f"{dest.name}: {last}")


def main():
    # fork 上下文：父进程不发起任何网络请求，全部 IO 在子进程内完成，
    # 既满足多进程，又避开 macOS 下 fork-after-ssl 的不稳定。
    ctx = mp.get_context("fork")

    resolve_args = (
        [(f, str(ja_dir)) for f in families_ja]
        + [(f, str(kr_dir)) for f in families_kr]
    )

    # 阶段一：并发解析各家族的 woff2 下载地址
    jobs = []
    with cf.ProcessPoolExecutor(max_workers=WORKERS, mp_context=ctx) as ex:
        for res in ex.map(resolve_family, resolve_args):
            jobs.extend(res)

    # 阶段二：并发下载（跳过已完成 / 断点续传 / 重试）
    ok = skip = fail = 0
    with cf.ProcessPoolExecutor(max_workers=WORKERS, mp_context=ctx) as ex:
        for status, info in ex.map(download_one, jobs):
            if status == "ok":
                ok += 1
            elif status == "skip":
                skip += 1
            else:
                fail += 1
                print("download failed", info)

    print(f"Google Fonts: 共 {len(jobs)} 文件，下载 {ok}，跳过 {skip}，失败 {fail}")


if __name__ == "__main__":
    main()
PY

# ---------------- 去重 ----------------
python3 - <<PY
import os, hashlib
from pathlib import Path

root = Path(os.path.expanduser("$OUT"))
seen = {}

for sub in ["ja", "kr"]:
    d = root / sub
    if not d.exists():
        continue

    for path in d.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in [".ttf", ".otf", ".ttc", ".otc", ".woff2"]:
            continue

        h = hashlib.sha256(path.read_bytes()).hexdigest()
        if h in seen:
            path.unlink()
        else:
            seen[h] = str(path)

for sub in ["ja", "kr"]:
    d = root / sub
    files = [
        p for p in d.rglob("*")
        if p.suffix.lower() in [".ttf", ".otf", ".ttc", ".otc", ".woff2"]
    ]
    print(f"{sub}: {len(files)} files")

print("Saved to:", root)
PY

echo
echo "完成：$OUT"
echo
echo "macOS 安装："
echo "mkdir -p ~/Library/Fonts && cp $OUT/{ja,kr}/* ~/Library/Fonts/"
echo
echo "Linux 安装："
echo "mkdir -p ~/.local/share/fonts/mtv && cp $OUT/{ja,kr}/* ~/.local/share/fonts/mtv/ && fc-cache -f -v"
