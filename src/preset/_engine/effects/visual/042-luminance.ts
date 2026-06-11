// 042 Luminance · Luminance · CodePen，源 example/effect/042-luminance.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "042",
  name: "042 Luminance",
  src: "Luminance · CodePen",
  css: "\n.fx-042 .bl-wrap {\n  background: #333641;\n  overflow: hidden;\n}\n.fx-042 .bl-luminance {\n  background: 50% 100%/50% 50% no-repeat radial-gradient(ellipse at bottom, #fff, transparent, transparent);\n  -webkit-background-clip: text;\n  background-clip: text;\n  color: transparent;\n  font-size: 10vw;\n  animation: fx042-bl-reveal 3000ms ease-in-out forwards 200ms, fx042-bl-glow 2500ms linear infinite 2000ms;\n  animation-delay: calc(200ms - var(--fx-t)), calc(2000ms - var(--fx-t));\n  text-transform: uppercase;\n  letter-spacing: 4px;\n}\n@keyframes fx042-bl-reveal {\n  80% { letter-spacing: 8px; }\n  100% { background-size: 300% 300%; }\n}\n@keyframes fx042-bl-glow {\n  40% { text-shadow: 0 0 8px #fff; }\n}\n",
  html: "<div class=\"bl-luminance\">{{LINE}}</div>",
  timeBase: "line",
};
