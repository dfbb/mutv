# OPTIMIZE.md — 渲染管线优化提案

> 面向未来的优化方向，非当前实现。记录两条可显著降本的思路：**前景/背景分离渲染** 与 **AI 背景的题材缓存**。

## 背景与动机

当前管线（`src/render.mjs` → Remotion → h264）每帧都把 **preset 前景文字** 与 **`_shared/BackgroundLayer`（bg-anim / video / image / pexels / carousel）** 在同一次 Chromium 渲染里合成，再用 `--codec=h264 --pixel-format=yuv420p` 编码。

由此带来的浪费：

- 同一首歌 + 同一 preset，**只想换背景**，也要把前景文字连同背景一起全量重渲。
- WebGL 类 bg-anim、视频背景都被拖进 Chromium 逐帧渲染，成本高。
- 前景与背景无法并行、无法各自复用。

---

## 优化一：前景绿幕/Alpha 分离渲染 + ffmpeg 合成

把单一管线拆成两条独立管线，最后用 ffmpeg 合成：

1. **前景管线**：Remotion 只渲 preset 文字（根节点透明、跳过 `BackgroundLayer`），输出**带透明/绿幕**的前景片。
2. **背景管线**：bg-anim / 视频 / 图片 / Pexels / AI 各自产出背景片（无需进 Chromium）。
3. **合成**：ffmpeg 把前景叠到背景上，挂一次音轨。

### 两种抠像方式

| 方式 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **A. 绿幕 chroma key**（提议） | 根背景填纯绿 `#00FF00`，h264 即可；ffmpeg `colorkey`/`chromakey` 抠 | 编码兼容性好、体积小 | 发光/柔边/半透明描边有**绿色溢色（spill）**和边缘锯齿，霓虹/glow/渐变类 preset 受损 |
| **B. Alpha 通道**（推荐） | 根节点不设 `backgroundColor`，Remotion 透明输出（`--codec=prores --prores-profile=4444`，或 `vp8/vp9` + 透明 + `--image-format=png`） | **无溢色**，柔边/发光/半透明完美保留 | ProRes 4444 中间体积大；VP9 alpha 较小但编码慢 |

> 本项目有大量 glow / neon / 渐变 / 软描边 preset，**优先 Alpha**；绿幕作为不支持 alpha 场景的兜底。

### 适用边界（关键，不可一刀切）

并非所有 preset 都能分离。需区分：

- **可分离**：文字效果不读取背景像素 —— 多数 text + 多数 visual preset。
- **不可分离**：前景效果依赖背景，抠出来会丢效果，例如：
  - `mix-blend-mode` 与背景混合；
  - 对背景做 `blur`/遮罩/`backdrop-filter`；
  - 半透明面板透出背景；
  - `background-clip:text` 用背景做字面取色。

建议给 preset 加 `separable` 元数据字段，或**自动检测**（复用本仓库 `_shared/colorOverride.mjs` 的 `detectColorTargets` 思路，扫 `effect.css` 里的 `mix-blend-mode`/`backdrop-filter`/依赖背景的渐变）。不可分离的回退到现有全量渲染路径。

### ffmpeg 合成示例

```bash
# A. Alpha 前景（prores/webm，自带透明）
ffmpeg -i bg.mp4 -i fg.mov \
  -filter_complex "[0][1]overlay=shortest=1" -shortest out.mp4

# B. 绿幕前景
ffmpeg -i bg.mp4 -i fg_green.mp4 \
  -filter_complex "[1]colorkey=0x00FF00:0.30:0.10[k];[0][k]overlay" out.mp4
```

### 收益与代价

**收益**
- 前景渲一次，N 个背景复用：换背景从「Chromium 全量重渲」降为「一次 ffmpeg overlay」，快几个数量级。
- 前景/背景管线可并行；背景可用现成视频/AI/Pexels，绕过 Chromium。

**代价/风险**
- 中间产物（alpha 片）体积。
- **分辨率/帧率/时长三者必须对齐**，否则 overlay 错位；时长不足用 loop/boomerang 补齐（可借鉴 `lib/buildCarousel.mjs`）。
- 音频只在最终合成挂一次（前景片可不带音轨）。

### 落地切口

- `render.mjs` 加 `--foreground-only`：根透明 + 跳过 `BackgroundLayer` + 切 alpha 编码（绕开现有 `--codec=h264 --pixel-format=yuv420p`）。
- 新增后处理步骤 `--composite <bg>`：ffmpeg overlay。
- preset 元数据加 `separable` 字段 + 自动检测兜底。

---

## 优化二：AI 生成视频的题材缓存（相似风格共享）

### 现状

AI 生成背景视频成本高、延迟大。相同/相似题材每次重新生成是浪费。

### 方案：按「题材风格指纹」缓存，相似共享

- **缓存键 = 风格指纹，而非 prompt 原文**。维度示例：题材/genre、情绪、主色调、节奏档（BPM 分桶）、画面风格关键词。归一化后生成 hash 或向量。
- **命中策略**：
  - 精确命中：同指纹直接复用。
  - **相似命中**：指纹向量距离 < 阈值 → 多首相似风格的歌**共享同一条**背景视频。
- **缓存结构**：`cache/ai-bg/<fingerprint>.mp4` + `manifest.json`（指纹 → 文件、生成参数、时长、引用计数、最近使用）。
- **复用补齐**：AI 视频时长常 < 歌曲 → ffmpeg loop/boomerang 补齐（同上 carousel 思路）。
- **失效**：按风格版本 / 模型版本打 tag；LRU 清理。

### 与优化一协同

分离管线后，AI 背景就是「一条可复用的背景片」，天然适合缓存共享：**同风格的多首歌共用一条 AI 背景 + 各自前景 overlay**，成本摊薄到接近零。

---

## 优先级建议

1. **前景 Alpha 分离 + ffmpeg 合成** —— 收益最大、最通用。
2. **preset `separable` 标记 / 自动检测** —— 支撑第 1 条的正确性。
3. **AI 背景题材缓存** —— 待 AI 背景接入后落地，与第 1 条协同最佳。
