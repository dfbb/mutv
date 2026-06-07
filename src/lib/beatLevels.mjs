/**
 * beatLevels.mjs — butterchurn 式音频频段归一化(复刻 3rd/butterchurn 的 audioLevels.js)。
 *
 * 把频谱切成 bass/mid/treb 三段求和,各除以一个 EMA 长时均值(longAvg),得到
 * 不随整体音量漂移的"此刻比平时响多少"相对值(基线 ~1.0,鼓点时冲高)。
 * 纯函数,无 Remotion / DOM 依赖,可单测。
 */

// 频段(Hz),取自 butterchurn:bass 20-320, mid 320-2800, treb 2800-11025
export const BANDS = [
  [20, 320],
  [320, 2800],
  [2800, 11025],
];

/**
 * 对线性频谱(spectrum[i] 为第 i 个 bin 的幅度,频率 0..nyquist 线性分布)
 * 按 Hz 频段求和。返回 [bassSum, midSum, trebSum]。
 */
export function bandSums(spectrum, sampleRate) {
  const nyquist = sampleRate / 2;
  const binHz = nyquist / spectrum.length;
  return BANDS.map(([lo, hi]) => {
    const start = Math.max(0, Math.floor(lo / binHz));
    const stop = Math.min(spectrum.length, Math.ceil(hi / binHz));
    let sum = 0;
    for (let i = start; i < stop; i++) sum += spectrum[i];
    return sum;
  });
}

// butterchurn: rate ** (baseFPS / FPS),把 30fps 调成的 EMA 速率适配到当前 fps。
function adjustRate(rate, fps) {
  return rate ** (30.0 / fps);
}

/**
 * 创建一个有状态的归一化器,复刻 butterchurn 的 avg/longAvg 递推。
 * 必须从 frame 0 起、按帧顺序喂入(组件侧用缓存保证),以确保确定性。
 *
 * @param {number} fps
 * @returns {{step(imm: number[], frame: number): {bass:number,mid:number,treb:number}}}
 */
export function createBeatState(fps) {
  const avg = [1, 1, 1];
  const longAvg = [1, 1, 1];
  return {
    step(imm, frame) {
      const out = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        let rateAvg = imm[i] > avg[i] ? 0.2 : 0.5;
        rateAvg = adjustRate(rateAvg, fps);
        avg[i] = avg[i] * rateAvg + imm[i] * (1 - rateAvg);

        let rateLong = frame < 50 ? 0.9 : 0.992;
        rateLong = adjustRate(rateLong, fps);
        longAvg[i] = longAvg[i] * rateLong + imm[i] * (1 - rateLong);

        out[i] = longAvg[i] < 0.001 ? 1.0 : imm[i] / longAvg[i];
      }
      return {bass: out[0], mid: out[1], treb: out[2]};
    },
  };
}

/**
 * 把相对 levels(基线 1.0)映射成 CSS / 时间驱动参数。
 * clamp 到 [0,2] 防极端帧炸裂。系数保守(见设计文档)。
 */
export function beatStyle({bass, mid, treb}) {
  const c = (x) => Math.max(0, Math.min(2, x - 1));
  return {
    scale: 1 + 0.04 * c(bass), // 低频缩放脉冲
    brightness: 1 + 0.06 * c(mid), // 亮度闪动
    saturate: 1 + 0.1 * c(treb), // 饱和闪动
    timeGain: 1 + 0.6 * c(bass), // 时钟加速增益
  };
}
