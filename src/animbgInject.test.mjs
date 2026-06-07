import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectBeatClock, BEAT_MARK} from './animbgInject.mjs';

const HTML = '<html><head></head><body><canvas></canvas></body></html>';

// 从注入后的 HTML 里提取 beat 时钟 <script> 内的 JS 代码体,真正执行注入逻辑。
function beatScriptBody() {
  const out = injectBeatClock(HTML);
  // beat 脚本是最后一个注入的 <script>;取含 BEAT_MARK 的那段。
  const start = out.indexOf('<script>', out.indexOf(BEAT_MARK) - 200);
  const end = out.indexOf('</script>', start);
  return out.slice(start + '<script>'.length, end);
}

// 在一个最小假宿主里执行注入脚本:把 fakeWin 当作 `window`。
// 脚本里通过 window.performance / window.Date 访问,故 fakeWin 自带这两者。
function runBeatScript() {
  const fakeWin = {
    performance: {now: () => 123.456},
    Date: {now: () => 1700000000000},
  };
  const epochBefore = fakeWin.Date.now();
  // 脚本以 `window` 为全局引用;用 new Function 注入 window 形参。
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', beatScriptBody());
  fn(fakeWin);
  return {fakeWin, epochBefore};
}

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

test('运行时: performance.now() 初始返回 0(虚拟时间轴从 0 起)', () => {
  const {fakeWin} = runBeatScript();
  assert.equal(fakeWin.__beatVirtualTimeMs, 0, '虚拟时间初值应为 0');
  assert.equal(fakeWin.performance.now(), 0, 'performance.now 初始应为 0');
});

test('运行时: __beatTick 推进 performance.now / Date.now(虚拟时间轴)', () => {
  const {fakeWin, epochBefore} = runBeatScript();
  fakeWin.__beatTick(5000);
  assert.equal(fakeWin.performance.now(), 5000);
  // Date.now = epoch0 + 虚拟时间;epoch0 在注入时取自 fakeWin 真实 Date.now。
  assert.equal(fakeWin.Date.now(), epochBefore + 5000);
  assert.ok(fakeWin.Date.now() >= epochBefore, 'Date.now 不应早于注入前时刻');
});

test('运行时: 时钟单调随 __beatTick 前进(无切换跳变)', () => {
  const {fakeWin} = runBeatScript();
  fakeWin.__beatTick(100);
  assert.equal(fakeWin.performance.now(), 100);
  fakeWin.__beatTick(250);
  assert.equal(fakeWin.performance.now(), 250);
});
