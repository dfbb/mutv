// 015 Breathe animation – Variable Font · Breathe animation – Variable Font, HTML · CodePen，源 example/effect/015-breathe-animation.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "015",
  name: "015 Breathe animation – Variable Font",
  src: "Breathe animation – Variable Font, HTML · CodePen",
  css: "\n@font-face {\n  src: url(\"https://garet.typeforward.com/assets/fonts/shared/TFMixVF.woff2\") format('woff2');\n}\n\n.fx-015 .bl-wrap {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background-color: black;\n}\n.fx-015 .breathe-text {\n  font-size: clamp(10vw, 20vw, 50vh);\n  color: white;\n  text-align: center;\n  animation: fx015-letter-breathe 3s ease-in-out infinite;\n  animation-delay: calc(0s - var(--fx-t));\n}\n@keyframes fx015-letter-breathe {\n  from, to {\n    font-variation-settings: 'wght' 100;\n  }\n  50% {\n    font-variation-settings: 'wght' 900;\n  }\n}\n/* 恢复白字(覆盖顶层强制绿);呼吸动画 font-variation-settings 在 .breathe-text 上,子 span 继承 */\n.fx-015 .bl-wrap .breathe-text,.fx-015 .bl-wrap .breathe-text .bl-char {\n  color: #fff !important;\n  -webkit-text-fill-color: #fff !important;\n}\n/* 逐字符显示:字符按歌词时间逐个露出 */\n.fx-015 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-015 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<span class=\"breathe-text\">{{LETTERS}}</span>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
