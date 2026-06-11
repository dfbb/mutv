BL.register({
  id: '095',
  name: '095 CSS3 text-shadow effects',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 95,
  src: 'CSS3 text-shadow effects · CodePen',
  css: `
.bl-wrap {
  background-color: #e7e5e4;
}

.elegant-shadow {
  font-family: "Avant Garde", Avantgarde, "Century Gothic", CenturyGothic, "AppleGothic", sans-serif;
  font-size: 5vmin;
  padding: 20px;
  text-align: center;
  text-transform: uppercase;
  text-rendering: optimizeLegibility;
  color: #131313;
  letter-spacing: 0.15em;
  text-shadow: 1px -1px 0 #767676, -1px 2px 1px #737272, -2px 4px 1px #767474, -3px 6px 1px #787777, -4px 8px 1px #7b7a7a, -5px 10px 1px #7f7d7d, -6px 12px 1px #828181, -7px 14px 1px #868585, -8px 16px 1px #8b8a89, -9px 18px 1px #8f8e8d, -10px 20px 1px #949392, -11px 22px 1px #999897, -12px 24px 1px #9e9c9c, -13px 26px 1px #a3a1a1, -14px 28px 1px #a8a6a6, -15px 30px 1px #adabab, -16px 32px 1px #b2b1b0, -17px 34px 1px #b7b6b5, -18px 36px 1px #bcbbba, -19px 38px 1px #c1bfbf, -20px 40px 1px #c6c4c4, -21px 42px 1px #cbc9c8, -22px 44px 1px #cfcdcd, -23px 46px 1px #d4d2d1, -24px 48px 1px #d8d6d5, -25px 50px 1px #dbdad9, -26px 52px 1px #dfdddc, -27px 54px 1px #e2e0df, -28px 56px 1px #e4e3e2;
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色: 原始为深色实心字 #131313 + 灰色立体阴影 */
:host .bl-wrap .elegant-shadow,
:host .bl-wrap .elegant-shadow .bl-char {
  color: #131313 !important;
  -webkit-text-fill-color: #131313 !important;
}

/* 逐字露出 */
.bl-char { display: inline-block; opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1); }
`,
  html: `<h1 class="elegant-shadow">{{LETTERS}}</h1>`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`
});
