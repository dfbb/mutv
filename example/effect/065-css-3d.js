BL.register({
  id:'065',
  name:'065 "HEY" - CSS 3D Text Animation',
  kind:'visual',
  group:'Visual 数据集特效',
  order:65,
  src:'"HEY" - CSS 3D Text Animation [ANIMATION] · CodePen',
  css:`:root {
  --color-primary: #f6aca2;
  --color-secondary: #f49b90;
  --color-tertiary: #f28b7d;
  --color-quaternary: #f07a6a;
  --color-quinary: #ee6352;
}

.bl-wrap {
  font-weight: 300;
  font-size: 1.25rem;
  background-color: #eff8e2;
}

.content {
  display: flex;
  align-content: center;
  justify-content: center;
}

.text-shadows {
  text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary), 12px 12px 0 var(--color-quinary);
  font-family: bungee, sans-serif;
  font-weight: 400;
  text-transform: uppercase;
  font-size: calc(2rem + 5vw);
  text-align: center;
  margin: 0;
  color: var(--color-primary);
  animation: shadows 1.2s ease-in infinite;
  letter-spacing: 0.4rem;
}

@keyframes shadows {
  0% {
    text-shadow: none;
  }
  10% {
    transform: translate(-3px, -3px);
    text-shadow: 3px 3px 0 var(--color-secondary);
  }
  20% {
    transform: translate(-6px, -6px);
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary);
  }
  30% {
    transform: translate(-9px, -9px);
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary);
  }
  40% {
    transform: translate(-12px, -12px);
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary), 12px 12px 0 var(--color-quinary);
  }
  50% {
    transform: translate(-12px, -12px);
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary), 12px 12px 0 var(--color-quinary);
  }
  60% {
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary), 12px 12px 0 var(--color-quinary);
  }
  70% {
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary), 9px 9px var(--color-quaternary);
  }
  80% {
    text-shadow: 3px 3px 0 var(--color-secondary), 6px 6px 0 var(--color-tertiary);
  }
  90% {
    text-shadow: 3px 3px 0 var(--color-secondary);
  }
  100% {
    text-shadow: none;
  }
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复原始颜色 */
:host .bl-wrap .text-shadows,
:host .bl-wrap .text-shadows .bl-char {
  color: #f6aca2 !important;
  -webkit-text-fill-color: #f6aca2 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}`,
  letterTpl:`<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html:`<div class="content"><h2 class="text-shadows">{{LETTERS}}</h2></div>`
});
