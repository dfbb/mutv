// 047 Text Reflect Effect Demo · Text Reflect Effect Demo · CodePen，源 example/effect/047-text-reflect.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "047",
  name: "047 Text Reflect Effect Demo",
  src: "Text Reflect Effect Demo · CodePen",
  css: "\n.fx-047 .bl-wrap {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.fx-047 .reflect-wrap {\n  position: relative;\n  display: inline-block;\n}\n.fx-047 p {\n  position: relative;\n  text-align: center;\n  font-size: 72px;\n  font-weight: bold;\n  margin: 0;\n}\n.fx-047 p::before {\n  content: attr(data-text);\n  position: absolute;\n  inset: 0;\n  transform: rotatex(180deg) translatey(15px);\n  transform-origin: 50% 100%;\n  white-space: nowrap;\n  -webkit-mask: linear-gradient(transparent, #000);\n  mask: linear-gradient(transparent, #000);\n  /* 倒影用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 逐字符显示:前景 p 拆成逐字,按歌词时间逐个露出 */\n.fx-047 p .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-047 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"reflect-wrap\"><p data-text=\"{{LINE}}\">{{LETTERS}}</p></div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
