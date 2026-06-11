BL.register({
  id: '029',
  name: '029 Text Animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 29,
  src: 'Text Animation · CodePen',
  css: `@font-face {
  src: url("https://www.axis-praxis.org/fonts/webfonts/AvenirNext_Variable.woff2") format("woff2");
  font-family: "Avenir";
  font-style: normal;
  font-weight: normal;
}
.bl-wrap {
  background-color: black;
  color: transparent;
  font-family: "Avenir";
}

.text {
  font-variation-settings: "wght" 400, "wdth" 100;
  font-size: 10em;
  text-align: center;
  position: absolute;
  animation: text-flow 6s infinite;
}

.text:nth-child(1) {
  animation-delay: 0.25s;
  opacity: 0.9;
  -webkit-text-stroke: 3px #ffb3c0;
  z-index: 0;
}

.text:nth-child(2) {
  animation-delay: 0.5s;
  opacity: 0.8;
  -webkit-text-stroke: 3px #ffa7b6;
  z-index: -1;
}

.text:nth-child(3) {
  animation-delay: 0.75s;
  opacity: 0.7;
  -webkit-text-stroke: 3px #ff9aab;
  z-index: -2;
}

.text:nth-child(4) {
  animation-delay: 1s;
  opacity: 0.6;
  -webkit-text-stroke: 3px #ff8da1;
  z-index: -3;
}

.text:nth-child(5) {
  animation-delay: 1.25s;
  opacity: 0.5;
  -webkit-text-stroke: 3px #ff8096;
  z-index: -4;
}

.text:nth-child(6) {
  animation-delay: 1.5s;
  opacity: 0.4;
  -webkit-text-stroke: 3px #ff748c;
  z-index: -5;
}

.text:nth-child(7) {
  animation-delay: 1.75s;
  opacity: 0.3;
  -webkit-text-stroke: 3px #ff6781;
  z-index: -6;
}

.text:nth-child(8) {
  animation-delay: 2s;
  opacity: 0.2;
  -webkit-text-stroke: 3px #ff5a77;
  z-index: -7;
}

.text:nth-child(9) {
  animation-delay: 2.25s;
  opacity: 0.1;
  -webkit-text-stroke: 3px #ff4d6c;
  z-index: -8;
}

@keyframes text-flow {
  25% {
    font-variation-settings: "wght" 900, "wdth" 100;
    filter: hue-rotate(0deg);
  }
  50% {
    transform: translateY(-100px);
    font-variation-settings: "wght" 400, "wdth" 100;
  }
  75% {
    transform: translateY(0%);
    font-variation-settings: "wght" 900, "wdth" 100;
    filter: hue-rotate(90deg);
  }
}
/* 修复黑屏:9 层 .text 全为 position:absolute,引擎 .bl-wrap{width:max-content}
   坍缩为 0,导致按宽度的 reveal 遮罩宽 0 全遮 → 黑屏。给容器明确宽度并去遮罩。 */
:host .bl-wrap {
  position: relative;
  width: 90vw !important;
  max-width: 90vw !important;
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
:host .text { left: 0; right: 0; }
/* 保留"描边回声"本貌:透明填充只留各层彩色描边(盖过 VISUAL_OVERRIDE 的 fill:green) */
:host .text, :host .text * {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
}
/* 按歌词时间逐字符出现(与各层回声透明度相乘);所有 9 层同一 --i/--n 同步揭示 */
.tl {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}`,
  html: `<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>
<div class="text">{{LETTERS}}</div>`,
  letterTpl: `<span class="tl" style="--i:{i}; --n:{n}">{ch}</span>`
});
