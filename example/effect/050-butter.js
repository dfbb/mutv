BL.register({
  id: '050',
  name: '050 Butter',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 50,
  src: 'Butter · CodePen',
  css: `@import url('https://fonts.googleapis.com/css2?family=Calligraffitti&display=swap');

.bl-wrap {
  background: #6868AC;
}

.butter-text {
  font-family: 'Calligraffitti', cursive;
  font-weight: 700;
  font-size: 8rem;
  letter-spacing: 0.02em;
  text-align: center;
  color: #F9f1cc;
  text-shadow:
    5px 5px 0px #FFB650,
    10px 10px 0px #FFD662,
    15px 15px 0px #FF80BF,
    20px 20px 0px #EF5097,
    25px 25px 0px #6868AC,
    30px 30px 0px #90B1E0;
}
/* 逐字符显示:color/text-shadow 由 .butter-text 继承,字符按歌词时间逐个露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="butter-text">{{LETTERS}}</div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
