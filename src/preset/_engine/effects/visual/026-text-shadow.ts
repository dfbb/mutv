// 026 Text Shadow · Text Shadow · CodePen，源 example/effect/026-text-shadow.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "026",
  name: "026 Text Shadow",
  src: "Text Shadow · CodePen",
  css: ".fx-026 .bl-wrap {\n  font-size: 16px;\n  background: #212121;\n  color: #fff;\n  text-transform: uppercase;\n}\n\n.fx-026 h1.text-shadow {\n  font-size: 2.5em;\n  text-decoration: underline;\n}\n\n.fx-026 .text-shadow {\n  font-style: italic;\n  text-transform: uppercase;\n  color: transparent;\n  -webkit-text-stroke: #fff;\n  -webkit-text-stroke-width: 1px;\n  text-shadow: 2px 2px 10px #2962ff;\n  text-align: center;\n  letter-spacing: 0.2em;\n}\n\n/* 外层:按歌词时间逐字符出现(reveal 门控)。字符 i 在 reveal>i/n 即自身 start 时刻显示 */\n.fx-026 .ts {\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 内层:保留原 flicker 闪烁(opacity 与阴影脉动);与外层 reveal 门控相乘 */\n.fx-026 .ts-g {\n  -webkit-animation: fx026-flicker 0.5s ease-in-out infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n          animation: fx026-flicker 0.5s ease-in-out infinite alternate;\n          animation-delay: calc(0s - var(--fx-t));\n}\n\n@-webkit-keyframes fx026-flicker {\n  0%   { opacity: 0.5; text-shadow: 2px 2px 10px #2962ff; }\n  100% { opacity: 1;   text-shadow: 2px 2px 20px #2962ff; }\n}\n@keyframes fx026-flicker {\n  0%   { opacity: 0.5; text-shadow: 2px 2px 10px #2962ff; }\n  100% { opacity: 1;   text-shadow: 2px 2px 20px #2962ff; }\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-026 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<h1 class=\"text-shadow\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"ts\" style=\"--i:{i}; --n:{n}\"><span class=\"ts-g\">{ch}</span></span>",
  timeBase: "line",
};
