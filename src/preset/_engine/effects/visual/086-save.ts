// 086 SAVE! · SAVE! · CodePen，源 example/effect/086-save.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "086",
  name: "086 SAVE!",
  src: "SAVE! · CodePen",
  css: "\n.fx-086 .bl-wrap {\n  color: #bfaa40;\n}\n\n.fx-086 .save-text {\n  position: relative;\n  z-index: 2;\n  font-size: 8vmin;\n  letter-spacing: 15px;\n  text-transform: uppercase;\n  transform: rotate(-10deg);\n  display: inline-block;\n  text-shadow: 1px 1px #ac9939, 2px 2px #998833, 3px 3px #86772d, 4px 4px #82742b, 5px 5px #7e702a, 6px 6px #7a6d29, 7px 7px #776928, 8px 8px #736626, 9px 9px #6f6325, 10px 10px #6b5f24, 10px 10px 30px rgba(0, 0, 0, 0.7);\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-086 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复金色文字 */\n.fx-086 .bl-wrap .save-text,.fx-086 .bl-wrap .save-text .bl-char {\n  color: #bfaa40 !important;\n  -webkit-text-fill-color: #bfaa40 !important;\n}\n\n/* 逐字露出 */\n.fx-086 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}\n",
  html: "<h1 class=\"save-text\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
