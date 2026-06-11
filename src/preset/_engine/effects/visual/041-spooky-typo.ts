// 041 Spooky Typo · Spooky Typo · CodePen，源 example/effect/041-spooky-typo.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "041",
  name: "041 Spooky Typo",
  src: "Spooky Typo · CodePen",
  css: "\n.fx-041 {\n  --color_base: #191919;\n  --color_pen: #fff;\n  --size: 10vmin;\n}\n.fx-041 .bl-wrap {\n  background-color: var(--color_base);\n  overflow: hidden;\n}\n.fx-041 .halloctober {\n  width: 100%;\n}\n.fx-041 .halloctober__banner {\n  padding: 3%;\n  position: relative;\n  overflow: hidden;\n  display: flex;\n  justify-content: center;\n}\n.fx-041 .typo {\n  color: var(--color_pen);\n  cursor: default;\n  font-size: var(--size);\n  font-weight: normal;\n  letter-spacing: 0.1rem;\n  margin: auto;\n  outline: none;\n  position: relative;\n  transform: skew(10deg, 2deg);\n  animation: fx041-bl-float 2s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n}\n.fx-041 .typo::before,.fx-041 \n.typo::after {\n  color: transparent;\n  content: attr(data-text);\n  position: absolute;\n  top: 0;\n  left: 0;\n  z-index: -10;\n}\n.fx-041 .typo::before {\n  animation: fx041-bl-move-upper-shadow 2s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  opacity: 0;\n  text-shadow: 6px 0 2px rgba(179, 8, 8, 0.4), 12px 0 2px rgba(26, 35, 126, 0.3);\n}\n.fx-041 .typo::after {\n  animation: fx041-bl-move-bottom-shadow 2s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  text-shadow: 2px 4px 2px rgba(179, 8, 8, 0.4), 4px 8px 2px rgba(26, 35, 126, 0.3);\n}\n@keyframes fx041-bl-move-upper-shadow {\n  0%, 90%, 100% { opacity: 0; transform: translateX(-2%); }\n  30%            { opacity: 1; transform: translateX(0); }\n}\n@keyframes fx041-bl-move-bottom-shadow {\n  0%, 90%, 100% { opacity: 1; transform: translate(0, 0); }\n  30%           { opacity: 0; transform: translateY(-3.5%); }\n}\n@keyframes fx041-bl-float {\n  50% { transform: scaleY(1.01) skew(-10deg, -2deg); }\n}\n",
  html: "<div class=\"halloctober\"><div class=\"halloctober__banner\"><h1 class=\"typo\" data-text=\"{{LINE}}\">{{LINE}}</h1></div></div>",
  timeBase: "line",
};
