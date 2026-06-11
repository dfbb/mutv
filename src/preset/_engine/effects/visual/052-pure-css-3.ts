// 052 Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect · Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect · CodePen，源 example/effect/052-pure-css-3.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "052",
  name: "052 Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect",
  src: "Pure CSS Animated 3D Text Effect + Fade In As Outline Text Effect · CodePen",
  css: ".fx-052 .bl-wrap {\n  background-color: #ffdd40;\n  color: #333;\n}\n\n.fx-052 .rise {\n  font-size: 4rem;\n  text-shadow: -0.01em -0.01em 0.01em #000;\n  animation: fx052-rise 2s ease-in-out 0.5s forwards;\n  animation-delay: calc(0.5s - var(--fx-t));\n}\n\n@keyframes fx052-rise {\n  to {\n    text-shadow:\n      0em 0.01em #ff5,\n      0em 0.02em #ff5,\n      0em 0.02em 0.03em #ff5,\n      -0.01em 0.01em #333,\n      -0.02em 0.02em #333,\n      -0.03em 0.03em #333,\n      -0.04em 0.04em #333,\n      -0.01em -0.01em 0.03em #000,\n      -0.02em -0.02em 0.03em #000,\n      -0.03em -0.03em 0.03em #000;\n    transform: translateY(-0.025em) translateX(0.04em);\n  }\n}\n/* 逐字符显示:color/text-shadow(含 rise 动画)由 .rise 继承,字符按歌词时间逐个露出 */\n.fx-052 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-052 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<p class=\"rise\">{{LETTERS}}</p>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
