import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectColorTargets} from './colorOverride.mjs';

// detectColorTargets：从 preset 的 CSS 源串判定它本身是否声明了"填充/描边发光"，
// 用于 --font-fg/bg-color 的"只替换已有、没有就不加"语义。

test('text-shadow → hasStroke=true；text-shadow:none / 无 → false', () => {
  assert.equal(detectColorTargets('.x{text-shadow:0 0 5px red}').hasStroke, true);
  assert.equal(detectColorTargets('.x{text-shadow: none}').hasStroke, false);
  assert.equal(detectColorTargets('.x{color:red}').hasStroke, false);
});

test('-webkit-text-stroke 有宽度 → hasStroke & hasTextStroke=true；宽度 0 → false', () => {
  const yes = detectColorTargets('.x{-webkit-text-stroke:2px blue}');
  assert.equal(yes.hasStroke, true);
  assert.equal(yes.hasTextStroke, true);
  const zero = detectColorTargets('.x{-webkit-text-stroke:0 blue}');
  assert.equal(zero.hasTextStroke, false);
  // 仅设 stroke-color 而无宽度，不算可见描边
  assert.equal(detectColorTargets('.x{-webkit-text-stroke-color:blue}').hasTextStroke, false);
});

test('color / -webkit-text-fill-color / background-clip:text → hasFill=true', () => {
  assert.equal(detectColorTargets('.x{color:red}').hasFill, true);
  assert.equal(detectColorTargets('.x{-webkit-text-fill-color:red}').hasFill, true);
  assert.equal(detectColorTargets('.x{background:linear-gradient(#fff,#000);-webkit-background-clip:text}').hasFill, true);
});

test('background-color 不应误判为文字填充', () => {
  assert.equal(detectColorTargets('.x{background-color:red}').hasFill, false);
});

test('无任何字色声明 → 三项全 false（--font-bg-color 应 no-op）', () => {
  const r = detectColorTargets('.x{transform:scale(1);opacity:.5}');
  assert.equal(r.hasFill, false);
  assert.equal(r.hasStroke, false);
  assert.equal(r.hasTextStroke, false);
});

test('空/缺省入参不抛错', () => {
  const r = detectColorTargets(undefined);
  assert.equal(r.hasFill, false);
  assert.equal(r.hasStroke, false);
  assert.equal(r.hasTextStroke, false);
});
