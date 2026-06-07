/**
 * 背景图轮播 POC 生成器（脱离 Remotion，直接浏览器验证）。
 *
 * 复用线上同一套 lib：regl + glTransitionFrag wrapper + kenBurns + transitionGroups。
 * 与线上 buildCarousel 的唯一区别：
 *   - 图片 base64 内联（双击打开 file:// 也不会 taint WebGL 纹理）
 *   - RAF + performance.now() 自驱动时间线（无需父级 #t= 注入）
 *   - 顶部控制条：切换转场组 / 间隔 / 转场时长 / 暂停 / 拖时间轴
 *
 * 用法：
 *   node scripts/carousel-poc.mjs                       # 默认 example/mbg, 1080x720
 *   node scripts/carousel-poc.mjs --dir example/mbg --w 720 --h 1080 --intvl 3
 *   node scripts/carousel-poc.mjs --out poc.html
 * 生成后用浏览器打开输出的 html 文件即可。
 */
import {readFileSync, writeFileSync, readdirSync} from 'fs';
import {resolve, dirname, extname, join} from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import {buildFragSource, buildPassthroughFragSource, VERT} from '../src/lib/glTransitionFrag.mjs';
import {groupTransitions, VALID_GROUPS} from '../src/lib/transitionGroups.mjs';
import {kenBurnsConfig} from '../src/lib/kenBurns.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif'};

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) { a[k.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
  }
  return a;
}

