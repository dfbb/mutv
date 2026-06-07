import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandSums, createBeatState, beatStyle} from './beatLevels.mjs';

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
