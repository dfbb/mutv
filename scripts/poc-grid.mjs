/**
 * 转场验证网格 POC（脱离 Remotion，单 HTML，浏览器直接打开）。
 *
 * 把指定组的「全部」转场并排成网格，每格一个独立 WebGL canvas，渲染 from→to 的转场。
 * 顶部一个全局 progress 滑块同步 scrub 所有格子（默认停在 0.5 中点 —— 露黑最常发生处）。
 * 每格按多点采样自动检测「是否露黑」：若中点画面整屏接近纯黑，则该格标红高亮，
 * 顶部汇总计数。这样打开一个文件即可一眼扫出哪些转场在中点塌缩成黑。
 *
 * 复用线上同一套 lib：glTransitionFrag（含哨兵/NaN 兜底）+ kenBurns + transitionGroups。
 * 图片 base64 内联，双击 file:// 打开也不会 taint WebGL 纹理。
 *
 * 用法：
 *   node scripts/poc-grid.mjs                          # soft 组, example/mbg, 1080x720 比例
 *   node scripts/poc-grid.mjs --group cool --dir example/mbg
 *   node scripts/poc-grid.mjs --group hard --out poc-hard.html
 *   node scripts/poc-grid.mjs --w 720 --h 1080         # 竖屏比例
 */
import {readFileSync, writeFileSync, readdirSync} from 'fs';
import {resolve, dirname, extname, join} from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';
import {buildFragSource, buildPassthroughFragSource, VERT} from '../src/lib/glTransitionFrag.mjs';
import {groupTransitions, VALID_GROUPS} from '../src/lib/transitionGroups.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif'};

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) a[k.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return a;
}

