/**
 * waveformBytes.mjs — 把 Float32 波形窗口转成 butterchurn 要的 Uint8 时域字节。
 * butterchurn AudioProcessor 期望 fftSize=1024 的 Uint8Array(0..255,中心 128)。
 */

export const FFT_SIZE = 1024;

/**
 * 从 wave(Float32,-1..1)起点 start 取 FFT_SIZE 个样本,
 * 映射到 Uint8:value = clamp(round(128 + s*127), 0, 255)。
 * 越界样本按 0(→128)处理。
 */
export function floatWindowToBytes(wave, start) {
  const out = new Uint8Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    const idx = start + i;
    const s = idx >= 0 && idx < wave.length ? wave[idx] : 0;
    let v = Math.round(128 + s * 127);
    if (v < 0) v = 0;
    else if (v > 255) v = 255;
    out[i] = v;
  }
  return out;
}
