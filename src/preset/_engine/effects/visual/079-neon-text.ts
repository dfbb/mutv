// 079 Neon Text Effect · Neon Text Effect · CodePen，源 example/effect/079-neon-text.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "079",
  name: "079 Neon Text Effect",
  src: "Neon Text Effect · CodePen",
  css: "\n.fx-079 .bl-wrap {\n  background-color: #010a00;\n}\n\n.fx-079 .neon {\n  color: #fff;\n  font-weight: 400;\n  text-align: center;\n  text-transform: uppercase;\n  font-size: 3rem;\n  text-shadow:\n    0 0 5px #fff,\n    0 0 10px #fff,\n    0 0 20px #fff,\n    0 0 40px #0ff,\n    0 0 80px #0ff,\n    0 0 90px #0ff,\n    0 0 100px #0ff,\n    0 0 150px #0ff;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-079 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 霓虹白字 (text-shadow 未被覆盖,青色辉光自动显现) */\n.fx-079 .bl-wrap .neon,.fx-079 .bl-wrap .neon .bl-char { color: #fff !important; -webkit-text-fill-color: #fff !important; }\n\n/* 逐字露出 */\n.fx-079 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }\n",
  html: "<h1 class=\"neon\">{{LETTERS}}</h1>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
