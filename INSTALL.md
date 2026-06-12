# INSTALL — 安装指南

本项目是纯 Node 工程，npm 工程根在 **`src/`**（`package.json` 在那里），渲染由 [Remotion](https://remotion.dev) 完成。下面按"最小可用 → 可选增强"的顺序说明。

> 快捷方式：在仓库根运行 **`./install.sh`** 可自动完成第 1–3 步并检测可选依赖。

## 1. 系统要求

| 项 | 要求 | 说明 |
| --- | --- | --- |
| 操作系统 | macOS / Linux | Windows 建议 WSL2 |
| Node.js | **18 或更高**（推荐 LTS / 20+） | `node -v` 检查；本项目在 Node 26 上验证通过 |
| 磁盘 | ≥ 2GB 空闲 | `node_modules` + chrome-headless-shell + 缓存 |

macOS 装 Node：`brew install node`。Linux 建议用 [nvm](https://github.com/nvm-sh/nvm) 或发行版包管理器。

## 2. 安装依赖

```bash
cd src
npm install
```

会安装 Remotion、React、`better-sqlite3`（Pexels 候选索引缓存）、`pexels` SDK 等。

> `better-sqlite3` 是原生模块，`npm install` 会自动编译。若失败，确认已装 Xcode Command Line Tools（macOS：`xcode-select --install`）或 `build-essential`（Linux：`apt install build-essential python3`）。

## 3. 安装渲染浏览器

Remotion 需要浏览器逐帧渲染。**强烈建议**安装专用的 `chrome-headless-shell`（比系统 Chrome 更稳定，避免 `localhost:3000 got no response` 类报错）：

```bash
cd src
npx remotion browser ensure
```

若不安装，脚本会按以下优先级回退查找浏览器：

1. 环境变量 `BROWSER_EXECUTABLE`
2. `--browser <path>` 参数
3. `node_modules/.remotion/` 下的 `chrome-headless-shell`
4. 用户缓存目录的 `chrome-headless-shell`
5. 系统 Chrome / Edge / Chromium

到此已可运行基本渲染：

```bash
node src/cli.mjs --audio song.mp3 --lyrics song.srt --title "歌名"
```

---

以下为**可选增强**，按需安装。

## 4. ffmpeg / ffprobe（推荐）

- **`ffprobe`** 用于自动检测音频时长。没有它时必须手动传 `--duration <秒>`。
- **`ffmpeg`** 仅 `--bg-pexels-video`（把多段 Pexels 视频近无损拼接成整首长度）必需。
- 视频编码本身由 Remotion 自带的 ffmpeg 完成，**无需**单独的系统 ffmpeg。

安装：

```bash
# macOS
brew install ffmpeg
# Debian / Ubuntu
sudo apt install ffmpeg
```

## 5. Pexels 智能背景密钥（可选）

仅使用 `--bg-pexels-image` / `--bg-pexels-video` 时需要。在仓库根创建 **`scripts/api.key`**（已 gitignore，不会被提交）：

```
pexels=<你的 Pexels API Key>
openrouter=<你的 OpenRouter API Key>
```

- Pexels Key：<https://www.pexels.com/api/>（免费）
- OpenRouter Key：<https://openrouter.ai/keys>（用于读歌词生成英文搜索关键词，调用 `mistralai/mistral-nemo`，需有余额）

## 6. 自定义字体库（可选）

`--font` 依赖本地 `font/` 目录（约 2GB woff2 源材料，**已 gitignore、未随仓库分发**）。不使用 `--font` 时各 preset 用内置字体栈，无需此目录。

字库按语言分子目录：`en` / `zh_CN` / `zh_TW` / `zh_HK` / `kr` / `ja` / `ar`。构建/下载脚本在 `scripts/fonts/`（`download-font.sh`、`to_woff2.py` 等）。

## 7. Python 辅助脚本（可选，开发用）

抓取动画背景（`src/scripts/fetch_animbg.py`）和字体处理脚本需要 Python 3：

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r src/scripts/requirements.txt   # requests + beautifulsoup4
```

日常渲染**不需要** Python —— 动画背景已随仓库分发在 `src/animbg/`。

---

## 验证安装

```bash
# 跑测试套件
cd src && npm test

# 最小渲染冒烟（需自备 song.mp3 + song.srt）
node src/cli.mjs --audio song.mp3 --lyrics song.srt --title "测试" --preset orig
```

成功后输出在 `out/song.mp4`。

## 常见问题

- **`better-sqlite3` 编译失败** —— 装好编译工具链（见第 2 步）后 `cd src && npm rebuild better-sqlite3`。
- **`localhost:3000 got no response` 渲染失败** —— 多为系统 Chrome 高并发所致，运行 `npx remotion browser ensure` 装 `chrome-headless-shell`。
- **中文/日文显示为 □ 方块** —— 缺 CJK 字体。macOS 自带；Linux 容器内 `apt install fonts-noto-cjk`（脚本会尝试自动安装）。
- **歌词不显示** —— 确认 `--lyrics` 是 LRC/SRT 格式，日志会打印 `Parsed N lyric lines`，为 0 则未识别。
- **未检测到音频时长** —— 装 `ffprobe`（见第 4 步）或手动传 `--duration`。

更多参数与排查见 [USAGE.md](USAGE.md)。
