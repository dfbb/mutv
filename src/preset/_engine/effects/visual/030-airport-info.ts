// 030 Airport info · Airport info · CodePen，源 example/effect/030-airport-info.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "030",
  name: "030 Airport info",
  src: "Airport info · CodePen",
  css: ".fx-030 .bl-wrap {\n  background: #C2BEB2;\n}\n\n.fx-030 .table {\n  width: 790px;\n  height: 150px;\n  background-color: #d4e5ff;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.fx-030 .monitor-wrapper {\n  background: #050321;\n  width: 770px;\n  height: 130px;\n  box-shadow: 0px 2px 2px 2px rgba(0, 0, 0, 0.3);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.fx-030 .monitor {\n  width: 700px;\n  height: 100px;\n  background-color: #344151;\n  overflow: hidden;\n  white-space: nowrap;\n  box-shadow: inset 0px 5px 10px 2px rgba(0, 0, 0, 0.3);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.fx-030 .monitor p {\n  font-size: 100px;\n  position: relative;\n  display: inline-block;\n  animation: fx030-move 20s infinite linear;\n  animation-delay: calc(0s - var(--fx-t));\n  color: #EBB55F;\n}\n\n@keyframes fx030-move {\n  from {\n    left: 800px;\n  }\n  to {\n    left: -4800px;\n  }\n}\n.fx-030 .monitor p { animation: none !important; position: static !important; left: auto !important; }\n.fx-030 .bl-wrap { width: auto !important; max-width: none !important; -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<div class=\"table\">\n  <div class=\"monitor-wrapper\">\n    <div class=\"monitor\">\n      <p>{{LINE}}</p>\n    </div>\n  </div>\n</div>",
  timeBase: "line",
};
