BL.register({
  id: '057',
  name: '057 CSS text-emphasis',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 57,
  src: 'CSS text-emphasis · CodePen',
  css: `.emphasis-text {
  -webkit-text-emphasis: filled double-circle deeppink;
  text-emphasis: filled double-circle deeppink;
  color: hsl(0 0% 20%);
  font-size: 3rem;
  line-height: 1.5;
  font-weight: 300;
  margin: 0;
  font-family: system-ui, sans-serif;
  text-align: center;
}
/* 改为绿色字体(着重号 deeppink 由 shorthand 继承,保留) */
:host .bl-wrap .emphasis-text,
:host .bl-wrap .emphasis-text .bl-char {
  color: #00e676 !important;
  -webkit-text-fill-color: #00e676 !important;
}
/* 逐字符显示:color/text-emphasis 由 .emphasis-text 继承,字符按歌词时间逐个露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<p class="emphasis-text">{{LETTERS}}</p>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
