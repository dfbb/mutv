BL.register({
  id: '086',
  name: '086 SAVE!',
  kind: 'visual',
  group: 'Visual 数据集特效',
  order: 86,
  src: 'SAVE! · CodePen',
  css: `
@import url("https://fonts.googleapis.com/css?family=Bangers&display=swap");

.bl-wrap {
  color: #bfaa40;
  font-family: "Bangers", cursive;
}

.save-text {
  position: relative;
  z-index: 2;
  font-size: 8vmin;
  letter-spacing: 15px;
  text-transform: uppercase;
  transform: rotate(-10deg);
  display: inline-block;
  text-shadow: 1px 1px #ac9939, 2px 2px #998833, 3px 3px #86772d, 4px 4px #82742b, 5px 5px #7e702a, 6px 6px #7a6d29, 7px 7px #776928, 8px 8px #736626, 9px 9px #6f6325, 10px 10px #6b5f24, 10px 10px 30px rgba(0, 0, 0, 0.7);
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复金色文字 */
:host .bl-wrap .save-text,
:host .bl-wrap .save-text .bl-char {
  color: #bfaa40 !important;
  -webkit-text-fill-color: #bfaa40 !important;
}

/* 逐字露出 */
.bl-char {
  display: inline-block;
  opacity: clamp(0, calc((var(--reveal, 1) - var(--i) / var(--n, 1)) * 1000), 1);
}
`,
  letterTpl: `<span class="bl-char" style="--i:{i};--n:{n}">{ch}</span>`,
  html: `<h1 class="save-text">{{LETTERS}}</h1>`
});
