BL.register({
  id: '088',
  name: '088 Animated Text-Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 88,
  src: 'Animated Text-Shadow · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Raleway:400,700,900,400italic,700italic,900italic);

.bl-wrap {
  background-color: #fdf9fd;
  color: #011a32;
  font: 16px/1.25 'Raleway', sans-serif;
  text-align: center;
}

.animated-shadow {
  animation: text-shadow 1.5s ease-in-out infinite;
  font-size: 4vmin;
  font-weight: 900;
  line-height: 1;
}

.animated-shadow:hover {
  animation-play-state: paused;
}

@keyframes text-shadow {
  0% {
    transform: translateY(0);
    text-shadow:
      0 0 0 #0c2ffb,
      0 0 0 #2cfcfd,
      0 0 0 #fb203b,
      0 0 0 #fefc4b;
  }
  20% {
    transform: translateY(-1em);
    text-shadow:
      0 0.125em 0 #0c2ffb,
      0 0.25em 0 #2cfcfd,
      0 -0.125em 0 #fb203b,
      0 -0.25em 0 #fefc4b;
  }
  40% {
    transform: translateY(0.5em);
    text-shadow:
      0 -0.0625em 0 #0c2ffb,
      0 -0.125em 0 #2cfcfd,
      0 0.0625em 0 #fb203b,
      0 0.125em 0 #fefc4b;
  }
  60% {
    transform: translateY(-0.25em);
    text-shadow:
      0 0.03125em 0 #0c2ffb,
      0 0.0625em 0 #2cfcfd,
      0 -0.03125em 0 #fb203b,
      0 -0.0625em 0 #fefc4b;
  }
  80% {
    transform: translateY(0);
    text-shadow:
      0 0 0 #0c2ffb,
      0 0 0 #2cfcfd,
      0 0 0 #fb203b,
      0 0 0 #fefc4b;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated-shadow {
    animation: none !important;
    transition: none !important;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始文字颜色(彩色阴影未被覆盖,自然显示) */
:host .bl-wrap .animated-shadow,
:host .bl-wrap .animated-shadow .bl-char {
  color: #011a32 !important;
  -webkit-text-fill-color: #011a32 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<h1 class="animated-shadow">{{LETTERS}}</h1>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
