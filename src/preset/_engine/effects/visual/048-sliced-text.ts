// 048 Sliced Text Effect · Sliced Text Effect · CodePen，源 example/effect/048-sliced-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "048",
  name: "048 Sliced Text Effect",
  src: "Sliced Text Effect · CodePen",
  css: "\n.fx-048 {\n  --background-color: black;\n  --text-color: hsl(0, 0%, 100%);\n}\n.fx-048 .bl-wrap {\n  background-color: var(--background-color);\n  display: grid;\n  place-content: center;\n  font-size: clamp(1.5rem, 1rem + 10vw, 10rem);\n  font-weight: 700;\n  text-transform: uppercase;\n  color: var(--text-color);\n}\n.fx-048 .sliced-wrapper {\n  display: grid;\n  position: relative;\n}\n.fx-048 .sliced-wrapper > div {\n  grid-area: 1/1/-1/-1;\n}\n.fx-048 .top {\n  clip-path: polygon(0% 0%, 100% 0%, 100% 48%, 0% 58%);\n}\n.fx-048 .bottom {\n  clip-path: polygon(0% 60%, 100% 50%, 100% 100%, 0% 100%);\n  color: transparent;\n  background: linear-gradient(177deg, black 53%, var(--text-color) 65%);\n  background-clip: text;\n  -webkit-background-clip: text;\n  transform: translateX(-0.02em);\n}\n/* 逐字符显示:上下两切片层共享 --i/--n 同步逐字露出,clip-path 切片效果不受影响 */\n.fx-048 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-048 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"sliced-wrapper\"><div class=\"top\">{{LETTERS}}</div><div class=\"bottom\" aria-hidden=\"true\">{{LETTERS}}</div></div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
