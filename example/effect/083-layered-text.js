BL.register({
  id: '083',
  name: '083 Layered text-shadow effect CSS',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 83,
  src: 'Layered text-shadow effect CSS · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Niconne&display=swap');

.bl-wrap {
  background: #d52e3f;
}

.layered-text {
  font-size: 8rem;
  text-align: center;
  color: #fcedd8;
  font-family: 'Niconne', cursive;
  font-weight: 700;
  text-shadow:
    5px 5px 0px #eb452b,
    10px 10px 0px #efa032,
    15px 15px 0px #46b59b,
    20px 20px 0px #017e7f,
    25px 25px 0px #052939,
    30px 30px 0px #c11a2b,
    35px 35px 0px #c11a2b,
    40px 40px 0px #c11a2b,
    45px 45px 0px #c11a2b;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色 */
:host .bl-wrap .layered-text,
:host .bl-wrap .layered-text .bl-char {
  color: #fcedd8 !important;
  -webkit-text-fill-color: #fcedd8 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  html: `<div class="layered-text">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
