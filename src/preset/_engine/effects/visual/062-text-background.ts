// 062 Background clipping covfefe · Background clipping covfefe · CodePen，源 example/effect/062-text-background.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "062",
  name: "062 Background clipping covfefe",
  src: "Background clipping covfefe · CodePen",
  css: "\n.fx-062 .bl-wrap {\n  background: #AB3428;\n  letter-spacing: 5px;\n}\n\n.fx-062 .clip-text {\n  display: inline;\n  font-size: 15vw;\n  text-transform: uppercase;\n  color: #F49E4C;\n}\n\n@media (min-width: 700px) {\n  .fx-062 .clip-text {\n    font-size: 9vw;\n  }\n}\n\n@media (min-width: 1400px) {\n  .fx-062 .clip-text {\n    font-size: 150px;\n  }\n}\n\n@supports (-webkit-background-clip: text) {\n  .fx-062 .clip-text {\n    color: transparent;\n    background: linear-gradient(7deg, #F5EE9E 50%, #F49E4C 0);\n    -webkit-background-clip: text;\n    background-clip: text;\n  }\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-062 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复原始渐变填充色 */\n.fx-062 .bl-wrap .clip-text {\n  background: linear-gradient(7deg, #F5EE9E 50%, #F49E4C 0) !important;\n  -webkit-background-clip: text !important;\n  background-clip: text !important;\n  color: transparent !important;\n  -webkit-text-fill-color: transparent !important;\n}\n\n/* 逐字露出（clip-path 按 reveal 比例裁剪文本宽度） */\n.fx-062 .bl-wrap .clip-text {\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n",
  html: "<h1 class=\"clip-text\">{{LINE}}</h1>",
  timeBase: "line",
};
