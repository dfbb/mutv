# preset 索引

`src/preset/` 收录全部歌词视效模板（preset），共 **105 个**。每个 preset 是一个独立目录，按统一契约暴露 `index.ts` / `Root.tsx`，供共享渲染入口 `render.mjs`（Remotion composition `MusicVideo`）加载。

## 命名约定

- 所有 preset 目录一律以 `fx-` 前缀开头。
  - **旧版（word-level）**：`fx-apple`、`fx-bounce`、`fx-cinema`、`fx-ktv`、`fx-neon`、`fx-no2`、`fx-orig`、`fx-typewriter`——早期从 ai-music-video-maker 的歌词浮层（lyrics-overlay）移植而来的逐词高亮样式，自带完整 `Composition.tsx`（部分另有 `Lyrics.tsx`），不走 effect-def 系统。
  - **text 类**：`fx-001-*` … `fx-011-*`——薄壳 preset，效果定义在 `_engine/effects/text/0NN-*.ts`。
  - **visual 类**：`fx-012-*` … `fx-097-*`——薄壳 preset，效果定义在 `_engine/effects/visual/<id>-<slug>.ts`。
- `_engine/` 与 `_shared/` 是**共享基础设施，不是 preset**（引擎、组件、effect 定义、转换脚本）。`render.mjs` 会跳过下划线开头的目录。

## 如何渲染

单个 preset：

```bash
node src/cli.mjs --audio <音频> --lyrics <lrc/srt> --title "歌名" --preset <目录名>
# 例：--preset fx-019-css-neon
```

批量渲染全部 preset（输出 `out/preset_all/<preset>.mp4`，增量跳过已存在文件）：

```bash
python3 scripts/preset_all.py            # 全部
python3 scripts/preset_all.py fx-019-css-neon   # 仅指定（可多个）
```

## 文字颜色覆盖（`--font-fg-color` / `--font-bg-color`）

传入 `--font-fg-color`（填充色）/ `--font-bg-color`（描边/勾边色）会**强制所有可见文字**（含描边、渐变、发光）改用指定颜色，覆盖 preset 自带配色。格式为 `R:G:B`（如 `212:122:33`）或 CSS 颜色名（如 `white`）。

两个 effect 因自身实现存在固有限制，无法被完全覆盖：

- **028-holographic-type**——全息效果靠父级 filter 着色，颜色覆盖无法穿透该滤镜，效果有限。
- **055-metallic-bordered**——文字本体即以「字形作为渐变蒙版」实现，覆盖填充色时金属渐变质感无法完整替换。

---

## 旧版（word-level）

