BL.register({
  id:'067',
  name:'067 Skewed and Rotated Text',
  kind:'visual',
  group:'Visual 数据集特效',
  order:67,
  src:'Skewed and Rotated Text · CodePen',
  css:`@import url("https://fonts.googleapis.com/css?family=Sarpanch:900");

.bl-wrap {
  background-image: radial-gradient(circle, #333333, #222222);
}

h1 {
  transform: skew(-12deg) rotate(-12deg);
  font-family: "Sarpanch", sans-serif;
  font-size: 20vmin;
  margin: 0;
  padding: 30px;
  color: #1d9099;
  text-shadow: 1vmin 1vmin 0 #E79C10, -1vmin -1vmin 0 #D53A33;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色 */
:host .bl-wrap h1, :host .bl-wrap h1 .bl-char {
  color: #1d9099 !important;
  -webkit-text-fill-color: #1d9099 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}`,
  html:`<h1>{{LETTERS}}</h1>`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
