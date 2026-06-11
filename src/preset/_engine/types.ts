import type {CSSProperties} from 'react';

export interface CharTime { ch: string; start: number; dur: number } // ms
export interface LineInfo { start: number; end: number; dur: number; chars: string[]; charDur: number; charTimes: CharTime[] }

// text 类效果 API（demo makeApi 的 Remotion 版，全部确定性输入）
export interface TextEffectApi {
  ms: number;            // 全局毫秒
  cur: number;           // 当前行索引，-1 = 未开始
  width: number; height: number;
  fontSize: number;      // height*0.055*fontScale
  GAP: number; HALF: number;
  DEFAULT_SCALE: number; LONG_SYLLABLE: number; FLOAT_PX: number; FLOAT_DUR: number;
  clamp(v: number, a: number, b: number): number;
  lerp(a: number, b: number, t: number): number;
  easeOutSine(x: number): number;
  bassEnergy: number;    // 011 用，其余为 0
}

export interface LineCtx { i: number; isCur: boolean; d: number; df: number; info: LineInfo }

// text 效果返回的样式由引擎合并到行/字 span 上（demo 直接改 DOM，这里改为返回值）
export interface LineRender {
  base?: {scale?: number; opacity?: number; rotate?: number; origin?: string};
  lineStyle?: CSSProperties;
  charStyles?: (CSSProperties | undefined)[];
}

export interface TextEffect {
  id: string; name: string; src: string;
  needsAudio?: boolean;  // true → 引擎计算 bassEnergy（011 呼吸）
  frame?(api: TextEffectApi): {trackTransform?: string; stagePerspective?: string; stageMask?: string} | void;
  line?(api: TextEffectApi, ctx: LineCtx): LineRender | void;
}

export interface VisualEffect {
  id: string; name: string; src: string;
  css: string;           // 已 scope（.fx-<id> 前缀、keyframes 已改名、delay 已合成 var(--fx-t)）
  html: string;          // 模板：{{LINE}} / {{LETTERS}}
  letterTpl?: string;    // 逐字模板：{i} {n} {ch}
  timeBase?: 'line' | 'global'; // 默认 'line'
}