// ── 浏览器端运行时：用「单个」WebGL canvas，把每个转场渲染到各自的 viewport 子矩形（tile）。
//    给每格建独立 context 会撞浏览器的 WebGL context 上限（约 16），而逐格 drawImage 拷贝
//    在一个同步循环里只有第一格存活 —— 所以用单 canvas + 分块 viewport 才可靠。
//    标签与「露黑」高亮用一层绝对定位的 HTML 网格叠加在 canvas 上。
const RUNTIME = String.raw`
(function () {
  var stage = document.getElementById('stage');
  var glCanvas = document.getElementById('cv');
  var overlay = document.getElementById('overlay');
  var probe = document.getElementById('prog');
  var pval = document.getElementById('pval');
  var sum = document.getElementById('sum');
  var midBtn = document.getElementById('mid');
  var playBtn = document.getElementById('play');

  var imgEls = [document.getElementById('src0'), document.getElementById('src1')];
  var screenAR = CFG.width / CFG.height;

  var COLS = CFG.cols, N = CFG.transitions.length, ROWS = Math.ceil(N / COLS);
  var TW = CFG.tileW, TH = Math.round(TW / screenAR);
  glCanvas.width = COLS * TW; glCanvas.height = ROWS * TH;

  var regl, gl;
  try { regl = createREGL({canvas: glCanvas, attributes: {preserveDrawingBuffer: true}}); gl = regl._gl; }
  catch (e) { sum.innerHTML = '<span class="bad">createREGL 失败: ' + e.message + '</span>'; return; }

  // 叠加层：每个 tile 一个 label div，绝对定位到对应像素块（CSS 像素与 canvas 像素同尺寸时一一对应）
  overlay.style.width = glCanvas.width + 'px'; overlay.style.height = glCanvas.height + 'px';
  var labels = CFG.transitions.map(function (tr, i) {
    var col = i % COLS, row = (i / COLS) | 0;
    var box = document.createElement('div'); box.className = 'tilebox';
    box.style.left = (col * TW) + 'px'; box.style.top = (row * TH) + 'px';
    box.style.width = TW + 'px'; box.style.height = TH + 'px';
    var cap = document.createElement('div'); cap.className = 'tcap';
    var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = tr.name;
    var st = document.createElement('span'); st.className = 'st';
    cap.appendChild(nm); cap.appendChild(st); box.appendChild(cap);
    overlay.appendChild(box);
    return {box: box, st: st, col: col, row: row};
  });

  // 每个转场编译一个 draw command（同一 context，viewport 作为 prop 决定画到哪个 tile）
  var draws = CFG.transitions.map(function (tr, i) {
    var col = i % COLS, row = (i / COLS) | 0;
    // WebGL 视口原点在左下；tile 行号是自上而下，需翻转到自下而上
    var vy = (ROWS - 1 - row) * TH;
    try {
      var d = regl({
        frag: tr.frag, vert: CFG.vert,
        attributes: {_p: [[-1,-1],[3,-1],[-1,3]]},
        viewport: {x: col * TW, y: vy, width: TW, height: TH},
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
      return {draw: d, broken: false, col: col, row: row, vy: vy};
    } catch (e) {
      labels[i].st.textContent = 'compile FAIL'; labels[i].st.className = 'st bad';
      labels[i].box.classList.add('black');
      return {draw: null, broken: true, col: col, row: row, vy: vy};
    }
  });

  function ready() { return imgEls.every(function (im) { return im && im.naturalWidth > 0; }); }
  function kb(ar) { return CFG.kenBurns(ar, screenAR); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function panVec(cfg, t) { var amt = cfg.panAmount * (t - 0.5); return cfg.panAxis === 'x' ? [amt, 0] : cfg.panAxis === 'y' ? [0, amt] : [0, 0]; }
  function zoomAt(cfg, t) { return lerp(cfg.zoomFrom, cfg.zoomTo, t); }
  function modeNum(cfg) { return cfg.mode === 'blur-contain' ? 5 : 0; }

  var tex = [], ar = [];
  function initTextures() {
    ar = [imgEls[0].naturalWidth / imgEls[0].naturalHeight, imgEls[1].naturalWidth / imgEls[1].naturalHeight];
    tex = [regl.texture({data: imgEls[0], flipY: true}), regl.texture({data: imgEls[1], flipY: true})];
  }

  // tile 内多点采样（相对 tile 左下角的归一化坐标 → 全局像素），整块接近纯黑则露黑
  var SP = [[0.5,0.5],[0.25,0.25],[0.75,0.75],[0.15,0.5],[0.85,0.5],[0.5,0.2],[0.5,0.8]];
  function tileDark(d) {
    var dark = 0, px = new Uint8Array(4);
    for (var i = 0; i < SP.length; i++) {
      var gx = (d.col * TW + SP[i][0] * TW) | 0;
      var gy = (d.vy + SP[i][1] * TH) | 0; // vy 已是自下而上
      gl.readPixels(gx, gy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      if (px[0] + px[1] + px[2] < 24) dark++;
    }
    return dark;
  }

  function renderAll(p) {
    if (!tex.length) return;
    var cc = kb(ar[0]), cn = kb(ar[1]);
    regl.clear({color: [0,0,0,1]}); // 清整张
    var props = {
      progress: p, from: tex[0], to: tex[1], fromR: ar[0], toR: ar[1],
      fromMode: modeNum(cc), toMode: modeNum(cn),
      fromZoom: zoomAt(cc, 1), toZoom: zoomAt(cn, 0),
      fromPan: panVec(cc, 1), toPan: panVec(cn, 0),
    };
    draws.forEach(function (d) { if (!d.broken) d.draw(props); });
    gl.flush();
    var black = 0, fail = 0;
    draws.forEach(function (d, i) {
      if (d.broken) { fail++; return; }
      var dark = tileDark(d);
      var isBlack = dark >= SP.length;
      labels[i].box.classList.toggle('black', isBlack);
      labels[i].st.className = 'st' + (dark ? ' bad' : '');
      labels[i].st.textContent = dark ? (dark + '/' + SP.length) : 'ok';
      if (isBlack) black++;
    });
    var parts = [black ? '<span class="bad">⚠ ' + black + ' 个露黑</span>' : '<span class="ok">✓ 无露黑</span>'];
    if (fail) parts.push('<span class="bad">' + fail + ' 个编译失败</span>');
    sum.innerHTML = parts.join(' · ');
  }

  function setProg(p) { pval.textContent = p.toFixed(2); if (ready()) renderAll(p); }

  probe.addEventListener('input', function () { stopPlay(); setProg(probe.value / 1000); });
  midBtn.addEventListener('click', function () { stopPlay(); probe.value = 500; setProg(0.5); });

  var playing = false, raf = 0, t0 = 0;
  function stopPlay() { if (playing) { playing = false; cancelAnimationFrame(raf); playBtn.textContent = '▶ 自动扫'; } }
  playBtn.addEventListener('click', function () {
    if (playing) { stopPlay(); return; }
    playing = true; playBtn.textContent = '⏸ 暂停'; t0 = performance.now();
    (function tick() {
      if (!playing) return;
      var p = ((performance.now() - t0) / 2500) % 1;
      probe.value = Math.round(p * 1000); setProg(p);
      raf = requestAnimationFrame(tick);
    })();
  });

  function boot() {
    if (!ready()) { return setTimeout(boot, 50); }
    initTextures();
    setProg(0.5);
  }
  boot();
})();
`;

function loadTransitions() {
  const script = resolve(ROOT, 'src/lib/gl-transitions/gl-transition-transform.js');
  const dir = resolve(ROOT, 'src/lib/gl-transitions/transitions');
  return JSON.parse(execSync(`node "${script}" -d "${dir}"`, {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024}));
}

const args = parseArgs(process.argv.slice(2));
const dir = resolve(ROOT, args.dir || 'example/mbg');
const width = parseInt(args.w || '1080', 10);
const height = parseInt(args.h || '720', 10);
const group = args.group || 'soft';
const out = resolve(ROOT, args.out || `poc-grid-${group}.html`);

