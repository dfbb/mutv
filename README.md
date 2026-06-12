# 音乐视频生成器

从 **音频 + 歌词** 一键生成带频谱可视化、卡拉OK字幕和动态背景的音乐视频，基于 [Remotion](https://remotion.dev) 渲染，纯 Node 运行，**编码一次成型**输出标准 H.264。

```bash
node src/cli.mjs --audio song.mp3 --lyrics song.srt --title "歌名"
# → out/song.mp4
```

## 特性

- **105 套歌词视觉模板（preset）** —— 97 个编号特效（`fx-001`～`fx-097`：逐词高亮、霓虹、3D、长投影、故障等）+ 8 个具名模板（`orig` 频谱 / `no2` / `apple` 滚动歌词 / `ktv` 卡拉OK / `neon` / `cinema` / `bounce` / `typewriter`）。`--preset random` 随机选。
- **131 个动画背景（bg-anim）** —— 57 个全屏特效（3D/WebGL、粒子、赛博朋克、文字排版等）+ 74 个 butterchurn(Milkdrop) 音频可视化。`--bg-anim random` 随机选。
- **42 种背景图切换效果** —— 图片目录轮播时的 gl-transitions 转场，分 3 组：`soft` 14 个（柔和淡入/滑动/缩放）、`cool` 16 个（翻页/扭曲/炫彩）、`hard` 12 个（故障/像素化/燃烧），`--bg-image-trans` 选组。
- **多种背景源** —— 静态图 / 图片目录（转场轮播 + Ken Burns）/ 视频 / 动画特效，互斥任选。
- **Pexels 智能背景** —— 读歌词经 OpenRouter 生成英文关键词 → Pexels 搜索按比例匹配的图/视频 → 自动轮播或拼接，带缓存去重与合规署名。
- **节拍反应** —— 动画背景随音乐低频"呼吸"、随中高频闪动（离线 FFT 注入，无需实时音频）。
- **814 款多语言字体** —— 本地字库覆盖 7 种语言（en 548 / zh_CN 143 / ja 57 / kr 49 / ar 12 / zh_TW 3 / zh_HK 2），按歌词语言自动选库；`--font`/`--font-scale`/`--font-fg-color`/`--font-bg-color` 全可控。字库未随仓库分发（见 INSTALL.md）。
- **歌词格式** —— LRC / SRT / JSON，自动解析回退。
- **任意分辨率与帧率** —— `--res 1080x1920 --fps 60`，横竖屏共用一套自适应缩放规则。

## 快速开始

```bash
# 1. 安装（详见 INSTALL.md，或运行 ./install.sh）
cd src && npm install && npx remotion browser ensure && cd ..

# 2. 基本渲染
node src/cli.mjs --audio song.mp3 --lyrics song.srt --title "歌名"

# 3. 带动画背景 + 随机 preset
node src/cli.mjs --audio song.mp3 --lyrics song.srt --preset random --bg-anim random

# 4. 本地网页预览（Remotion Studio，不渲染）
node src/cli.mjs --audio song.mp3 --lyrics song.srt --html
```

## 前置条件

| 依赖 | 用途 | 必需 |
| --- | --- | --- |
| Node.js 18+ | 运行时 | 是 |
| `chrome-headless-shell` | Remotion 渲染浏览器（`npx remotion browser ensure`） | 是（否则回退系统 Chrome） |
| `ffprobe` / `ffmpeg` | 检测音频时长 / Pexels 视频拼接 | 时长检测建议有；`--bg-pexels-video` 必需 |
| `scripts/api.key` | Pexels + OpenRouter 密钥 | 仅用 `--bg-pexels-*` 时 |
| `font/` 目录 | 自定义字体库（~2GB，未随仓库分发） | 仅用 `--font` 时 |

完整安装步骤见 **[INSTALL.md](INSTALL.md)**。

## API 密钥（Pexels 智能背景）

仅使用 `--bg-pexels-image` / `--bg-pexels-video` 时需要。在仓库根创建 **`scripts/api.key`**（已 gitignore）：

```
pexels=<你的 Pexels API Key>
openrouter=<你的 OpenRouter API Key>
```

### Pexels API Key

- **申请**：登录 <https://www.pexels.com/api/>，任何 Pexels 账号都能**即时**领取 key（免费）。每次请求通过 `Authorization` 头携带。
- **限额**（默认，截至 2026）：**200 次/小时** + **20,000 次/月**。超限返回 `429 Too Many Requests`。
  - 成功响应（`200`）带 `X-Ratelimit-Limit` / `X-Ratelimit-Remaining` / `X-Ratelimit-Reset` 三个头用于监控；错误响应不带。
  - 满足条款（含规范署名、不复制 Pexels 核心功能）可联系官方**免费**申请提高至无限。
  - 严禁绕过限流，否则封禁。
- **本项目如何省额度**：素材**按关键词分目录缓存**于 `cache/pexels/`，优先读缓存、按需下载、同关键词内轮换，重复渲染几乎不再请求 Pexels（契合官方"自建缓存 + 归一化搜索词"建议）。
- **合规署名**（已内置）：渲染后在输出同目录写 `<name>.credits.md` 列全部作者/链接，并在视频末尾 1 秒右下角叠加 "Pexels.com + 作者名" 字幕。

### OpenRouter API Key

用于读歌词生成英文搜索关键词，调用 `mistralai/mistral-nemo`。

- **申请**：登录 <https://openrouter.ai/keys> 创建 key（可选设额度上限）。**key 只完整显示一次**，请立即保存。
- **需要余额**：`mistral-nemo` 是**付费**模型，需先在 Credits 充值（信用卡/加密货币，无最低额度，余额不过期）。每首歌仅生成数十个关键词，**单次成本极低**（约几分之一美分量级）。新账号有少量免费额度可试。
- **限额**：付费(Pay-as-you-go)用户无平台级速率限制；免费模型(`:free`)才有 20 次/分钟等限制——本项目用的是付费模型，不受此限。
- **报错处理**（已内置）：HTTP 402（余额不足）/ 429（限流）/ 401（鉴权失败）直接报错退出。

> 详细工作流程见 [USAGE.md — Pexels 智能背景](USAGE.md#pexels-智能背景)。

## 预览画廊

两个自包含 HTML 画廊，浏览器直接打开即可逐个预览效果视频（点击放大播放，按 `✕` 或 Esc 返回列表），每个视频都标注了对应的命令行参数与中文解释：

- **[demo/index-bg.html](demo/index-bg.html)** —— 全部 **116 个动画背景**（`--bg-anim <label>`）
- **[demo/index-lyric.html](demo/index-lyric.html)** —— 全部 **105 套歌词模板**（`--preset <label>`）

视频与 HTML 由 `node demo/gen-index.mjs` 生成/刷新（新增或删除 `demo/bganim`、`demo/lyric` 下的 mp4 后重跑即可）。

## 节约 AI 成本与提高生成速度

### 省 AI / API 成本

- **优先复用缓存**：Pexels 素材按关键词分目录缓存于 `cache/pexels/`，候选元数据记入 SQLite（`cache/usage.sqlite`）。同一首歌**重复渲染**、不同歌曲**共享相同关键词**时，几乎不再请求 Pexels、不重复下载——只对实际用到的素材花带宽。
- **关键词只生成一次**：OpenRouter 仅在准备背景时读一次歌词生成关键词，调用极便宜的 `mistralai/mistral-nemo`，单首成本约几分之一美分。
- **不需要 AI 就别开**：`--bg-pexels-*` 才会产生 API 成本。改用本地 **131 个 `--bg-anim`** 或自备 `--bg-image` / `--bg-video`，**零 API 调用、零费用**，效果同样丰富。
- **图片比视频省**：`--bg-pexels-image` 只下载若干张图；`--bg-pexels-video` 要下多段视频再 ffmpeg 拼接，带宽和时间都更高——优先用图片版。

### 提速

- **装专用渲染浏览器**：`npx remotion browser ensure` 安装 `chrome-headless-shell`，比回退系统 Chrome 更快更稳，避免 `localhost:3000 got no response` 类卡顿。
- **降分辨率 / 帧率**：渲染耗时基本与「像素 × 帧数」成正比。`--res 854x480 --fps 24` 出片远快于 `1080x1920 --fps 60`；先低配试样，满意再高配出终版。
- **选轻量背景**：静态 `--bg-image`（单图）最快；canvas 类 `--bg-anim` 次之；**WebGL 重特效、视频背景、Pexels 视频**最慢（逐帧进 Chromium 合成）。`tech=canvas` 的 bg-anim 通常比 `webgl` 快。
- **先预览再渲染**：用 `--html` 启动 Remotion Studio 实时调 preset/背景/字体，定稿后再跑渲染，避免反复全量出片。
- **缓存命中即提速**：开启 Pexels 背景后重复渲染同一首歌，素材直接读本地缓存，省去下载等待。
- **`--crf` 主要影响体积**：调大（如 28）减小文件、略快编码；对渲染总耗时影响有限，瓶颈在逐帧合成而非编码。

> 更激进的「前景/背景分离渲染 + ffmpeg 合成」「AI 背景题材缓存共享」等管线级优化提案见 [OPTIMIZE.md](OPTIMIZE.md)（暂为方向，非当前实现）。

## 文档

| 文档 | 内容 |
| --- | --- |
| **[INSTALL.md](INSTALL.md)** | 安装、依赖、密钥配置、常见环境问题 |
| **[USAGE.md](USAGE.md)** | 全部参数详解、目录结构、preset/bg-anim 列表、工作原理、故障排查 |
| **[OPTIMIZE.md](OPTIMIZE.md)** | 渲染管线优化提案（前景/背景分离、AI 背景缓存） |

## 项目结构（概览）

```
src/             npm 工程根（package.json 在此）
  cli.mjs        友好入口：参数/路径/字体处理 → 调 render.mjs
  render.mjs     渲染核心：构建 props、调 remotion render/studio
  preset/        视觉模板，每个一目录
  animbg/        全屏动画/可视化背景特效
  pexelsBg.mjs   Pexels 智能背景
  lib/           gl-transitions、轮播构建等共享库
scripts/         Python/Node 辅助脚本、api.key
font/            本地字体库（gitignored）
out/             渲染输出
```

详细结构见 [USAGE.md](USAGE.md#目录结构)。

## 测试

```bash
cd src && npm test      # node --test，覆盖歌词解析、动画注入、Pexels 等
```
