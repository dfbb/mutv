// 056 Multi Colored Text with CSS · Multi Colored Text with CSS · CodePen，源 example/effect/056-multi-colored.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "056",
  name: "056 Multi Colored Text with CSS",
  src: "Multi Colored Text with CSS · CodePen",
  css: ".fx-056 {\n  --color-1: #186cb8;\n  --color-2: #2a9a9f;\n  --color-3: #f1b211;\n  --color-4: #e83611;\n  --color-5: #f9002f;\n}\n\n.fx-056 .bl-wrap {\n  background: #000;\n  line-height: 1;\n}\n\n.fx-056 .multicolor-text {\n  font-size: clamp(3rem, 12vw, 8rem);\n  font-weight: 900;\n  text-transform: uppercase;\n  text-align: center;\n  background: linear-gradient(219deg,\n    var(--color-1) 19%,\n    transparent 19%, transparent 20%,\n    var(--color-2) 20%, var(--color-2) 39%,\n    transparent 39%, transparent 40%,\n    var(--color-3) 40%, var(--color-3) 59%,\n    transparent 59%, transparent 60%,\n    var(--color-4) 60%, var(--color-4) 79%,\n    transparent 79%, transparent 80%,\n    var(--color-5) 80%);\n  background-clip: text;\n  -webkit-background-clip: text;\n  color: transparent;\n  margin: 0;\n}\n/* 用更高优先级(:host .bl-wrap .x = 0,3,0)覆盖顶层 VISUAL_OVERRIDE 的强制绿字,恢复多色条纹 */\n.fx-056 .bl-wrap .multicolor-text {\n  background: linear-gradient(219deg,\n    var(--color-1) 19%,\n    transparent 19%, transparent 20%,\n    var(--color-2) 20%, var(--color-2) 39%,\n    transparent 39%, transparent 40%,\n    var(--color-3) 40%, var(--color-3) 59%,\n    transparent 59%, transparent 60%,\n    var(--color-4) 60%, var(--color-4) 79%,\n    transparent 79%, transparent 80%,\n    var(--color-5) 80%) !important;\n  -webkit-background-clip: text !important;\n  background-clip: text !important;\n  color: transparent !important;\n  -webkit-text-fill-color: transparent !important;\n  /* 整行多色条纹保持连续,按 --reveal 裁切(CJK 等宽 => 恰好逐字步进露出) */\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */\n.fx-056 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<h1 class=\"multicolor-text\">{{LINE}}</h1>",
  timeBase: "line",
};
