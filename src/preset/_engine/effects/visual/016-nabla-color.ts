// 016 Nabla color font! · Nabla color font! · CodePen，源 example/effect/016-nabla-color.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "016",
  name: "016 Nabla color font!",
  src: "Nabla color font! · CodePen",
  css: "\n.fx-016 .bl-wrap {\n  background-color: #000;\n}\n.fx-016 h1.nabla-title {\n  font-size: 12vw;\n  margin: 0;\n}\n@font-palette-values --Nabla {\n  base-palette: 2;\n}\n.fx-016 .nabla-letter {\n  animation: fx016-depth 1s ease-in-out alternate infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  position: relative;\n  display: inline-block;\n  font-variation-settings: \"EDPT\" 30;\n  font-palette: --Nabla;\n  animation-delay: calc(calc(var(--i) * 0.1s) - var(--fx-t));\n  /* 按时间逐字符显示：reveal=已到时间字符数/总数；字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现，\n     与字幕时间轴完全同步(不加 opacity 过渡，避免淡入造成滞后) */\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n@keyframes fx016-depth {\n  0% {\n    transform: translateX(0) translateY(0);\n  }\n  100% {\n    font-variation-settings: \"EDPT\" 200;\n    transform: translateX(0.15em) translateY(0.1em);\n  }\n}\n/* 取消引擎按宽度推进的逐字遮罩(与变宽字体+位移动画不同步、显得慢)，改用上面的逐字符显示 */\n.fx-016 .bl-wrap {\n  -webkit-mask-image: none !important;\n          mask-image: none !important;\n}\n",
  html: "<h1 class=\"nabla-title\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"nabla-letter\" style=\"--i:{i}; --n:{n}\">{ch}</span>",
  timeBase: "line",
};
