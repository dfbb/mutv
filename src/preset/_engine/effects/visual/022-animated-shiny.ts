// 022 Animated Shiny Gold Text · Animated Shiny Gold Text · CodePen，源 example/effect/022-animated-shiny.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "022",
  name: "022 Animated Shiny Gold Text",
  src: "Animated Shiny Gold Text · CodePen",
  css: "\n.fx-022 .gold-text {\n  font-style: italic;\n  word-spacing: 0.2em;\n  line-height: 1;\n  white-space: nowrap;\n}\n/* 每个字符:绿字 + 金色立体阴影(原 ::before 的 3D 挤出改为逐字 text-shadow) */\n.fx-022 .gl {\n  display: inline-block;\n  position: relative;\n  text-shadow:\n    0 -1px 0 #f4cc9b, 0 1px 0 #a77334, 0 2px 0 #9b6b30, 0 3px 0 #90632d,\n    0 4px 0 #7a5426, 0 4px 2px #7a5426,\n    0 0.075em 0.1em rgba(26,35,39,.3), 0 0.15em 0.3em rgba(222,153,69,.2);\n  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 逐字扫光:每字一束高光,按 --i 错开相位,整体形成从左到右流动的闪光 */\n.fx-022 .gl::after {\n  content: attr(data-c);\n  position: absolute;\n  left: 0;\n  top: 0;\n  color: transparent;\n  -webkit-text-fill-color: transparent;\n  background-image: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.95) 50%, transparent 65%);\n  background-size: 250% 100%;\n  background-repeat: no-repeat;\n  background-clip: text;\n  -webkit-background-clip: text;\n  animation: fx022-shineL 2.6s linear infinite;\n  animation-delay: calc(0s - var(--fx-t));\n  animation-delay: calc(calc(var(--i) * -0.18s) - var(--fx-t));\n}\n@keyframes fx022-shineL {\n  0%   { background-position: 120% 0; }\n  100% { background-position: -120% 0; }\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-022 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<h1 class=\"gold-text\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"gl\" style=\"--i:{i}; --n:{n}\" data-c=\"{ch}\">{ch}</span>",
  timeBase: "line",
};
