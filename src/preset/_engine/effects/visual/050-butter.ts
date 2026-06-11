// 050 Butter · Butter · CodePen，源 example/effect/050-butter.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "050",
  name: "050 Butter",
  src: "Butter · CodePen",
  css: ".fx-050 .bl-wrap {\n  background: #6868AC;\n}\n\n.fx-050 .butter-text {\n  font-weight: 700;\n  font-size: 8rem;\n  letter-spacing: 0.02em;\n  text-align: center;\n  color: #F9f1cc;\n  text-shadow:\n    5px 5px 0px #FFB650,\n    10px 10px 0px #FFD662,\n    15px 15px 0px #FF80BF,\n    20px 20px 0px #EF5097,\n    25px 25px 0px #6868AC,\n    30px 30px 0px #90B1E0;\n}\n/* 逐字符显示:color/text-shadow 由 .butter-text 继承,字符按歌词时间逐个露出 */\n.fx-050 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-050 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"butter-text\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
