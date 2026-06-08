import {test} from 'node:test';
import assert from 'node:assert/strict';
import {twoWordLabel, buildNameMap} from './winampNames.mjs';

test('twoWordLabel: 取前两个有意义 token,小写短横线', () => {
  assert.equal(twoWordLabel('$$$ Royal - Mashup (197)'), 'royal-mashup');
});

test('twoWordLabel: 去前导下划线/符号,跨分隔取词', () => {
  assert.equal(
    twoWordLabel('_Aderrasi - Wanderer in Curved Space - mash0000'),
    'aderrasi-wanderer'
  );
});

test('twoWordLabel: 不足两词时补 -fx 保持两段', () => {
  assert.equal(twoWordLabel('Geiss'), 'geiss-fx');
});

test('buildNameMap: 唯一 label,冲突加后缀', () => {
  const keys = ['$$$ Royal - Mashup (197)', '$$$ Royal - Mashup (220)', 'Foo - Bar baz'];
  const map = buildNameMap(keys);
  const labels = Object.keys(map);
  assert.equal(labels.length, 3);
  assert.equal(new Set(labels).size, 3, 'label 必须唯一');
  assert.ok(labels.some((l) => l === 'royal-mashup'));
  assert.ok(labels.some((l) => l.startsWith('royal-mashup-')));
  for (const [label, key] of Object.entries(map)) {
    assert.ok(keys.includes(key));
    assert.match(label, /^[a-z0-9]+(-[a-z0-9]+)+$/);
  }
});

test('buildNameMap: 确定性(同输入同输出)', () => {
  const keys = ['A - One', 'B - Two', 'A - One extra'];
  assert.deepEqual(buildNameMap(keys), buildNameMap(keys));
});
