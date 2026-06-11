BL.register({
  id: '051',
  name: '051 Text Shadow',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 51,
  src: 'Text Shadow · CodePen',
  css: `@import url("https://fonts.googleapis.com/css?family=Henny+Penny");

.bl-wrap {
  background-color: #ffdd40;
}

.shadow-text {
  font-family: "Henny Penny", cursive;
  letter-spacing: 0.0015em;
  font-size: 5em;
  color: #274dff;
  text-shadow:
    0 1px #8da1ff,
    -1px 0 #c0cbff,
    -1px 2px #8da1ff,
    -2px 1px #c0cbff,
    -2px 3px #8da1ff,
    -3px 2px #c0cbff,
    -3px 4px #8da1ff,
    -4px 3px #c0cbff,
    -4px 5px #8da1ff,
    -5px 4px #c0cbff,
    -5px 6px #8da1ff,
    -6px 5px #c0cbff,
    -6px 7px #8da1ff,
    -7px 6px #c0cbff,
    -7px 8px #8da1ff,
    -8px 7px #c0cbff;
  text-align: center;
}
/* 逐字符显示:color/text-shadow 由 .shadow-text 继承,字符按歌词时间逐个露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<p class="shadow-text">{{LETTERS}}</p>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
