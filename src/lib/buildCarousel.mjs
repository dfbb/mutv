import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import {buildFragSource, buildPassthroughFragSource, VERT} from './glTransitionFrag.mjs';
import {groupTransitions} from './transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 读取全部 gl-transitions 解析结果（name -> glsl）。 */
function loadTransitions() {
  const script = resolve(HERE, 'gl-transitions/gl-transition-transform.js');
  const dir = resolve(HERE, 'gl-transitions/transitions');
  const json = execSync(`node "${script}" -d "${dir}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024});
  return JSON.parse(json);
}

/**
 * @param {object} opts
 *   images: string[]   public/ 下的图片文件名（相对 IFrame 的 URL）
 *   intvl: number      每张停留秒数
 *   transDur: number   转场秒数（默认 1）
 *   group: 'soft'|'cool'|'hard'
 *   width, height: number
 *   seed: number
 * @returns {string} 自包含 HTML
 */
export function buildCarousel(opts) {
  const {images, intvl, transDur = 1, group, width, height, seed = 1} = opts;
  const all = loadTransitions();
  const names = all.map((t) => t.name);
  const chosen = new Set(groupTransitions(group, names));
  const transFrags = all.filter((t) => chosen.has(t.name)).map((t) => buildFragSource(t.glsl));
  const passthrough = buildPassthroughFragSource();

  const reglSrc = readFileSync(resolve(HERE, 'regl/regl.min.js'), 'utf-8');
  const kbSrc = readFileSync(resolve(HERE, 'kenBurns.mjs'), 'utf-8');
  const runtimeSrc = readFileSync(resolve(HERE, 'carouselRuntime.js'), 'utf-8');

  // kenBurns.mjs 是 ESM（export function）。浏览器内联需去掉 export 关键字，
  // 暴露为全局函数 kenBurnsConfig。
  const kbInline = kbSrc.replace(/export\s+function/g, 'function');

  const config = {
    images,
    intvl,
    transDur,
    width,
    height,
    seed,
    vert: VERT,
    transitions: transFrags,
    passthrough,
  };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
  #cv{display:block;width:100vw;height:100vh}
</style></head><body>
<canvas id="cv"></canvas>
<script>${reglSrc}</script>
<script>${kbInline}</script>
<script>
  var CAROUSEL_CONFIG = ${JSON.stringify(config)};
  CAROUSEL_CONFIG.kenBurns = kenBurnsConfig;
</script>
<script>${runtimeSrc}</script>
</body></html>`;
}
