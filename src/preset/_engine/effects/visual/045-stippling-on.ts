// 045 Stippling on Text · Stippling on Text · CodePen，源 example/effect/045-stippling-on.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "045",
  name: "045 Stippling on Text",
  src: "Stippling on Text · CodePen",
  css: "\n.fx-045 .bl-wrap {\n  background: radial-gradient(#480d35, #17151d);\n}\n\n.fx-045 .stipple-text {\n  position: relative;\n  color: #f6d8d5;\n  font-size: clamp(3rem, 10vw, 8rem);\n  font-weight: 900;\n  text-align: center;\n}\n\n.fx-045 .stipple-text::before {\n  content: attr(data-text);\n  position: absolute;\n  top: 0em;\n  left: 0em;\n  color: #313f97;\n  z-index: -1;\n  animation: fx045-stipple-shift-back 3s ease-in-out infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n.fx-045 .stipple-text::after {\n  content: attr(data-text);\n  position: absolute;\n  color: transparent;\n  top: 0em;\n  left: 0em;\n  background-image: radial-gradient(circle, rgba(236, 34, 37, 0.5) 0.0125em, transparent 0.0125em);\n  background-size: 8px 8px;\n  -webkit-background-clip: text;\n  background-clip: text;\n  -webkit-text-stroke: 1px #ec2225;\n  animation: fx045-stipple-shift-after 3s ease-in-out infinite alternate;\n  animation-delay: calc(0s - var(--fx-t));\n}\n\n@keyframes fx045-stipple-shift-back {\n  0%   { top: 0em; left: 0em; }\n  100% { top: 0.04em; left: 0.04em; }\n}\n\n@keyframes fx045-stipple-shift-after {\n  0%   { top: 0em; left: 0em; }\n  100% { top: -0.04em; left: -0.04em; }\n}\n",
  html: "<h1 class=\"stipple-text\" data-text=\"{{LINE}}\">{{LINE}}</h1>",
  timeBase: "line",
};
