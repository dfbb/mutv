# example/effect → src/preset 歌词特效移植设计

日期：2026-06-11
状态：已批准（设计阶段）

## 目标

把 `example/lyrics-demo.html` + `example/effect/` 下的歌词特效移植为 Remotion 可渲染的 preset，并统一 preset 命名规范与存放方式。

## 范围

- **移植**：text 类 11 个（001–011）+ visual 类 86 个（012–097），共 97 个
- **不移植**：`effect/core-*.js`（6 个 bg 类背景特效）
- **同步整理**：现有 8 个旧 preset 改名归入新规范，共享组件移入 `_shared/`

## 硬约束

1. 移植后必须支持 Remotion 逐帧确定性渲染
2. 特效外部字体（Google Fonts `@import` 等）全部剥离，复用现有本地字体管线（FontLoader + `--font-family/--font-file`）
3. 颜色复用现有配置：`fontFgColor/fontBgColor`（TextColorOverride）覆盖必须对所有特效生效
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
      visual/014-gooey-marquee.ts …  # 86 个，{css, html, letterTpl} 数据
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
- 旧 preset 加前缀改名：`apple→fx-apple`、`bounce→fx-bounce`、`cinema→fx-cinema`、`ktv→fx-ktv`、`neon→fx-neon`、`no2→fx-no2`、`orig→fx-orig`、`typewriter→fx-typewriter`；`scripts/render_all.py` 等引用同步更新
- 每个效果定义文件头保留一行来源注释（原 CodePen 名 / LyricsAnimator 出处）

## 关键技术映射

| demo / 特效原状 | Remotion 移植实现 |
|---|---|
| audio 时钟 + rAF | `useCurrentFrame()/fps` 换算 ms，纯帧驱动 |
| CSS keyframes 动画 | `animation-play-state: paused` + 按帧注入负 `animation-delay` |
| 滚动 lerp（依赖上一帧状态） | 确定性插值：按行切换时刻起算 easeOut |
| Shadow DOM 样式隔离 | 唯一 class 前缀 scope（字符串处理，`:host` 等特判） |
| `@import` 字体 | 剥离；特效内 `font-family` 改为继承容器（FontLoader 提供） |
| 硬编码颜色 | 引擎层统一覆盖（等价 demo `--theme-text !important` / VISUAL_OVERRIDE），接 fontFgColor/fontBgColor |
| 自带字号 | 引擎容器设基准字号（height*0.055*fontScale），内部 em 相对缩放 |

颜色/字号采用**引擎层统一覆盖**而非逐个改写 86 个特效 CSS，保证机械转换可行；覆盖不生效的个例在抽检阶段特判。

## 实施步骤（每步可验证）

1. `_shared/` 整理 + 旧 preset 改名 → 验证：`render.mjs --preset fx-neon --html` 正常
2. `_engine/` 两引擎 + makePreset → 验证：手写 fx-001（text）+ fx-014（visual）渲染出帧
3. 脚本批量转换 97 个效果定义 + 生成薄 preset 目录 → 验证：render.mjs 列出全部目录
4. 批量出帧抽检（复用 `--debug-preset`），重点查 visual 类黑屏 / 动画不动 / 颜色覆盖失效，逐个修复
5. 写 `preset/README.md` 索引

## 已知风险

- 86 个 visual 质量参差（demo 阶段已修过一轮黑屏），步骤 4 的逐个排查是主要工作量
- CSS scope 化用字符串处理而非完整 parser，复杂选择器需特判
- 个别特效效果强依赖被剥离的特定字体（如 Nabla 彩色字体），观感会变化，抽检时记录并决定保留或剔除
