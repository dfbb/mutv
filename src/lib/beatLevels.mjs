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
 *
 * 复刻 butterchurn:先用 4 个 Hz 边界点(20/320/2800/11025)各算一个 bin 索引
 * (Math.round 后 clamp 到 [0, length]),再串成 3 个相邻互斥区间
 * [e0,e1) / [e1,e2) / [e2,e3) —— 前段 stop === 后段 start,边界 bin 只计入一段。
 */
export function bandSums(spectrum, sampleRate) {
  const nyquist = sampleRate / 2;
  const binHz = nyquist / spectrum.length;
  const len = spectrum.length;
  const edges = [20, 320, 2800, 11025].map((hz) =>
    Math.max(0, Math.min(len, Math.round(hz / binHz)))
  );
  const out = [0, 0, 0];
  for (let b = 0; b < 3; b++) {
    let sum = 0;
    for (let i = edges[b]; i < edges[b + 1]; i++) sum += spectrum[i];
    out[b] = sum;
  }
  return out;
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
  const c = (x) => Math.max(0, Math.min(2, x - 1)); // 把相对偏移 (level-1) clamp 到 [0,2]
  return {
    scale: 1 + 0.04 * c(bass), // 低频缩放脉冲
    brightness: 1 + 0.06 * c(mid), // 亮度闪动
    saturate: 1 + 0.1 * c(treb), // 饱和闪动
    timeGain: 1 + 0.6 * c(bass), // 时钟加速增益(瞬时;积分见 advanceVirtualTime)
  };
}

// 漏积分松弛系数:每帧把虚拟时间向实时回拉的比例(~1/LEAK 帧的时间常数)。
// 0.05 ≈ 24fps 下 0.8s 归位,既保留鼓点踢感又快速消除超前量。
export const VT_LEAK = 0.05;

/**
 * 把瞬时 timeGain 积分成 iframe 的虚拟时间(ms),并松弛回实时以消除净漂移。
 *
 * 背景:beatStyle.timeGain ∈ [1, 2.2] 恒 ≥ 1(只加速不减速)。若直接累加
 * `vt += dt * timeGain`,则整首歌的平均速率 > 实时,时间积分型动画(canvas
 * rAF / VANTA / p5)会系统性偏快——这正是录制视频"速度过快"的根因。
 *
 * 解法(漏积分):鼓点帧虚拟时间瞬时超前(保留"踢一下"的加速观感),随后每帧
 * 按 VT_LEAK 比例把超前量拉回实时。稳态下超前量有界、与帧数无关,故长期平均
 * 速率严格等于实时,不再整体偏快。
 *
 * 必须从 frame 0 起、按帧顺序调用(组件侧用缓存保证),以确保确定性。
 *
 * @param {number} prevVtMs 上一帧虚拟时间(frame 0 传 0)
 * @param {number} timeGain 当前帧瞬时增益(来自 beatStyle,≥1)
 * @param {number} frame    当前帧序号(从 0 起)
 * @param {number} fps
 * @returns {number} 当前帧虚拟时间(ms)
 */
export function advanceVirtualTime(prevVtMs, timeGain, frame, fps) {
  const dt = 1000 / fps;
  const vt = prevVtMs + dt * timeGain; // 鼓点瞬时加速:虚拟时间超前于实时
  return vt - VT_LEAK * (vt - frame * dt); // 松弛回实时:消除净漂移
}
