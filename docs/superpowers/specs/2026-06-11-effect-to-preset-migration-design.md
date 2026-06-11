# example/effect → src/preset 歌词特效移植设计

日期：2026-06-11
状态：已批准（设计阶段）

## 目标

把 `example/lyrics-demo.html` + `example/effect/` 下的歌词特效移植为 Remotion 可渲染的 preset，并统一 preset 命名规范与存放方式。

## 范围

- **移植**：text 类 11 个（001–011）+ visual 类 86 个（012–097），共 97 个。**97 个全部必须交付，不允许剔除**；强依赖被剥离字体的效果（如 016 Nabla）接受观感降级，在 README 索引中标注
- **不移植**：`effect/core-*.js`（6 个 bg 类背景特效）
- **同步整理**：现有 8 个旧 preset 改名归入新规范，共享组件移入 `_shared/`

## 硬约束

1. 移植后必须支持 Remotion 逐帧确定性渲染
2. 特效外部字体（Google Fonts `@import` 等）全部剥离，复用现有本地字体管线（FontLoader + `--font-family/--font-file`）
3. 颜色复用现有配置：`fontFgColor/fontBgColor` 不传时特效原配色保留；传了则 CLI 颜色优先强覆盖（详见「颜色覆盖语义」）
4. 字号复用现有 `height * 0.055 * fontScale` 体系，不用特效自带的 clamp/em 硬编码

## 架构：共享引擎 + 薄 preset（方案 A）

```
src/preset/
  _shared/                    # 现有平铺共享组件移入（BackgroundLayer、FontLoader、
                              #   lyricsToData、StudioControlBar、TextColorOverride 等）
  _engine/                    # demo 引擎的 Remotion 移植（无 index.ts，不被识别为 preset）
    ScrollLyrics.tsx          # 滚动锚点引擎：distanceFactor、行级时间均分逐字、确定性滚动插值
    VisualLyrics.tsx          # 单行展示引擎：scoped CSS + 逐字 reveal 遮罩 + 负 animation-delay 驱帧
    makePreset.tsx            # 工厂：effect 定义 → Root/Composition
    effects/
      text/001-word-by.ts …   # 11 个，来自 LOGIC.md 规范
      visual/014-gooey-marquee.ts …  # 86 个，{css, html, letterTpl?, timeBase?} 数据
  fx-001-word-by/             # 薄 preset 目录，index.ts ≈5 行调 makePreset(effect)
  …
  fx-097-retro-glitch/
  fx-apple/ … fx-typewriter/  # 旧 preset 改名
  README.md                   # 索引：目录名、中文名、类别、来源
```

`render.mjs` 按「目录含 index.ts」扫描 preset，本方案零改动兼容 `--preset <name>` 与 `--preset random`。

## 命名规范

- 目录名 = `--preset` 值，全小写 kebab-case，统一 `fx-` 前缀
- 移植效果保留原三位编号对照 example：`fx-001-word-by`、`fx-014-gooey-marquee`
- 旧 preset 加前缀改名：`apple→fx-apple`、`bounce→fx-bounce`、`cinema→fx-cinema`、`ktv→fx-ktv`、`neon→fx-neon`、`no2→fx-no2`、`orig→fx-orig`、`typewriter→fx-typewriter`
- **默认入口全量改写，不留旧名 alias**：`render.mjs` 默认值（`args.preset || 'orig'`）、`cli.mjs:111`、`package.json` 的 `start`/`build`（`preset/orig/index.ts`）、`scripts/render_all.py` 等所有 `orig` 引用统一改为 `fx-orig`，改名与引用更新在同一提交内完成并以 `npm start` + 不带 `--preset` 渲染验证
- 每个效果定义文件头保留一行来源注释（原 CodePen 名 / LyricsAnimator 出处）

## 关键技术映射

| demo / 特效原状 | Remotion 移植实现 |
|---|---|
| audio 时钟 + rAF | `useCurrentFrame()/fps` 换算 ms，纯帧驱动 |
| CSS keyframes 动画 | 见下「驱帧规则」 |
| 滚动 lerp（依赖上一帧状态） | 确定性插值：按行切换时刻起算 easeOut |
| Shadow DOM 样式隔离 | 见下「CSS scope 规则」 |
| `@import` 字体 | 剥离；特效内 `font-family` 改为继承容器（FontLoader 提供） |
| 硬编码颜色 | 见下「颜色覆盖语义」 |
| 自带字号 | 引擎容器设基准字号（height*0.055*fontScale），内部 em 相对缩放 |

### 驱帧规则（CSS 动画 → 逐帧确定性）

