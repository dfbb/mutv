import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectBeatClock, BEAT_MARK} from './animbgInject.mjs';

const HTML = '<html><head></head><body><canvas></canvas></body></html>';

test('injectBeatClock: 注入到 </body> 前', () => {
  const out = injectBeatClock(HTML);
  assert.ok(out.includes(BEAT_MARK), '应含 marker');
  assert.ok(out.includes('__beatTick'), '应定义 __beatTick');
  assert.ok(out.indexOf(BEAT_MARK) < out.indexOf('</body>'), '应在 </body> 之前');
});

test('injectBeatClock: 幂等(不重复注入)', () => {
  const once = injectBeatClock(HTML);
  const twice = injectBeatClock(once);
  assert.equal(once, twice);
});

test('injectBeatClock: 无 </body> 时追加到末尾', () => {
  const out = injectBeatClock('<div>x</div>');
  assert.ok(out.includes(BEAT_MARK));
});
