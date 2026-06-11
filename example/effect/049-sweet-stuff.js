BL.register({
  id: '049',
  name: '049 Sweet stuff',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 49,
  src: 'Sweet stuff · CodePen',
  css: `@import url("https://fonts.googleapis.com/css2?family=Exo+2:wght@300;700;900&display=swap");

.bl-wrap {
  font-family: "Exo 2", sans-serif;
}

.sweet-title {
  color: #fde9ff;
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(3rem, 10vw, 6rem);
  line-height: 0.75em;
  text-align: center;
  text-shadow: 3px 1px 1px #4af7ff, 2px 2px 1px #165bfb, 4px 2px 1px #4af7ff, 3px 3px 1px #165bfb, 5px 3px 1px #4af7ff, 4px 4px 1px #165bfb, 6px 4px 1px #4af7ff, 5px 5px 1px #165bfb, 7px 5px 1px #4af7ff, 6px 6px 1px #165bfb, 8px 6px 1px #4af7ff, 7px 7px 1px #165bfb, 9px 7px 1px #4af7ff;
  position: relative;
}

.sweet-title::before {
  content: attr(data-text);
  position: absolute;
  text-shadow: 2px 2px 1px #e94aa1, -1px -1px 1px #c736f9, -2px 2px 1px #e94aa1, 1px -1px 1px #f736f9;
  z-index: 1;
  left: 0;
  top: 0;
  /* 叠层用 attr(data-text) 画整行,无法逐字,改用按 --reveal 比例从左到右裁切,与出字同步 */
  clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0);
}
/* 逐字符显示:主文字拆成逐字,按歌词时间逐个露出 */
.sweet-title .bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="sweet-title" data-text="{{LINE}}">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
