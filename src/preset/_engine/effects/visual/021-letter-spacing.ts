// 021 letter spacing animation · letter spacing animation · CodePen，源 example/effect/021-letter-spacing.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "021",
  name: "021 letter spacing animation",
  src: "letter spacing animation · CodePen",
  css: "\n.fx-021 .bl-wrap {\n  background: #000;\n  color: #fff;\n  overflow-x: hidden;\n}\n.fx-021 .ls-line {\n  width: 100%;\n  text-align: center;\n  animation: fx021-lsexpand 2.4s infinite ease-in-out;\n  animation-delay: calc(0s - var(--fx-t));\n  letter-spacing: 10px;\n  white-space: nowrap;\n  font-size: clamp(1rem, 3vw, 2.5rem);\n  text-indent: 10px;\n  animation-delay: calc(calc(var(--i) * 0.1s) - var(--fx-t));\n}\n@keyframes fx021-lsexpand {\n  0%   { letter-spacing: 10px; text-indent: 10px; }\n  40%  { letter-spacing: 50px; text-indent: 50px; }\n  80%  { letter-spacing: 10px; text-indent: 10px; }\n  100% { letter-spacing: 10px; text-indent: 10px; }\n}\n",
  html: "<div class=\"ls-line\" style=\"--i:0\">{{LINE}}</div>\n<div class=\"ls-line\" style=\"--i:1\">{{LINE}}</div>\n<div class=\"ls-line\" style=\"--i:2\">{{LINE}}</div>\n<div class=\"ls-line\" style=\"--i:3\">{{LINE}}</div>\n<div class=\"ls-line\" style=\"--i:4\">{{LINE}}</div>\n<div class=\"ls-line\" style=\"--i:5\">{{LINE}}</div>",
  timeBase: "line",
};
