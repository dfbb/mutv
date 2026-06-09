import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {nextIndex, listPresets} from './studioControl.mjs';

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

test('listPresets: 仅含 index.ts 的目录、按名排序', () => {
  const root = mkdtempSync(join(tmpdir(), 'presets-'));
  const prevCwd = process.cwd();
  try {
    mkdirSync(join(root, 'preset', 'orig'), {recursive: true});
    mkdirSync(join(root, 'preset', 'apple'), {recursive: true});
    mkdirSync(join(root, 'preset', 'notapreset'), {recursive: true}); // 无 index.ts，应被过滤
    writeFileSync(join(root, 'preset', 'orig', 'index.ts'), '');
    writeFileSync(join(root, 'preset', 'apple', 'index.ts'), '');
    writeFileSync(join(root, 'preset', 'notapreset', 'readme.md'), 'x');
    process.chdir(root);
    assert.deepEqual(listPresets(), ['apple', 'orig']);
  } finally {
    process.chdir(prevCwd);
    rmSync(root, {recursive: true, force: true});
  }
});

test('listPresets: preset 目录不存在 → 空数组', () => {
  const root = mkdtempSync(join(tmpdir(), 'presets-empty-'));
  const prevCwd = process.cwd();
  try {
    process.chdir(root);
    assert.deepEqual(listPresets(), []);
  } finally {
    process.chdir(prevCwd);
    rmSync(root, {recursive: true, force: true});
  }
});