对 scope 内每条 `animation` 声明：保留原 `animation-name/duration/timing/iteration` 等，强制 `animation-play-state: paused !important`，并把 `animation-delay` 重写为**逐项合成值** `原delay_i − t`。**t = 行内时间 = 当前帧时间 − 当前歌词行 start**（demo 在换行时重建 Shadow DOM、动画逐行重播，引擎等价做法是换行时重挂效果子树 + 行内时间驱帧），one-shot 入场动画因此每行重播。需要全局相位的无限循环动画在效果定义 schema 中标注：visual 定义为 `{css, html, letterTpl?, timeBase?: 'line' | 'global'}`，默认 `'line'`。识别规则：转换脚本对 `animation-iteration-count: infinite`（含 shorthand 内的 `infinite`）且 keyframes 含位移类属性（translate/margin/left 等）的效果输出候选清单，人工确认后标注；首批已知 global：014 跑马灯、030 机场翻牌屏。步骤 3 验收含「候选清单已确认完毕」。多动画列表按 `animation-name` 个数逐项展开，缺省 delay 视为 0，原有逐字/分层 stagger（如 016、023、037 的 `--i` delay）因此保留相位。转换脚本静态可见的 delay 直接合成；依赖 CSS 变量的 delay 由引擎用 `calc(原delay表达式 − t·1s)` 注入。

### CSS scope 规则（替代 Shadow DOM）

转换时用 postcss 做选择器改写，不用裸字符串替换（postcss + postcss-selector-parser + postcss-value-parser **显式加入 devDependencies**，不依赖 Remotion 的传递依赖）：
- 所有 `animation` **shorthand**（如 `animation: marquee 16s infinite linear`）用 postcss-value-parser 拆解后读写 name/duration/delay/iteration-count，与显式 `animation-name`/`animation-delay`/`animation-iteration-count` 属性走同一套读写逻辑；keyframes 改名、delay 合成、infinite 检测均同时覆盖 shorthand 与 longhand，并各有单测
- `:host` → 效果根容器类 `.fx-<id>`；`:host .x` → `.fx-<id> .x`；`:root` → `.fx-<id>`（CSS 变量定义改挂效果根，var() 引用照常生效）；其余选择器统一加 `.fx-<id> ` 前缀（伪类/伪元素保持在末位）
- `@keyframes` 名与所有 `animation-name` 引用统一加 `fx<id>-` 前缀，防跨效果串名
- 样式注入顺序与 demo 一致：效果 css 在前、引擎 VISUAL_OVERRIDE 等价层在后；源效果里既有的 `:host .bl-wrap … !important` 黑屏修复经映射后特异度关系不变，原样生效
- 以 014（黑屏修复 + mask 关闭）、020（`:host` 覆盖）、034/048/077（`:root` CSS 变量）为代表性样例写转换单测

### 颜色覆盖语义（fontFgColor / fontBgColor）

沿用现行 TextColorOverride 语义并扩展：
- **不传**：零副作用，特效原配色（渐变、霓虹、全息等）完整保留——这是默认路径
- **传了**：CLI 颜色优先、允许牺牲特效配色。覆盖范围从现在的 `color/text-shadow` 扩展到 `-webkit-text-fill-color`、`background-clip:text` 类渐变填充、`-webkit-text-stroke-color`（保留原 stroke 宽度）及 `*::before/*::after` 伪元素。stroke 取色优先级：传 `fontBgColor` 时 stroke-color 用 bgColor（勾边语义），否则用 fgColor。验收标准 = 传色时画面所有可见文字（含描边）均为指定色
- README 索引中标注「强依赖配色」的特效（如 028 全息），提示传色后观感损失

### 011 呼吸效果（节拍能量）

复用 `BeatReactiveAnim.tsx` 已有的 `useAudioData + visualizeAudio` 低频能量提取（确定性）。原 attack 0.2 / decay 0.05 非对称单极滤波是跨帧状态，改为确定性等价：每帧从当前行起始帧迭代重算滤波（行时长有界，开销可忽略），保证任意帧独立渲染结果一致。

## 实施步骤（每步可验证）

1. `_shared/` 整理 + 旧 preset 改名 → 验证：`render.mjs --preset fx-neon --html` 正常
2. `_engine/` 两引擎 + makePreset → 验证：手写 fx-001（text）+ fx-014（visual）渲染出帧
3. 脚本批量转换 97 个效果定义 + 生成薄 preset 目录 → 验证：**105 个 preset（97 新 + 8 旧改名）全量 smoke render（各出 1 帧 still）成功**，TS/CSS/模板错误与改名/共享组件移动导致的 import 断裂在此层全部暴露；timeBase 候选清单已确认完毕
4. 批量出帧**视觉**抽检（复用 `--debug-preset`），重点查 visual 类黑屏 / 动画不动 / 颜色覆盖失效，逐个修复——抽检只判视觉质量，可用性以步骤 3 的全量 smoke 为准
5. 写 `preset/README.md` 索引

## 已知风险

- 86 个 visual 质量参差（demo 阶段已修过一轮黑屏），步骤 4 的逐个排查是主要工作量
- 依赖 CSS 变量的 animation-delay 需引擎 calc 注入路径，个别复杂时序特效可能仍需手工调整
- 个别特效效果强依赖被剥离的特定字体（如 Nabla 彩色字体），观感会降级——仍交付，README 标注，不剔除