if (!VALID_GROUPS.includes(group)) { console.error(`--group must be ${VALID_GROUPS.join('|')}`); process.exit(1); }

const files = readdirSync(dir).filter((f) => IMG_EXT.has(extname(f).toLowerCase())).sort();
if (files.length < 2) { console.error(`Need >=2 images in ${dir}`); process.exit(1); }

// 只用前两张做 from→to（够验证转场了），base64 内联
const pick = files.slice(0, 2).map((f) => {
  const buf = readFileSync(join(dir, f));
  return {name: f, dataUrl: `data:${MIME[extname(f).toLowerCase()]};base64,${buf.toString('base64')}`};
});

const all = loadTransitions();
const names = all.map((t) => t.name);
const chosen = new Set(groupTransitions(group, names));
const needsExtraTexture = (glsl) => /uniform\s+sampler2D\s+(?!from\b|to\b)\w+/.test(glsl);
const transitions = all
  .filter((t) => chosen.has(t.name) && !needsExtraTexture(t.glsl))
  .map((t) => ({name: t.name, frag: buildFragSource(t.glsl)}));
if (!transitions.length) { console.error('No transitions matched'); process.exit(1); }

const reglSrc = readFileSync(resolve(ROOT, 'src/lib/regl/regl.min.js'), 'utf-8');
const kbSrc = readFileSync(resolve(ROOT, 'src/lib/kenBurns.mjs'), 'utf-8').replace(/export\s+function/g, 'function');

const cols = parseInt(args.cols || '5', 10);
const tileW = parseInt(args.tile || '280', 10);
const config = {width, height, cols, tileW, vert: VERT, transitions, passthrough: buildPassthroughFragSource()};

writeFileSync(out, buildHtml());
console.log(`POC grid written: ${out}`);
console.log(`  group=${group}  transitions=${transitions.length}  imgs=${pick.map((p) => p.name).join(', ')}  ar=${width}x${height}`);
console.log(`  open in a browser; drag the slider to scrub all transitions together.`);

function buildHtml() {
  const imgTags = pick.map((im, i) =>
    `<img id="src${i}" src="${im.dataUrl}" crossorigin="anonymous" style="display:none">`).join('\n');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Transition grid · ${group}</title>
<style>
  :root{--ar:${(width / height).toFixed(4)}}
  html,body{margin:0;background:#0d0d0f;color:#e8e8ea;font:13px/1.4 system-ui,sans-serif}
  #top{position:sticky;top:0;z-index:5;display:flex;gap:16px;align-items:center;flex-wrap:wrap;
       padding:10px 16px;background:rgba(18,18,22,.96);border-bottom:1px solid #2a2a30;backdrop-filter:blur(6px)}
  #top h1{font-size:14px;margin:0;font-weight:600}
  #top .sum{font-variant-numeric:tabular-nums}
  #top .ok{color:#5fd97a}#top .bad{color:#ff6b6b;font-weight:600}
  #prog{flex:1;min-width:200px}
  #pval{font-variant-numeric:tabular-nums;width:3.2em;text-align:right}
  button{background:#26262c;color:#e8e8ea;border:1px solid #3a3a42;border-radius:5px;padding:5px 11px;cursor:pointer}
  button:hover{background:#32323a}
  #stage{position:relative;margin:16px}
  #cv{display:block}
  #overlay{position:absolute;top:0;left:0;pointer-events:none}
  .tilebox{position:absolute;box-sizing:border-box;border:2px solid transparent}
  .tilebox.black{border-color:#ff6b6b;box-shadow:inset 0 0 0 1px #ff6b6b}
  .tcap{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;
        align-items:center;gap:6px;padding:3px 6px;font-size:11px;
        background:linear-gradient(transparent,rgba(0,0,0,.78));color:#fff}
  .tcap .nm{font-weight:600;text-shadow:0 1px 2px #000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tcap .st{font-variant-numeric:tabular-nums;opacity:.85}
  .tcap .st.bad{color:#ff8080;font-weight:700;opacity:1}
</style></head><body>
<div id="top">
  <h1>转场验证 · ${group} · ${transitions.length} 个</h1>
  <button id="mid">⟳ 回到中点 0.5</button>
  <button id="play">▶ 自动扫</button>
  <input id="prog" type="range" min="0" max="1000" value="500">
  <span id="pval">0.50</span>
  <span class="sum" id="sum">检测中…</span>
</div>
<div id="stage"><canvas id="cv"></canvas><div id="overlay"></div></div>
${imgTags}
<script>/*regl*/${reglSrc}</script>
<script>/*kb*/${kbSrc}</script>
<script>
var CFG = ${JSON.stringify(config)};
CFG.kenBurns = kenBurnsConfig;
</script>
<script>${RUNTIME}</script>
</body></html>`;
}

