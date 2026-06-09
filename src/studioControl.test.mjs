import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextIndex} from './studioControl.mjs';

test('nextIndex: 普通前进', () => {
  assert.equal(nextIndex(0, 5), 1);
  assert.equal(nextIndex(3, 5), 4);
});

test('nextIndex: 到末尾回环到 0', () => {
  assert.equal(nextIndex(4, 5), 0);
});

test('nextIndex: 单元素始终回到 0', () => {
  assert.equal(nextIndex(0, 1), 0);
});
