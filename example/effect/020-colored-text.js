BL.register({
  id: '020',
  name: '020 Colored text with CSS masks (animated)',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 20,
  src: 'Colored text with CSS masks (animated) · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap");

.bl-wrap {
  background: #000;
  font-size: clamp(40px, 12vw, 150px);
}
.demo {
  --stripe-step: .75vmax;
  --stripe-offset: calc(var(--stripe-step) * .7);
  --stripe-offset-neg: calc(var(--stripe-offset) * -1);
  --delay: 2.5s;
  --duration: calc(var(--delay) * 3);
  position: relative;
  width: 100%;
  height: 1em;
  font-family: "Fredoka One", cursive;
  line-height: 1;
  text-align: center;
}
.demo__text,
.demo::before,
.demo::after {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  mask-image: repeating-linear-gradient(-45deg, black 0, black var(--stripe-step), transparent 0, transparent calc(var(--stripe-step) * 3));
  -webkit-mask-image: repeating-linear-gradient(-45deg, black 0, black var(--stripe-step), transparent 0, transparent calc(var(--stripe-step) * 3));
  mask-position: 0 0;
  -webkit-mask-position: 0 0;
  mask-size: 120% 120%;
  -webkit-mask-size: 120% 120%;
  animation: mask-move var(--duration) ease-out infinite;
}
.demo__text {
  color: gold;
}
.demo::before,
.demo::after {
  content: attr(data-text);
}
.demo::before {
  left: var(--stripe-offset);
  bottom: var(--stripe-offset);
  mask-position: var(--stripe-offset) var(--stripe-offset);
  -webkit-mask-position: var(--stripe-offset) var(--stripe-offset);
  animation-delay: calc(var(--delay) * -1);
  color: tomato;
}
.demo::after {
  left: var(--stripe-offset-neg);
  bottom: var(--stripe-offset-neg);
  mask-position: var(--stripe-offset-neg) var(--stripe-offset-neg);
  -webkit-mask-position: var(--stripe-offset-neg) var(--stripe-offset-neg);
  animation-delay: calc(var(--delay) * -2);
  color: turquoise;
}
@keyframes mask-move {
  0%   { mask-position: 0 0; -webkit-mask-position: 0 0; }
  33%  { mask-position: var(--stripe-offset) var(--stripe-offset); -webkit-mask-position: var(--stripe-offset) var(--stripe-offset); }
  66%  { mask-position: var(--stripe-offset-neg) var(--stripe-offset-neg); -webkit-mask-position: var(--stripe-offset-neg) var(--stripe-offset-neg); }
  100% { mask-position: 0 0; -webkit-mask-position: 0 0; }
}
/* 修复完全被遮挡:引擎将 .bl-wrap 设为 width:max-content,而本特效内容(.demo__text 与
   ::before/::after)全是 position:absolute,宽度坍缩为 0,条纹 mask(mask-size:120% of 0)
   把内容全部遮掉。给容器明确宽度。 */
:host .bl-wrap { width: 90vw !important; max-width: 90vw !important; }
/* 恢复三层多色(彩字效果):覆盖顶层主题强制的绿色填充。必须同时覆盖 -webkit-text-fill-color
   (其优先级高于 color);伪元素还会继承 .demo 的绿色填充,故每层都显式指定。 */
:host .demo__text { color: gold !important; -webkit-text-fill-color: gold !important; }
:host .demo::before { color: tomato !important; -webkit-text-fill-color: tomato !important; }
:host .demo::after { color: turquoise !important; -webkit-text-fill-color: turquoise !important; }
/* 去掉三层的物理位移(重影),三层叠放在同一位置;颜色仍靠 mask 条纹错位交错填满字形,
   这样字形完整不再错位重影。 */
:host .demo::before,
:host .demo::after { left: 0 !important; bottom: 0 !important; }
`,
  html: `<div class="demo" data-text="{{LINE}}">
  <div class="demo__text">{{LINE}}</div>
</div>`
});
