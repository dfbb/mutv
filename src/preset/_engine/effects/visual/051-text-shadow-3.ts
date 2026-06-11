// 051 Text Shadow · Text Shadow · CodePen，源 example/effect/051-text-shadow-3.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "051",
  name: "051 Text Shadow",
  src: "Text Shadow · CodePen",
  css: ".fx-051 .bl-wrap {\n  background-color: #ffdd40;\n}\n\n.fx-051 .shadow-text {\n  letter-spacing: 0.0015em;\n  font-size: 5em;\n  color: #274dff;\n  text-shadow:\n    0 1px #8da1ff,\n    -1px 0 #c0cbff,\n    -1px 2px #8da1ff,\n    -2px 1px #c0cbff,\n    -2px 3px #8da1ff,\n    -3px 2px #c0cbff,\n    -3px 4px #8da1ff,\n    -4px 3px #c0cbff,\n    -4px 5px #8da1ff,\n    -5px 4px #c0cbff,\n    -5px 6px #8da1ff,\n    -6px 5px #c0cbff,\n    -6px 7px #8da1ff,\n    -7px 6px #c0cbff,\n    -7px 8px #8da1ff,\n    -8px 7px #c0cbff;\n  text-align: center;\n}\n/* 逐字符显示:color/text-shadow 由 .shadow-text 继承,字符按歌词时间逐个露出 */\n.fx-051 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-051 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<p class=\"shadow-text\">{{LETTERS}}</p>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
