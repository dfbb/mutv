// 033 CSS Text-Shadow Animation · CSS Text-Shadow Animation · CodePen，源 example/effect/033-css-text-2.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "033",
  name: "033 CSS Text-Shadow Animation",
  src: "CSS Text-Shadow Animation · CodePen",
  css: ".fx-033 .bl-wrap {\n  background: #000;\n}\n\n.fx-033 .wrapper {\n  width: 100%;\n  text-align: center;\n}\n.fx-033 .wrapper .ch {\n  -webkit-text-stroke-width: 1.25px;\n  -webkit-text-stroke-color: #000;\n  font-size: 100px;\n  text-shadow: 0 0px #f3c623, 0 0px #f2aaaa;\n  transform: translate(0, 100%) rotate(4deg);\n  animation: fx033-jump 2s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  animation-delay: calc(calc(var(--i) * 120ms) - var(--fx-t));\n  display: inline-block;\n  color: #fff;\n  /* 按歌词时间逐字符出现:字符 i 在 reveal>i/n 即自身 start 时刻显示 */\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n\n@keyframes fx033-jump {\n  33% {\n    text-shadow: 0 60px #f37121, 0 150px #f2aaaa;\n  }\n  50% {\n    transform: translate(0, 0) rotate(-4deg);\n    text-shadow: 0 0px #8fc0a9, 0 0px #84a9ac;\n  }\n  66.67% {\n    text-shadow: 0 -60px #d54062, 0 -150px #8fc0a9;\n  }\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-033 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<div class=\"wrapper\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"ch\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
