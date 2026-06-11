// 059 CSS Sticker · CSS Sticker · CodePen，源 example/effect/059-css-sticker.js，本文件由 convert-effects.mjs 生成
import type {VisualEffect} from '../../types';

export const effect: VisualEffect = {
  id: "059",
  name: "059 CSS Sticker",
  src: "CSS Sticker · CodePen",
  css: ".fx-059 .bl-wrap {\n  background-color: #d1dbe8;\n  line-height: 1;\n}\n\n.fx-059 .sticker {\n  --c1: #ef548f;\n  --c2: #ef8b6d;\n  --c3: #cfef6b;\n  --c4: #3bf0c1;\n  --c5: #bb4af0;\n  --shine-angle: 15deg;\n  display: inline-grid;\n  grid-template-areas: \"text\";\n  place-items: center;\n  font-weight: 900;\n  font-style: italic;\n  font-size: clamp(3rem, 12vw, 8rem);\n  text-transform: uppercase;\n  color: var(--c5);\n}\n\n.fx-059 .sticker span {\n  background: linear-gradient(var(--shine-angle), rgba(255, 0, 0, 0) 0%, rgba(255, 0, 0, 0) 35%, rgba(255, 255, 255, 0.98) 49.95%, rgba(255, 255, 255, 0.98) 50.15%, rgba(255, 0, 0, 0) 65%, rgba(255, 0, 0, 0)), linear-gradient(to right, var(--c1), var(--c2), var(--c3), var(--c4), var(--c5));\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n  -webkit-text-stroke: 0.01em rgba(0, 0, 0, 0.6);\n}\n\n.fx-059 .sticker > *,.fx-059  .sticker::before,.fx-059  .sticker::after {\n  grid-area: text;\n}\n\n.fx-059 .sticker::before,.fx-059  .sticker::after {\n  content: attr(data-text);\n  color: #fff;\n}\n\n.fx-059 .sticker::before {\n  -webkit-text-stroke: 0.21em white;\n  background: no-repeat linear-gradient(white, white) 15% 50%/85% 60%;\n}\n\n.fx-059 .sticker::after {\n  text-shadow: 0.07em 0.08em 0.05em rgba(0, 0, 0, 0.75), -0.07em -0.05em 0.05em rgba(0, 0, 0, 0.75);\n  z-index: -2;\n}\n/* 整张贴纸(内层 span 彩虹 + ::before 白描边 + ::after 阴影)按 --reveal 裁切(CJK 等宽 => 逐字步进露出) */\n.fx-059 .bl-wrap .sticker {\n  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);\n}\n/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字裁切 */\n.fx-059 .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }",
  html: "<span class=\"sticker\" data-text=\"{{LINE}}\"><span>{{LINE}}</span></span>",
  timeBase: "line",
};
