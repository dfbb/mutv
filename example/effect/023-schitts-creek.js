BL.register({
  id: '023',
  name: "023 Schitt's Creek CSS title animation",
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 23,
  src: "Schitt's Creek (CSS) title animation · CodePen",
  css: `
@import url("https://fonts.bunny.net/css?family=playfair-display:600");

@keyframes pop-word {
  to { transform: rotateX(0); }
}
@keyframes show {
  to { opacity: 1; }
}
@keyframes shimmer {
  to { text-shadow: 0 0 8px red; }
}

.bl-wrap {
  background-color: black;
}
.schitts-title {
  color: white;
  font-family: "Playfair Display", Vidaloka, serif;
  font-size: clamp(3rem, 8vw, 8rem);
  line-height: 0.85;
  perspective: 500px;
  margin: 0;
}
.word {
  display: block;
  animation: show 0.01s forwards, pop-word 1.5s forwards;
  animation-timing-function: cubic-bezier(0.14, 1.23, 0.33, 1.16);
  opacity: 0;
  transform: rotateX(120deg);
  transform-origin: 50% 100%;
}
.word:nth-of-type(2) {
  padding: 0 2rem;
  animation-delay: 1.5s;
  color: gold;
}
`,
  html: `<h1 class="schitts-title">
  <span class="word">{{LINE}}</span>
</h1>`
});
