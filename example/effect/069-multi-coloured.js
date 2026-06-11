BL.register({
  id:'069',
  name:'069 Multi-coloured CSS Text Effect with Text Shadows',
  kind:'visual',
  group:'Visual 数据集特效',
  order:69,
  src:'Multi-coloured CSS Text Effect with Text Shadows · CodePen',
  css:`:host {
  --green: #65f283;
  --blue: #4ad9db;
  --red: #f98ca4;
  --orange: #f5b10b;
  --mustard: #dac249;
  --darkblue: #2f3e9c;
  --darkred: #9e132c;
  --purple: #6e1f58;
}

.bl-wrap {
  background: linear-gradient(10deg, #f4eba0 43%, #c0faca 43%);
}

h1 {
  font-family: "CoreCircus", sans-serif;
  text-transform: uppercase;
  font-size: 16vw;
  text-align: center;
  line-height: 1;
  margin: 0;
  color: var(--red);
  text-shadow: -1px -1px 0 var(--purple), 1px -1px 0 var(--purple), -1px 1px 0 var(--purple), 1px 1px 0 var(--purple), 1px 0px 0px var(--green), 0px 1px 0px var(--green), 2px 1px 0px var(--green), 1px 2px 0px var(--green), 3px 2px 0px var(--green), 2px 3px 0px var(--green), 4px 3px 0px var(--green), 3px 4px 0px var(--green), 5px 4px 0px var(--green), 3px 5px 0px var(--purple), 6px 5px 0px var(--purple), -1px 2px 0 black, 0 3px 0 var(--purple), 1px 4px 0 var(--purple), 2px 5px 0px var(--purple), 2px -1px 0 var(--purple), 3px 0 0 var(--purple), 4px 1px 0 var(--purple), 5px 2px 0px var(--purple), 6px 3px 0 var(--purple), 7px 4px 0 var(--purple), 10px 10px 4px var(--mustard);
}
h1:after, h1:before {
  content: attr(data-heading);
  position: absolute;
  overflow: hidden;
  left: 0;
  width: 100%;
  top: 0;
  z-index: 5;
}
h1::before {
  text-shadow: -1px -1px 0 var(--darkred), 1px -1px 0 var(--darkred), -1px 1px 0 var(--darkred), 1px 1px 0 var(--darkred), 1px 0px 0px var(--orange), 0px 1px 0px var(--orange), 2px 1px 0px var(--orange), 1px 2px 0px var(--orange), 3px 2px 0px var(--orange), 2px 3px 0px var(--orange), 4px 3px 0px var(--orange), 3px 4px 0px var(--orange), 5px 4px 0px var(--orange), 3px 5px 0px var(--darkred), 6px 5px 0px var(--darkred), -1px 2px 0 black, 0 3px 0 var(--darkred), 1px 4px 0 var(--darkred), 2px 5px 0px var(--darkred), 2px -1px 0 var(--darkred), 3px 0 0 var(--darkred), 4px 1px 0 var(--darkred), 5px 2px 0px var(--darkred), 6px 3px 0 var(--darkred), 7px 4px 0 var(--darkred), 10px 10px 4px rgba(106, 241, 119, 0.8);
  color: var(--green);
  height: 66%;
}
h1::after {
  height: 33%;
  color: var(--blue);
  text-shadow: -1px -1px 0 var(--darkblue), 1px -1px 0 var(--darkblue), -1px 1px 0 var(--darkblue), 1px 1px 0 var(--darkblue), 1px 0px 0px var(--red), 0px 1px 0px var(--red), 2px 1px 0px var(--red), 1px 2px 0px var(--red), 3px 2px 0px var(--red), 2px 3px 0px var(--red), 4px 3px 0px var(--red), 3px 4px 0px var(--red), 5px 4px 0px var(--red), 3px 5px 0px var(--darkblue), 6px 5px 0px var(--darkblue), -1px 2px 0 black, 0 3px 0 var(--darkblue), 1px 4px 0 var(--darkblue), 2px 5px 0px var(--darkblue), 2px -1px 0 var(--darkblue), 3px 0 0 var(--darkblue), 4px 1px 0 var(--darkblue), 5px 2px 0px var(--darkblue), 6px 3px 0 var(--darkblue), 7px 4px 0 var(--darkblue);
}

@font-face {
  font-family: "CoreCircus";
  src: url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/209981/333BF4_8_0.woff2") format("woff2"), url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/209981/333BF4_8_0.woff") format("woff"), url("https://s3-us-west-2.amazonaws.com/s.cdpn.io/209981/333BF4_8_0.ttf") format("truetype");
}

/* 取消引擎遮罩,改用逐字露出 */
:host .bl-wrap { -webkit-mask-image: none !important; mask-image: none !important; }

/* 恢复颜色:h1 主体红色(其上多彩 text-shadow 不受覆盖影响) */
:host .bl-wrap h1 { position: relative !important; color: var(--red) !important; -webkit-text-fill-color: var(--red) !important; }

/* 逐字露出:裁剪 h1(含 ::before/::after 同时裁剪) */
:host .bl-wrap h1 { clip-path: inset(0 calc((1 - var(--reveal, 1)) * 100%) 0 0); }`,
  html:`<h1 data-heading="{{LINE}}">{{LINE}}</h1>`
});
