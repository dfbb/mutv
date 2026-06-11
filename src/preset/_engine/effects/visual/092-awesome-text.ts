// 092 Awesome Text-Shadow · Awesome Text-Shadow · CodePen，源 example/effect/092-awesome-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "092",
  name: "092 Awesome Text-Shadow",
  src: "Awesome Text-Shadow · CodePen",
  css: "\n.fx-092 .bl-wrap {\n  background-color: #ece5da;\n  text-align: center;\n}\n\n.fx-092 .awesome-shadow {\n  color: #202020;\n  text-transform: uppercase;\n  letter-spacing: -2px;\n  font-size: 6vmin;\n  font-weight: 900;\n  line-height: 1.2;\n  text-shadow: 0 13.36px 8.896px #c4b59d, 0 -2px 1px #fff;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-092 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复原始字色 */\n.fx-092 .bl-wrap .awesome-shadow,.fx-092 .bl-wrap .awesome-shadow .bl-char {\n  color: #202020 !important;\n  -webkit-text-fill-color: #202020 !important;\n}\n\n/* 逐字露出 */\n.fx-092 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<div class=\"awesome-shadow\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
