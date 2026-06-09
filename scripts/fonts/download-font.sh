#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-$PWD}"
export OUT
mkdir -p "$OUT"/{zh,en,unicode,tmp}

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

# ---------------- 中文 / CJK ----------------
download_zip "SourceHanSans" "https://github.com/adobe-fonts/source-han-sans/releases/latest/download/02_SourceHanSans-VF.zip" "zh"
download_zip "SourceHanSerif" "https://github.com/adobe-fonts/source-han-serif/releases/latest/download/02_SourceHanSerif-VF.zip" "zh"

download_zip "NotoSansCJK" "https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/00_NotoSansCJK.ttc.zip" "zh"
download_zip "NotoSerifCJK" "https://github.com/notofonts/noto-cjk/releases/latest/download/01_NotoSerifCJK.ttc.zip" "zh"

download_zip "LXGWWenKai" "https://github.com/lxgw/LxgwWenKai/releases/latest/download/lxgw-wenkai-v1.522.zip" "zh"
download_file "LXGWWenKaiScreen.ttf" "https://github.com/lxgw/LxgwWenKai-Screen/releases/latest/download/LXGWWenKaiScreen.ttf" "zh"
download_file "LXGWWenKaiMono-Regular.ttf" "https://github.com/lxgw/LxgwWenKai/raw/main/fonts/TTF/LXGWWenKaiMono-Regular.ttf" "zh"

download_zip "SmileySans" "https://github.com/atelier-anchor/smiley-sans/releases/latest/download/smiley-sans-v2.0.1.zip" "zh"

download_zip "HarmonyOSSans" "https://github.com/IKKI2000/harmonyos-fonts/archive/refs/heads/main.zip" "zh"
download_zip "AlibabaPuHuiTi" "https://github.com/chinayin/fonts-alibaba-puhuiti-regular/archive/refs/heads/master.zip" "zh"

download_zip "ZCOOLXiaoWei" "https://github.com/googlefonts/zcool-xiaowei/archive/refs/heads/main.zip" "zh"
download_zip "ZCOOLQingKeHuangYou" "https://github.com/googlefonts/zcool-qingke-huangyou/archive/refs/heads/main.zip" "zh"
download_zip "ZCOOLKuaiLe" "https://github.com/googlefonts/zcool-kuaile/archive/refs/heads/main.zip" "zh"

# MaShanZheng / ZhiMangXing / LongCang / LiuJianMaoCao 的独立 googlefonts 仓库已下线，
# 这几款书法体由文末 Google Fonts css2 接口统一下载（families_zh 已包含），此处不再单独抓取。

download_zip "TaipeiSansTC" "https://github.com/VdustR/taipei-sans-tc/archive/refs/heads/master.zip" "zh"
download_zip "ChenYuluoyan" "https://github.com/Chenyu-otf/chenyuluoyan_thin/archive/refs/heads/main.zip" "zh"

# ---------------- 英文 / Latin ----------------
download_zip "Inter" "https://github.com/rsms/inter/releases/latest/download/Inter-4.1.zip" "en"
download_zip "IBMPlex" "https://github.com/IBM/plex/releases/latest/download/ibm-plex-sans.zip" "en"

download_zip "Roboto" "https://github.com/googlefonts/roboto-2/archive/refs/heads/main.zip" "en"
download_zip "RobotoFlex" "https://github.com/googlefonts/roboto-flex/archive/refs/heads/main.zip" "en"
# RobotoCondensed 独立仓库已下线，改由文末 css2 接口下载（已加入 families_en）。
download_zip "OpenSans" "https://github.com/googlefonts/opensans/archive/refs/heads/main.zip" "en"
download_zip "Lato" "https://github.com/latofonts/lato-source/archive/refs/heads/master.zip" "en"
download_zip "Montserrat" "https://github.com/JulietaUla/Montserrat/archive/refs/heads/master.zip" "en"
download_zip "Poppins" "https://github.com/itfoundry/Poppins/archive/refs/heads/master.zip" "en"
download_zip "Raleway" "https://github.com/impallari/Raleway/archive/refs/heads/master.zip" "en"
download_zip "Nunito" "https://github.com/googlefonts/nunito/archive/refs/heads/main.zip" "en"
# NunitoSans 独立仓库已下线，改由文末 css2 接口下载（已加入 families_en）。
download_zip "Oswald" "https://github.com/googlefonts/OswaldFont/archive/refs/heads/main.zip" "en"
download_zip "BebasNeue" "https://github.com/dharmatype/Bebas-Neue/archive/refs/heads/master.zip" "en"
download_zip "Barlow" "https://github.com/jpt/barlow/archive/refs/heads/master.zip" "en"
download_zip "WorkSans" "https://github.com/weiweihuanghuang/Work-Sans/archive/refs/heads/master.zip" "en"
download_zip "SpaceGrotesk" "https://github.com/floriankarsten/space-grotesk/archive/refs/heads/master.zip" "en"
download_zip "SpaceMono" "https://github.com/googlefonts/spacemono/archive/refs/heads/main.zip" "en"
download_zip "Manrope" "https://github.com/terrapkg/pkg-manrope-fonts/archive/refs/heads/main.zip" "en"
download_zip "FiraSans" "https://github.com/mozilla/Fira/archive/refs/heads/master.zip" "en"
download_zip "JetBrainsMono" "https://github.com/JetBrains/JetBrainsMono/releases/latest/download/JetBrainsMono-2.304.zip" "en"

