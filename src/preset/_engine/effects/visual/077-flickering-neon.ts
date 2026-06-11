// 077 Flickering Neon Sign Effect using CSS Text & Box Shadow · Flickering Neon Sign Effect using CSS Text & Box Shadow · CodePen，源 example/effect/077-flickering-neon.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "077",
  name: "077 Flickering Neon Sign Effect using CSS Text & Box Shadow",
  src: "Flickering Neon Sign Effect using CSS Text & Box Shadow · CodePen",
  css: "\n.fx-077 {\n  --neon-text-color: #f40;\n  --neon-border-color: #08f;\n}\n\n.fx-077 .bl-wrap {\n  background: #000;\n}\n\n.fx-077 .neon-box {\n  font-size: 8rem;\n  font-weight: 200;\n  font-style: italic;\n  color: #fff;\n  padding: 2rem 3rem 2.5rem;\n  border: 0.4rem solid #fff;\n  border-radius: 2rem;\n  text-transform: uppercase;\n  animation: fx077-flicker248 1.5s infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx077-flicker248 {\n  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {\n    text-shadow:\n      -0.2rem -0.2rem 1rem #fff,\n      0.2rem 0.2rem 1rem #fff,\n      0 0 2rem var(--neon-text-color),\n      0 0 4rem var(--neon-text-color),\n      0 0 6rem var(--neon-text-color),\n      0 0 8rem var(--neon-text-color),\n      0 0 10rem var(--neon-text-color);\n    box-shadow:\n      0 0 .5rem #fff,\n      inset 0 0 .5rem #fff,\n      0 0 2rem var(--neon-border-color),\n      inset 0 0 2rem var(--neon-border-color),\n      0 0 4rem var(--neon-border-color),\n      inset 0 0 4rem var(--neon-border-color);\n  }\n  20%, 24%, 55% {\n    text-shadow: none;\n    box-shadow: none;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-077 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 白色霓虹文字 */\n.fx-077 .bl-wrap .neon-box,.fx-077 .bl-wrap .neon-box .bl-char {\n  color: #fff !important;\n  -webkit-text-fill-color: #fff !important;\n}\n\n/* 逐字露出 */\n.fx-077 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<h1 class=\"neon-box\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
