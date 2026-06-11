// 075 Check Me Out Glow Text · Check Me Out Glow Text · CodePen，源 example/effect/075-check-me.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "075",
  name: "075 Check Me Out Glow Text",
  src: "Check Me Out Glow Text · CodePen",
  css: "\n@keyframes fx075-bounce243 {\n  0%, 20%, 50%, 80%, to {\n    transform: translateZ(-2px) translateY(5px);\n  }\n  40% {\n    transform: rotateY(180deg) translateZ(-2px) translateY(-35px);\n  }\n  60% {\n    transform: translateZ(-2px) translateY(-25px);\n  }\n}\n\n.fx-075 .bl-wrap {\n  background: radial-gradient(circle at center, #1a1546, #040411 40%);\n  perspective: 1000px;\n}\n\n.fx-075 .glow-text {\n  font-size: 3.5rem;\n  line-height: 1.2;\n  transform: rotateX(0) rotateY(-25deg);\n  text-transform: uppercase;\n  text-align: center;\n  color: #fff;\n  margin: 3rem auto;\n  position: relative;\n  padding: 2rem 0;\n  text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #228dff, 0 0 35px #228dff, 0 0 40px #228dff;\n}\n\n/* 取消引擎遮罩,改用逐字露出 */\n.fx-075 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }\n\n/* 恢复白色字 + 蓝色辉光 */\n.fx-075 .bl-wrap .glow-text,.fx-075 .bl-wrap .glow-text .bl-char {\n  color: #fff !important;\n  -webkit-text-fill-color: #fff !important;\n}\n\n/* 逐字露出 */\n.fx-075 .bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }\n",
  html: "<div class=\"glow-text\">{{LETTERS}}</div>",
  letterTpl: "<span class=\"bl-char\" style=\"--i:{i};--n:{n}\">{ch}</span>",
  timeBase: "line",
};
