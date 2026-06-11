BL.register({
  id: '025',
  name: '025 City Nights Text Effect',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 25,
  src: 'City Nights Text Effect · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Raleway:wght@300&display=swap");

@keyframes lights {
  0% {
    color: hsl(230, 40%, 80%);
    text-shadow:
      0 0 1em hsla(320, 100%, 50%, 0.2),
      0 0 0.125em hsla(320, 100%, 60%, 0.3),
      -1em -0.125em 0.5em hsla(40, 100%, 60%, 0),
      1em 0.125em 0.5em hsla(200, 100%, 60%, 0);
  }
  30% {
    color: hsl(230, 80%, 90%);
    text-shadow:
      0 0 1em hsla(320, 100%, 50%, 0.5),
      0 0 0.125em hsla(320, 100%, 60%, 0.5),
      -0.5em -0.125em 0.25em hsla(40, 100%, 60%, 0.2),
      0.5em 0.125em 0.25em hsla(200, 100%, 60%, 0.4);
  }
  40% {
    color: hsl(230, 100%, 95%);
    text-shadow:
      0 0 1em hsla(320, 100%, 50%, 0.5),
      0 0 0.125em hsla(320, 100%, 90%, 0.5),
      -0.25em -0.125em 0.125em hsla(40, 100%, 60%, 0.2),
      0.25em 0.125em 0.125em hsla(200, 100%, 60%, 0.4);
  }
  70% {
    color: hsl(230, 80%, 90%);
    text-shadow:
      0 0 1em hsla(320, 100%, 50%, 0.5),
      0 0 0.125em hsla(320, 100%, 60%, 0.5),
      0.5em -0.125em 0.25em hsla(40, 100%, 60%, 0.2),
      -0.5em 0.125em 0.25em hsla(200, 100%, 60%, 0.4);
  }
  100% {
    color: hsl(230, 40%, 80%);
    text-shadow:
      0 0 1em hsla(320, 100%, 50%, 0.2),
      0 0 0.125em hsla(320, 100%, 60%, 0.3),
      1em -0.125em 0.5em hsla(40, 100%, 60%, 0),
      -1em 0.125em 0.5em hsla(200, 100%, 60%, 0);
  }
}

.bl-wrap {
  background: linear-gradient(135deg, hsl(230, 40%, 12%), hsl(230, 20%, 7%));
}
.city-nights-text {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 300;
  font-family: Raleway, sans-serif;
  color: hsl(230, 100%, 95%);
  animation: lights 5s 750ms linear infinite;
  text-align: center;
}
`,
  html: `<h2 class="city-nights-text">{{LINE}}</h2>`
});
