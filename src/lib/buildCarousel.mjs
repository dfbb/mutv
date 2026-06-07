import {readFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import {buildFragSource, buildPassthroughFragSource, VERT} from './glTransitionFrag.mjs';
import {groupTransitions} from './transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 读取全部 gl-transitions 解析结果。 */
function loadTransitions() {
  const script = resolve(HERE, 'gl-transitions/gl-transition-transform.js');
  const dir = resolve(HERE, 'gl-transitions/transitions');
  const json = execSync(`node "${script}" -d "${dir}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024});
  return JSON.parse(json);
}

/**
 * @param {object} opts
 *   imageUrls: string[]  图片的 URL（相对于 IFrame，即 public/ 下的文件名，由调用方复制）
 *   intvl: number        每张停留秒数
 *   transDur: number     转场秒数（默认 1）
 *   group: 'soft'|'cool'|'hard'
 *   width, height: number
 *   seed: number
 * @returns {string} 自包含 HTML
 */
export function buildCarousel(opts) {
  const {imageUrls, intvl, transDur = 1, group, width, height, seed = 1} = opts;
  const all = loadTransitions();
  const names = all.map((t) => t.name);
  const chosen = new Set(groupTransitions(group, names));
  // Exclude transitions that declare an extra sampler2D (e.g. displacement/luma):
  // they need an external texture map we don't supply, so they'd render broken frames.
  const needsExtraTexture = (glsl) => /uniform\s+sampler2D\s+(?!from\b|to\b)\w+/.test(glsl);
  const transFrags = all
    .filter((t) => chosen.has(t.name) && !needsExtraTexture(t.glsl))
    .map((t) => buildFragSource(t.glsl));
  const passthrough = buildPassthroughFragSource();

  const reglSrc = readFileSync(resolve(HERE, 'regl/regl.min.js'), 'utf-8');
  const kbSrc = readFileSync(resolve(HERE, 'kenBurns.mjs'), 'utf-8');
  const runtimeSrc = readFileSync(resolve(HERE, 'carouselRuntime.js'), 'utf-8');

  const kbInline = kbSrc.replace(/export\s+function/g, 'function');

  const config = {
    images: imageUrls,   // relative URLs served from public/
    intvl,
    transDur,
    width,
    height,
    seed,
    vert: VERT,
    transitions: transFrags,
    passthrough,
  };

  // Embed images as hidden <img> tags. The IFrame's load event — which Remotion
  // waits on before screenshotting — only fires after all <img> elements finish
  // loading. So by the time our script runs, the images are fully decoded and
  // ready for regl.texture(). No crossorigin (same-origin assets aren't tainted).
  const imgTags = imageUrls.map((url, i) =>
    `<img id="ci${i}" src="${url}" style="display:none" />`
  ).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
  #cv{display:block;width:100vw;height:100vh}
</style></head><body>
<canvas id="cv"></canvas>
${imgTags}
<script>${reglSrc}</script>
<script>${kbInline}</script>
<script>
  var CAROUSEL_CONFIG = ${JSON.stringify(config)};
  CAROUSEL_CONFIG.kenBurns = kenBurnsConfig;
</script>
<script>${runtimeSrc}</script>
</body></html>`;
}
