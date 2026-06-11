// 081 Neon sign · Neon sign · CodePen，源 example/effect/081-neon-sign.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "081",
  name: "081 Neon sign",
  src: "Neon sign · CodePen",
  css: "\n.fx-081 .bl-wrap {\n  background: #313131;\n}\n\n.fx-081 .neon-blue {\n  text-align: center;\n  color: #ebffff;\n  font-size: 50px;\n  text-shadow: 2px 2px 1px rgba(0,0,0,0.3), 0 0px 15px #fff, 0 0 10px #38eeff, 0 0 50px #38eeff;\n  animation: fx081-fade256 3s infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx081-fade256 {\n  40% { opacity: 0.8; }\n  42% { opacity: 0.1; }\n  43% { opacity: 0.8; }\n  45% { opacity: 0.1; }\n  46% { opacity: 0.8; }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-081 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复霓虹白蓝原色 */\n.fx-081 .bl-wrap .neon-blue,.fx-081 .bl-wrap .neon-blue .bl-char {\n  color: #ebffff !important;\n  -webkit-text-fill-color: #ebffff !important;\n}\n\n/* 逐字露出 */\n.fx-081 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<div class=\"neon-blue\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
