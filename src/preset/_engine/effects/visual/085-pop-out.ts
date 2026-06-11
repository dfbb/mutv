// 085 popout text · popout text · CodePen，源 example/effect/085-pop-out.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "085",
  name: "085 popout text",
  src: "popout text · CodePen",
  css: "\n.fx-085 .bl-wrap {\n  background: white;\n}\n\n.fx-085 .popout {\n  font-weight: 900;\n  font-size: 80px;\n  text-align: center;\n}\n\n.fx-085 .popout-letter {\n  position: relative;\n  display: inline-block;\n  animation: fx085-popout263 1s infinite alternate cubic-bezier(0.86, 0, 0.07, 1);\n  animation-delay: calc(0s - var(--fx-t));\n  animation-delay: calc(calc(var(--i) * -0.1666666667s) - var(--fx-t));\n}\n\n@keyframes fx085-popout263 {\n  0% {\n    transform: translate3d(0, 0, 0);\n    text-shadow: 0em 0em 0 lightblue;\n    color: #00e676;\n  }\n  30% {\n    transform: translate3d(0, 0, 0);\n    text-shadow: 0em 0em 0 lightblue;\n    color: #00e676;\n  }\n  70% {\n    transform: translate3d(0.08em, -0.08em, 0);\n    text-shadow: -0.08em 0.08em lightblue;\n    color: #00e676;\n  }\n  100% {\n    transform: translate3d(0.08em, -0.08em, 0);\n    text-shadow: -0.08em 0.08em lightblue;\n    color: #00e676;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-085 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 绿色字体 (text-shadow 已保留) */\n.fx-085 .bl-wrap .popout,.fx-085 .bl-wrap .popout .popout-letter {\n  color: #00e676 !important;\n  -webkit-text-fill-color: #00e676 !important;\n}\n\n/* 逐字露出 */\n.fx-085 .bl-wrap .popout-letter {\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<p class=\"popout\">{{LETTERS}}</p>",
  letterTpl: "<span class=\"popout-letter\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
