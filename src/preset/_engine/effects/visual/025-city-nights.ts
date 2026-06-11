// 025 City Nights Text Effect · City Nights Text Effect · CodePen，源 example/effect/025-city-nights.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "025",
  name: "025 City Nights Text Effect",
  src: "City Nights Text Effect · CodePen",
  css: "\n@keyframes fx025-lights {\n  0% {\n    color: hsl(230, 40%, 80%);\n    text-shadow:\n      0 0 1em hsla(320, 100%, 50%, 0.2),\n      0 0 0.125em hsla(320, 100%, 60%, 0.3),\n      -1em -0.125em 0.5em hsla(40, 100%, 60%, 0),\n      1em 0.125em 0.5em hsla(200, 100%, 60%, 0);\n  }\n  30% {\n    color: hsl(230, 80%, 90%);\n    text-shadow:\n      0 0 1em hsla(320, 100%, 50%, 0.5),\n      0 0 0.125em hsla(320, 100%, 60%, 0.5),\n      -0.5em -0.125em 0.25em hsla(40, 100%, 60%, 0.2),\n      0.5em 0.125em 0.25em hsla(200, 100%, 60%, 0.4);\n  }\n  40% {\n    color: hsl(230, 100%, 95%);\n    text-shadow:\n      0 0 1em hsla(320, 100%, 50%, 0.5),\n      0 0 0.125em hsla(320, 100%, 90%, 0.5),\n      -0.25em -0.125em 0.125em hsla(40, 100%, 60%, 0.2),\n      0.25em 0.125em 0.125em hsla(200, 100%, 60%, 0.4);\n  }\n  70% {\n    color: hsl(230, 80%, 90%);\n    text-shadow:\n      0 0 1em hsla(320, 100%, 50%, 0.5),\n      0 0 0.125em hsla(320, 100%, 60%, 0.5),\n      0.5em -0.125em 0.25em hsla(40, 100%, 60%, 0.2),\n      -0.5em 0.125em 0.25em hsla(200, 100%, 60%, 0.4);\n  }\n  100% {\n    color: hsl(230, 40%, 80%);\n    text-shadow:\n      0 0 1em hsla(320, 100%, 50%, 0.2),\n      0 0 0.125em hsla(320, 100%, 60%, 0.3),\n      1em -0.125em 0.5em hsla(40, 100%, 60%, 0),\n      -1em 0.125em 0.5em hsla(200, 100%, 60%, 0);\n  }\n}\n\n.fx-025 .bl-wrap {\n  background: linear-gradient(135deg, hsl(230, 40%, 12%), hsl(230, 20%, 7%));\n}\n.fx-025 .city-nights-text {\n  margin: 0;\n  font-size: clamp(2rem, 6vw, 3.5rem);\n  font-weight: 300;\n  color: hsl(230, 100%, 95%);\n  animation: fx025-lights 5s 750ms linear infinite;\n  animation-delay: calc(750ms - var(--fx-t));\n  text-align: center;\n}\n",
  html: "<h2 class=\"city-nights-text\">{{LINE}}</h2>",
  timeBase: "line",
};
