// 044 Smoky Text · Smoky Text · CodePen，源 example/effect/044-smoky-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "044",
  name: "044 Smoky Text",
  src: "Smoky Text · CodePen",
  css: "\n.fx-044 .bl-wrap {\n  background: black;\n  font-size: 5vw;\n  text-align: center;\n  color: transparent;\n}\n\n.fx-044 .smoky-text .ch {\n  display: inline-block;\n  text-shadow: 0 0 0 whitesmoke;\n  animation: fx044-smoky-letter 5s calc(var(--i) * 0.1s) infinite both;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n.fx-044 .smoky-text .ch:nth-child(even) {\n  animation-name: fx044-smoky-letter-mirror;\n}\n\n@keyframes fx044-smoky-letter {\n  60% {\n    text-shadow: 0 0 40px whitesmoke;\n  }\n  to {\n    transform: translate3d(15rem, -8rem, 0) rotate(-40deg) skewX(70deg) scale(1.5);\n    text-shadow: 0 0 20px whitesmoke;\n    opacity: 0;\n  }\n}\n\n@keyframes fx044-smoky-letter-mirror {\n  60% {\n    text-shadow: 0 0 40px whitesmoke;\n  }\n  to {\n    transform: translate3d(18rem, -8rem, 0) rotate(-40deg) skewX(-70deg) scale(2);\n    text-shadow: 0 0 20px whitesmoke;\n    opacity: 0;\n  }\n}\n\n.fx-044 .smoky-text .ch { animation: none !important; opacity: 1 !important; text-shadow: 0 0 0.18em whitesmoke, 0 0 0 whitesmoke !important; }",
  html: "<div class=\"smoky-text\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"ch\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
