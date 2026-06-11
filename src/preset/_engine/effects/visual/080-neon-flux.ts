// 080 Neon Flux · Neon Flux · CodePen，源 example/effect/080-neon-flux.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "080",
  name: "080 Neon Flux",
  src: "Neon Flux · CodePen",
  css: "\n@font-face {\n  src: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/707108/neon.ttf);\n}\n\n.fx-080 .bl-wrap {\n  background-color: black;\n}\n\n.fx-080 .neon-flux {\n  color: #FB4264;\n  font-size: 9vw;\n  line-height: 9vw;\n  text-shadow: 0 0 3vw #F40A35;\n  animation: fx080-neon254 1s ease infinite;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx080-neon254 {\n  0%, 100% {\n    text-shadow: 0 0 1vw #FA1C16, 0 0 3vw #FA1C16, 0 0 10vw #FA1C16, 0 0 10vw #FA1C16,\n      0 0 .4vw #FED128, .5vw .5vw .1vw #806914;\n    color: #FED128;\n  }\n  50% {\n    text-shadow: 0 0 .5vw #800E0B, 0 0 1.5vw #800E0B, 0 0 5vw #800E0B, 0 0 5vw #800E0B,\n      0 0 .2vw #800E0B, .5vw .5vw .1vw #40340A;\n    color: #806914;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-080 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色 */\n.fx-080 .bl-wrap .neon-flux,.fx-080 .bl-wrap .neon-flux .bl-char {\n  color: #FB4264 !important;\n  -webkit-text-fill-color: #FB4264 !important;\n}\n\n/* 逐字露出 */\n.fx-080 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<div class=\"neon-flux\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
