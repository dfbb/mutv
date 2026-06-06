# USAGE — 音乐视频生成器

从音频 + 歌词生成带频谱可视化和字幕的音乐视频，基于 [Remotion](https://remotion.dev) 渲染。整个项目用 Node 运行。

## 目录结构

```
src/                     项目代码根目录
  cli.mjs              友好入口（参数解析、字体检查、压缩、调用 render.mjs）
  render.mjs           渲染核心（构建 props、调用 remotion render/studio）
  types.ts             共享 props schema（MVInputProps / defaultProps）
  preset/
    orig/              视觉模板 "orig"（频谱可视化 + 整行字幕）
      index.ts         Remotion registerRoot 入口
      Root.tsx         Composition 定义（从 props 读取分辨率/帧率）
      AudioVisualization.tsx   实际视觉组件
    no2/               视觉模板 "no2"（逐词卡拉OK高亮 + 跟随圆点）
      index.ts / Root.tsx / Composition.tsx / Subtitles.tsx ...
    apple/             视觉模板 "apple"（Apple Music 风格：滚动歌词 + 逐词渐亮 + 流动模糊背景）
      index.ts / Root.tsx / Composition.tsx / Lyrics.tsx
  out/                 渲染输出目录
  public/              运行时复制的音频/背景（自动生成）
```

## 前置条件

- Node.js（建议 18+）
- `ffmpeg` / `ffprobe`（用于自动检测音频时长、`--max-size` 压缩）
- 首次使用前安装依赖：

```bash
cd src
npm install
```

- 渲染需要浏览器。优先使用 Remotion 专用的 `chrome-headless-shell`（更稳定）。若未安装，可手动下载：

```bash
npx remotion browser ensure
```

否则脚本会回退到系统的 Chrome / Edge / Chromium。

## 快速开始

```bash
# 基本渲染（输出到 out/cn-1.mp4）
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --title "歌名"

# 带背景图
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --title "歌名" --background bg.jpg

# 本地网页预览（不渲染视频，启动 Remotion Studio）
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --html

# 指定分辨率和帧率（竖屏 + 60fps）
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --res 1080x1920 --fps 60

# 限制输出大小到 24MB（超出则两遍压缩，适合 IM 平台上传）
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --max-size 24
```

## 入口说明

有两个入口，正常使用走 `cli.mjs`：

- **`cli.mjs`** — 友好入口。处理路径解析、默认输出命名、CJK 字体检查、`--max-size` 压缩，然后调用 `render.mjs`。**推荐日常使用。**
- **`render.mjs`** — 渲染核心。可直接调用，但需要自行处理路径等细节。`cli.mjs` 的所有参数都会透传给它。

也可通过 npm scripts 调用：

```bash
cd src
npm run render -- --audio ../cn-1.mp3 --lyrics ../cn-1.srt --title "歌名"   # = node cli.mjs
npm start          # 启动 Studio（preset/orig），无 props
npm run build      # 渲染 preset/orig 到 out/video.mp4（默认 props）
```

<!-- PARAMS_PLACEHOLDER -->

## 参数详解

`cli.mjs` 与 `render.mjs` 接受相同的参数（`cli.mjs` 额外处理 `--max-size`）。

### 必填

| 参数 | 说明 |
| --- | --- |
| `--audio <file>` | 音频文件路径（绝对或相对）。绝对路径会自动复制到 `public/`。**必填。** |

### 歌词（二选一，可省略）

| 参数 | 说明 |
| --- | --- |
| `--lyrics <file>` | 歌词文件。支持 **LRC**（`[mm:ss.xx]`）和 **SRT**（`HH:MM:SS,mmm --> ...`）。先按 LRC 解析，若 0 行则自动回退按 SRT 解析。 |
| `--lyrics-json <file>` | JSON 格式歌词：`[{start, end, text}, ...]`（时间单位为秒）。 |

> 同时提供时，`--lyrics` 优先。都不提供则视频无字幕。

### 文本

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--title <text>` | `"Music Video"` | 主标题。会去除换行，超过 50 字符截断为 `...`。 |
| `--subtitle <text>` | `""` | 副标题（标题下方）。会去除换行。 |
| `--credit <text>` | `""` | 底部署名文字。 |

### 画面

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--preset <label>` | `orig` | 视觉模板，对应 `preset/<label>/` 目录。可用：`orig`（频谱+整行字幕）、`no2`（逐词卡拉OK）、`apple`（Apple Music 风格滚动歌词）。不存在时报错并列出可用模板。 |
| `--res <WxH>` | `1920x1080` | 输出分辨率，格式如 `1280x720`、`1080x1920`。格式非法时报错。 |
| `--fps <N>` | `30` | 帧率，正整数。非法时报错。 |
| `--background <file>` | 无 | 背景图片路径。省略时使用动态渐变背景。自动复制到 `public/`。 |

### 时间轴

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--offset <seconds>` | `-0.5` | 歌词时间偏移（秒）。正值延后，负值提前。 |
| `--duration <seconds>` | 自动检测 | 音频时长。省略时用 `ffprobe` 自动检测；检测失败则必须手动提供。（`render.mjs` 参数，`cli.mjs` 不暴露。） |

### 输出与编码

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--output <file>` | `out/<音频名>.mp4` | 输出文件路径。 |
| `--codec <name>` | `h264` | 编码：`h264` / `h265` / `vp8` / `vp9`。 |
| `--max-size <MB>` | 无 | 仅 `cli.mjs`。输出超过该大小时用两遍 ffmpeg 压缩到目标体积（保留 5% 余量，音频固定 96k）。适合 WhatsApp/Discord/Telegram 等上传限制。 |

### 浏览器

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--browser <path>` | 自动检测 | 自定义浏览器可执行文件路径（Chrome/Edge/Chromium）。 |

浏览器查找优先级：

1. 环境变量 `BROWSER_EXECUTABLE`
2. `--browser` 参数
3. `node_modules/.remotion/` 下的 `chrome-headless-shell`
4. 用户缓存目录的 `chrome-headless-shell`
5. 系统 Chrome / Edge / Chromium

### 模式

| 参数 | 说明 |
| --- | --- |
| `--html` | 启动本地 **Remotion Studio** 网页预览（`http://localhost:3000`）而非渲染视频。长驻进程，按 `Ctrl+C` 停止。此模式下 `--max-size` 不生效。 |
| `-h` / `--help` | 打印帮助信息。 |

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `BROWSER_EXECUTABLE` | 浏览器可执行文件路径，优先级最高，覆盖自动检测。 |

## 工作原理

1. `cli.mjs` 解析参数、解析路径、确定输出名，并检查 CJK 字体（仅 Linux 容器，缺失时尝试自动安装 `fonts-noto-cjk`）。
2. 调用 `render.mjs`，后者：
   - 把绝对路径的音频/背景复制到 `public/`
   - 解析歌词（LRC → SRT 回退 / JSON）
   - 用 `ffprobe` 检测音频时长
   - 把所有参数写入临时文件 `.render-props.json`
   - 调用 `npx remotion render preset/<label>/index.ts MusicVideo <output>`（或 `--html` 时启动 studio）
3. 分辨率/帧率通过 props 传入，`preset/orig/Root.tsx` 的 `calculateMetadata` 读取后决定画布尺寸，无需在组件里写死。
4. （可选）`cli.mjs` 按 `--max-size` 做两遍压缩。

## 新增视觉模板（preset）

1. 复制 `preset/orig/` 为 `preset/<新名>/`。
2. 修改其中的 `AudioVisualization.tsx`（或换成你自己的组件），`Root.tsx` 引用它。
3. 保持从 `../../types` 导入共享的 `MVInputProps` / `defaultProps`，让 `--res`/`--fps` 等参数继续生效。
4. 用 `--preset <新名>` 调用。

## 故障排查

- **歌词不显示**：确认 `--lyrics` 文件格式为 LRC 或 SRT；运行日志会打印 `Parsed N lyric lines`，若为 0 则未识别。
- **中文/日文显示为 □ 方块**：缺少 CJK 字体。macOS 自带；Linux 容器内安装 `fonts-noto-cjk`（脚本会尝试自动安装）。
- **`localhost:3000 got no response` 渲染失败**：通常是用系统 Chrome 高并发开多标签所致。运行 `npx remotion browser ensure` 安装 `chrome-headless-shell` 即可。
- **渲染看似卡住无进度**：`render.mjs` 缓冲了 remotion 输出，过程中不打印进度，属正常；用 `--html` 预览可实时查看。

