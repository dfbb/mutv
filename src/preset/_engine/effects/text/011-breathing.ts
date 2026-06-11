import type {TextEffect} from '../../types';

// 011 呼吸（低音律动）· BreathingRendererBase.cs（源 example/effect/011-breathing.js）
// demo 用合成节拍；这里改用引擎确定性 bassEnergy（真实音频低频能量，attack0.2/decay0.05）。
export const effect: TextEffect = {
  id: '011', name: '呼吸（低音律动）', src: '呼吸 attack0.2/decay0.05 · BreathingRendererBase.cs', needsAudio: true,
  line(api, ctx) {
    if (!ctx.isCur) return;
    return {base: {scale: 1 + api.bassEnergy * 0.8}};
  },
};
