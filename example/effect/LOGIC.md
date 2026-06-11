# 原版歌词效果逻辑规范（Canonical Logic）

> 本文档从源码精确提取，作为 `effect/` 与 `bg/` 下 HTML 演示的"标准答案"。
> 演示用歌词《沧海一声笑》仅含**行级**时间戳（无逐音节信息），因此演示需把每行时长**按字符均分**来合成逐字时间（每个字符视作一个"音节"）。

## 来源文件
- `Renderer/LyricsRenderer.cs`：滚动布局、3D、扇形、呼吸、边缘遮罩
- `Renderer/LyricsLineRenderer.cs`：逐字卡拉OK填充、发光、缩放、浮动绘制
- `Helper/Lyrics/LyricsAnimator.cs`：所有过渡的**触发条件与目标值**（最核心）
- `Helper/ValueTransition.cs`：关键帧过渡 + 缓动
- `Renderer/BreathingRendererBase.cs`：低音呼吸缩放
- `Models/Lyrics/RenderLyricsChar.cs`：字符级 Scale/Glow/Float 过渡定义

## 全局常量（源码原值）
| 名称 | 值 | 含义 |
|---|---|---|
| `_defaultScale` | **0.75** | 非当前行的目标缩放（视线外效果下的最小值） |
| `_highlightedScale` | **1.0** | 当前行缩放 |
| 行模糊上限 | `5 * distanceFactor` px | 高斯模糊量，当前行=0 |
| `targetCharFloat`（auto） | `lineHeight * 0.1` | 字符下沉量 |
| `targetCharGlow`（auto） | `lineHeight * 0.2` | 发光模糊半径；手动默认 8 |
| `targetCharScale`（auto） | **1.15** | 字符放大目标；手动 = amount/100 |
| 长音节阈值 | **700ms** | Glow / Scale 仅在 ≥700ms 的音节触发 |
| `LyricsFloatAnimationDuration` | **450ms** | 单字上浮回归时长 |
| 缓动 | **Sine**（EaseInOutSine） | Scale/Glow/Float 均用正弦缓动 |

## 关键概念：distanceFactor（距离因子）
```
distanceFactor = clamp(|line.Y - playingLine.Y| / halfHeight, 0, 1)
```
- 以**像素距离**而非"第几行"计算；当前行上方用 topHeightFactor，下方用 bottomHeightFactor。
- 当前行 distanceFactor=0，越远越接近 1。
- 模糊、淡出、视线外缩放、扇形角度**全部**由它驱动。

## 滚动锚点模型（所有效果共用）
- **当前播放行锚定在固定垂直位置**（`LyricsY + LyricsHeight * PlayingLineTopOffsetFactor`，演示用 ~50%）。
- 歌词整体滚动，让当前行始终停在锚点。
- 非当前行：**不是把当前行放大**，而是把其它行**缩小到 0.75**（视线外开启时按 distanceFactor 插值）。
- 远处行动画**时长更长 + 延迟更大**（staggered，越远越慢）。

---

## 各效果标准逻辑

### 01 逐字卡拉OK（Word-by-Word）—— `LyricsLineRenderer.DrawSubLineRegion`
- 每字进度 `p = clamp((t - charStart)/charDur, 0, 1)`。
- 整行渲染为**一条水平线性渐变**：`[0..progress]` 已唱色（亮）→ 软边 `[progress .. progress + 0.5/charCount * 首字进度]` → 未唱色（暗）→ `[..1]`。
- 即**连续渐变扫过**，软边约半个字宽；已唱亮、未唱暗，同处一行。**不是**每字硬切。

### 02 发光（Glow）—— 默认 scope = LongDurationSyllable
- **仅** DurationMs ≥ 700ms 的音节发光。音节开始时其字符 Glow 关键帧：`0→targetGlow`(inDuration) 再 `targetGlow→0`(outDuration)，Sine。
- 发光只作用于字符**已唱部分**（`charWidth * progressPlayed`）的高斯模糊。
- 即：长音上**脉冲式**亮起再淡灭，短音不发光。

### 03 缩放（Scale）—— 仅长音节脉冲
- **仅** DurationMs ≥ 700ms 的音节：字符 `1.0 → 1.15`(inDuration) `→ 1.0`(outDuration)，Sine，逐字。
- 是**瞬态脉冲**（放大再回落），**不是**当前行恒定放大。
- （当前行 vs 其它行 0.75 的整体缩放属于"滚动锚点模型"，与此独立。）

### 04 浮动（Float）—— `LyricsAnimator` 浮动段
- 当前行激活瞬间：未唱字符**下沉** `+targetFloat`（lineHeight*0.1），已唱字符归 0。
- 每字开始播放时，从 `+targetFloat` **上浮回 0**，时长 450ms，Sine。
- 净效果：未唱字符略低，随演唱**逐字升起**到基线（波浪式上抬）。行结束后全部归 0。

### 05 模糊淡出（Blur）—— `IsLyricsBlurEffectEnabled`
- 行模糊 = `5 * distanceFactor` px（当前行 0，越远越糊）。
- 配合淡出：opacity = `(1 - distanceFactor) * baseOpacity`。
- **距离驱动**，绕固定锚点。

### 06 视线外（Out-of-Sight）—— `IsLyricsOutOfSightEffectEnabled`
- 缩放：`1.0 - distanceFactor * (1.0 - 0.75)`，越远越缩到 0.75。
- 配合淡出 opacity = `(1 - distanceFactor) * base`。
- 强调**远行缩小+淡隐**（可不加模糊）。

### 07 阴影（Shadow）—— `IsLyricsShadowEffectEnabled`
- 当前行强投影 + 轻微彩色辉光；非当前行弱投影。静态样式，无逐字逻辑。

### 08 边缘渐隐遮罩（Edge Fade）—— `EdgeFadeMaskRenderer`
- 歌词区**上下边缘**渐变遮罩（垂直方向 16px 渐隐带）。行滚入/滚出时在区域边缘渐隐。

### 09 3D 透视 —— `LyricsRenderer.CalculateLyrics3DMatrix`
- 对整个歌词层施加 4×4：平移到中心 → rotateX/Y/Z → 透视(`M34 = 1/depth`) → 平移回。
- 绕**中心锚点**整体倾斜，滚动块一起透视。

### 10 扇形（Fan）—— `LyricsAnimator` AngleTransition
- 每行角度 = `fanAngleRad * distanceFactor * (在下方?+1:-1)`，绕**左/右边缘**为轴（取决于角度正负），并附加 xOffset。
- 当前行角度 0，越远偏转越大。

### 11 呼吸（Breathing）—— `BreathingRendererBase.UpdateBreathing`
- 目标缩放 `target = 1 + bassEnergy * (intensity/100)`。
- 非对称插值：`target > current` 时 `current += (target-current)*0.2`（快速 Attack）；否则 `*0.05`（缓慢 Decay）。
- **仅当前行**、且仅当 scale>1 时应用，绕行中心。
