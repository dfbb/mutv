BL.register({
  id: '040',
  name: '040 Multi-line spanning animated underline.',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 40,
  src: 'Multi-line spanning animated underline. · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css?family=Gochi+Hand');
.bl-wrap {
  background-color: #ffb7b0;
  color: hsl(198, 1%, 29%);
  font-family: 'Gochi Hand', cursive;
  font-size: 130%;
}
h2.bl-underline-anim {
  line-height: 1.5;
  display: inline;
  background-image: linear-gradient(
    transparent 50%,
    #e1fffe 50%,
    #b0f8ff 85%,
    transparent 85%,
    transparent 100%
  );
  background-repeat: no-repeat;
  background-size: 0% 100%;
  animation: bl-animatedBackground 2s cubic-bezier(0.645, 0.045, 0.355, 1) 0.5s forwards;
}
@keyframes bl-animatedBackground {
  to { background-size: 100% 100%; }
}
`,
  html: `<h2 class="bl-underline-anim">{{LINE}}</h2>`
});
