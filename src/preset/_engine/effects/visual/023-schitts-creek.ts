// 023 Schitt's Creek CSS title animation · Schitt's Creek (CSS) title animation · CodePen，源 example/effect/023-schitts-creek.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "023",
  name: "023 Schitt's Creek CSS title animation",
  src: "Schitt's Creek (CSS) title animation · CodePen",
  css: "\n@keyframes fx023-pop-word {\n  to { transform: rotateX(0); }\n}\n@keyframes fx023-show {\n  to { opacity: 1; }\n}\n@keyframes fx023-shimmer {\n  to { text-shadow: 0 0 8px red; }\n}\n\n.fx-023 .bl-wrap {\n  background-color: black;\n}\n.fx-023 .schitts-title {\n  color: white;\n  font-size: clamp(3rem, 8vw, 8rem);\n  line-height: 0.85;\n  perspective: 500px;\n  margin: 0;\n}\n.fx-023 .word {\n  display: block;\n  animation: fx023-show 0.01s forwards, fx023-pop-word 1.5s forwards;\n  animation-delay: calc(0s - var(--fx-t)), calc(0s - var(--fx-t));\n  animation-timing-function: cubic-bezier(0.14, 1.23, 0.33, 1.16);\n  opacity: 0;\n  transform: rotateX(120deg);\n  transform-origin: 50% 100%;\n}\n.fx-023 .word:nth-of-type(2) {\n  padding: 0 2rem;\n  animation-delay: calc(1.5s - var(--fx-t));\n  color: gold;\n}\n",
  html: "<h1 class=\"schitts-title\">\n  <span class=\"word\">{{LINE}}</span>\n</h1>",
  timeBase: "line",
};
