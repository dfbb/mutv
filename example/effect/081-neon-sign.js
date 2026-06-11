BL.register({
  id: '081',
  name: '081 Neon sign',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 81,
  src: 'Neon sign · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Nixie+One");
@import url("https://fonts.googleapis.com/css?family=League+Script");

.bl-wrap {
  background: #313131;
}

.neon-blue {
  text-align: center;
  color: #ebffff;
  font-family: 'Nixie One', Helvetica, Arial, sans-serif;
  font-size: 50px;
  text-shadow: 2px 2px 1px rgba(0,0,0,0.3), 0 0px 15px #fff, 0 0 10px #38eeff, 0 0 50px #38eeff;
  animation: fade256 3s infinite alternate;
}

@keyframes fade256 {
  40% { opacity: 0.8; }
  42% { opacity: 0.1; }
  43% { opacity: 0.8; }
  45% { opacity: 0.1; }
  46% { opacity: 0.8; }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复霓虹白蓝原色 */
:host .bl-wrap .neon-blue,
:host .bl-wrap .neon-blue .bl-char {
  color: #ebffff !important;
  -webkit-text-fill-color: #ebffff !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<div class="neon-blue">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
