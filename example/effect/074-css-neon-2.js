BL.register({
  id: '074',
  name: '074 neon lights affect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 74,
  src: 'neon lights affect · CodePen',
  css: `
@font-face {
  font-family: neon;
  src: url(https://dl.dropbox.com/s/df4zz9y6lmhocr9/England.otf?dl=0)
}

.bl-wrap {
  background: black;
  --lights: rgb(91, 235, 115);
}

#neon {
  position: relative;
  text-align: center;
  font-size: 20vh;
  font-family: neon;
  color: white;
  text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
  animation: flicker240 7s infinite;
  filter: brightness(1);
}

@keyframes flicker240 {
  9% {
    text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
    filter: brightness(1);
  }
  10% {
    text-shadow: none;
    filter: brightness(.4);
  }
  11% {
    text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
    filter: brightness(1);
  }
  12% {
    text-shadow: none;
    filter: brightness(.4);
  }
  13% {
    text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
    filter: brightness(1);
  }
  66% {
    text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
    filter: brightness(1);
  }
  67% {
    text-shadow: none;
    filter: brightness(.4);
  }
  75% {
    text-shadow: none;
    filter: brightness(.4);
  }
  76% {
    text-shadow: 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 .5vh var(--lights), 0 0 1vh var(--lights);
    filter: brightness(1);
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复真实颜色: 白色字体 + 绿色霓虹光晕(text-shadow 未被覆盖) */
:host .bl-wrap #neon,
:host .bl-wrap #neon .bl-char {
  color: white !important;
  -webkit-text-fill-color: white !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<div id="neon">{{LETTERS}}</div>`
});
