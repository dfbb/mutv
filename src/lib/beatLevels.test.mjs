import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandSums, createBeatState, beatStyle, advanceVirtualTime} from './beatLevels.mjs';

test('bandSums: 仅低频有能量时 bass>0、mid/treb=0', () => {
  // sampleRate 44100, nyquist 22050; 512 bins → binHz ≈ 43.07
  // 只在 ~100Hz(bin 2)放能量,落在 bass(20-320Hz)
  const spectrum = new Array(512).fill(0);
  spectrum[2] = 1;
  const [bass, mid, treb] = bandSums(spectrum, 44100);
  assert.ok(bass > 0, 'bass 应>0');
  assert.equal(mid, 0);
  assert.equal(treb, 0);
});

test('bandSums: 高频能量落入 treb', () => {
  const spectrum = new Array(512).fill(0);
  // ~8000Hz → bin ≈ 8000/43.07 ≈ 185,落在 treb(2800-11025Hz)
  spectrum[185] = 1;
  const [bass, mid, treb] = bandSums(spectrum, 44100);
  assert.equal(bass, 0);
  assert.equal(mid, 0);
  assert.ok(treb > 0);
});

test('bandSums: 相邻段边界不重叠(边界 bin 只计入一段)', () => {
  // binHz ≈ 43.07;边界 bin:round(320/binHz)=7(bass|mid),round(2800/binHz)=65(mid|treb)
  // 在 bass/mid 边界 bin 7 放能量,应只计入 mid(bass 区间 [0,7) 不含 7)
  const sBassMid = new Array(512).fill(0);
  sBassMid[7] = 1;
  const r1 = bandSums(sBassMid, 44100);
  assert.equal(r1[0], 0, 'bass 不应含边界 bin 7');
  assert.equal(r1[1], 1, 'mid 应含边界 bin 7');
  assert.equal(r1[2], 0);
  // 在 mid/treb 边界 bin 65 放能量,应只计入 treb(mid 区间 [7,65) 不含 65)
  const sMidTreb = new Array(512).fill(0);
  sMidTreb[65] = 1;
  const r2 = bandSums(sMidTreb, 44100);
  assert.equal(r2[0], 0);
  assert.equal(r2[1], 0, 'mid 不应含边界 bin 65');
  assert.equal(r2[2], 1, 'treb 应含边界 bin 65');
});

test('createBeatState: 恒定输入收敛到 ~1.0', () => {
  const s = createBeatState(24);
  let last;
  for (let f = 0; f < 300; f++) last = s.step([5, 5, 5], f);
  assert.ok(Math.abs(last.bass - 1) < 0.05, `bass≈1, got ${last.bass}`);
});

test('createBeatState: 突增能量使 val 冲高>1', () => {
  const s = createBeatState(24);
  for (let f = 0; f < 200; f++) s.step([2, 2, 2], f); // 建立基线
  const spike = s.step([20, 2, 2], 200);
  assert.ok(spike.bass > 2, `bass 应冲高, got ${spike.bass}`);
});

test('createBeatState: 确定性(同序列→同结果)', () => {
  const seq = [[3, 1, 1], [9, 2, 1], [4, 5, 2], [1, 1, 8]];
  const a = createBeatState(24);
  const b = createBeatState(24);
  for (let f = 0; f < seq.length; f++) {
    assert.deepEqual(a.step(seq[f], f), b.step(seq[f], f));
  }
});

test('beatStyle: 静音基线为中性', () => {
  const st = beatStyle({bass: 1, mid: 1, treb: 1});
  assert.equal(st.scale, 1);
  assert.equal(st.brightness, 1);
  assert.equal(st.saturate, 1);
  assert.equal(st.timeGain, 1);
});

test('beatStyle: clamp 上限', () => {
  const st = beatStyle({bass: 10, mid: 10, treb: 10}); // c clamps at 2
  assert.ok(Math.abs(st.scale - 1.08) < 1e-9);
  assert.ok(Math.abs(st.brightness - 1.12) < 1e-9);
  assert.ok(Math.abs(st.saturate - 1.2) < 1e-9);
  assert.ok(Math.abs(st.timeGain - 2.2) < 1e-9);
});

test('advanceVirtualTime: 恒定 timeGain=1 收敛到实时(vt≈frame*dt)', () => {
  const fps = 24;
  const dt = 1000 / fps;
  let vt = 0;
  for (let f = 0; f < 500; f++) vt = advanceVirtualTime(vt, 1, f, fps);
  // 基线无鼓点时虚拟时间应贴合实时,残差仅为初始松弛瞬态
  assert.ok(Math.abs(vt - 499 * dt) < dt, `vt 应≈实时, 差 ${(vt - 499 * dt).toFixed(2)}ms`);
});

test('advanceVirtualTime: 鼓点帧瞬时加速(单帧推进 > dt)', () => {
  const fps = 24;
  const dt = 1000 / fps;
  // 先用 timeGain=1 稳定到实时附近
  let vt = 0;
  for (let f = 0; f < 200; f++) vt = advanceVirtualTime(vt, 1, f, fps);
  const before = vt;
  vt = advanceVirtualTime(vt, 2.2, 200, fps); // 一记最强鼓点
  assert.ok(vt - before > dt, `鼓点帧应加速, 推进 ${(vt - before).toFixed(2)}ms 应 > ${dt.toFixed(2)}ms`);
});

test('advanceVirtualTime: 长程零漂移(平均速率=实时,不再整体偏快)', () => {
  const fps = 24;
  const dt = 1000 / fps;
  const N = 2400; // 100 秒
  // 模拟规律鼓点:每 24 帧前 3 帧是强拍(timeGain=2.2),其余基线 1.0
  // 旧逻辑(vt += dt*timeGain 无松弛)会累计 (avgGain-1)*N*dt ≈ 0.15*N*dt ≈ 360*dt 的漂移
  let vt = 0;
  for (let f = 0; f < N; f++) {
    const timeGain = f % 24 < 3 ? 2.2 : 1.0;
    vt = advanceVirtualTime(vt, timeGain, f, fps);
  }
  const realMs = (N - 1) * dt;
  // 漏积分使超前量有界(几个 dt 量级),与帧数无关 → 长程平均速率=实时
  assert.ok(
    Math.abs(vt - realMs) < 20 * dt,
    `应无净漂移, vt-real=${((vt - realMs) / dt).toFixed(1)} 帧 (应 <20)`
  );
});
