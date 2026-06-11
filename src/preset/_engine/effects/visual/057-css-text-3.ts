// 057 CSS text-emphasis · CSS text-emphasis · CodePen，源 example/effect/057-css-text-3.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "057",
  name: "057 CSS text-emphasis",
  src: "CSS text-emphasis · CodePen",
  css: ".fx-057 .emphasis-text {\n  -webkit-text-emphasis: filled double-circle deeppink;\n  text-emphasis: filled double-circle deeppink;\n  color: hsl(0 0% 20%);\n  font-size: 3rem;\n  line-height: 1.5;\n  font-weight: 300;\n  margin: 0;\n  text-align: center;\n}\n/* 改为绿色字体(着重号 deeppink 由 shorthand 继承,保留) */\n.fx-057 .bl-wrap .emphasis-text,.fx-057 .bl-wrap .emphasis-text .bl-char {\n  color: #00e676 !important;\n  -webkit-text-fill-color: #00e676 !important;\n}\n/* 逐字符显示:color/text-emphasis 由 .emphasis-text 继承,字符按歌词时间逐个露出 */\n.fx-057 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-057 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<p class=\"emphasis-text\">{{LETTERS}}</p>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
