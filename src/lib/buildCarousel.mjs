import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {GROUPS, groupTransitions} from './transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * 构建纯 CSS 背景图轮播 HTML（animate.css 入场动画 + Ken Burns），自包含，置于 <IFrame>。
 *
 * 时间由父级通过 URL hash (#t=<ms>) 驱动，每帧静态渲染，Remotion 截图可靠。
 * 当前图始终满不透明铺底（绝不露黑），下一张图在转场区间用 animate.css 的入场动画，
 * 通过 animation-delay + paused 冻结在该帧进度。
 *
 * @param {object} opts
 *   imageUrls: string[]  图片 URL（public/ 下文件名，由调用方复制）
 *   intvl: number        每张停留秒数
 *   transDur: number     转场秒数（默认 1）
 *   group: 'soft'|'cool'|'hard'
 *   width, height: number
 *   seed: number
 *   onlyTransition?: string  仅用某个动画名（调试/验证用）
 * @returns {string} 自包含 HTML
 */
export function buildCarousel(opts) {
  const {imageUrls, intvl, transDur = 1, group, width, height, seed = 1, onlyTransition} = opts;

  // 候选动画名：onlyTransition 优先，否则按组取 animate.css 入场动画
  const allNames = [...new Set(Object.values(GROUPS).flat())];
  const transitions = onlyTransition
    ? [onlyTransition]
    : groupTransitions(group, allNames);

  const animateCss = readFileSync(resolve(HERE, 'vendor/animate.min.css'), 'utf-8');
  const kbSrc = readFileSync(resolve(HERE, 'kenBurns.mjs'), 'utf-8').replace(/export\s+function/g, 'function');
  const runtimeSrc = readFileSync(resolve(HERE, 'cssCarouselRuntime.js'), 'utf-8');

  const config = {
    images: imageUrls,
    intvl,
    transDur,
    width,
    height,
    seed,
    transitions,
  };

  // 隐藏 <img> 预加载：IFrame 的 load 事件（Remotion 截图前会等待）在所有 <img> 解码后才触发，
  // 故运行时读取尺寸时图片已就绪。同源资源不会污染。
  const imgTags = imageUrls.map((url, i) =>
    `<img id="ci${i}" src="${url}" style="display:none" />`
  ).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>${animateCss}</style>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
  #stage{position:absolute;inset:0;width:100vw;height:100vh;overflow:hidden;background:#000}
  .layer{position:absolute;inset:0;overflow:hidden;will-change:transform,opacity}
  .kb{position:absolute;inset:0;will-change:transform}
  .pic{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .pic.contain{object-fit:contain}
  .pic.blurbg{filter:blur(24px) brightness(0.7);transform:scale(1.15)}
  /* animate.css 默认时长由内联 style 覆盖；这里只保证动画基类生效 */
  .layer{animation-fill-mode:both}
</style>
</head><body>
<div id="stage"></div>
${imgTags}
<script>${kbSrc}</script>
<script>
  var CAROUSEL_CONFIG = ${JSON.stringify(config)};
  CAROUSEL_CONFIG.kenBurns = kenBurnsConfig;
</script>
<script>${runtimeSrc}</script>
</body></html>`;
}
