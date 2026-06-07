# bg-anim 节拍反应设计

日期:2026-06-08
状态:已批准设计,待写实现计划

## 背景与动机

`--bg-anim` 提供 72 个动画背景模板(`src/animbg/<label>/index.html`),各自是独立的 canvas / WebGL / SVG / VANTA / p5 动画,通过 `<IFrame src>` 加载,各跑各的动画循环,**与音乐无关**。

参考 `3rd/butterchurn`(Milkdrop 的 WebGL 实现),研究其"动画跟节拍相关"的机制,目标是让我们的 bg-anim 也具备同样的节拍反应感。

### butterchurn 的节拍机制(研究结论)

核心在 `3rd/butterchurn/src/audio/audioProcessor.js` + `audioLevels.js`:

1. **FFT 取频谱** — 对音频时域采样做 FFT,得到各频率强度。
2. **切 3 个频段** — 按赫兹分桶:bass(20–320Hz)、mid(320–2800Hz)、treb(2800–11025Hz),每段求和。
3. **相对化(灵魂)** — 每段强度除以一个**长时间滑动平均** `longAvg`,得到的不是绝对音量,而是"此刻比平时响多少",基线约 1.0,鼓点一来 bass 飙到 2~4。这样无论整首歌混音多大声,反应都一致。
4. **preset 消费** — Milkdrop preset 内部写 `zoom = 1 + 0.1*bass`、`warp *= mid` 等,把这 3 个值乘到运动参数上,于是低频一锤就"放大/抽搐",高频一来就闪烁。

### 关键差异(为何不能照搬)

butterchurn 的 preset 天生为消费 bass/mid/treb 而设计;我们的 72 个模板不是,它们各写各的动画,**没有统一的"速度/强度"变量**可供乘上节拍值。逐模板改造(72×)已被否决。

### 好消息

mutv 渲染管线**已具备逐帧确定性取音频频谱的能力**:`preset/orig/AudioVisualization.tsx` 和 `preset/no2/AudioViz.tsx` 都在用 `@remotion/media-utils` 的 `useAudioData` + `visualizeAudio`。所以"算出频谱"这步是现成的,只需复刻 butterchurn 的归一化逻辑。

## 方案:通用注入(共享 React 层 + iframe 时钟注入)

**不编辑 72 个 HTML 文件。** 所有逻辑集中在一个共享 React 组件 + 一段注入脚本。新组件 `BeatReactiveAnim` 替换 `BackgroundLayer` 中现有的 `backgroundAnim` 那段 `<IFrame>` 分支。

### 两条驱动通道

1. **React 外层(CSS,稳健)** — 对 iframe 容器施加 `transform: scale(1 + k·bass)` 脉冲 + `filter: brightness()/saturate()` 随 mid/treb 闪动。作用于模板渲染出的整体画面。对所有模板生效。
2. **iframe 内部(时钟,脆弱)** — 注入脚本覆盖 `performance.now()` / `Date.now()`,返回一个由 bass 积分加速的**虚拟时间** `vt += dt·(1 + g·bass)`。React 侧每帧通过 `contentWindow` 把当前虚拟时间喂进去(复用 carousel 已验证的 `delayRender` + `contentWindow` 函数调用模式,避免黑屏竞态)。基于时间积分的模板(canvas rAF、VANTA、p5)会在鼓点时"加速运动";基于纯帧计数的模板对此免疫——这就是"脆弱"的含义,文档标明哪类不生效。

### 为何选 React 层而非编辑 HTML

要让模板*内部*运动反应,只能逐模板改(已否决)。"通用"且"确定性可渲染"的做法是在 React 侧逐帧算出 bass/mid/treb,对整个 iframe 施加节拍驱动的变换/滤镜。这恰好是 butterchurn 最标志性的观感(随低频"呼吸/放大"),全程走 Remotion 已有的确定性音频通道,无需逐帧 postMessage、无黑屏竞态,比注入 72 个文件更稳更可控。

## 架构与组件

| 组件 | 职责 | 依赖 |
| --- | --- | --- |
| `computeLevels(audioData, frame, fps)` 纯函数 | 复刻 butterchurn 归一化:切 bass/mid/treb 三段求和,各除以滑动长时均值 `longAvg`,返回 ~1.0 基线的 `{bass, mid, treb}` | `visualizeAudio` |
| `BeatReactiveAnim` React 组件 | 替换 `BackgroundLayer` 的 `backgroundAnim` 分支;逐帧取 levels,驱动 CSS 通道 + 时钟通道 | `computeLevels`、`delayRender`/`continueRender`、`contentWindow` |
| 时钟注入脚本 | 注入到 anim HTML,覆盖 `performance.now`/`Date.now` 返回虚拟时间,暴露 `window.__beatTick(virtualTime, levels)` | 扩展 `animbgInject.mjs` 或新建模块 |
| `render.mjs` / `cli.mjs` | 新增 `--bg-anim-beat` flag,写入 `inputProps` | — |

