// 031 Cool Text · Cool Text · CodePen，源 example/effect/031-cool-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "031",
  name: "031 Cool Text",
  src: "Cool Text · CodePen",
  css: ".fx-031 .bl-wrap {\n  background: #f4d03f;\n}\n\n.fx-031 .words {\n  color: #f4d03f;\n  font-size: 0;\n  line-height: 1.5;\n}\n\n.fx-031 .words .ch {\n  font-size: 5rem;\n  display: inline-block;\n  animation: fx031-move 3s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  animation-delay: calc(calc(var(--i) * 0.5s) - var(--fx-t));\n}\n\n@keyframes fx031-move {\n  0% {\n    transform: translate(-30%, 0);\n  }\n  50% {\n    text-shadow: 0 25px 50px rgba(0, 0, 0, 0.75);\n  }\n  100% {\n    transform: translate(30%, 0);\n  }\n}",
  html: "<div class=\"words\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"ch\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
