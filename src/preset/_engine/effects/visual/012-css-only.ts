// 012 CSS only marquee with slow on hover · CSS only marquee with slow on hover · CodePen，源 example/effect/012-css-only.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "012",
  name: "012 CSS only marquee with slow on hover",
  src: "CSS only marquee with slow on hover · CodePen",
  css: "\n/* 方案 B：只显示一行、绕中心倾斜（去掉 6 遍重复滚动），整行对称落在屏幕正中 */\n.fx-012 { overflow: visible !important; }\n/* 跑马灯本是滚动效果，关掉引擎注入的逐字遮罩，避免 mask-clip 把倾斜溢出裁掉 */\n.fx-012 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n.fx-012 .marquee {\n  transform: rotate(-5deg);\n  transform-origin: center center;\n}\n.fx-012 .marquee p {\n  margin: 0;\n  font-weight: bold;\n  line-height: 1.1;\n  text-transform: uppercase;\n}\n",
  html: "<div class=\"marquee\"><p>{{LINE}}</p></div>",
  timeBase: "line",
};
