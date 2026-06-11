// 072 3D Text Lighting & Shadows · 3D Text Lighting & Shadows · CodePen，源 example/effect/072-3d-text-3.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "072",
  name: "072 3D Text Lighting & Shadows",
  src: "3D Text Lighting & Shadows · CodePen",
  css: ".fx-072 .bl-wrap {\n  background: linear-gradient(135deg, rgba(206,188,155,1) 0%, rgba(85,63,50,1) 51%, rgba(42,31,25,1) 100%);\n  overflow: hidden;\n}\n\n.fx-072 h1 {\n  width: 100%;\n  margin: 0 auto;\n  line-height: 280px;\n  font-size: 11.5rem;\n  padding: 80px 50px;\n  text-align: center;\n  text-transform: uppercase;\n  text-rendering: optimizeLegibility;\n}\n\n.fx-072 h1::before {\n  content: \"\";\n  width: 100%;\n  height: 750px;\n  position: absolute;\n  top: -200px;\n  left: 10px;\n  transform: rotate(55deg);\n  background: linear-gradient(to right, rgba(206,188,155,.7) 0%, rgba(42,31,25,0) 65%);\n}\n\n.fx-072 #text3d {\n  color: #70869d;\n  letter-spacing: .15em;\n  text-shadow:\n    -1px -1px 1px #efede3,\n    0px 1px 0 #2e2e2e,\n    0px 2px 0 #2c2c2c,\n    0px 3px 0 #2a2a2a,\n    0px 4px 0 #282828,\n    0px 5px 0 #262626,\n    0px 6px 0 #242424,\n    0px 7px 0 #222,\n    0px 8px 0 #202020,\n    0px 9px 0 #1e1e1e,\n    0px 10px 0 #1c1c1c,\n    0px 11px 0 #1a1a1a,\n    0px 12px 0 #181818,\n    0px 13px 0 #161616,\n    0px 14px 0 #141414,\n    0px 15px 0 #121212,\n    2px 20px 5px rgba(0, 0, 0, 0.9),\n    5px 23px 5px rgba(0, 0, 0, 0.3),\n    8px 27px 8px rgba(0, 0, 0, 0.5),\n    8px 28px 35px rgba(0, 0, 0, 0.9);\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-072 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 去掉背景:h1::before 的斜向浅色光带(伪元素未被主题覆盖才残留);.bl-wrap 渐变已被主题压掉 */\n.fx-072 .bl-wrap h1::before { display: none !important; }\n\n/* 恢复颜色 #70869d (高优先级压过引擎绿色覆盖) */\n.fx-072 .bl-wrap #text3d,.fx-072 .bl-wrap #text3d .bl-char {\n  color: #70869d !important;\n  -webkit-text-fill-color: #70869d !important;\n}\n\n/* 逐字露出 */\n.fx-072 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }",
  html: "<h1 id=\"text3d\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
