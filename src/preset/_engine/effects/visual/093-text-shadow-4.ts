// 093 Text-Shadow · Text-Shadow · CodePen，源 example/effect/093-text-shadow-4.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "093",
  name: "093 Text-Shadow",
  src: "Text-Shadow · CodePen",
  css: "\n.fx-093 .bl-wrap {\n  background: #A0CBA4;\n}\n\n.fx-093 .lobster-shadow {\n  color: #D5E2D6;\n  text-align: center;\n  line-height: 1.2;\n  font-size: 7vmin;\n  transform: rotate(-5deg) skewX(1deg) skewY(1deg);\n  display: inline-block;\n  text-shadow: 1px 1px #4A744D, 2px 2px #4A744D, 3px 3px #4A744D, 4px 4px #4A744D, 5px 5px #4A744D, 6px 6px #4A744D, 7px 7px #4A744D, 8px 8px #4A744D, 9px 9px #4A744D, 10px 10px #4A744D, 11px 11px #4A744D, 12px 12px #4A744D, 13px 13px #4A744D, 14px 14px #4A744D, 15px 15px #4A744D, 16px 16px #4A744D, 17px 17px #4A744D, 18px 18px #4A744D, 19px 19px #4A744D, 20px 20px #4A744D, 21px 21px #4A744D, 22px 22px #4A744D, 23px 23px #4A744D, 24px 24px #4A744D, 25px 25px #4A744D, 26px 26px 6px #06520C;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-093 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复原始颜色(浅色字 + 深色阴影) */\n.fx-093 .bl-wrap .lobster-shadow,.fx-093 .bl-wrap .lobster-shadow .bl-char {\n  color: #D5E2D6 !important;\n  -webkit-text-fill-color: #D5E2D6 !important;\n}\n\n/* 逐字露出 */\n.fx-093 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<h1 class=\"lobster-shadow\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
