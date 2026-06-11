// 078 Neon · Neon · CodePen，源 example/effect/078-css-neon-4.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "078",
  name: "078 Neon",
  src: "Neon · CodePen",
  css: "\n.fx-078 .bl-wrap {\n  background-color: #141414;\n}\n\n.fx-078 .neon-span {\n  font-size: 5.6rem;\n  text-align: center;\n  line-height: 1;\n  color: #c6e2ff;\n  animation: fx078-neon249 0.08s ease-in-out infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx078-neon249 {\n  from {\n    text-shadow:\n      0 0 6px rgba(202, 228, 225, 0.92),\n      0 0 30px rgba(202, 228, 225, 0.34),\n      0 0 12px rgba(30, 132, 242, 0.52),\n      0 0 21px rgba(30, 132, 242, 0.92),\n      0 0 34px rgba(30, 132, 242, 0.78),\n      0 0 54px rgba(30, 132, 242, 0.92);\n  }\n  to {\n    text-shadow:\n      0 0 6px rgba(202, 228, 225, 0.98),\n      0 0 30px rgba(202, 228, 225, 0.42),\n      0 0 12px rgba(30, 132, 242, 0.58),\n      0 0 22px rgba(30, 132, 242, 0.84),\n      0 0 38px rgba(30, 132, 242, 0.88),\n      0 0 60px #1e84f2;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-078 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复霓虹文字颜色 */\n.fx-078 .bl-wrap .neon-span,.fx-078 .bl-wrap .neon-span .bl-char {\n  color: #c6e2ff !important;\n  -webkit-text-fill-color: #c6e2ff !important;\n}\n\n/* 逐字露出 */\n.fx-078 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<span class=\"neon-span\">{{LETTERS}}</span>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
