BL.register({
  id: '080',
  name: '080 Neon Flux',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 80,
  src: 'Neon Flux · CodePen',
  css: `
@font-face {
  font-family: neon254;
  src: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/707108/neon.ttf);
}

.bl-wrap {
  background-color: black;
}

.neon-flux {
  font-family: neon254;
  color: #FB4264;
  font-size: 9vw;
  line-height: 9vw;
  text-shadow: 0 0 3vw #F40A35;
  animation: neon254 1s ease infinite;
}

@keyframes neon254 {
  0%, 100% {
    text-shadow: 0 0 1vw #FA1C16, 0 0 3vw #FA1C16, 0 0 10vw #FA1C16, 0 0 10vw #FA1C16,
      0 0 .4vw #FED128, .5vw .5vw .1vw #806914;
    color: #FED128;
  }
  50% {
    text-shadow: 0 0 .5vw #800E0B, 0 0 1.5vw #800E0B, 0 0 5vw #800E0B, 0 0 5vw #800E0B,
      0 0 .2vw #800E0B, .5vw .5vw .1vw #40340A;
    color: #806914;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色 */
:host .bl-wrap .neon-flux,
:host .bl-wrap .neon-flux .bl-char {
  color: #FB4264 !important;
  -webkit-text-fill-color: #FB4264 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<div class="neon-flux">{{LETTERS}}</div>`
});
