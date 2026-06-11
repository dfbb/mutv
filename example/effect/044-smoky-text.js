BL.register({
  id: '044',
  name: '044 Smoky Text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 44,
  src: 'Smoky Text · CodePen',
  css: `
@import url(https://fonts.googleapis.com/css?family=Finger+Paint);

.bl-wrap {
  background: black;
  font-family: "Finger Paint", cursive;
  font-size: 5vw;
  text-align: center;
  color: transparent;
}

.smoky-text .ch {
  display: inline-block;
  text-shadow: 0 0 0 whitesmoke;
  animation: smoky-letter 5s calc(var(--i) * 0.1s) infinite both;
}

.smoky-text .ch:nth-child(even) {
  animation-name: smoky-letter-mirror;
}

@keyframes smoky-letter {
  60% {
    text-shadow: 0 0 40px whitesmoke;
  }
  to {
    transform: translate3d(15rem, -8rem, 0) rotate(-40deg) skewX(70deg) scale(1.5);
    text-shadow: 0 0 20px whitesmoke;
    opacity: 0;
  }
}

@keyframes smoky-letter-mirror {
  60% {
    text-shadow: 0 0 40px whitesmoke;
  }
  to {
    transform: translate3d(18rem, -8rem, 0) rotate(-40deg) skewX(-70deg) scale(2);
    text-shadow: 0 0 20px whitesmoke;
    opacity: 0;
  }
}
`,
  html: `<div class="smoky-text">{{LETTERS}}</div>`,
  letterTpl: `<span class="ch" style="--i:{i};--n:{n}">{ch}</span>`
});