| preset 目录 | 名称 | 类别 | 来源(src) | 备注 |
| --- | --- | --- | --- | --- |
| `fx-apple` | Apple 风逐词 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-bounce` | 弹跳逐词 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-cinema` | 影院字幕 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-ktv` | KTV 逐词高亮 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-neon` | 霓虹逐词 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-no2` | No.2（点阵 + 双行） | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |
| `fx-orig` | 原始默认（音频可视化） | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | 默认入口 preset |
| `fx-typewriter` | 打字机 | 旧版(word-level) | ai-music-video-maker lyrics-overlay 移植 | |

## text 类（`_engine/effects/text/`）

| preset 目录 | 名称 | 类别 | 来源(src) | 备注 |
| --- | --- | --- | --- | --- |
| `fx-001-word-by` | 逐字卡拉OK | text | 逐字卡拉OK · Renderer/LyricsLineRenderer.cs | |
| `fx-002-glow` | 发光（长音脉冲） | text | 发光(长音脉冲≥700ms) · LyricsAnimator.cs | |
| `fx-003-scale` | 缩放（长音脉冲） | text | 缩放(长音脉冲≥700ms) · LyricsAnimator.cs | |
| `fx-004-float` | 浮动（逐字升起） | text | 浮动(逐字升起) · LyricsAnimator.cs | |
| `fx-005-blur-fade` | 模糊淡出（距离驱动） | text | 模糊淡出 blur=5×df · LyricsAnimator.cs | |
| `fx-006-out-of` | 视线外（缩小+淡隐） | text | 视线外 scale=1−df×0.25 · LyricsAnimator.cs | |
| `fx-007-shadow` | 阴影 | text | 阴影 · LyricsLineRenderer.cs | |
| `fx-008-edge-fade` | 边缘渐隐遮罩 | text | 边缘渐隐遮罩 · EdgeFadeMaskRenderer.cs | |
| `fx-009-3d-perspective` | 3D 透视 | text | 3D透视 · LyricsRenderer.CalculateLyrics3DMatrix | |
| `fx-010-fan` | 扇形展开 | text | 扇形 angle=fan×df×(±1) · LyricsAnimator.cs | |
| `fx-011-breathing` | 呼吸（低音律动） | text | 呼吸 attack0.2/decay0.05 · BreathingRendererBase.cs | |

## visual 类（`_engine/effects/visual/`）

| preset 目录 | 名称 | 类别 | 来源(src) | 备注 |
| --- | --- | --- | --- | --- |
| `fx-012-css-only` | CSS only marquee with slow on hover | visual | CSS only marquee with slow on hover · CodePen | |
| `fx-013-perspective-is` | Perspective is a matter of perception | visual | Perspective is a matter of perception · CodePen | |
| `fx-014-a-gooey` | A Gooey Marquee | visual | A Gooey Marquee · CodePen | 全局相位（连续滚动） |
| `fx-015-breathe-animation` | Breathe animation – Variable Font | visual | Breathe animation – Variable Font, HTML · CodePen | |
| `fx-016-nabla-color` | Nabla color font! | visual | Nabla color font! · CodePen | 见「观感降级」 |
| `fx-017-text-animation` | Text Animation Inspired By Apple Event | visual | Text Animation Inspired By Apple Event · CodePen | |
| `fx-018-pure-css` | Pure CSS pseudo-randomized keyboard pressing text | visual | Pure CSS pseudo-randomized keyboard pressing text effect · CodePen | |
| `fx-019-css-neon` | CSS Neon Text Animation | visual | CSS Neon Text Animation · CodePen | |
| `fx-020-colored-text` | Colored text with CSS masks (animated) | visual | Colored text with CSS masks (animated) · CodePen | 见「观感降级」 |
| `fx-021-letter-spacing` | letter spacing animation | visual | letter spacing animation · CodePen | |
| `fx-022-animated-shiny` | Animated Shiny Gold Text | visual | Animated Shiny Gold Text · CodePen | |
| `fx-023-schitts-creek` | Schitt's Creek CSS title animation | visual | Schitt's Creek (CSS) title animation · CodePen | |
| `fx-024-eat-sleep` | EAT SLEEP RAVE - 3D ROTATE | visual | EAT SLEEP RAVE - 3D ROTATE · CodePen | |
| `fx-025-city-nights` | City Nights Text Effect | visual | City Nights Text Effect · CodePen | |
| `fx-026-text-shadow` | Text Shadow | visual | Text Shadow · CodePen | |
| `fx-027-css-text` | Text shadow animation (CSS) but I'm being extra | visual | Text shadow animation (CSS) but I'm being extra · CodePen | |
| `fx-028-holographic-type` | Holographic type | visual | Holographic type · CodePen | 颜色覆盖受限（父级 filter） |
| `fx-029-text-animation-2` | Text Animation | visual | Text Animation · CodePen | |
| `fx-030-airport-info` | Airport info | visual | Airport info · CodePen | 见「观感降级」 |
| `fx-031-cool-text` | Cool Text | visual | Cool Text · CodePen | |
| `fx-032-pure-css-2` | Pure CSS text-animation | visual | Pure CSS text-animation · CodePen | |
| `fx-033-css-text-2` | CSS Text-Shadow Animation | visual | CSS Text-Shadow Animation · CodePen | 见「观感降级」 |
| `fx-034-waaaves` | Waaaves | visual | Waaaves · CodePen | |
| `fx-035-easy-animation` | Easy Animation | visual | Easy Animation · CodePen | |
| `fx-036-animated-3d` | 3D Text (scss) - animated | visual | 3D Text (scss) - animated · CodePen | |
| `fx-037-rainbow-effect` | Rainbow and Trail Effect | visual | Rainbow and Trail Effect · CodePen | |
| `fx-038-animated-neon` | Breathe (Coded on iOS) | visual | Breathe (Coded on iOS) · CodePen | |
| `fx-039-animated-text` | mix-blend-mode | visual | mix-blend-mode · CodePen | |
| `fx-040-multi-line` | Multi-line spanning animated underline. | visual | Multi-line spanning animated underline. · CodePen | |
| `fx-041-spooky-typo` | Spooky Typo | visual | Spooky Typo · CodePen | |
| `fx-042-luminance` | Luminance | visual | Luminance · CodePen | |
| `fx-043-text-shadow-2` | Text-Shadow Animate | visual | Text-Shadow Animate · CodePen | |
| `fx-044-smoky-text` | Smoky Text | visual | Smoky Text · CodePen | 见「观感降级」 |
| `fx-045-stippling-on` | Stippling on Text | visual | Stippling on Text · CodePen | |
| `fx-046-3d-text` | 3D TEXT! | visual | 3D TEXT! · CodePen | |
| `fx-047-text-reflect` | Text Reflect Effect Demo | visual | Text Reflect Effect Demo · CodePen | |
| `fx-048-sliced-text` | Sliced Text Effect | visual | Sliced Text Effect · CodePen | |
| `fx-049-sweet-stuff` | Sweet stuff | visual | Sweet stuff · CodePen | |
| `fx-050-butter` | Butter | visual | Butter · CodePen | |
| `fx-051-text-shadow-3` | Text Shadow | visual | Text Shadow · CodePen | |
| `fx-052-pure-css-3` | Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect | visual | Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect · CodePen | |
| `fx-053-css-paper` | CSS Paper Cut-out Effect | visual | CSS Paper Cut-out Effect · CodePen | |
| `fx-054-gradient-stroke` | Gradient Stroke | visual | Gradient Stroke · CodePen | |
| `fx-055-metallic-bordered` | Metallic Bordered Text with CSS | visual | Metallic Bordered Text with CSS · CodePen | 颜色覆盖受限（字形即渐变蒙版） |
| `fx-056-multi-colored` | Multi Colored Text with CSS | visual | Multi Colored Text with CSS · CodePen | |
| `fx-057-css-text-3` | CSS text-emphasis | visual | CSS text-emphasis · CodePen | |
| `fx-058-multilayer-text` | Multilayer text | visual | Multilayer text · CodePen | |
| `fx-059-css-sticker` | CSS Sticker | visual | CSS Sticker · CodePen | |
| `fx-060-deconstructed` | DECONSTRUCTED | visual | DECONSTRUCTED · CodePen | 全局相位（连续滚动） |
| `fx-061-css-text-4` | CSS Text Reveal | visual | CSS Text Reveal · CodePen | |
| `fx-062-text-background` | Background clipping covfefe | visual | Background clipping covfefe · CodePen | |
| `fx-063-typo-triple` | Typo triple | visual | Typo triple · CodePen | |
| `fx-064-80s-fonts` | 80s Fonts Text Effect 4: Cyberspace Text | visual | 80s Fonts Text Effect 4: Cyberspace Text · CodePen | |
| `fx-065-css-3d` | "HEY" - CSS 3D Text Animation | visual | "HEY" - CSS 3D Text Animation [ANIMATION] · CodePen | |
| `fx-066-scss-3d` | SCSS 3D text mixin | visual | SCSS 3D text mixin · CodePen | |
| `fx-067-simple-3d` | Skewed and Rotated Text | visual | Skewed and Rotated Text · CodePen | |
| `fx-068-animated-3d-2` | Only CSS: Text Wave | visual | Only CSS: Text Wave · CodePen | |
| `fx-069-multi-coloured` | Multi-coloured CSS Text Effect with Text Shadows | visual | Multi-coloured CSS Text Effect with Text Shadows · CodePen | |
| `fx-070-css-only-2` | CSS only 3D paper fold text effect | visual | CSS only 3D paper fold text effect · CodePen | |
| `fx-071-3d-text-2` | 3D text stroke | visual | 3D text stroke · CodePen | |
| `fx-072-3d-text-3` | 3D Text Lighting & Shadows | visual | 3D Text Lighting & Shadows · CodePen | |
| `fx-073-css-3d-2` | CSS3D | visual | CSS3D · CodePen | |
| `fx-074-css-neon-2` | neon lights affect | visual | neon lights affect · CodePen | |
| `fx-075-check-me` | Check Me Out Glow Text | visual | Check Me Out Glow Text · CodePen | |
| `fx-076-css-neon-3` | CSS Neon Sign | visual | CSS Neon Sign · CodePen | |
| `fx-077-flickering-neon` | Flickering Neon Sign Effect using CSS Text & Box Shadow | visual | Flickering Neon Sign Effect using CSS Text & Box Shadow · CodePen | |
| `fx-078-css-neon-4` | Neon | visual | Neon · CodePen | |
| `fx-079-neon-text` | Neon Text Effect | visual | Neon Text Effect · CodePen | |
| `fx-080-neon-flux` | Neon Flux | visual | Neon Flux · CodePen | |
| `fx-081-neon-sign` | Neon sign | visual | Neon sign · CodePen | |
| `fx-082-blazing-fire` | Blazing Fire | visual | Blazing Fire · CodePen | 见「观感降级」 |
| `fx-083-layered-text` | Layered text-shadow effect CSS | visual | Layered text-shadow effect CSS · CodePen | |
| `fx-084-text-stroke` | Strokes, Shadows + Halftone Effects | visual | Strokes, Shadows + Halftone Effects · CodePen | |
| `fx-085-pop-out` | popout text | visual | popout text · CodePen | |
| `fx-086-save` | SAVE! | visual | SAVE! · CodePen | 见「观感降级」 |
| `fx-087-3d-cartoon` | 3D Cartoon Text w/CSS text-shadow | visual | 3D Cartoon Text w/CSS text-shadow · CodePen | |
| `fx-088-animated-text-2` | Animated Text-Shadow | visual | Animated Text-Shadow · CodePen | |
| `fx-089-netflix-style` | Netflix style text animation with CSS | visual | Netflix style text animation with CSS · CodePen | |
| `fx-090-variable-longshadow` | Variable Longshadow with Gradients Mixin | visual | Variable Longshadow with Gradients Mixin · CodePen | |
| `fx-091-pinchy-type` | Pinchy Type with CSS text-shadow | visual | Pinchy Type with CSS text-shadow · CodePen | 见「观感降级」 |
| `fx-092-awesome-text` | Awesome Text-Shadow | visual | Awesome Text-Shadow · CodePen | |
| `fx-093-text-shadow-4` | Text-Shadow | visual | Text-Shadow · CodePen | |
| `fx-094-long-shadow` | Long Shadow Gradient Mixin | visual | Long Shadow Gradient Mixin · CodePen | |
| `fx-095-css3-text` | CSS3 text-shadow effects | visual | CSS3 text-shadow effects · CodePen | |
| `fx-096-css-dashed` | CSS Dashed Shadow | visual | CSS Dashed Shadow · CodePen | 见「观感降级」 |
| `fx-097-retro-glitch` | Retro Glitch Effect Colors RGB | visual | Retro Glitch Effect Colors RGB (Daily Design + Code #6) · CodePen | |

---

## 观感降级 / 已知局限

下列 effect 在迁移到「逐行歌词下滚」+「剥离外部字体」的静帧渲染环境后，相比原 CodePen demo 存在不可避免的观感降级，列出原因以便预期管理：

- **016-nabla-color**——黑屏：依赖 Nabla 彩色字体，迁移按规范剥离外部字体，预期降级。
- **020-colored-text**——RGB 错位 glitch，CJK 半可读（本质是「故障美学」，并非渲染 bug）。
- **030-airport-info**——原全局滚动跑马灯改为静态翻牌板（逐行歌词下若保留滚动则不可读）。
- **033-css-text-2**——逐字 jump 运动特效，静帧下字符散落。
- **044-smoky-text**——烟雾消散动画改为静态柔光（原动画会让字烟散消失）。
- **082-blazing-fire**——火焰团块，CJK 不可读。
- **086-save**——3D 挤出团块，CJK 不可读。
- **091-pinchy-type**——三角碎裂特效，CJK 不可读。
- **096-css-dashed**——已修复为可读，但放弃了原「网点状投影」质感。
