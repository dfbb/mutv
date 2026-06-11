import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../_shared/BackgroundLayer';
import {StudioControlBar} from '../_shared/StudioControlBar';
import {FontLoader} from '../_shared/FontLoader';
import {buildLineInfo, currentLineIndex} from './timing.mjs';
import type {VisualEffect} from './types';

// visual 引擎：把 CodePen 特效（已由 convert-effects.mjs 转换的 css + html 模板）
// 渲染进 Remotion。CSS 动画在逐帧渲染下不推进，故全部暂停，并用 --fx-t 注入每行时间
// 驱动 delay；逐字露出用 --reveal 遮罩（与 demo 的 renderVisual 一致）。
//
// 见 example/lyrics-demo.html 的 buildTpl / VISUAL_OVERRIDE / renderVisual。

// 转义 HTML 文本与属性值：含引号，避免歌词内的 " ' 破坏属性（部分 letterTpl 把
// {ch} 注入 data-c="{ch}" 这类双引号属性）。
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// 构建内层 HTML：letterTpl 逐字模板 或默认 <span class="bl-l">；再代入 effect.html。
// 注意：replace 的替换串用函数形式，避免歌词中的 $（$&/$1 等）被当作替换模式而损坏输出。
function buildTpl(effect: VisualEffect, line: string): string {
  const chars = [...line];
  const safe = esc(line) || '&nbsp;';
  let letters: string;
  if (effect.letterTpl) {
    letters =
      chars
        .map((ch, i) =>
          effect.letterTpl!
            .replace(/\{i\}/g, () => String(i))
            .replace(/\{n\}/g, () => String(chars.length))
            .replace(/\{ch\}/g, () => (ch === ' ' ? '&nbsp;' : esc(ch))),
        )
        .join('') || '&nbsp;';
  } else {
    letters =
      chars
        .map(
          (ch, i) =>
            `<span class="bl-l" style="--i:${i};--n:${chars.length}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`,
        )
        .join('') || '&nbsp;';
  }
  return (effect.html || '<div class="bl-line">{{LINE}}</div>')
    .replace(/\{\{LETTERS\}\}/g, () => letters)
    .replace(/\{\{LINE\}\}/g, () => safe);
}

// 8 方向勾边偏移（与 _shared/TextColorOverride 一致），em 随字号缩放
const OUTLINE_OFFSETS = [
  '-0.05em -0.05em',
  '0.05em -0.05em',
  '-0.05em 0.05em',
  '0.05em 0.05em',
  '-0.07em 0',
  '0.07em 0',
  '0 -0.07em',
  '0 0.07em',
];

