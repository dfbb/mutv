// 073 CSS3D · CSS3D · CodePen，源 example/effect/073-css-3d-2.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "073",
  name: "073 CSS3D",
  src: "CSS3D · CodePen",
  css: ".fx-073 .bl-wrap {\n  background: #f5f5f5;\n}\n\n.fx-073 #wrapper {\n  text-align: center;\n  color: #000;\n  font-weight: bold;\n  font-size: 10em;\n  padding: 50px 0;\n}\n\n.fx-073 #title span {\n  text-shadow: -0.06em 0 red, 0.06em 0 cyan;\n  letter-spacing: 0.08em;\n  vertical-align: middle;\n  line-height: 1.5em;\n  transition: font-size 2s cubic-bezier(0, 1, 0, 1);\n}\n\n.fx-073 #title span:hover {\n  font-size: 1.5em;\n  line-height: 1em;\n  transition: font-size .2s cubic-bezier(0, 0.75, 0, 1);\n}\n\n.fx-073 #title span:active {\n  font-size: 1em;\n  text-shadow: none;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-073 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 改为绿色字体 + 红/青错位阴影(阴影未被覆盖,自动保留) */\n.fx-073 .bl-wrap #title,.fx-073 .bl-wrap #title .bl-char {\n  color: #00e676 !important;\n  -webkit-text-fill-color: #00e676 !important;\n}\n\n/* 逐字露出 */\n.fx-073 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }",
  html: "<div id=\"wrapper\"><p id=\"title\">{{LETTERS}}</p></div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
