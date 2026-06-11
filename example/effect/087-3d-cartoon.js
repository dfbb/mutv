BL.register({
  id: '087',
  name: '087 3D Cartoon Text w/CSS text-shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 87,
  src: '3D Cartoon Text w/CSS text-shadow · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap");

.bl-wrap {
  background-color: #fc3153;
  text-align: center;
}

.cartoon-3d {
  font-size: 10vmin;
  font-family: 'Luckiest Guy', cursive;
  color: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-shadow:
    0px -6px 0 #212121,
    0px -6px 0 #212121,
    0px  6px 0 #212121,
    0px  6px 0 #212121,
    -6px  0px 0 #212121,
    6px  0px 0 #212121,
    -6px  0px 0 #212121,
    6px  0px 0 #212121,
    -6px -6px 0 #212121,
    6px -6px 0 #212121,
    -6px  6px 0 #212121,
    6px  6px 0 #212121,
    -6px  18px 0 #212121,
    0px  18px 0 #212121,
    6px  18px 0 #212121,
    0 19px 1px rgba(0,0,0,.1),
    0 0 6px rgba(0,0,0,.1),
    0 6px 3px rgba(0,0,0,.3),
    0 12px 6px rgba(0,0,0,.2),
    0 18px 18px rgba(0,0,0,.25),
    0 24px 24px rgba(0,0,0,.2),
    0 36px 36px rgba(0,0,0,.15);
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色 (白色字体 + text-shadow 3D 卡通效果) */
:host .bl-wrap .cartoon-3d,
:host .bl-wrap .cartoon-3d .bl-char {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<h1 class="cartoon-3d">{{LETTERS}}</h1>`
});
