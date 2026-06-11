BL.register({
  id: '031',
  name: '031 Cool Text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 31,
  src: 'Cool Text · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap");
.bl-wrap {
  font-family: "Archivo Black", sans-serif;
  background: #f4d03f;
}

.words {
  color: #f4d03f;
  font-size: 0;
  line-height: 1.5;
}

.words .ch {
  font-size: 5rem;
  display: inline-block;
  animation: move 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.5s);
}

@keyframes move {
  0% {
    transform: translate(-30%, 0);
  }
  50% {
    text-shadow: 0 25px 50px rgba(0, 0, 0, 0.75);
  }
  100% {
    transform: translate(30%, 0);
  }
}`,
  html: `<div class="words">{{LETTERS}}</div>`,
  letterTpl: `<span class="ch" style="--i:{i};--n:{n}">{ch}</span>`
});
