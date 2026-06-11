BL.register({
  id: '062',
  name: '062 Background clipping covfefe',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 62,
  src: 'Background clipping covfefe · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Monoton");

.bl-wrap {
  background: #AB3428;
  letter-spacing: 5px;
}

.clip-text {
  display: inline;
  font-family: "Monoton", Helvetica, sans-serif;
  font-size: 15vw;
  text-transform: uppercase;
  color: #F49E4C;
}

@media (min-width: 700px) {
  .clip-text {
    font-size: 9vw;
  }
}

@media (min-width: 1400px) {
  .clip-text {
    font-size: 150px;
  }
}

@supports (-webkit-background-clip: text) {
  .clip-text {
    color: transparent;
    background: linear-gradient(7deg, #F5EE9E 50%, #F49E4C 0);
    -webkit-background-clip: text;
    background-clip: text;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始渐变填充色 */
:host .bl-wrap .clip-text {
  background: linear-gradient(7deg, #F5EE9E 50%, #F49E4C 0) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
}

/* 逐字露出（clip-path 按 reveal 比例裁剪文本宽度） */
:host .bl-wrap .clip-text {
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
`,
  html: `<h1 class="clip-text">{{LINE}}</h1>`
});