// 引擎统一覆盖：暂停动画 + 中和 .bl-wrap 面板底色 + 字号/换行 + 逐字露出遮罩 +
// （仅当指定时）颜色覆盖。全部 scope 到 .fx-<id> 下。改编自 demo 的 VISUAL_OVERRIDE。
//
// 面板底色中和：visual 特效常给 .bl-wrap 加 background（盒/框/贴纸面板）。该面板按
// max-content 撑满整行，逐字露出时未露出的字仍占位 → 已露出文字被推到面板左缘、首字被
// 面板左边裁切。demo 的 VISUAL_OVERRIDE 用 `background:transparent !important` 抹掉了
// 这层面板（仅余文字），移植时漏掉此规则导致 ~13 个面板类特效首字左缘裁切。此处仅中和
// .bl-wrap 自身底色，不动其子元素（保留 background-clip:text 取色的渐变文字特效）。
function overrideCss(id: string, fontSize: number, fg: string, bg: string): string {
  const p = `.fx-${id}`;
  const mask = `linear-gradient(90deg,#000 calc(var(--reveal,1)*100% - 0.4ch), transparent calc(var(--reveal,1)*100% + 0.1ch))`;
  let css = `
${p} * { animation-play-state: paused !important; }
/* 默认文字色：demo 的 VISUAL_OVERRIDE 强制 .bl-wrap* 为白字；移植时为保留渐变文字
   (background-clip:text + text-fill-color:transparent) 改成只在 .fx-<id> 上设低优先级
   白色(color 可继承、fill-color 缺省取 currentColor)，无自带颜色的特效(012/047 等)
   才不再黑字黑底；任何特效自身的颜色/渐变规则(更高 specificity)都覆盖它。 */
${p} { color: #fff; }
${p} .bl-wrap { background: transparent !important; }
${p} .bl-wrap, ${p} .bl-wrap * { font-size: ${fontSize}px !important; white-space: nowrap !important; }
${p} .bl-wrap {
  width: max-content; max-width: 94%; margin: 0 auto; line-height: 1.3;
  -webkit-mask-image: ${mask};
          mask-image: ${mask};
}`;
  if (fg || bg) {
    const decls: string[] = [];
    if (fg) {
      decls.push(`color: ${fg} !important;`);
      decls.push(`-webkit-text-fill-color: ${fg} !important;`);
      // 用 background 简写而非仅 background-image：部分特效用 background 简写注入
      // 取色渐变(specificity 更高 + !important)，仅覆盖 background-image 盖不住；连同
      // background 一并清空，让字面回到 text-fill-color。
      decls.push(`background: none !important;`);
      // 关键：渐变文字特效保留 background-clip:text（取色渐变 clip 进字形）。若只清
      // background 而不复位 clip，则 clip:text + 无背景 = 字形被裁成透明，fill-color 也
      // 显不出（055 全黑 / 028 仍露父级噪点底色）。复位 clip 到 border-box 让指定 fg 显出。
      decls.push(`-webkit-background-clip: border-box !important;`);
      decls.push(`background-clip: border-box !important;`);
    }
    decls.push(`-webkit-text-stroke-color: ${bg || fg} !important;`);
    if (bg) {
      const shadow = OUTLINE_OFFSETS.map((off) => `${off} 0 ${bg}`).join(', ');
      decls.push(`text-shadow: ${shadow} !important;`);
    }
    // 多个特效手写了 `.fx-<id> .bl-wrap .x` 级(最深 0,4,0)+!important 规则刻意恢复自身
    // 渐变/描边色("覆盖顶层 VISUAL_OVERRIDE 的强制色")。!important 平手时由 specificity
    // 决出胜负，故传色时把 .fx-<id> 重复 4 次，叠加 .bl-wrap 后达 (0,5,*) 稳压这些特效
    // 规则，让全部可见文字落到指定 fg/bg。仅在传色时启用，不影响默认渲染。
    const pp = `${p}${p}${p}${p}`; // 4×id + .bl-wrap = (0,5,*)，压过特效最深 (0,4,0) 规则
    css += `
${pp} .bl-wrap, ${pp} .bl-wrap *, ${pp} .bl-wrap *::before, ${pp} .bl-wrap *::after { ${decls.join(' ')} }`;
  }
  return css;
}

export const VisualLyrics: React.FC<MVInputProps & {effect: VisualEffect}> = ({
  effect,
  audioFileName,
  backgroundImage,
  backgroundVideo,
  backgroundAnim,
  backgroundCarousel,
  lyrics,
  lyricOffset,
  fontFamily,
  fontFile,
  fontScale = 1,
  fontFgColor = '',
  fontBgColor = '',
}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();

  const audioSrc = audioFileName.startsWith('http') ? audioFileName : staticFile(audioFileName);

  const ms = (frame / fps) * 1000;
  const info = buildLineInfo(lyrics, lyricOffset);
  const cur = currentLineIndex(info, ms);
  const line = cur < 0 ? '' : info[cur].chars.join('');
  const fontSize = Math.round(height * 0.055 * fontScale);

  // 驱动 --fx-t 的每行时间（秒）：global 用全局 ms，line 用相对本行起点的 ms。
  const tMs = effect.timeBase === 'global' ? ms : cur < 0 ? 0 : ms - info[cur].start;

  // 逐字露出：本行已到时间的字符数 / 总字符数
  let reveal = 1;
  if (cur >= 0) {
    const cts = info[cur].charTimes;
    let n = 0;
    for (const ct of cts) {
      if (ms >= ct.start) n++;
      else break;
    }
    reveal = cts.length ? n / cts.length : 1;
  }

  const ff = fontFamily ? `"${fontFamily}", sans-serif` : 'sans-serif';

  const scopedStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ['--fx-t' as string]: `${(tMs / 1000).toFixed(4)}s`,
    ['--reveal' as string]: reveal,
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#000', fontFamily: ff}}>
      <BackgroundLayer
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundAnim={backgroundAnim}
        backgroundCarousel={backgroundCarousel}
        fallbackGradient="#000"
      />
      <StudioControlBar />
      <FontLoader fontFamily={fontFamily} fontFile={fontFile} />

      <Audio src={audioSrc} />

      <style>{effect.css + overrideCss(effect.id, fontSize, fontFgColor, fontBgColor)}</style>

      {/* key 随行变化（line 模式）→ 切行时重挂子树，使一次性动画每行重新开始，
          复现 demo 的 Shadow-DOM 重建；global 模式用固定 key 不重挂。 */}
      <div
        className={`fx-${effect.id}`}
        key={effect.timeBase === 'global' ? 'g' : cur}
        style={scopedStyle}
        dangerouslySetInnerHTML={{__html: `<div class="bl-wrap">${buildTpl(effect, line)}</div>`}}
      />
    </AbsoluteFill>
  );
};
