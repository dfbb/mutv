// 018 Pure CSS pseudo-randomized keyboard pressing text · Pure CSS pseudo-randomized keyboard pressing text effect · CodePen，源 example/effect/018-pure-css.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "018",
  name: "018 Pure CSS pseudo-randomized keyboard pressing text",
  src: "Pure CSS pseudo-randomized keyboard pressing text effect · CodePen",
  css: "\n.fx-018 .bl-wrap {\n  background-color: #101013;\n  color: #fff;\n  font-weight: 900;\n}\n.fx-018 .key {\n  font-size: clamp(2rem, 10vw, 8rem);\n  display: inline-block;\n  letter-spacing: -0.05em;\n  transition: transform 0.2s;\n  animation-duration: calc(2s + var(--i) * 0.3s);\n  animation-iteration-count: infinite;\n  animation-name: fx018-pressDown;\n  animation-delay: calc(calc(var(--i) * 0.27s) - var(--fx-t));\n  /* 按歌词时间逐字符显示:reveal=已到时间字符数/总数,字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n@keyframes fx018-pressDown {\n  30%, 40%, 100% { transform: translateY(0); }\n  35% { transform: translateY(10px); }\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-018 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"keyboard\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"key\" style=\"--i:{i}; --n:{n}\">{ch}</span>",
  timeBase: "line",
};
