BL.register({
  id: '046',
  name: '046 3D TEXT!',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 46,
  src: '3D TEXT! · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Wendy+One&display=swap');
.bl-wrap {
  font-family: 'Wendy One', sans-serif;
  background: #F7CA05;
  display: flex;
  align-content: center;
  justify-content: center;
}
.box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
h3 {
  font-size: 12vw;
  white-space: nowrap;
  overflow: hidden;
  line-height: 220px;
  color: #F7CA05;
  text-shadow: 0 10px 7px rgba(0,0,0,0.4), 0 -10px 1px #fff;
  letter-spacing: -3px;
  margin: 0;
}
h3:hover {
  animation: glitch .3s linear infinite;
  cursor: pointer;
}
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
/* 逐字符显示:color/text-shadow(3D 效果)在 h3 上,子 span 继承,
   字符按歌词时间逐个露出,字符 i 在 reveal>i/n 即自身 start 时刻出现 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }
`,
  html: `<div class="box"><h3>{{LETTERS}}</h3></div>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
