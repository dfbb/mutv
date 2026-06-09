import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {prepareAnim} from './animbgPrepare.mjs';

// 在临时目录搭一个最小项目骨架，chdir 进去后调用 prepareAnim（它以 cwd 为根）。
function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'animprep-'));
  const prevCwd = process.cwd();
  try {
    mkdirSync(join(root, 'animbg', 'plain'), {recursive: true});
    mkdirSync(join(root, 'animbg', 'libfx'), {recursive: true});
    mkdirSync(join(root, 'animbg', 'vendor'), {recursive: true});
    mkdirSync(join(root, 'public'), {recursive: true});
    writeFileSync(join(root, 'animbg', 'plain', 'index.html'),
      '<html><body><canvas></canvas></body></html>');
    writeFileSync(join(root, 'animbg', 'libfx', 'index.html'),
      '<html><body><script src="../vendor/p5.min.js"></script></body></html>');
    writeFileSync(join(root, 'animbg', 'vendor', 'p5.min.js'), '// lib');
    writeFileSync(join(root, 'animbg', 'manifest.json'),
      JSON.stringify([{label: 'plain', category: 'WINAMP'}]));
    process.chdir(root);
    fn(root);
  } finally {
    process.chdir(prevCwd);
    rmSync(root, {recursive: true, force: true});
  }
}

test('prepareAnim: 写出 public/animbg/animbg-<label>.html 并返回路径', () => {
  withFixture((root) => {
    const r = prepareAnim({label: 'plain', beatReactive: false});
    assert.equal(r.backgroundAnim, 'animbg/animbg-plain.html');
    assert.equal(r.backgroundAnimLabel, 'plain');
    assert.ok(existsSync(resolve('public', 'animbg', 'animbg-plain.html')));
  });
});

test('prepareAnim: manifest 里 WINAMP 类别 → backgroundAnimKind=winamp', () => {
  withFixture(() => {
    const r = prepareAnim({label: 'plain', beatReactive: false});
    assert.equal(r.backgroundAnimKind, 'winamp');
  });
});

test('prepareAnim: 非 WINAMP（无 manifest 条目）→ kind 为空', () => {
  withFixture(() => {
    const r = prepareAnim({label: 'libfx', beatReactive: false});
    assert.equal(r.backgroundAnimKind, '');
  });
});

test('prepareAnim: html 引用 vendor/ → 拷贝 vendor 树到 public/vendor', () => {
  withFixture(() => {
    prepareAnim({label: 'libfx', beatReactive: false});
    assert.ok(existsSync(resolve('public', 'vendor', 'p5.min.js')), 'vendor 应被拷贝');
  });
});

test('prepareAnim: beatReactive=true → 注入 beat 时钟标记', () => {
  withFixture(() => {
    prepareAnim({label: 'plain', beatReactive: true});
    const out = readFileSync(resolve('public', 'animbg', 'animbg-plain.html'), 'utf-8');
    assert.ok(out.includes('__beatTick'), '应含 beat 时钟');
  });
});

test('prepareAnim: 不存在的 label → 抛错', () => {
  withFixture(() => {
    assert.throws(() => prepareAnim({label: 'nope', beatReactive: false}), /not found/);
  });
});
