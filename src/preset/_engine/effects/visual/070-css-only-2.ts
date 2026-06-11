// 070 CSS only 3D paper fold text effect · CSS only 3D paper fold text effect · CodePen，源 example/effect/070-css-only-2.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "070",
  name: "070 CSS only 3D paper fold text effect",
  src: "CSS only 3D paper fold text effect · CodePen",
  css: ".fx-070 .bl-wrap {\n  background: linear-gradient(45deg, lch(90 2.22 62.5) 80%, lch(78 2.15 94.43) 100%);\n}\n\n.fx-070 h1 {\n  font-weight: 900;\n  font-size: calc(20vw + 0.5rem);\n  white-space: nowrap;\n  color: lch(76 39.21 9.23/0.5);\n  text-transform: uppercase;\n  transform: skew(10deg) rotate(-10deg);\n  text-shadow: 1px 4px 6px lch(90 2.22 62.5), 0 0 0 lch(28 26.21 12.27), 1px 4px 6px lch(90 2.22 62.5);\n}\n.fx-070 h1::before {\n  content: attr(data-heading);\n  position: absolute;\n  left: 0;\n  top: -4.8%;\n  overflow: hidden;\n  height: 50%;\n  color: lch(97 2.19 62.49);\n  transform: translate(1.6vw, 0) skew(-13deg) scale(1, 1.2);\n  text-shadow: 2px -1px 6px rgba(0, 0, 0, 0.2);\n}\n.fx-070 h1::after {\n  content: attr(data-heading);\n  position: absolute;\n  left: 0;\n  color: lch(83 2.26 62.51);\n  transform: translate(0, 0) skew(13deg) scale(1, 0.8);\n  clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0% 100%);\n  text-shadow: 2px -1px 6px lch(0 0 0/0.3);\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-070 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复 h1 主体颜色(::before/::after 颜色不受 override 影响,保持原样) */\n.fx-070 .bl-wrap h1 {\n  color: lch(76 39.21 9.23/0.5) !important;\n  -webkit-text-fill-color: lch(76 39.21 9.23/0.5) !important;\n}\n\n/* 逐字露出:在 h1(含其 ::before/::after)上做 clip-path */\n.fx-070 .bl-wrap h1 { clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0); }",
  html: "<h1 data-heading=\"{{LINE}}\">{{LINE}}</h1>",
  timeBase: "line",
};
