// 063 Typo triple · Typo triple · CodePen，源 example/effect/063-typo-triple.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "063",
  name: "063 Typo triple",
  src: "Typo triple · CodePen",
  css: ".fx-063 .bl-wrap {\n  background: yellow;\n}\n\n.fx-063 .typo-triple {\n  font-size: 120px;\n  letter-spacing: 0.1em;\n  -webkit-text-fill-color: transparent;\n  -webkit-text-stroke-width: 3px;\n  -webkit-text-stroke-color: white;\n  text-shadow:\n    8px 8px #ff1f8f,\n    20px 20px #000000;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-063 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色:透明填充 + 白色描边 + 粉/黑双重阴影 */\n.fx-063 .bl-wrap .typo-triple,.fx-063 .bl-wrap .typo-triple .bl-char {\n  color: transparent !important;\n  -webkit-text-fill-color: transparent !important;\n  -webkit-text-stroke-width: 3px !important;\n  -webkit-text-stroke-color: white !important;\n}\n\n/* 逐字露出 */\n.fx-063 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }",
  html: "<span class=\"typo-triple\">{{LETTERS}}</span>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
