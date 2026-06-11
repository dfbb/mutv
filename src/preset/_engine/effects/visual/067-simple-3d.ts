// 067 Skewed and Rotated Text · Skewed and Rotated Text · CodePen，源 example/effect/067-simple-3d.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "067",
  name: "067 Skewed and Rotated Text",
  src: "Skewed and Rotated Text · CodePen",
  css: ".fx-067 .bl-wrap {\n  background-image: radial-gradient(circle, #333333, #222222);\n}\n\n.fx-067 h1 {\n  transform: skew(-12deg) rotate(-12deg);\n  font-size: 20vmin;\n  margin: 0;\n  padding: 30px;\n  color: #1d9099;\n  text-shadow: 1vmin 1vmin 0 #E79C10, -1vmin -1vmin 0 #D53A33;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-067 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色 */\n.fx-067 .bl-wrap h1,.fx-067 .bl-wrap h1 .bl-char {\n  color: #1d9099 !important;\n  -webkit-text-fill-color: #1d9099 !important;\n}\n\n/* 逐字露出 */\n.fx-067 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}",
  html: "<h1>{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
