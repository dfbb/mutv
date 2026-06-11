BL.register({
  id: '021',
  name: '021 letter spacing animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 21,
  src: 'letter spacing animation · CodePen',
  css: `
.bl-wrap {
  background: #000;
  color: #fff;
  font-family: Helvetica, sans-serif;
  overflow-x: hidden;
}
.ls-line {
  width: 100%;
  text-align: center;
  animation: lsexpand 2.4s infinite ease-in-out;
  letter-spacing: 10px;
  white-space: nowrap;
  font-size: clamp(1rem, 3vw, 2.5rem);
  text-indent: 10px;
  animation-delay: calc(var(--i) * 0.1s);
}
@keyframes lsexpand {
  0%   { letter-spacing: 10px; text-indent: 10px; }
  40%  { letter-spacing: 50px; text-indent: 50px; }
  80%  { letter-spacing: 10px; text-indent: 10px; }
  100% { letter-spacing: 10px; text-indent: 10px; }
}
`,
  html: `<div class="ls-line" style="--i:0">{{LINE}}</div>
<div class="ls-line" style="--i:1">{{LINE}}</div>
<div class="ls-line" style="--i:2">{{LINE}}</div>
<div class="ls-line" style="--i:3">{{LINE}}</div>
<div class="ls-line" style="--i:4">{{LINE}}</div>
<div class="ls-line" style="--i:5">{{LINE}}</div>`
});
