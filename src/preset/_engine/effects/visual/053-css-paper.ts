// 053 CSS Paper Cut-out Effect · CSS Paper Cut-out Effect · CodePen，源 example/effect/053-css-paper.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "053",
  name: "053 CSS Paper Cut-out Effect",
  src: "CSS Paper Cut-out Effect · CodePen",
  css: ".fx-053 {\n  --hs: 225, 100%;\n  --paper: hsl(var(--hs), 25%);\n  --highlight: hsl(var(--hs), 45%);\n  --shadow: hsl(var(--hs), 15%);\n}\n\n.fx-053 .bl-wrap {\n  background-color: var(--paper, hsl(225, 100%, 25%));\n}\n\n.fx-053 .cutout-text {\n  font-size: clamp(4rem, 15vw, 12rem);\n  letter-spacing: 0.1em;\n  display: grid;\n  place-items: center;\n  grid-template-areas: \"text\";\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  color: transparent;\n  background-image: linear-gradient(305deg, tomato, gold, cyan);\n  margin: 0;\n  text-transform: uppercase;\n}\n\n.fx-053 .cutout-text > *,.fx-053  .cutout-text::after {\n  grid-area: text;\n}\n\n.fx-053 .cutout-text::after {\n  content: attr(data-text);\n  color: var(--paper, hsl(225, 100%, 25%));\n  transform: translate(0.1em, 0.1em);\n  filter: drop-shadow(0.015em 0.015em 0.025em var(--shadow, hsl(225, 100%, 15%)));\n  -webkit-background-clip: text;\n  color: transparent;\n  background-image: linear-gradient(var(--highlight, hsl(225, 100%, 45%)), var(--paper, hsl(225, 100%, 25%)));\n  /* 偏移层用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 逐字符显示:前景 span 拆成逐字,按歌词时间逐个露出 */\n.fx-053 .cutout-text .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-053 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<h1 class=\"cutout-text\" data-text=\"{{LINE}}\"><span>{{LETTERS}}</span></h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
