BL.register({
  id: '032',
  name: '032 Pure CSS text-animation',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 32,
  src: 'Pure CSS text-animation · CodePen',
  css: `@import url('https://fonts.googleapis.com/css2?family=Staatliches&display=swap');
.bl-wrap {
  background: black;
  color: tomato;
}

.jt {
  position: relative;
  font-size: 20vmin;
  font-family: 'Staatliches', sans-serif;
  text-transform: uppercase;
  font-display: swap;
  text-shadow: 0 0 10px tomato;
}

.jt__row {
  display: block;
}
.jt__row:nth-child(1) {
  clip-path: polygon(-10% 75%, 110% 75%, 110% 110%, -10% 110%);
}
.jt__row:nth-child(2) {
  clip-path: polygon(-10% 50%, 110% 50%, 110% 75.3%, -10% 75.3%);
}
.jt__row:nth-child(3) {
  clip-path: polygon(-10% 25%, 110% 25%, 110% 50.3%, -10% 50.3%);
}
.jt__row:nth-child(4) {
  clip-path: polygon(-10% 0%, 110% 0%, 110% 25.3%, -10% 25.3%);
}

.jt__row.jt__row--sibling {
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
}

.jt__text {
  display: block;
  transform-origin: bottom left;
  animation: moveIn 2s 0s cubic-bezier(.36,0,.06,1) alternate infinite;
}
.jt__row:nth-child(1) .jt__text {
  transform: translateY(-0.1em);
}
.jt__row:nth-child(2) .jt__text {
  transform: translateY(-0.3em) scaleY(1.1);
}
.jt__row:nth-child(3) .jt__text {
  transform: translateY(-0.5em) scaleY(1.2);
}
.jt__row:nth-child(4) .jt__text {
  transform: translateY(-0.7em) scaleY(1.3);
}

@keyframes moveIn {
  50%, 100% {
    transform: translateY(0em)
  }
  0% {
    opacity: 0;
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
  }
}
/* 按歌词时间逐字符出现(与 .jt__text 的 moveIn 脉动相乘);4 个切片行同一 --i/--n 同步揭示 */
.jl {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示;水平切片(clip-path)保留 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<h1 class="jt">
  <span class="jt__row"><span class="jt__text">{{LETTERS}}</span></span>
  <span class="jt__row jt__row--sibling" aria-hidden="true"><span class="jt__text">{{LETTERS}}</span></span>
  <span class="jt__row jt__row--sibling" aria-hidden="true"><span class="jt__text">{{LETTERS}}</span></span>
  <span class="jt__row jt__row--sibling" aria-hidden="true"><span class="jt__text">{{LETTERS}}</span></span>
</h1>`,
  letterTpl: `<span class="jl" style="--i:{i}; --n:{n}">{ch}</span>`
});
