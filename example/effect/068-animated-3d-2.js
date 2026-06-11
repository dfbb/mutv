BL.register({
  id:'068',
  name:'068 Only CSS: Text Wave',
  kind:'visual',
  group:'Visual 数据集特效',
  order:68,
  src:'Only CSS: Text Wave · CodePen',
  css:`@import url('https://fonts.googleapis.com/css?family=Anton');

.bl-wrap {
  background: #0a1428;
  perspective: 500px;
}

div {
  will-change: transform;
}

#ui {
  transform-style: preserve-3d;
}
#ui .text {
  position: absolute;
  font-size: 15rem;
  color: #fff;
  line-height: 15rem;
  font-family: "Anton", sans-serif;
  padding: 20px 0;
  mix-blend-mode: screen;
  transform-style: preserve-3d;
}
#ui .text:nth-child(1) {
  clip-path: polygon(-30% 0, -20% 0, 20% 100%, 0% 100%);
  animation: wave 2000ms -10000ms ease-in-out infinite alternate;
}
#ui .text:nth-child(2) {
  clip-path: polygon(-25% 0, -15% 0, 25% 100%, 5% 100%);
  animation: wave 2000ms -9800ms ease-in-out infinite alternate;
}
#ui .text:nth-child(3) {
  clip-path: polygon(-20% 0, -10% 0, 30% 100%, 10% 100%);
  animation: wave 2000ms -9600ms ease-in-out infinite alternate;
}
#ui .text:nth-child(4) {
  clip-path: polygon(-15% 0, -5% 0, 35% 100%, 15% 100%);
  animation: wave 2000ms -9400ms ease-in-out infinite alternate;
}
#ui .text:nth-child(5) {
  clip-path: polygon(-10% 0, 0% 0, 40% 100%, 20% 100%);
  animation: wave 2000ms -9200ms ease-in-out infinite alternate;
}
#ui .text:nth-child(6) {
  clip-path: polygon(-5% 0, 5% 0, 45% 100%, 25% 100%);
  animation: wave 2000ms -9000ms ease-in-out infinite alternate;
}
#ui .text:nth-child(7) {
  clip-path: polygon(0% 0, 10% 0, 50% 100%, 30% 100%);
  animation: wave 2000ms -8800ms ease-in-out infinite alternate;
}
#ui .text:nth-child(8) {
  clip-path: polygon(5% 0, 15% 0, 55% 100%, 35% 100%);
  animation: wave 2000ms -8600ms ease-in-out infinite alternate;
}
#ui .text:nth-child(9) {
  clip-path: polygon(10% 0, 20% 0, 60% 100%, 40% 100%);
  animation: wave 2000ms -8400ms ease-in-out infinite alternate;
}
#ui .text:nth-child(10) {
  clip-path: polygon(15% 0, 25% 0, 65% 100%, 45% 100%);
  animation: wave 2000ms -8200ms ease-in-out infinite alternate;
}
#ui .text:nth-child(11) {
  clip-path: polygon(20% 0, 30% 0, 70% 100%, 50% 100%);
  animation: wave 2000ms -8000ms ease-in-out infinite alternate;
}
#ui .text:nth-child(12) {
  clip-path: polygon(25% 0, 35% 0, 75% 100%, 55% 100%);
  animation: wave 2000ms -7800ms ease-in-out infinite alternate;
}
#ui .text:nth-child(13) {
  clip-path: polygon(30% 0, 40% 0, 80% 100%, 60% 100%);
  animation: wave 2000ms -7600ms ease-in-out infinite alternate;
}
#ui .text:nth-child(14) {
  clip-path: polygon(35% 0, 45% 0, 85% 100%, 65% 100%);
  animation: wave 2000ms -7400ms ease-in-out infinite alternate;
}
#ui .text:nth-child(15) {
  clip-path: polygon(40% 0, 50% 0, 90% 100%, 70% 100%);
  animation: wave 2000ms -7200ms ease-in-out infinite alternate;
}
#ui .text:nth-child(16) {
  clip-path: polygon(45% 0, 55% 0, 95% 100%, 75% 100%);
  animation: wave 2000ms -7000ms ease-in-out infinite alternate;
}
#ui .text:nth-child(17) {
  clip-path: polygon(50% 0, 60% 0, 100% 100%, 80% 100%);
  animation: wave 2000ms -6800ms ease-in-out infinite alternate;
}
#ui .text:nth-child(18) {
  clip-path: polygon(55% 0, 65% 0, 105% 100%, 85% 100%);
  animation: wave 2000ms -6600ms ease-in-out infinite alternate;
}
#ui .text:nth-child(19) {
  clip-path: polygon(60% 0, 70% 0, 110% 100%, 90% 100%);
  animation: wave 2000ms -6400ms ease-in-out infinite alternate;
}
#ui .text:nth-child(20) {
  clip-path: polygon(65% 0, 75% 0, 115% 100%, 95% 100%);
  animation: wave 2000ms -6200ms ease-in-out infinite alternate;
}
#ui .text:nth-child(21) {
  clip-path: polygon(70% 0, 80% 0, 120% 100%, 100% 100%);
  animation: wave 2000ms -6000ms ease-in-out infinite alternate;
}
#ui .text:nth-child(22) {
  clip-path: polygon(75% 0, 85% 0, 125% 100%, 105% 100%);
  animation: wave 2000ms -5800ms ease-in-out infinite alternate;
}
#ui .text:nth-child(23) {
  clip-path: polygon(80% 0, 90% 0, 130% 100%, 110% 100%);
  animation: wave 2000ms -5600ms ease-in-out infinite alternate;
}
#ui .text:nth-child(24) {
  clip-path: polygon(85% 0, 95% 0, 135% 100%, 115% 100%);
  animation: wave 2000ms -5400ms ease-in-out infinite alternate;
}
#ui .text:nth-child(25) {
  clip-path: polygon(90% 0, 100% 0, 140% 100%, 120% 100%);
  animation: wave 2000ms -5200ms ease-in-out infinite alternate;
}
#ui .text:nth-child(26) {
  clip-path: polygon(95% 0, 105% 0, 145% 100%, 125% 100%);
  animation: wave 2000ms -5000ms ease-in-out infinite alternate;
}

@keyframes wave {
  0% {
    transform: translate(-50%, -50%) scale(0.9) rotateX(20deg) rotateY(20deg) rotateZ(0deg);
    color: #001e64;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.1) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    color: #32e6ff;
  }
}

/* 防止 absolute 层导致 .bl-wrap 宽度塌缩成 0(黑屏) */
:host .bl-wrap { width: 90vw !important; max-width: 90vw !important; height: 60vh !important; position: relative !important; }
:host .bl-wrap #ui { position: absolute !important; left: 50%; top: 50%; }
:host .bl-wrap #ui .text { left: 0; top: 0; }

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色:原效果为蓝->青渐变动画(mix-blend-mode:screen),取亮端青色 #32e6ff */
:host .bl-wrap #ui .text { color: #32e6ff !important; -webkit-text-fill-color: #32e6ff !important; }

/* 逐字露出:每层文字内逐字符透明度控制(保留各层 wave clip-path 不冲突) */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }`,
  html:`<div id="ui">
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
  <div class="text">{{LETTERS}}</div>
</div>`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
