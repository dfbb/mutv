import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transformCss, parseEffectFile} from './convert-effects.mjs';

test(':host → .fx-<id>，:host .x → .fx-<id> .x', () => {
  const out = transformCss(':host .bl-wrap { width: 90vw !important; }', '014');
  assert.match(out, /\.fx-014 \.bl-wrap/);
  assert.doesNotMatch(out, /:host/);
});

test(':root → .fx-<id>（CSS 变量定义挂效果根）', () => {
  const out = transformCss(':root { --c: red; } .t { color: var(--c); }', '034');
  assert.match(out, /\.fx-034\s*\{\s*--c: red/);
  assert.match(out, /\.fx-034 \.t/);
});

test('普通选择器加前缀，伪元素保留', () => {
  const out = transformCss('.x::before { content: ""; }', '020');
  assert.match(out, /\.fx-020 \.x::before/);
});

test('@keyframes 改名且 shorthand/longhand 引用同步', () => {
  const css = `@keyframes marquee { from { transform: translateX(70%); } }
    .a { animation: marquee 16s infinite linear; }
    .b { animation-name: marquee; animation-delay: 0.5s; }`;
  const out = transformCss(css, '014');
  assert.match(out, /@keyframes fx014-marquee/);
  assert.match(out, /animation:[^;]*fx014-marquee/);
  assert.match(out, /animation-name:\s*fx014-marquee/);
});

test('delay 合成行内时间：shorthand 含 delay → 注入 calc(原delay − var(--fx-t))', () => {
  const out = transformCss('.a { animation: spin 2s 0.5s infinite; }', '023');
  assert.match(out, /animation-delay:\s*calc\(0\.5s - var\(--fx-t\)\)/);
});

test('delay 合成：shorthand 无 delay → calc(0s − var(--fx-t))', () => {
  const out = transformCss('.b { animation: spin 2s infinite; }', '023');
  assert.match(out, /animation-delay:\s*calc\(0s - var\(--fx-t\)\)/);
});

test('CSS 变量 delay 也包进 calc', () => {
  const out = transformCss('.c { animation-delay: calc(var(--i) * 0.1s); }', '016');
  assert.match(out, /animation-delay:\s*calc\(calc\(var\(--i\) \* 0\.1s\) - var\(--fx-t\)\)/);
});

test('@import 与 font-family 剥离', () => {
  const out = transformCss('@import url("https://fonts.googleapis.com/css?family=Raleway"); .a { font-family: Raleway; color: red; }', '014');
  assert.doesNotMatch(out, /@import/);
  assert.doesNotMatch(out, /font-family/);
  assert.match(out, /color: red/);
});

test('parseEffectFile 提取 BL.register 字段', () => {
  const {effect} = parseEffectFile('099-x.js', `BL.register({id:'099',name:'099 测试',kind:'visual',src:'x · CodePen',css:'.a{color:red}',html:'<div>{{LINE}}</div>',letterTpl:'<b>{ch}</b>'})`);
  assert.equal(effect.id, '099');
  assert.equal(effect.kind, 'visual');
  assert.equal(effect.letterTpl, '<b>{ch}</b>');
});

test('parseEffectFile 标记 timeBase 候选：infinite + 位移 keyframes', () => {
  const code = `BL.register({id:'030',name:'x',kind:'visual',css:'@keyframes mv{from{left:0}to{left:100%}} .a{animation: mv 20s infinite linear;}',html:'<i>{{LINE}}</i>'})`;
  const {timeBaseCandidate} = parseEffectFile('030-x.js', code);
  assert.equal(timeBaseCandidate, true);
});

test('parseEffectFile 不误标：有限次动画', () => {
  const code = `BL.register({id:'041',name:'x',kind:'visual',css:'@keyframes mv{from{left:0}to{left:100%}} .a{animation: mv 1s 1;}',html:'<i>{{LINE}}</i>'})`;
  const {timeBaseCandidate} = parseEffectFile('041-x.js', code);
  assert.equal(timeBaseCandidate, false);
});
