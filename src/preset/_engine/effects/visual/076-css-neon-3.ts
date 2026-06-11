// 076 CSS Neon Sign · CSS Neon Sign · CodePen，源 example/effect/076-css-neon-3.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "076",
  name: "076 CSS Neon Sign",
  src: "CSS Neon Sign · CodePen",
  css: "\n.fx-076 .bl-wrap {\n  background: #222;\n  background-image: repeating-linear-gradient(\n    to bottom,\n    transparent 7px,\n    rgba(0, 0, 0, 0.8) 9px,\n    rgba(0, 0, 0, 0.8) 13px,\n    transparent 13px\n  );\n}\n\n.fx-076 .neon-sign {\n  font-size: calc(20px + 18vh);\n  line-height: calc(20px + 20vh);\n  text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 40px #ffa500,\n    0 0 60px #ff0000, 0 0 10px #ff8d00, 0 0 98px #ff0000;\n  color: #fff6a9;\n  text-align: center;\n  animation: fx076-blink245 12s infinite;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx076-blink245 {\n  20%, 24%, 55% {\n    color: #111;\n    text-shadow: none;\n  }\n  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {\n    text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500, 0 0 40px #ffa500,\n      0 0 60px #ff0000, 0 0 10px #ff8d00, 0 0 98px #ff0000;\n    color: #fff6a9;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-076 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复霓虹灯字色 */\n.fx-076 .bl-wrap .neon-sign,.fx-076 .bl-wrap .neon-sign .bl-char {\n  color: #fff6a9 !important;\n  -webkit-text-fill-color: #fff6a9 !important;\n}\n\n/* 逐字露出 */\n.fx-076 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<h1 class=\"neon-sign\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