### 数据流(每帧)

```
useCurrentFrame(frame)
  → computeLevels(audioData, frame, fps) 得 {bass, mid, treb}
  → ① CSS 通道:算 transform: scale / filter: brightness/saturate,应用到 iframe 容器
  → ② 时钟通道:积分出 virtualTime
       delayRender 阻塞本帧
       → iframe.contentWindow.__beatTick(virtualTime, levels)
       → requestAnimationFrame 等一帧绘制
       → continueRender
```

### longAvg 跨帧积分的确定性处理

`visualizeAudio` 逐帧无状态,而 `longAvg` 需跨帧积分。解决:`computeLevels` 为纯函数,内部对 `[0..frame]` 做一次轻量递推(或维护模块级 `frame → levels` 缓存)。要求:同一 frame 多次调用结果一致(可重渲染硬约束)。

## 节拍参数(保守默认,可调)

```
bass scale 脉冲:   scale      = 1 + 0.04 * clamp(bass-1, 0, 2)   // 安静≈1.0,鼓点≈1.04~1.08
亮度闪动:          brightness = 1 + 0.06 * clamp(mid-1,  0, 2)
饱和闪动:          saturate   = 1 + 0.10 * clamp(treb-1, 0, 2)
时钟加速增益:      vt += dt * (1 + 0.6 * clamp(bass-1, 0, 2))    // 鼓点最多 ~2.2x 速度
```

- 全部基于 butterchurn 的相对值(基线 1.0),`clamp` 防极端帧炸裂。
- scale 用 `transform-origin: center` + 容器 `overflow: hidden`,放大不露黑边。
- 系数刻意偏保守:butterchurn 看着猛是因 preset 内部多参数叠加,我们只有外层几个滤镜,过猛显廉价。先给克制默认值,看样片再调。

## 开关与默认行为

- 新增 CLI flag `--bg-anim-beat`(布尔,默认**开**)。`--bg-anim` 已选效果时自动按节拍反应;`--no-bg-anim-beat`(或 `--bg-anim-beat=false`)关掉,退回现有静态 `<IFrame>` 行为。
- 经 `render.mjs` 写进 `inputProps`,`BackgroundLayer` 据此选 `BeatReactiveAnim` 或原分支。不破坏现有渲染。

## 错误处理(均静默降级,绝不黑屏或崩渲染)

- `useAudioData` 未就绪(返回 null)→ 当帧 levels 全取 1.0(静止基线),照常渲染,不阻塞。
- iframe 未暴露 `__beatTick`(未注入完 / 模板异常)→ 跳过时钟通道,仅保留 CSS 通道;`delayRender` 用与 carousel 同款超时 + cleanup 释放,绝不挂死。
- 时钟注入脚本包 try/catch,覆盖 `performance.now` 失败即放弃时钟通道,不影响模板原本运行。

## 测试与验证

1. `computeLevels` 纯函数单测:喂合成频谱,断言 bass/mid/treb 归一化数值、clamp 边界、静音→1.0。
2. 确定性测试:同一 frame 调两次结果一致。
3. 端到端冒烟:挑 3 个代表模板(canvas 时间型 `aurora`、VANTA `waves`、帧计数型若有)各渲一小段,人工核对:(a) 无黑屏、(b) 时间型有节拍加速、(c) 帧计数型至少有 CSS 脉冲。
4. 关开关回归:`--no-bg-anim-beat` 输出与当前 `main` 逐像素一致(零破坏)。

## 已知风险 / 边界

- 纯帧计数驱动的模板:时钟通道无效,只剩 CSS 脉冲——可接受,文档标明。
- 跨 iframe 调函数依赖同源;模板都从 `public/` 同源加载,OK(carousel 已验证)。
- CSS scale 脉冲对"画面已铺满"的模板最自然;少数留边模板放大可能轻微裁切,默认系数小到基本无感。

## 交付物

- `BeatReactiveAnim` 组件
- `computeLevels` 工具 + 单测
- 时钟注入脚本(扩展 `animbgInject.mjs` 或新建)
- `render.mjs` / `cli.mjs` 的 `--bg-anim-beat` flag
- `USAGE.md` 更新
