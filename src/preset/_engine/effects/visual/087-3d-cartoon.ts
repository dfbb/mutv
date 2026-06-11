// 087 3D Cartoon Text w/CSS text-shadow · 3D Cartoon Text w/CSS text-shadow · CodePen，源 example/effect/087-3d-cartoon.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "087",
  name: "087 3D Cartoon Text w/CSS text-shadow",
  src: "3D Cartoon Text w/CSS text-shadow · CodePen",
  css: "\n.fx-087 .bl-wrap {\n  background-color: #fc3153;\n  text-align: center;\n}\n\n.fx-087 .cartoon-3d {\n  font-size: 10vmin;\n  color: #fff;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  text-shadow:\n    0px -6px 0 #212121,\n    0px -6px 0 #212121,\n    0px  6px 0 #212121,\n    0px  6px 0 #212121,\n    -6px  0px 0 #212121,\n    6px  0px 0 #212121,\n    -6px  0px 0 #212121,\n    6px  0px 0 #212121,\n    -6px -6px 0 #212121,\n    6px -6px 0 #212121,\n    -6px  6px 0 #212121,\n    6px  6px 0 #212121,\n    -6px  18px 0 #212121,\n    0px  18px 0 #212121,\n    6px  18px 0 #212121,\n    0 19px 1px rgba(0,0,0,.1),\n    0 0 6px rgba(0,0,0,.1),\n    0 6px 3px rgba(0,0,0,.3),\n    0 12px 6px rgba(0,0,0,.2),\n    0 18px 18px rgba(0,0,0,.25),\n    0 24px 24px rgba(0,0,0,.2),\n    0 36px 36px rgba(0,0,0,.15);\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-087 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色 (白色字体 + text-shadow 3D 卡通效果) */\n.fx-087 .bl-wrap .cartoon-3d,.fx-087 .bl-wrap .cartoon-3d .bl-char {\n  color: #fff !important;\n  -webkit-text-fill-color: #fff !important;\n}\n\n/* 逐字露出 */\n.fx-087 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }\n",
  html: "<h1 class=\"cartoon-3d\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