download_zip "EBGaramond" "https://github.com/octaviopardo/EBGaramond12/archive/refs/heads/master.zip" "en"
download_zip "LibreBaskerville" "https://github.com/impallari/Libre-Baskerville/archive/refs/heads/master.zip" "en"
download_zip "Cormorant" "https://github.com/CatharsisFonts/Cormorant/archive/refs/heads/master.zip" "en"
download_zip "PlayfairDisplay" "https://github.com/clauseggers/Playfair-Display/archive/refs/heads/master.zip" "en"
download_zip "Merriweather" "https://github.com/SorkinType/Merriweather/archive/refs/heads/master.zip" "en"

# ---------------- Unicode / Emoji / Symbols ----------------
download_zip "NotoEmoji" "https://github.com/googlefonts/noto-emoji/archive/refs/heads/main.zip" "unicode"
download_zip "NotoSansSymbols" "https://github.com/notofonts/symbols/archive/refs/heads/main.zip" "unicode"
download_zip "NotoMusic" "https://github.com/notofonts/music/archive/refs/heads/main.zip" "unicode"
download_zip "NotoMath" "https://github.com/notofonts/math/archive/refs/heads/main.zip" "unicode"

# ---------------- Google Fonts API：额外下载更多歌词可用字体 ----------------
python3 - <<'PY'
import os, re, urllib.request, urllib.parse, hashlib
from pathlib import Path

out = Path(os.path.expanduser(os.environ.get("OUT", ""))) if os.environ.get("OUT") else Path.home() / "Downloads" / "mtv-fonts"
en_dir = out / "en"
zh_dir = out / "zh"
uni_dir = out / "unicode"

families_en = [
    "Inter", "Noto Sans", "Noto Serif", "Archivo", "Archivo Black",
    "Nunito Sans", "Roboto Condensed",
    "Anton", "Bitter", "DM Sans", "DM Serif Display", "Exo 2",
    "Figtree", "Hind", "Kanit", "Lexend", "Libre Franklin",
    "Mulish", "Outfit", "Plus Jakarta Sans", "Public Sans",
    "Quicksand", "Rubik", "Sora", "Urbanist", "Ubuntu",
    "Vollkorn", "Josefin Sans", "Josefin Slab", "Titillium Web",
    "Alegreya Sans", "Alegreya", "Crimson Text", "Cardo",
]

families_zh = [
    "Noto Sans SC", "Noto Serif SC",
    "Noto Sans TC", "Noto Serif TC",
    "Noto Sans HK", "Noto Serif HK",
    "Ma Shan Zheng", "ZCOOL XiaoWei", "ZCOOL QingKe HuangYou",
    "ZCOOL KuaiLe", "Zhi Mang Xing", "Long Cang", "Liu Jian Mao Cao",
]

families_uni = [
    "Noto Sans Symbols 2", "Noto Emoji", "Noto Music",
]

def download_google_font(family, target):
    target.mkdir(parents=True, exist_ok=True)

    fam = urllib.parse.quote(family)
    url = f"https://fonts.googleapis.com/css2?family={fam}:wght@100..900&display=swap"

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    try:
        css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    except Exception:
        url = f"https://fonts.googleapis.com/css2?family={fam}&display=swap"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
        except Exception as e:
            print("skip", family, e)
            return

    urls = sorted(set(re.findall(r"url\((https://[^)]+)\)", css)))
    if not urls:
        print("no font urls", family)
        return

    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", family)
    for i, u in enumerate(urls):
        ext = ".woff2"
        name = f"{safe}_{i:02d}{ext}"
        dest = target / name
        if dest.exists() and dest.stat().st_size > 0:
            continue  # 已下载，跳过

        try:
            data = urllib.request.urlopen(
                urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}),
                timeout=60
            ).read()
        except Exception as e:
            print("download failed", family, e)
            continue

        dest.write_bytes(data)

for f in families_en:
    download_google_font(f, en_dir)

for f in families_zh:
    download_google_font(f, zh_dir)

for f in families_uni:
    download_google_font(f, uni_dir)

print("Google Fonts extra download finished.")
PY

# ---------------- 去重 ----------------
python3 - <<PY
import os, hashlib
from pathlib import Path

root = Path(os.path.expanduser("$OUT"))
seen = {}

for sub in ["zh", "en", "unicode"]:
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

for sub in ["zh", "en", "unicode"]:
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
echo "mkdir -p ~/Library/Fonts && cp $OUT/{zh,en,unicode}/* ~/Library/Fonts/"
echo
echo "Linux 安装："
echo "mkdir -p ~/.local/share/fonts/mtv && cp $OUT/{zh,en,unicode}/* ~/.local/share/fonts/mtv/ && fc-cache -f -v"
