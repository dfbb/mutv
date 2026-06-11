BL.register({
  id: '022',
  name: '022 Animated Shiny Gold Text',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 22,
  src: 'Animated Shiny Gold Text · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Alegreya:900i");

.gold-text {
  font-family: "Alegreya", serif;
  font-style: italic;
  word-spacing: 0.2em;
  line-height: 1;
  white-space: nowrap;
}
/* 每个字符:绿字 + 金色立体阴影(原 ::before 的 3D 挤出改为逐字 text-shadow) */
.gl {
  display: inline-block;
  position: relative;
  text-shadow:
    0 -1px 0 #f4cc9b, 0 1px 0 #a77334, 0 2px 0 #9b6b30, 0 3px 0 #90632d,
    0 4px 0 #7a5426, 0 4px 2px #7a5426,
    0 0.075em 0.1em rgba(26,35,39,.3), 0 0.15em 0.3em rgba(222,153,69,.2);
  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻瞬时出现 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 逐字扫光:每字一束高光,按 --i 错开相位,整体形成从左到右流动的闪光 */
.gl::after {
  content: attr(data-c);
  position: absolute;
  left: 0;
  top: 0;
  color: transparent;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.95) 50%, transparent 65%);
  background-size: 250% 100%;
  background-repeat: no-repeat;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shineL 2.6s linear infinite;
  animation-delay: calc(var(--i) * -0.18s);
}
@keyframes shineL {
  0%   { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<h1 class="gold-text">{{LETTERS}}</h1>`,
  letterTpl: `<span class="gl" style="--i:{i}; --n:{n}" data-c="{ch}">{ch}</span>`
});
