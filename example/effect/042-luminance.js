BL.register({
  id: '042',
  name: '042 Luminance',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 42,
  src: 'Luminance · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");
.bl-wrap {
  background: #333641;
  overflow: hidden;
}
.bl-luminance {
  background: 50% 100%/50% 50% no-repeat radial-gradient(ellipse at bottom, #fff, transparent, transparent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 10vw;
  font-family: "Source Sans Pro", sans-serif;
  animation: bl-reveal 3000ms ease-in-out forwards 200ms, bl-glow 2500ms linear infinite 2000ms;
  text-transform: uppercase;
  letter-spacing: 4px;
}
@keyframes bl-reveal {
  80% { letter-spacing: 8px; }
  100% { background-size: 300% 300%; }
}
@keyframes bl-glow {
  40% { text-shadow: 0 0 8px #fff; }
}
`,
  html: `<div class="bl-luminance">{{LINE}}</div>`
});
