BL.register({
  id: '061',
  name: '061 CSS Text Reveal',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 61,
  src: 'CSS Text Reveal · CodePen',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Maitree&display=swap');

.bl-wrap {
  background-color: #D8D8D8;
  --bg-color: #D8D8D8;
}

.home-title {
  font-size: 3em;
  font-weight: normal;
  font-family: 'Maitree', serif;
  color: #000;
}

.home-title span {
  position: relative;
  overflow: hidden;
  display: block;
  line-height: 1.2;
}

.home-title span::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: white;
  animation: a-ltr-after 2s cubic-bezier(.77,0,.18,1) forwards;
  transform: translateX(-101%);
}

.home-title span::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-color);
  animation: a-ltr-before 2s cubic-bezier(.77,0,.18,1) forwards;
  transform: translateX(0);
}

.home-title span:nth-of-type(1)::before,
.home-title span:nth-of-type(1)::after {
  animation-delay: 0.2s;
}

.home-title span:nth-of-type(2)::before,
.home-title span:nth-of-type(2)::after {
  animation-delay: 0.5s;
}

@keyframes a-ltr-after {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(101%); }
}

@keyframes a-ltr-before {
  0% { transform: translateX(0); }
  100% { transform: translateX(200%); }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始浅灰底,使黑字可见 */
:host .bl-wrap {
  background-color: #D8D8D8 !important;
  --bg-color: #D8D8D8;
  padding: 0.1em 0.3em !important;
}

/* 恢复原始颜色(黑色文字) */
:host .bl-wrap .home-title,
:host .bl-wrap .home-title .bl-char {
  color: #000 !important;
  -webkit-text-fill-color: #000 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}

/* 关闭原始擦除遮罩动画,避免覆盖逐字露出 */
:host .bl-wrap .home-title span::before,
:host .bl-wrap .home-title span::after {
  display: none !important;
}

/* 字体在统一字号基础上缩小 30%(覆盖顶层 VISUAL_OVERRIDE 的强制 clamp 字号) */
:host .bl-wrap .home-title,
:host .bl-wrap .home-title span,
:host .bl-wrap .home-title .bl-char {
  font-size: calc(clamp(34px, 5vw, 88px) * 0.7) !important;
}

/* 内层 span 原为 display:block(配合原版逐行揭示),在引擎单行+逐字结构下会让每个
   .bl-char 各占一行(竖排),英文长句尤其破碎。改 inline-block 让逐字横向排列。 */
:host .bl-wrap .home-title span { display: inline-block !important; overflow: visible !important; white-space: nowrap !important; }
`,
  html: `<h1 class="home-title">
  <span>{{LETTERS}}</span>
</h1>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
