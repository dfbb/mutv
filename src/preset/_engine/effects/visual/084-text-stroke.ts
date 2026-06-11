// 084 Strokes, Shadows + Halftone Effects · Strokes, Shadows + Halftone Effects · CodePen，源 example/effect/084-text-stroke.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "084",
  name: "084 Strokes, Shadows + Halftone Effects",
  src: "Strokes, Shadows + Halftone Effects · CodePen",
  css: "\n.fx-084 .bl-wrap {\n  background-color: #fef3c7;\n}\n\n.fx-084 .stroke-shadow {\n  font-size: 12vw;\n  font-weight: bold;\n  letter-spacing: 5px;\n  text-align: center;\n  color: #fef3c7;\n  text-shadow:\n    -2px 0 #111827, 0 -2px #111827, 2px 0 #111827, 0 2px #111827,\n    2px 2px #111827, -2px -2px #111827, -2px 2px #111827, 2px -2px #111827,\n    6px 6px #db2777;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-084 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复原始米色字面色(描边/投影由 text-shadow 提供,未被覆盖) */\n.fx-084 .bl-wrap .stroke-shadow,.fx-084 .bl-wrap .stroke-shadow .bl-char {\n  color: #fef3c7 !important;\n  -webkit-text-fill-color: #fef3c7 !important;\n}\n\n/* 逐字露出 */\n.fx-084 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<p class=\"stroke-shadow\">{{LETTERS}}</p>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
