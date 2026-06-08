import {test} from 'node:test';
import assert from 'node:assert/strict';
import {floatWindowToBytes, FFT_SIZE} from './waveformBytes.mjs';

test('FFT_SIZE 为 1024', () => {
  assert.equal(FFT_SIZE, 1024);
});

test('floatWindowToBytes: 长度恒为 FFT_SIZE', () => {
  const wave = new Float32Array(5000);
  const out = floatWindowToBytes(wave, 1000);
  assert.equal(out.length, FFT_SIZE);
  assert.ok(out instanceof Uint8Array);
});

test('floatWindowToBytes: 0 → 128(静音中心)', () => {
  const wave = new Float32Array(2048); // 全 0
  const out = floatWindowToBytes(wave, 0);
  assert.ok(out.every((b) => b === 128), '静音应全 128');
});

test('floatWindowToBytes: +1 → 255, -1 → ~0(钳制)', () => {
  const wave = new Float32Array(FFT_SIZE);
  wave[0] = 1; wave[1] = -1; wave[2] = 2; wave[3] = -2; // 超界测试钳制
  const out = floatWindowToBytes(wave, 0);
  assert.equal(out[0], 255);
  assert.equal(out[1], 1);   // -1 → 128 + (-127) = 1
  assert.equal(out[2], 255); // 钳制
  assert.equal(out[3], 0);   // 钳制
});

test('floatWindowToBytes: 越界起点用 0 补齐(末尾窗口)', () => {
  const wave = new Float32Array(FFT_SIZE + 10);
  wave.fill(0);
  const out = floatWindowToBytes(wave, FFT_SIZE); // 起点接近末尾,后段越界
  assert.equal(out.length, FFT_SIZE);
  assert.ok(out.every((b) => b === 128)); // 越界补 0 → 128
});
