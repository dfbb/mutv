/* Carousel browser runtime. Expects global CAROUSEL_CONFIG, createREGL, and
 * pre-loaded <img id="ci0">, <img id="ci1">, ... elements in the HTML body.
 *
 * Images are <img> tags in the HTML, so the IFrame load event (which Remotion
 * waits for before screenshotting) only fires once all images are decoded.
 * That means this script can read them synchronously — no async load race.
 *
 * Config shape:
 *   images: [url, ...]  (used only for count)
 *   intvl, transDur, width, height, seed,
 *   transitions: [fragSource, ...], passthrough: fragSource, vert,
 *   kenBurns: (imgAR, screenAR) => config
 *
 * Timing: Date.now() is the absolute timeline. Remotion patches Date.now() to
 * frame/fps*1000 during render, making each frame deterministic.
 */
/* global CAROUSEL_CONFIG, createREGL */
window.addEventListener('load', function () {
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

  // --- build textures synchronously from pre-loaded <img> elements ---
  var total = C.images.length;
  var slides = [];
  for (var i = 0; i < total; i++) {
    var img = document.getElementById('ci' + i);
    if (img && img.naturalWidth > 0) {
      slides.push({tex: regl.texture({data: img, flipY: true}),
                   ar: img.naturalWidth / img.naturalHeight});
    } else {
      slides.push(null);
    }
  }

  // --- Ken Burns helpers ---
  function kb(i) { return C.kenBurns(slides[i].ar, screenAR); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function panVec(cfg, t) {
    var amt = cfg.panAmount * (t - 0.5);
    return cfg.panAxis === 'x' ? [amt, 0] : cfg.panAxis === 'y' ? [0, amt] : [0, 0];
  }
  function zoomAt(cfg, t) { return lerp(cfg.zoomFrom, cfg.zoomTo, t); }
  function modeNum(cfg) { return cfg.mode === 'blur-contain' ? 5 : 0; }

  // --- regl draw command cache ---
  // Passthrough is compiled eagerly and reused as a fallback: any transition shader
  // that fails to compile in this WebGL context degrades to a hard cut (passthrough)
  // instead of a black frame.
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
  var passthroughCmd = compile(C.passthrough);
  cmdCache[C.passthrough] = passthroughCmd;
  function getCmd(frag) {
    if (cmdCache[frag] === undefined) {
      try { cmdCache[frag] = compile(frag); }
      catch (e) { cmdCache[frag] = passthroughCmd; } // fall back to hard cut
    }
    return cmdCache[frag];
  }

  // --- per-boundary transition ---
  var boundaryFrags = {};
  function fragFor(step) {
    if (!boundaryFrags[step])
      boundaryFrags[step] = C.transitions[Math.floor(rand() * C.transitions.length)];
    return boundaryFrags[step];
  }

  // --- render loop ---
  var n = total;
  var cycle = C.intvl + C.transDur;

  function draw() {
    for (var k = 0; k < n; k++) { if (!slides[k] || !slides[k].tex) return; }
    // Frame time is passed by the parent via the URL hash (#t=<ms>). This is
    // deterministic per frame; Date.now()/RAF time aren't frame-synced in an IFrame.
    var hashMatch = /[#&]t=([0-9.]+)/.exec(window.location.hash);
    var elapsed = (hashMatch ? parseFloat(hashMatch[1]) : 0) / 1000;
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
    } else {
      var p = (inStep - C.intvl) / C.transDur;
      var cc = kb(cur), cn = kb(nxt);
      getCmd(fragFor(step))({
        progress: p,
        from: slides[cur].tex, to: slides[nxt].tex,
        fromR: slides[cur].ar, toR: slides[nxt].ar,
        fromMode: modeNum(cc), toMode: modeNum(cn),
        fromZoom: zoomAt(cc, 1), toZoom: zoomAt(cn, 0),
        fromPan: panVec(cc, 1), toPan: panVec(cn, 0),
      });
    }
  }

  // Draw synchronously based on the current hash time. We deliberately avoid a
  // persistent requestAnimationFrame loop: during Remotion renders a RAF tick fires
  // after the synchronous draw and re-clears the canvas to black before the
  // screenshot. The parent updates the URL hash (#t=<ms>) every frame, so a
  // hashchange listener covers both still renders and Player preview playback.
  draw();
  window.addEventListener('hashchange', draw);
});
