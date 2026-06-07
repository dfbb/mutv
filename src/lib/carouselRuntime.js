/* Carousel browser runtime. Expects global CAROUSEL_CONFIG:
 * {
 *   images: [url, ...],
 *   intvl: seconds per slide (hold),
 *   transDur: seconds per transition,
 *   width, height,
 *   transitions: [fragSource, ...]   // pool, randomly picked per transition
 *   passthrough: fragSource,
 *   vert: vertexShaderSource,
 *   kenBurns: (imgAR, screenAR) => config,
 *   seed: number                      // deterministic randomness
 * }
 * Drives via requestAnimationFrame + performance.now (Remotion hijacks both
 * during render, so motion is deterministic per frame).
 */
/* global CAROUSEL_CONFIG, createREGL */
(function () {
  var C = CAROUSEL_CONFIG;
  var canvas = document.getElementById('cv');
  canvas.width = C.width; canvas.height = C.height;
  var regl = createREGL({canvas: canvas, attributes: {preserveDrawingBuffer: true}});
  var screenAR = C.width / C.height;

  // --- deterministic PRNG (mulberry32) ---
  var seed = C.seed >>> 0;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // --- load all images as regl textures ---
  var slides = [];     // {tex, ar}
  var loaded = 0;
  C.images.forEach(function (url, i) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      slides[i] = {tex: regl.texture({data: img, flipY: true}), ar: img.width / img.height};
      loaded++;
    };
    img.onerror = function () {
      console.warn('carousel: failed to load image', url, '— skipping');
      slides[i] = null;
      loaded++;
    };
    img.src = url;
  });

  // per-slide Ken Burns config (computed lazily once ar known)
  function kb(i) { return C.kenBurns(slides[i].ar, screenAR); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // pan offset on the cover sampling window, eased by t in [0,1]
  function panVec(cfg, t) {
    var amt = cfg.panAmount * (t - 0.5); // center-crossing pan
    if (cfg.panAxis === 'x') return [amt, 0];
    if (cfg.panAxis === 'y') return [0, amt];
    return [0, 0];
  }
  function zoomAt(cfg, t) { return lerp(cfg.zoomFrom, cfg.zoomTo, t); }
  function modeNum(cfg) { return cfg.mode === 'blur-contain' ? 5 : 0; }

  // compiled regl draw commands cached by frag source
  var cmdCache = {};
  function getCmd(frag) {
    if (cmdCache[frag]) return cmdCache[frag];
    var cmd = regl({
      frag: frag,
      vert: C.vert,
      attributes: {_p: [[-1, -1], [3, -1], [-1, 3]]},
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
    cmdCache[frag] = cmd;
    return cmd;
  }

  // assign a random transition frag to each slide boundary, deterministically
  var perBoundaryFrag = [];
  function fragForBoundary(b) {
    if (perBoundaryFrag[b] === undefined) {
      perBoundaryFrag[b] = C.transitions[Math.floor(rand() * C.transitions.length)];
    }
    return perBoundaryFrag[b];
  }

  var n = C.images.length;
  var cycle = C.intvl + C.transDur; // seconds per slide step
  var start = (window.performance && performance.now) ? performance.now() : Date.now();

  function frame() {
    if (loaded < n) { requestAnimationFrame(frame); return; }
    // skip if any required slide failed to load
    if (slides.some(function(s){ return !s; })) {
      console.warn('carousel: some images failed to load, rendering skipped');
      return;
    }
    var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
    var elapsed = (nowMs - start) / 1000;
    var step = Math.floor(elapsed / cycle);     // which slide step
    var inStep = elapsed - step * cycle;         // time within step
    var cur = ((step % n) + n) % n;
    var nxt = (cur + 1) % n;
    regl.clear({color: [0, 0, 0, 1], depth: 1});

    if (inStep < C.intvl) {
      // hold: draw current with Ken Burns progressing over hold duration
      var th = inStep / C.intvl;
      var c = kb(cur);
      getCmd(C.passthrough)({
        progress: 0, from: slides[cur].tex, to: slides[cur].tex,
        fromR: slides[cur].ar, toR: slides[cur].ar,
        fromMode: modeNum(c), toMode: modeNum(c),
        fromZoom: zoomAt(c, th), toZoom: zoomAt(c, th),
        fromPan: panVec(c, th), toPan: panVec(c, th),
      });
    } else {
      // transition: progress 0..1 across transDur
      var p = (inStep - C.intvl) / C.transDur;
      var cc = kb(cur), cn = kb(nxt);
      getCmd(fragForBoundary(step))({
        progress: p,
        from: slides[cur].tex, to: slides[nxt].tex,
        fromR: slides[cur].ar, toR: slides[nxt].ar,
        fromMode: modeNum(cc), toMode: modeNum(cn),
        fromZoom: zoomAt(cc, 1), toZoom: zoomAt(cn, 0),
        fromPan: panVec(cc, 1), toPan: panVec(cn, 0),
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
