// 039 mix-blend-mode · mix-blend-mode · CodePen，源 example/effect/039-animated-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "039",
  name: "039 mix-blend-mode",
  src: "mix-blend-mode · CodePen",
  css: "\n.fx-039 {\n  --primary-color: #6CD9CE;\n  --secondary-color: #D93BA1;\n  --complimentary-color: #2E2473;\n}\n.fx-039 .bl-wrap {\n  background-color: var(--complimentary-color);\n  position: relative;\n  overflow: hidden;\n}\n.fx-039 h1.bl-mixblend {\n  font-size: clamp(3rem, 10vw, 9rem);\n  color: var(--primary-color);\n  transform: translateY(-600px);\n  animation: fx039-bl-slideIn 1.2s ease-in-out forwards 1s;\n  animation-delay: calc(1s - var(--fx-t));\n  z-index: 10;\n  position: relative;\n  margin: 0;\n}\n.fx-039 h1.bl-mixblend::before {\n  content: '';\n  /* 粉色横条宽度跟随逐字露出比例(引擎每帧设的 --reveal),不再提前画满 */\n  width: calc(var(--reveal, 1) * 100%);\n  height: 76px;\n  background-color: var(--secondary-color);\n  position: absolute;\n  left: 0;\n  bottom: -10px;\n  mix-blend-mode: screen;\n}\n.fx-039 .bl-overlay {\n  position: absolute;\n  width: 100%;\n  top: 0;\n  bottom: 0;\n  opacity: 0;\n  left: 0;\n  right: 0;\n  background-color: var(--secondary-color);\n  transform: scale(0.5);\n  animation: fx039-bl-slideIn 0.5s ease-in-out forwards, fx039-bl-skewBg 1s ease-in-out;\n  animation-delay: calc(0s - var(--fx-t)), calc(0s - var(--fx-t));\n}\n@keyframes fx039-bl-skewBg {\n  0%   { transform: scale(0.5); }\n  100% { transform: scale(1); }\n}\n@keyframes fx039-bl-slideIn {\n  100% { transform: translateY(0px); opacity: 1; }\n}\n/* 逐字符显示:整行保留 translateY 滑入入场,字符按歌词时间逐个露出,\n   字符 i 在 reveal>i/n 即自身 start 时刻出现 */\n.fx-039 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-039 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<h1 class=\"bl-mixblend\">{{LETTERS}}</h1><div class=\"bl-overlay\"></div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
