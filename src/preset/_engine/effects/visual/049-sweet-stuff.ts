// 049 Sweet stuff · Sweet stuff · CodePen，源 example/effect/049-sweet-stuff.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "049",
  name: "049 Sweet stuff",
  src: "Sweet stuff · CodePen",
  css: ".fx-049 .bl-wrap {\n}\n\n.fx-049 .sweet-title {\n  color: #fde9ff;\n  font-weight: 900;\n  text-transform: uppercase;\n  font-size: clamp(3rem, 10vw, 6rem);\n  line-height: 0.75em;\n  text-align: center;\n  text-shadow: 3px 1px 1px #4af7ff, 2px 2px 1px #165bfb, 4px 2px 1px #4af7ff, 3px 3px 1px #165bfb, 5px 3px 1px #4af7ff, 4px 4px 1px #165bfb, 6px 4px 1px #4af7ff, 5px 5px 1px #165bfb, 7px 5px 1px #4af7ff, 6px 6px 1px #165bfb, 8px 6px 1px #4af7ff, 7px 7px 1px #165bfb, 9px 7px 1px #4af7ff;\n  position: relative;\n}\n\n.fx-049 .sweet-title::before {\n  content: attr(data-text);\n  position: absolute;\n  text-shadow: 2px 2px 1px #e94aa1, -1px -1px 1px #c736f9, -2px 2px 1px #e94aa1, 1px -1px 1px #f736f9;\n  z-index: 1;\n  left: 0;\n  top: 0;\n  /* 叠层用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 逐字符显示:主文字拆成逐字,按歌词时间逐个露出 */\n.fx-049 .sweet-title .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */\n.fx-049 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n",
  html: "<div class=\"sweet-title\" data-text=\"{{LINE}}\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
