// 083 Layered text-shadow effect CSS · Layered text-shadow effect CSS · CodePen，源 example/effect/083-layered-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "083",
  name: "083 Layered text-shadow effect CSS",
  src: "Layered text-shadow effect CSS · CodePen",
  css: "\n.fx-083 .bl-wrap {\n  background: #d52e3f;\n}\n\n.fx-083 .layered-text {\n  font-size: 8rem;\n  text-align: center;\n  color: #fcedd8;\n  font-weight: 700;\n  text-shadow:\n    5px 5px 0px #eb452b,\n    10px 10px 0px #efa032,\n    15px 15px 0px #46b59b,\n    20px 20px 0px #017e7f,\n    25px 25px 0px #052939,\n    30px 30px 0px #c11a2b,\n    35px 35px 0px #c11a2b,\n    40px 40px 0px #c11a2b,\n    45px 45px 0px #c11a2b;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-083 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色 */\n.fx-083 .bl-wrap .layered-text,.fx-083 .bl-wrap .layered-text .bl-char {\n  color: #fcedd8 !important;\n  -webkit-text-fill-color: #fcedd8 !important;\n}\n\n/* 逐字露出 */\n.fx-083 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<div class=\"layered-text\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
