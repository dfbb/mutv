// 071 3D text stroke · 3D text stroke · CodePen，源 example/effect/071-3d-text-2.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "071",
  name: "071 3D text stroke",
  src: "3D text stroke · CodePen",
  css: ".fx-071 .bl-wrap {\n  background: #252527;\n}\n\n.fx-071 .owText {\n  text-align: center;\n  -webkit-text-stroke: 2px white;\n  text-transform: uppercase;\n  color: #252527;\n  font-size: 14vw;\n  letter-spacing: 1.2vw;\n  font-weight: 700;\n  text-shadow: 0 1px 0 #4a4a4e, -1px -1px 0 #4a4a4e, -1px 0px 0 #343437, -2px 1px 0 #343437, -3px 2px 0 #313134, -4px 3px 0 #2f2f31, -5px 4px 0 #2c2c2f, -6px 5px 0 #2a2a2c, -7px 6px 0 #27272a, -8px 7px 0 #252527, -9px 8px 0 #232324, -10px 9px 0 #202022, -11px 10px 0 #1e1e1f, -12px 11px 0 #1b1b1d, -13px 12px 0 #19191a, -14px 13px 0 #161617, -15px 14px 0 #141415, -16px 15px 0 #111112, 0 -1px 1px white, 0 -2px 0px white, -15px 14px 0px white, -16px 15px 0px white, -17px 16px 0px white, -18px 17px 0px white, -2px -1px 0 white, -3px 0px 0 white, -19px 15px 0 white, -18px 14px 0 white, -17px 13px 0 white, -16px 12px 0 white, -15px 11px 0 white, -14px 10px 0 white, -13px 9px 0 white, -12px 8px 0 white, -11px 7px 0 white, -10px 6px 0 white, -9px 5px 0 white, -8px 4px 0 white, -7px 3px 0 white, -6px 2px 0 white, -5px 1px 0 white, -4px 0px 0 white, 0px 2px 0px white, -1px 3px 0px white, -2px 4px 0px white, -3px 5px 0px white, -4px 6px 0px white, -5px 7px 0px white, -6px 8px 0px white, -7px 9px 0px white, -8px 10px 0px white, -9px 11px 0px white, -10px 12px 0px white, -11px 13px 0px white, -12px 14px 0px white, -13px 15px 0px white, -14px 16px 0px white, -15px 17px 0px white;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-071 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复颜色: 深灰字心 + 白色描边构成 3D 立体字 */\n.fx-071 .bl-wrap .owText,.fx-071 .bl-wrap .owText .bl-char {\n  color: #252527 !important;\n  -webkit-text-fill-color: #252527 !important;\n}\n\n/* 逐字露出 */\n.fx-071 .bl-char {\n  display: inline-block;\n  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);\n}",
  html: "<div class=\"owText\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
