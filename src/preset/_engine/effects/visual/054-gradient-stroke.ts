// 054 Gradient Stroke · Gradient Stroke · CodePen，源 example/effect/054-gradient-stroke.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "054",
  name: "054 Gradient Stroke",
  src: "Gradient Stroke · CodePen",
  css: ".fx-054 {\n  --color-background: #000119;\n  --stroke-width: calc(1em / 16);\n  --font-weight: 700;\n  --letter-spacing: calc(1em / 8);\n}\n\n.fx-054 .bl-wrap {\n  background-color: var(--color-background, #000119);\n  padding: 5vmin;\n}\n\n.fx-054 .gradient-stroke {\n  -webkit-background-clip: text;\n  background-clip: text;\n  background-image: linear-gradient(to right, #09f1b8, #00a2ff, #ff00d2, #fed90f);\n  color: var(--color-background, #000119);\n  font-size: clamp(3rem, 15vw, 8rem);\n  font-weight: var(--font-weight, 700);\n  letter-spacing: var(--letter-spacing, calc(1em / 8));\n  -webkit-text-stroke-color: transparent;\n  -webkit-text-stroke-width: var(--stroke-width, calc(1em / 16));\n  text-align: center;\n  margin: 0;\n}\n/* 用更高优先级(:host .bl-wrap .x = 0,3,0)覆盖顶层 VISUAL_OVERRIDE 的强制绿字,恢复渐变描边 */\n.fx-054 .bl-wrap .gradient-stroke {\n  background: linear-gradient(to right, #09f1b8, #00a2ff, #ff00d2, #fed90f) !important;\n  -webkit-background-clip: text !important;\n  background-clip: text !important;\n  color: var(--color-background, #000119) !important;\n  -webkit-text-fill-color: var(--color-background, #000119) !important;\n  /* 整行渐变保持连续,按 --reveal 裁切(CJK 等宽 => 恰好逐字步进露出) */\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */\n.fx-054 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<h1 class=\"gradient-stroke\">{{LINE}}</h1>",
  timeBase: "line",
};
