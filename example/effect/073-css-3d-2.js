BL.register({
  id:'073',
  name:'073 CSS3D',
  kind:'visual',
  group:'Visual 数据集特效',
  order:73,
  src:'CSS3D · CodePen',
  css:`.bl-wrap {
  background: #f5f5f5;
}

#wrapper {
  text-align: center;
  color: #000;
  font-weight: bold;
  font-size: 10em;
  padding: 50px 0;
}

#title span {
  text-shadow: -0.06em 0 red, 0.06em 0 cyan;
  letter-spacing: 0.08em;
  vertical-align: middle;
  line-height: 1.5em;
  transition: font-size 2s cubic-bezier(0, 1, 0, 1);
}

#title span:hover {
  font-size: 1.5em;
  line-height: 1em;
  transition: font-size .2s cubic-bezier(0, 0.75, 0, 1);
}

#title span:active {
  font-size: 1em;
  text-shadow: none;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 改为绿色字体 + 红/青错位阴影(阴影未被覆盖,自动保留) */
:host .bl-wrap #title,
:host .bl-wrap #title .bl-char {
  color: #00e676 !important;
  -webkit-text-fill-color: #00e676 !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }`,
  html:`<div id="wrapper"><p id="title">{{LETTERS}}</p></div>`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
