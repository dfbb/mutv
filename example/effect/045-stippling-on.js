BL.register({
  id: '045',
  name: '045 Stippling on Text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 45,
  src: 'Stippling on Text · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@900&display=swap');

.bl-wrap {
  background: radial-gradient(#480d35, #17151d);
}

.stipple-text {
  position: relative;
  font-family: "Poppins", sans-serif;
  color: #f6d8d5;
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 900;
  text-align: center;
}

.stipple-text::before {
  content: attr(data-text);
  position: absolute;
  top: 0em;
  left: 0em;
  color: #313f97;
  z-index: -1;
  animation: stipple-shift-back 3s ease-in-out infinite alternate;
}

.stipple-text::after {
  content: attr(data-text);
  position: absolute;
  color: transparent;
  top: 0em;
  left: 0em;
  background-image: radial-gradient(circle, rgba(236, 34, 37, 0.5) 0.0125em, transparent 0.0125em);
  background-size: 8px 8px;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 1px #ec2225;
  animation: stipple-shift-after 3s ease-in-out infinite alternate;
}

@keyframes stipple-shift-back {
  0%   { top: 0em; left: 0em; }
  100% { top: 0.04em; left: 0.04em; }
}

@keyframes stipple-shift-after {
  0%   { top: 0em; left: 0em; }
  100% { top: -0.04em; left: -0.04em; }
}
`,
  html: `<h1 class="stipple-text" data-text="{{LINE}}">{{LINE}}</h1>`
});
