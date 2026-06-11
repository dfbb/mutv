// 095 CSS3 text-shadow effects · CSS3 text-shadow effects · CodePen，源 example/effect/095-css3-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "095",
  name: "095 CSS3 text-shadow effects",
  src: "CSS3 text-shadow effects · CodePen",
  css: "\n.fx-095 .bl-wrap {\n  background-color: #e7e5e4;\n}\n\n.fx-095 .elegant-shadow {\n  font-size: 5vmin;\n  padding: 20px;\n  text-align: center;\n  text-transform: uppercase;\n  text-rendering: optimizeLegibility;\n  color: #131313;\n  letter-spacing: 0.15em;\n  text-shadow: 1px -1px 0 #767676, -1px 2px 1px #737272, -2px 4px 1px #767474, -3px 6px 1px #787777, -4px 8px 1px #7b7a7a, -5px 10px 1px #7f7d7d, -6px 12px 1px #828181, -7px 14px 1px #868585, -8px 16px 1px #8b8a89, -9px 18px 1px #8f8e8d, -10px 20px 1px #949392, -11px 22px 1px #999897, -12px 24px 1px #9e9c9c, -13px 26px 1px #a3a1a1, -14px 28px 1px #a8a6a6, -15px 30px 1px #adabab, -16px 32px 1px #b2b1b0, -17px 34px 1px #b7b6b5, -18px 36px 1px #bcbbba, -19px 38px 1px #c1bfbf, -20px 40px 1px #c6c4c4, -21px 42px 1px #cbc9c8, -22px 44px 1px #cfcdcd, -23px 46px 1px #d4d2d1, -24px 48px 1px #d8d6d5, -25px 50px 1px #dbdad9, -26px 52px 1px #dfdddc, -27px 54px 1px #e2e0df, -28px 56px 1px #e4e3e2;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-095 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 原始为深色实心字 #131313 + 灰色立体阴影 */\n.fx-095 .bl-wrap .elegant-shadow,.fx-095 .bl-wrap .elegant-shadow .bl-char {\n  color: #131313 !important;\n  -webkit-text-fill-color: #131313 !important;\n}\n\n/* 逐字露出 */\n.fx-095 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }\n",
  html: "<h1 class=\"elegant-shadow\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
