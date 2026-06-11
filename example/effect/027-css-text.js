BL.register({
  id: '027',
  name: '027 Text shadow animation (CSS) but I\'m being extra',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 27,
  src: 'Text shadow animation (CSS) but I\'m being extra · CodePen',
  css: `:root {
  --background: #f3a683;
  --base: #303952;
  --accent: #786fa6;
  --shadow: #e77f67;
}

.bl-wrap {
  background: var(--background);
}

.cool {
  font: bold 3rem/1.2 sans-serif;
  max-width: 20rem;
}
.cool .ch {
  color: var(--shadow);
  display: inline-block;
  position: relative;
  /* 按歌词时间逐字符显示:字符 i 在 reveal>i/n 即自身 start 时刻出现 */
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
@media (prefers-reduced-motion) {
  .cool .ch {
    color: var(--base);
  }
}
.cool .ch::before {
  -webkit-animation: max-height 0.4s cubic-bezier(0.61, 1, 0.88, 1) 1 normal both;
          animation: max-height 0.4s cubic-bezier(0.61, 1, 0.88, 1) 1 normal both;
  animation-delay: calc(var(--i) * 0.1s);
  color: var(--accent);
}
.cool .ch::after {
  -webkit-animation: max-width 0.7s cubic-bezier(0.61, 1, 0.88, 1) 1 normal both;
          animation: max-width 0.7s cubic-bezier(0.61, 1, 0.88, 1) 1 normal both;
  animation-delay: calc(var(--i) * 0.1s);
  color: var(--base);
}
.cool .ch::before, .cool .ch::after {
  content: attr(data-ch);
  left: 0;
  overflow: hidden;
  position: absolute;
  speak: none;
}
@media (prefers-reduced-motion) {
  .cool .ch::before, .cool .ch::after {
    -webkit-animation: none;
            animation: none;
    content: "";
  }
}

@-webkit-keyframes max-width {
  from {
    max-width: 0;
  }
  to {
    max-width: 100%;
  }
}

@keyframes max-width {
  from {
    max-width: 0;
  }
  to {
    max-width: 100%;
  }
}
@-webkit-keyframes max-height {
  from {
    max-height: 0;
  }
  to {
    max-height: 100%;
  }
}
@keyframes max-height {
  from {
    max-height: 0;
  }
  to {
    max-height: 100%;
  }
}
/* 取消引擎按 --reveal 的遮罩露出(与字幕不同步),改用上面的逐字符显示 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }`,
  html: `<p class="cool">{{LETTERS}}</p>`,
  letterTpl: `<span class="ch" data-ch="{ch}" style="--i:{i};--n:{n}">{ch}</span>`
});
