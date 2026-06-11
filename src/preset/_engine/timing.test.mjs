import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildLineInfo, currentLineIndex} from './timing.mjs';

test('行级时间均分成逐字 charTimes', () => {
  const lines = [{start: 1, end: 3, text: '沧海'}]; // 秒
  const info = buildLineInfo(lines, 0);
  assert.equal(info[0].charTimes.length, 2);
  assert.equal(info[0].charTimes[0].start, 1000);
  assert.equal(info[0].charTimes[0].dur, 1000);
  assert.equal(info[0].charTimes[1].start, 2000);
});

test('currentLineIndex：开始前 -1，行内取该行', () => {
  const info = buildLineInfo([{start: 1, end: 3, text: '沧'}, {start: 3, end: 5, text: '海'}], 0);
  assert.equal(currentLineIndex(info, 500), -1);
  assert.equal(currentLineIndex(info, 1500), 0);
  assert.equal(currentLineIndex(info, 3500), 1);
});

test('lyricOffset 生效（秒）', () => {
  const info = buildLineInfo([{start: 1, end: 3, text: '沧'}], -0.5);
  assert.equal(info[0].start, 500);
});

test('空文本行不产生 NaN（charDur 安全）', () => {
  const info = buildLineInfo([{start: 1, end: 2, text: ''}], 0);
  assert.equal(info[0].chars.length, 0);
  assert.ok(Number.isFinite(info[0].dur));
});
