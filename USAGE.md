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
    ktv/               视觉模板 "ktv"（经典卡拉OK：多行可见 + 逐词扫光双色描边 + lead-in 箭头）
      index.ts / Root.tsx / Composition.tsx / Lyrics.tsx
    neon/              视觉模板 "neon"（赛博朋克霓虹：逐词出场 + RGB 色差/故障 + 扫描线）
    cinema/            视觉模板 "cinema"（电影预告片：居中超大字 + 金色辉光 + 黑边暗角）
    bounce/            视觉模板 "bounce"（彩虹弹跳：每词不同色，随机方向弹入 + 旋转）
    typewriter/        视觉模板 "typewriter"（打字机：逐字符显示 + 当前词高亮 + 闪烁光标）
    lyricsToData.ts    neon/cinema/bounce/typewriter 共用：行级歌词→逐词时间合成
    BackgroundLayer.tsx  所有 preset 共用：按优先级渲染 video/img/anim/渐变背景
  animbg/              抓取的全屏动画特效（<label>/index.html + manifest.json）
  scripts/             fetch_animbg.py 抓取脚本 + requirements.txt
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
node src/cli.mjs --audio cn-1.mp3 --lyrics cn-1.srt --title "歌名" --bg-image bg.jpg

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
| `--preset <label>` | `orig` | 视觉模板，对应 `preset/<label>/` 目录。可用模板见下方[视觉模板（preset）列表](#视觉模板preset列表)。传 `random` 随机选一个。不存在时报错并列出可用模板。 |
| `--res <WxH>` | `1080x720` | 输出分辨率，格式如 `1280x720`、`1080x1920`。格式非法时报错。 |
| `--fps <N>` | `24` | 帧率，正整数。非法时报错。 |
| `--bg-image <文件\|目录>` | 无 | 背景图片文件，或图片目录。目录内多图时自动用 gl-transitions 转场轮播，循环到歌曲结束。与 `--bg-video`/`--bg-anim` 互斥。自动复制到 `public/`。 |
| `--bg-image-intvl <秒>` | `5` | 轮播时每张图停留秒数（转场固定额外 1 秒）。 |
| `--bg-image-trans <组>` | `soft` | 轮播转场风格组：`soft`（柔和淡入淡出/滑动/缩放）、`cool`（翻页/扭曲/炫彩）、`hard`（故障/像素化/燃烧）。 |
| `--bg-video <file>` | 无 | 背景视频文件（循环播放）。与其它背景源互斥。自动复制到 `public/`。 |
| `--bg-anim <label>` | 无 | 动画特效背景，对应 `src/animbg/<label>/`（由 `scripts/fetch_animbg.py` 抓取）。传 `random` 随机选一个。可用特效见下方[动画背景特效（bg-anim）列表](#动画背景特效bg-anim列表)。与其它背景源互斥。 |
| `--no-bg-anim-beat` | 关闭（即默认开启节拍） | 关闭 `--bg-anim` 的节拍反应。默认开启：动画背景会随音乐低频“呼吸/放大”、随中高频闪动（复刻 butterchurn 频段归一化）。基于时间积分的模板（canvas/VANTA/p5）还会在鼓点时动画加速；纯帧计数的模板只有缩放/滤镜脉冲。少数特效（`net`、`net-dots`、`cartoon`、`clouds`、`clouds2`、`particle-*`、`supernova`）不适合节拍抖动，始终不加节拍反应（不受此开关影响）。 |

### 背景图轮播与缩放规则

`--bg-image` 传目录且含多张图时，按文件名排序轮播，用 `src/lib/gl-transitions` 的随机 GLSL 转场切换，循环到歌曲结束。每张图按「图片宽高比 ÷ 屏幕宽高比」自动选择缩放/平移（Ken Burns），始终等比、绝不拉伸：

- 接近屏幕比例：cover 居中，轻微放大
- 明显比屏幕宽：cover，轻微放大，左右平移
- 明显比屏幕窄：cover，轻微放大，上下平移
- 极宽：cover，小幅缩放，横向慢移
- 极窄：背景模糊 cover + 前景 contain 完整显示

横屏（1080×720）与竖屏（720×1080）共用同一套相对阈值，自动适配：同一张 16:9 横图在横屏里是「接近」，在竖屏里是「极宽」（横向慢移露出全景）。

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
| `--debug-bg-anim` | 关闭 | 仅配合 `--html` 调试用：在 Studio 预览画面顶部叠加控制条，显示当前 preset / bg-anim 及其按目录名排序的序号，并提供「下一个」（切换到下一个 bg-anim 并重载 Studio）与「标记」（在该特效目录下建空文件 `blank.txt`）两个按钮。控制服务仅绑定 `127.0.0.1:3001`。 |
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


## 视觉模板（preset）列表

用 `--preset <label>` 选择，传 `random` 随机选一个。

| label | 效果简介 |
| --- | --- |
| `orig` | 频谱可视化 + 整行字幕，底部跳动的频率柱与径向辉光 |
| `no2` | 逐词卡拉OK高亮，跟随圆点指示当前演唱位置 |
| `apple` | Apple Music 风格：滚动歌词 + 逐词渐亮 + 模糊背景 |
| `ktv` | 经典卡拉OK：多行可见 + 逐词扫光双色描边 + lead-in 箭头 |
| `neon` | 赛博朋克霓虹：逐词出场 + RGB 色差/故障 + 扫描线 |
| `cinema` | 电影预告片：居中超大字 + 金色辉光 + 黑边暗角 |
| `bounce` | 彩虹弹跳：每词不同色，随机方向弹入 + 旋转 |
| `typewriter` | 打字机：逐字符显示 + 当前词高亮 + 闪烁光标 |

## 动画背景特效（bg-anim）列表

> 默认大多数 bg-anim 带节拍反应（随音乐起伏）。如需静态背景，加 `--no-bg-anim-beat`。少数特效（`net`、`net-dots`、`cartoon`、`clouds`、`clouds2`、`particle-*`、`supernova`）不适合节拍抖动，已默认排除，不受 beat 影响。

用 `--bg-anim <label>` 选择，传 `random` 随机选一个。共 63 个，按类别分组（`tech` 列：canvas / webgl / svg 渲染方式）。

> 部分特效原本依赖鼠标移动才会动（如 `mouse-trails`）。渲染时检测到这类特效会自动注入一个“虚拟鼠标”脚本，按随机平滑曲线轨迹模拟光标移动，无需真实鼠标即可让特效动起来。

> **WINAMP 分类**：89 个移植自 butterchurn（Milkdrop）的经典音乐可视化 preset，用 `--bg-anim <两词名>` 选择（如 `--bg-anim royal-mashup`）。它们由当前歌曲音频实时驱动（离线 FFT 注入），无需 `--bg-anim-beat`（本身即音频反应）。完整 label 见 `src/animbg/manifest.json` 中 category=WINAMP 的条目。

### 3D & WebGL

| label | 效果简介 | tech |
| --- | --- | --- |
| `birds` | 成群飞鸟在 3D 空间中编队游弋 | webgl |
| `cells` | 有机细胞分裂膨胀的 3D 生物质感 | webgl |
| `globe` | 旋转的 3D 网格地球 | webgl |
| `halo` | 流动的光环漩涡，金属反光质感 | webgl |
| `liquid-distortion` | 液态扭曲着色器，光影折射流动 | webgl |
| `mirror-room` | 无限镜像房间的纵深递归 | canvas |
| `rings` | 同心圆环在 3D 中起伏波动 | webgl |
| `tunnel` | 高速穿越无尽隧道 | canvas |
| `voxel-paris` | 体素风格的巴黎城市场景 | webgl |
| `waves` | 起伏的 3D 网格波浪 | webgl |

### 背景（Backgrounds）

| label | 效果简介 | tech |
| --- | --- | --- |
| `ascendant-light` | 自下而上升腾的光束氛围 | canvas |
| `aurora` | 极光在夜空中飘舞 | canvas |
| `clouds` | 缓缓飘移的 3D 云层 | webgl |
| `clouds2` | 云层变体，更厚重的天空质感 | webgl |
| `fog` | 弥漫流动的雾气 | webgl |
| `interactive-stars` | 可交互的星点闪烁 | canvas |
| `liquid-blobs` | 液态融球变形蠕动 | canvas |
| `meteor` | 流星雨划过夜空 | canvas |
| `ribbons` | 彩色丝带飘舞 | canvas |
| `rotating-spiral` | 旋转的螺旋图案 | canvas |
| `star-genesis` | 星辰诞生的粒子聚合 | canvas |
| `symbolic-gyre` | 符号环绕的旋涡 | canvas |
| `urban-downpour` | 都市暴雨与闪电 | canvas |

### 庆祝（Celebration）

| label | 效果简介 | tech |
| --- | --- | --- |
| `bouncing-balloons` | 弹跳的 SVG 气球 | canvas |
| `cartoon` | 卡通风格动画元素 | canvas |
| `confetti` | 五彩纸屑喷射 | canvas |
| `falling-confetti` | 飘落的纸屑雨 | canvas |
| `fireworks` | 绽放的烟花 | canvas |
| `fizzy-sparks` | 嘶嘶作响的火花气泡 | canvas |
| `supernova` | 超新星爆发与重生 | canvas |
| `walking-peeps` | 卡通小人横穿屏幕行走 | canvas |

### 交互（Interactive）

| label | 效果简介 | tech |
| --- | --- | --- |
| `data-tunnel` | 3D 透视数据隧道 | canvas |
| `long-shadow` | 长投影几何动画 | canvas |
| `mouse-trails` | 磁吸鼠标拖尾 | canvas |

### 粒子与系统（Particles & Systems）

| label | 效果简介 | tech |
| --- | --- | --- |
| `abstract-particles` | 抽象粒子系统漂浮聚散 | canvas |
| `cosmic` | 深空宇宙星海背景 | canvas |
| `digital-dust` | 数字尘埃微粒飘动 | canvas |
| `fireflies` | 发光萤火虫游弋 | canvas |
| `neon-network` | 霓虹粒子连线网络 | canvas |
| `net` | 节点连线的动态网格 | webgl |
| `net-dots` | 网格点阵连线（Vanta Dots） | webgl |
| `orbital-trails` | 轨道环绕的拖尾轨迹 | canvas |
| `particle-collision` | 粒子碰撞反应 | canvas |
| `particle-dots` | 点阵粒子场 | webgl |
| `particle-field` | 自包含粒子场 | canvas |
| `particle-flow` | 粒子流动场 | canvas |
| `particle-swarm` | 粒子集群游动 | canvas |
| `quantum-mesh` | 量子节点网格 | canvas |
| `starfield-warp` | 星空曲速穿梭 | canvas |
| `topology` | 拓扑曲面网格起伏 | webgl |
| `trunk` | 树干分形枝杈生长 | webgl |

### 复古与赛博朋克（Retro & Cyberpunk）

| label | 效果简介 | tech |
| --- | --- | --- |
| `circuit-tracers` | 电路板走线追踪 | canvas |
| `crimson-glitch` | 猩红故障数据流 | canvas |
| `crt-boot` | CRT 显示器开机序列 | canvas |
| `fiber-optics` | 赛博光纤数据传输 | canvas |
| `hyperspace-corridor` | 超空间走廊穿梭 | canvas |
| `neon-hexagons` | 霓虹六边形图案 | canvas |
| `pixel-flow` | 动态像素流 | canvas |
| `synthwave-grid` | 合成波网格飞驰 | canvas |
| `system-breach` | 系统入侵破坏特效 | canvas |

### 文字与排版（Text & Typography）

| label | 效果简介 | tech |
| --- | --- | --- |
| `financial-stream` | 金融数据流滚动 | canvas |
| `hex-wave` | 十六进制代码波浪 | canvas |
| `kinetic-swarm` | 动态文字集群 | canvas |
