// 058 Multilayer text · Multilayer text · CodePen，源 example/effect/058-multilayer-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "058",
  name: "058 Multilayer text",
  src: "Multilayer text · CodePen",
  css: ".fx-058 .bl-wrap {\n  background: black;\n}\n\n.fx-058 .multilayer {\n  position: relative;\n  display: inline-block;\n  color: #cf1b1b;\n  font-size: clamp(3rem, 10vw, 7rem);\n  letter-spacing: 8px;\n  cursor: pointer;\n  text-transform: uppercase;\n}\n\n.fx-058 .multilayer::before {\n  content: attr(data-text);\n  position: absolute;\n  color: transparent;\n  background-image: repeating-linear-gradient(\n    45deg,\n    transparent 0,\n    transparent 2px,\n    white 2px,\n    white 4px\n  );\n  -webkit-background-clip: text;\n  top: 0px;\n  left: 0;\n  z-index: -1;\n  transition: 1s;\n  width: 100%;\n}\n\n.fx-058 .multilayer::after {\n  content: attr(data-text);\n  position: absolute;\n  color: transparent;\n  background-image: repeating-linear-gradient(\n    135deg,\n    transparent 0,\n    transparent 2px,\n    white 2px,\n    white 4px\n  );\n  -webkit-background-clip: text;\n  top: 0px;\n  left: 0;\n  transition: 1s;\n  width: 100%;\n}\n\n.fx-058 .multilayer:hover::before {\n  top: 10px;\n  left: 10px;\n}\n\n.fx-058 .multilayer:hover::after {\n  top: -10px;\n  left: -10px;\n}\n/* 恢复原红字(覆盖顶层 VISUAL_OVERRIDE 的强制绿);\n   主红字 + ::before/::after 斜纹叠层整体按 --reveal 裁切(CJK 等宽 => 逐字步进露出) */\n.fx-058 .bl-wrap .multilayer {\n  color: #cf1b1b !important;\n  -webkit-text-fill-color: #cf1b1b !important;\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */\n.fx-058 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<span class=\"multilayer\" data-text=\"{{LINE}}\">{{LINE}}</span>",
  timeBase: "line",
};
