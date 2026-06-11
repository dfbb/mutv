// 046 3D TEXT! · 3D TEXT! · CodePen，源 example/effect/046-3d-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "046",
  name: "046 3D TEXT!",
  src: "3D TEXT! · CodePen",
  css: "\n.fx-046 .bl-wrap {\n  background: #F7CA05;\n  display: flex;\n  align-content: center;\n  justify-content: center;\n}\n.fx-046 .box {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.fx-046 h3 {\n  font-size: 12vw;\n  white-space: nowrap;\n  overflow: hidden;\n  line-height: 220px;\n  color: #F7CA05;\n  text-shadow: 0 10px 7px rgba(0,0,0,0.4), 0 -10px 1px #fff;\n  letter-spacing: -3px;\n  margin: 0;\n}\n.fx-046 h3:hover {\n  animation: fx046-glitch .3s linear infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  cursor: pointer;\n}\n@keyframes fx046-glitch {\n  0% { transform: translate(0); }\n  20% { transform: translate(-2px, 2px); }\n  40% { transform: translate(-2px, -2px); }\n  60% { transform: translate(2px, 2px); }\n  80% { transform: translate(2px, -2px); }\n  100% { transform: translate(0); }\n}\n/* 逐字符显示:color/text-shadow(3D 效果)在 h3 上,子 span 继承,\n   字符按歌词时间逐个露出,字符 i 在 reveal>i/n 即自身 start 时刻出现 */\n.fx-046 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-046 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"box\"><h3>{{LETTERS}}</h3></div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
