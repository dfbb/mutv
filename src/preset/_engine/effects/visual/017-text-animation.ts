// 017 Text Animation Inspired By Apple Event · Text Animation Inspired By Apple Event #apple #iphone #appleevent · CodePen，源 example/effect/017-text-animation.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "017",
  name: "017 Text Animation Inspired By Apple Event",
  src: "Text Animation Inspired By Apple Event #apple #iphone #appleevent · CodePen",
  css: "\n.fx-017 .bl-wrap {\n  background: #000;\n  color: #fff;\n  font-weight: bold;\n  font-size: 36px;\n  overflow: hidden;\n}\n.fx-017 .apple-text {\n  animation: fx017-come2life linear 10s infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  transform-origin: center center;\n  opacity: 0;\n  backface-visibility: hidden;\n  text-align: center;\n}\n@keyframes fx017-come2life {\n  0% {\n    transform: scale3d(0,0,1) rotate(0.02deg);\n    opacity: 0;\n    filter: blur(10px);\n  }\n  25% {\n    transform: scale3d(1,1,1) rotate(0.02deg);\n    opacity: 1;\n    filter: blur(0px);\n  }\n  40% {\n    opacity: 1;\n    filter: blur(0px);\n  }\n  80% {\n    opacity: 0;\n  }\n  100% {\n    transform: scale3d(4,4,1) rotate(0.02deg);\n    filter: blur(10px);\n  }\n}\n/* 去掉引擎按 --reveal 注入的逐字露出遮挡；并放开容器裁切，\n   使 come2life 放大(scale 最大 4)过程中字体不被 overflow:hidden 切掉 */\n.fx-017 { overflow: visible !important; }\n.fx-017 .bl-wrap {\n  overflow: visible !important;\n  -webkit-mask-image: none !important;\n          mask-image: none !important;\n}\n",
  html: "<div class=\"apple-text\">{{LINE}}</div>",
  timeBase: "line",
};
