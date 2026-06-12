#!/usr/bin/env bash
#
# install.sh — 一键安装音乐视频生成器的依赖
#
# 完成：
#   1. 检查 Node.js 版本（需 18+）
#   2. cd src && npm install
#   3. npx remotion browser ensure（安装 chrome-headless-shell）
#   4. 检测可选依赖 ffmpeg/ffprobe，提示安装
#   5. 若缺 scripts/api.key 则生成模板（Pexels 智能背景用）
#
# 用法：在仓库根运行
#   ./install.sh
#
set -euo pipefail

# 切到脚本所在目录（仓库根）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '\033[33m!\033[0m %s\n' "$1"; }
err()  { printf '\033[31m✗\033[0m %s\n' "$1" >&2; }

# ---------------------------------------------------------------------------
bold "[1/5] 检查 Node.js"
if ! command -v node >/dev/null 2>&1; then
  err "未找到 node。请先安装 Node.js 18+（macOS: brew install node）。"
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  err "Node 版本过低（当前 $(node -v)），需要 18 或更高。"
  exit 1
fi
ok "Node $(node -v)"

# ---------------------------------------------------------------------------
bold "[2/5] 安装 npm 依赖（src/）"
( cd src && npm install )
ok "依赖安装完成"

# ---------------------------------------------------------------------------
bold "[3/5] 安装渲染浏览器 chrome-headless-shell"
if ( cd src && npx remotion browser ensure ); then
  ok "渲染浏览器就绪"
else
  warn "browser ensure 失败，渲染时将回退系统 Chrome/Edge/Chromium。"
fi

# ---------------------------------------------------------------------------
bold "[4/5] 检测可选依赖 ffmpeg / ffprobe"
if command -v ffprobe >/dev/null 2>&1; then
  ok "ffprobe 已安装（自动检测音频时长）"
else
  warn "未找到 ffprobe：无法自动检测音频时长，需手动传 --duration。"
  warn "  安装：macOS 'brew install ffmpeg'  /  Debian/Ubuntu 'sudo apt install ffmpeg'"
fi
if command -v ffmpeg >/dev/null 2>&1; then
  ok "ffmpeg 已安装（--bg-pexels-video 视频拼接可用）"
else
  warn "未找到 ffmpeg：--bg-pexels-video 不可用（其它功能不受影响）。"
fi

# ---------------------------------------------------------------------------
bold "[5/5] Pexels 密钥模板"
if [ -f scripts/api.key ]; then
  ok "scripts/api.key 已存在，跳过"
else
  cat > scripts/api.key <<'EOF'
pexels=
openrouter=
EOF
  ok "已生成 scripts/api.key 模板（已 gitignore）"
  warn "  使用 --bg-pexels-* 前请填入密钥："
  warn "    pexels=    → https://www.pexels.com/api/"
  warn "    openrouter= → https://openrouter.ai/keys"
fi

# ---------------------------------------------------------------------------
echo
bold "安装完成 🎉"
echo "试运行（需自备 song.mp3 + song.srt）："
echo "  node src/cli.mjs --audio song.mp3 --lyrics song.srt --title \"歌名\""
echo "更多见 README.md / INSTALL.md / USAGE.md"