/** 解析全部 gl-transitions（同 buildCarousel）。 */
function loadTransitions() {
  const script = resolve(ROOT, 'src/lib/gl-transitions/gl-transition-transform.js');
  const dir = resolve(ROOT, 'src/lib/gl-transitions/transitions');
  return JSON.parse(execSync(`node "${script}" -d "${dir}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024}));
}

const args = parseArgs(process.argv.slice(2));
const dir = resolve(ROOT, args.dir || 'example/mbg');
const width = parseInt(args.w || '1080', 10);
const height = parseInt(args.h || '720', 10);
const intvl = parseFloat(args.intvl || '3');
const transDur = parseFloat(args.trans || '1');
const group = args.group || 'soft';
const seed = parseInt(args.seed || '1', 10);
const out = resolve(ROOT, args.out || 'carousel-poc.html');

if (!VALID_GROUPS.includes(group)) {
  console.error(`--group must be one of ${VALID_GROUPS.join('|')}, got: ${group}`);
  process.exit(1);
}

const files = readdirSync(dir)
  .filter((f) => IMG_EXT.has(extname(f).toLowerCase()))
  .sort();
if (files.length === 0) { console.error(`No images in ${dir}`); process.exit(1); }

// base64 内联图片（file:// 下也能安全用于 WebGL 纹理）
const images = files.map((f) => {
  const buf = readFileSync(join(dir, f));
  return {name: f, dataUrl: `data:${MIME[extname(f).toLowerCase()]};base64,${buf.toString('base64')}`};
});

// 选中组的转场 frag（剔除需要额外 sampler2D 的）
const all = loadTransitions();
const names = all.map((t) => t.name);
const chosen = new Set(groupTransitions(group, names));
const needsExtraTexture = (glsl) => /uniform\s+sampler2D\s+(?!from\b|to\b)\w+/.test(glsl);
// --only <name>: 只装一个指定转场，便于复现/验证单个转场（如 SimpleFlip 中点黑屏）
const only = typeof args.only === 'string' ? args.only : null;
const transFrags = all
  .filter((t) => (only ? t.name === only : chosen.has(t.name)) && !needsExtraTexture(t.glsl))
  .map((t) => ({name: t.name, frag: buildFragSource(t.glsl)}));
if (transFrags.length === 0) { console.error(`No transitions matched (only=${only})`); process.exit(1); }
const passthrough = buildPassthroughFragSource();

const reglSrc = readFileSync(resolve(ROOT, 'src/lib/regl/regl.min.js'), 'utf-8');
const kbSrc = readFileSync(resolve(ROOT, 'src/lib/kenBurns.mjs'), 'utf-8').replace(/export\s+function/g, 'function');

const config = {
  images: images.map((im) => ({name: im.name})),
  intvl, transDur, width, height, seed,
  vert: VERT,
  transitions: transFrags,
  passthrough,
};

function buildHtml({config, images, kbSrc, reglSrc, group}) {
  const imgTags = images.map((im, i) => `<img id="ci${i}" src="${im.dataUrl}" crossorigin="anonymous" style="display:none">`).join('\n');
  const runtime = RUNTIME_JS.replace('__RUNTIME_TAIL__', () => RUNTIME_TAIL);
  return HTML_TEMPLATE
    .replace('/*__REGL__*/', () => reglSrc)
    .replace('/*__KB__*/', () => kbSrc)
    .replace('/*__CONFIG__*/', () => JSON.stringify(config))
    .replace('<!--__IMGS__-->', () => imgTags)
    .replace('__RUNTIME__', () => runtime)
    .replace(/__GROUP__/g, group);
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Carousel POC (__GROUP__)</title>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#111;font-family:system-ui,sans-serif}
  #cv{display:block;position:absolute;top:0;left:0;width:100vw;height:100vh}
  #bar{position:fixed;left:0;right:0;bottom:0;z-index:10;display:flex;gap:12px;align-items:center;
       padding:8px 12px;background:rgba(0,0,0,.6);color:#eee;font-size:13px;backdrop-filter:blur(4px)}
  #bar button{background:#2a2a2a;color:#eee;border:1px solid #444;border-radius:4px;padding:4px 10px;cursor:pointer}
  #bar input[type=range]{flex:1;min-width:120px}
  #info{font-variant-numeric:tabular-nums;white-space:nowrap;opacity:.85}
  #hud{position:fixed;top:0;left:0;z-index:20;margin:0;padding:6px 10px;max-width:60vw;
       background:rgba(0,0,0,.7);color:#0f0;font:12px/1.4 monospace;white-space:pre-wrap;pointer-events:none}
</style></head><body>
<canvas id="cv"></canvas>
<pre id="hud">booting…</pre>
<!--__IMGS__-->
<div id="bar">
  <button id="play">⏸</button>
  <input id="seek" type="range" min="0" max="1000" value="0">
  <span id="info"></span>
</div>
<script>
  // top-level error trap so even a script-load failure shows on screen
  window.__hud = function (msg, color) {
    var h = document.getElementById('hud'); if (!h) return;
    h.textContent = msg; if (color) h.style.color = color;
  };
  window.addEventListener('error', function (e) {
    window.__hud('ERROR: ' + (e.message || e.error) + '\\n' + (e.filename || '') + ':' + e.lineno, '#f55');
  });
</script>
<script>/*__REGL__*/</script>
<script>/*__KB__*/</script>
<script>
var CAROUSEL_CONFIG = /*__CONFIG__*/;
CAROUSEL_CONFIG.kenBurns = kenBurnsConfig;
</script>
<script>__RUNTIME__</script>
</body></html>`;

const RUNTIME_JS = `
window.addEventListener('load', function () {
  var C = CAROUSEL_CONFIG;
  var canvas = document.getElementById('cv');
  canvas.width = C.width; canvas.height = C.height;
  var hud = window.__hud || function(){};
  var regl;
  try {
    regl = createREGL({canvas: canvas, attributes: {preserveDrawingBuffer: true}});
  } catch (e) { hud('createREGL threw: ' + e.message, '#f55'); return; }
  if (!regl) { hud('createREGL returned null — WebGL unavailable in this context', '#f55'); return; }
  var screenAR = C.width / C.height;


  // deterministic PRNG (mulberry32) — same as production runtime
  var seed = C.seed >>> 0;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  var total = C.images.length;
  var slides = [];
  var loadReport = [];
  for (var i = 0; i < total; i++) {
    var img = document.getElementById('ci' + i);
    var ok = img && img.naturalWidth > 0;
    loadReport.push('ci' + i + ':' + (ok ? img.naturalWidth + 'x' + img.naturalHeight : 'NOT-LOADED'));
    slides.push(ok
      ? {tex: regl.texture({data: img, flipY: true}), ar: img.naturalWidth / img.naturalHeight, name: C.images[i].name}
      : null);
  }
  hud('regl OK · transitions=' + C.transitions.length + '\\n' + loadReport.join('  '), '#0f0');

  function kb(i) { return C.kenBurns(slides[i].ar, screenAR); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function panVec(cfg, t) {
    var amt = cfg.panAmount * (t - 0.5);
    return cfg.panAxis === 'x' ? [amt, 0] : cfg.panAxis === 'y' ? [0, amt] : [0, 0];
  }
  function zoomAt(cfg, t) { return lerp(cfg.zoomFrom, cfg.zoomTo, t); }
  function modeNum(cfg) { return cfg.mode === 'blur-contain' ? 5 : 0; }
__RUNTIME_TAIL__`;

const RUNTIME_TAIL = `
  // regl draw command cache (passthrough as fallback) — same as production
  var cmdCache = {};
  function compile(frag) {
    return regl({
      frag: frag, vert: C.vert,
      attributes: {_p: [[-1,-1],[3,-1],[-1,3]]},
      uniforms: {
        progress: regl.prop('progress'), ratio: screenAR,
        from: regl.prop('from'), to: regl.prop('to'),
        fromR: regl.prop('fromR'), toR: regl.prop('toR'),
        fromMode: regl.prop('fromMode'), toMode: regl.prop('toMode'),
        fromZoom: regl.prop('fromZoom'), toZoom: regl.prop('toZoom'),
        fromPan: regl.prop('fromPan'), toPan: regl.prop('toPan'),
      },
      count: 3,
    });
  }
  var passthroughCmd;
  try { passthroughCmd = compile(C.passthrough); }
  catch (e) { hud('passthrough shader FAILED to compile:\\n' + e.message, '#f55'); throw e; }
  cmdCache[C.passthrough] = passthroughCmd;
  function getCmd(frag) {
    if (cmdCache[frag] === undefined) {
      try { cmdCache[frag] = compile(frag); }
      catch (e) { cmdCache[frag] = passthroughCmd; }
    }
    return cmdCache[frag];
  }

  // per-boundary transition pick (deterministic, by step index)
  var boundary = {};
  function transFor(step) {
    if (!boundary[step]) boundary[step] = C.transitions[Math.floor(rand() * C.transitions.length)];
    return boundary[step];
  }

  var n = total;
  var cycle = C.intvl + C.transDur;
  var lastName = '';

  function render(elapsed) {
    for (var k = 0; k < n; k++) { if (!slides[k] || !slides[k].tex) return; }
    var step = Math.floor(elapsed / cycle);
    var inStep = elapsed - step * cycle;
    var cur = ((step % n) + n) % n;
    var nxt = (cur + 1) % n;
    regl.clear({color: [0, 0, 0, 1]});
    if (inStep < C.intvl) {
      var th = inStep / C.intvl;
      var c = kb(cur);
      getCmd(C.passthrough)({
        progress: 0,
        from: slides[cur].tex, to: slides[cur].tex,
        fromR: slides[cur].ar, toR: slides[cur].ar,
        fromMode: modeNum(c), toMode: modeNum(c),
        fromZoom: zoomAt(c, th), toZoom: zoomAt(c, th),
        fromPan: panVec(c, th), toPan: panVec(c, th),
      });
      lastName = 'hold #' + cur + ' (' + slides[cur].name + ') bucket=' + c.bucket;
    } else {
      var p = (inStep - C.intvl) / C.transDur;
      var cc = kb(cur), cn = kb(nxt);
      var tr = transFor(step);
      getCmd(tr.frag)({
        progress: p,
        from: slides[cur].tex, to: slides[nxt].tex,
        fromR: slides[cur].ar, toR: slides[nxt].ar,
        fromMode: modeNum(cc), toMode: modeNum(cn),
        fromZoom: zoomAt(cc, 1), toZoom: zoomAt(cn, 0),
        fromPan: panVec(cc, 1), toPan: panVec(cn, 0),
      });
      lastName = 'trans [' + tr.name + '] ' + cur + '→' + nxt + ' p=' + p.toFixed(2);
    }
  }

  // --- self-driving timeline + control bar ---
  var loopDur = n * cycle;             // one full cycle through all images, in seconds
  var playing = true;
  var t0 = performance.now();
  var pausedAt = 0;                    // elapsed seconds frozen while paused
  var playBtn = document.getElementById('play');
  var seek = document.getElementById('seek');
  var info = document.getElementById('info');
  var seeking = false;

  function elapsedNow() {
    if (!playing) return pausedAt;
    return ((performance.now() - t0) / 1000) % loopDur;
  }

  playBtn.addEventListener('click', function () {
    if (playing) { pausedAt = elapsedNow(); playing = false; playBtn.textContent = '▶'; }
    else { t0 = performance.now() - pausedAt * 1000; playing = true; playBtn.textContent = '⏸'; }
  });
  seek.addEventListener('input', function () {
    seeking = true;
    pausedAt = (seek.value / 1000) * loopDur;
    if (playing) { pausedAt = pausedAt; playing = false; playBtn.textContent = '▶'; }
    render(pausedAt);
    updateInfo(pausedAt);
  });
  seek.addEventListener('change', function () { seeking = false; });

  function updateInfo(e) {
    info.textContent = e.toFixed(2) + 's / ' + loopDur.toFixed(0) + 's  ·  ' + lastName;
  }

  function frame() {
    if (!seeking) {
      var e = elapsedNow();
      render(e);
      if (!seek.matches(':active')) seek.value = Math.round((e / loopDur) * 1000);
      updateInfo(e);
      if (!window.__diag) {
        window.__diag = 1;
        try {
          var gl = regl._gl;
          var px = new Uint8Array(4);
          gl.readPixels((C.width/2)|0, (C.height/2)|0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          hud('regl OK · gl center px=[' + px[0]+','+px[1]+','+px[2]+'] · group=__GROUP__',
              px[0]+px[1]+px[2] > 0 ? '#0f0' : '#fb0');
        } catch (err) { hud('diag err: ' + err.message, '#f55'); }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
`;

writeFileSync(out, buildHtml({config, images, kbSrc, reglSrc, group}));
console.log(`POC written: ${out}`);
console.log(`  images=${images.length} (${files.join(', ')})`);
console.log(`  ${width}x${height}  intvl=${intvl}s  trans=${transDur}s  group=${group}  transitions=${transFrags.length}`);
console.log(`  open it in a browser to verify.`);



