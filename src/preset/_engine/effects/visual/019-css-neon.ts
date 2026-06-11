// 019 CSS Neon Text Animation · CSS Neon Text Animation · CodePen，源 example/effect/019-css-neon.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "019",
  name: "019 CSS Neon Text Animation",
  src: "CSS Neon Text Animation · CodePen",
  css: "\n@font-face {\n  src: url(\"https://s3-us-west-2.amazonaws.com/s.cdpn.io/907368/liberty.otf\");\n}\n.fx-019 .bl-wrap {\n  background-color: #1b2431;\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n}\n.fx-019 .neon-text {\n  font-weight: 100;\n  font-size: clamp(3rem, 10vw, 7rem);\n  letter-spacing: normal;\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n}\n.fx-019 .neon-letter {\n  color: #d9fdff;\n  text-shadow: 0 0 2rem #00f0ff;\n  display: inline-block;\n  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-019 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<h1 class=\"neon-text\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"neon-letter\" style=\"--i:{i}; --n:{n}\">{ch}</span>",
  timeBase: "line",
};
