BL.register({
  id: '034',
  name: '034 Waaaves',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 34,
  src: 'Waaaves · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@699;700&display=swap");
:root {
  --lower: 100;
  --upper: 700;
}
.bl-wrap {
  background: #70c9db;
  position: relative;
  height: 100%;
}

h1.wave-layer {
  font-family: 'Roboto Mono', monospace;
  font-size: 7rem;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  white-space: nowrap;
  transform: translate(-50%, -50%) translate(calc(var(--x, 0) * 1%), calc(var(--y, 0) * 1%));
  font-variation-settings: 'wght' var(--lower);
  margin: 0;
}
h1.wave-layer .ch {
  -webkit-animation: rise 2.25s infinite ease-in-out;
          animation: rise 2.25s infinite ease-in-out;
  -webkit-animation-delay: calc((var(--i) - 3) * 0.225s);
          animation-delay: calc((var(--i) - 3) * 0.225s);
  display: inline-block;
  /* 按歌词时间逐字符出现:字符 i 在 reveal>i/n 即自身 start 时刻显示 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
h1.wave-layer:nth-child(1) .ch {
  color: hsla(180, 100%, 90%, 0.125);
}
h1.wave-layer:nth-child(2) .ch {
  color: hsla(180, 100%, 90%, 0.25);
}
h1.wave-layer:nth-child(3) .ch {
  color: hsla(180, 100%, 90%, 0.5);
}
@keyframes rise {
  50% {
    font-variation-settings: 'wght' var(--upper);
    color: hsla(180, 100%, 100%, 1);
    transform: translate(0, -15%);
  }
}
/* 修复黑屏:3 层 .wave-layer 全为 position:absolute,引擎 .bl-wrap{width:max-content}
   坍缩为 0,按宽度的 reveal 遮罩宽 0 全遮 → 黑屏。给容器明确宽高并去遮罩。 */
:host .bl-wrap {
  width: 90vw !important;
  max-width: 90vw !important;
  height: 100% !important;
  -webkit-mask-image: none !important;
          mask-image: none !important;
}
/* 还原 waaaves 分层景深:让填充跟随各层 color(否则被主题 fill:green 压成不透明,
   三层重叠杂乱)。后层半透明、前层实色;rise 动画的 color 提亮仍生效。 */
:host .wave-layer:nth-child(1) .ch { color: rgba(0, 230, 118, 0.18) !important; }
:host .wave-layer:nth-child(2) .ch { color: rgba(0, 230, 118, 0.4) !important; }
:host .wave-layer:nth-child(3) .ch { color: rgba(0, 230, 118, 1) !important; }
:host .wave-layer .ch { -webkit-text-fill-color: currentColor !important; }`,
  html: `<h1 class="wave-layer" style="--x: 6; --y: -6;">{{LETTERS}}</h1>
<h1 class="wave-layer" style="--x: 3; --y: -3;">{{LETTERS}}</h1>
<h1 class="wave-layer">{{LETTERS}}</h1>`,
  letterTpl: `<span class="ch" style="--i:{i};--n:{n}">{ch}</span>`
});
