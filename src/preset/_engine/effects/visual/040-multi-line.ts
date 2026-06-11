// 040 Multi-line spanning animated underline. · Multi-line spanning animated underline. · CodePen，源 example/effect/040-multi-line.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "040",
  name: "040 Multi-line spanning animated underline.",
  src: "Multi-line spanning animated underline. · CodePen",
  css: "\n.fx-040 .bl-wrap {\n  background-color: #ffb7b0;\n  color: hsl(198, 1%, 29%);\n  font-size: 130%;\n}\n.fx-040 h2.bl-underline-anim {\n  line-height: 1.5;\n  display: inline;\n  background-image: linear-gradient(\n    transparent 50%,\n    #e1fffe 50%,\n    #b0f8ff 85%,\n    transparent 85%,\n    transparent 100%\n  );\n  background-repeat: no-repeat;\n  background-size: 0% 100%;\n  animation: fx040-bl-animatedBackground 2s cubic-bezier(0.645, 0.045, 0.355, 1) 0.5s forwards;\n  animation-delay: calc(0.5s - var(--fx-t));\n}\n@keyframes fx040-bl-animatedBackground {\n  to { background-size: 100% 100%; }\n}\n",
  html: "<h2 class=\"bl-underline-anim\">{{LINE}}</h2>",
  timeBase: "line",
};
