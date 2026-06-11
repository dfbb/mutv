// 066 SCSS 3D text mixin · SCSS 3D text mixin · CodePen，源 example/effect/066-scss-3d.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "066",
  name: "066 SCSS 3D text mixin",
  src: "SCSS 3D text mixin · CodePen",
  css: ".fx-066 .bl-wrap {\n  background: #e6bebe;\n}\n\n.fx-066 h1 {\n  color: #FFF;\n  font-size: 60px;\n  line-height: 1em;\n  margin: 0;\n  text-align: center;\n  text-shadow: 0 1px 0 #dba1a1, 0 2px 0 #d89999, 0 3px 0 #d59292, 0 4px 0 #d28a8a, 0 5px 0 #cf8383, 0 6px 0 #cd7c7c, 0 7px 0 #ca7474, 0 8px 0 #c76d6d, 0 0 5px rgba(230, 139, 139, 0.05), 0 -1px 3px rgba(230, 139, 139, 0.2), 0 9px 9px rgba(230, 139, 139, 0.3), 0 12px 12px rgba(230, 139, 139, 0.3), 0 15px 15px rgba(230, 139, 139, 0.3);\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-066 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 原始为白色文字 + 红色 3D 阴影 */\n.fx-066 .bl-wrap h1,.fx-066 .bl-wrap h1 .bl-char { color: #FFF !important; -webkit-text-fill-color: #FFF !important; }\n\n/* 逐字露出 */\n.fx-066 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }",
  html: "<h1>{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
