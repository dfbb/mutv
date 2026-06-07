/* CSS carousel browser runtime. Expects global CAROUSEL_CONFIG, the animate.css
 * stylesheet, and pre-loaded <img id="ci0">, <img id="ci1">, ... elements.
 *
 * Design (pure CSS, no WebGL):
 *   - One persistent layer per image, built ONCE at startup. The CURRENT image is
 *     shown as an opaque Ken Burns base layer (so the screen is NEVER black).
 *   - During a transition the NEXT image's layer is shown on top and plays an
 *     animate.css "In" keyframe (fadeIn/zoomIn/flipInX/…), frozen at the exact
 *     progress p via animation-delay:-(p*dur)s + animation-play-state:paused.
 *   - Per frame we ONLY mutate styles (which layer is visible, z-order, transform,
 *     animation). We never rebuild the DOM or recreate <img> elements — recreating
 *     nodes every frame caused a flash/flicker at transitions. Reusing the same
 *     already-decoded <img> nodes makes every frame a clean static snapshot, so
 *     Remotion screenshots are deterministic AND there is no flicker on playback.
 *
 * Config shape:
 *   images: [url, ...], intvl, transDur, width, height, seed,
 *   transitions: [animationName, ...],
 *   kenBurns: (imgAR, screenAR) => {mode, zoomFrom, zoomTo, panAxis, panAmount}
 *
 * Timing: frame time arrives via the URL hash (#t=<ms>), set by the Remotion parent
 * every frame. cycle = intvl + transDur. Within a cycle: [0,intvl) hold current,
 * [intvl,intvl+transDur) transition current->next.
 */
/* global CAROUSEL_CONFIG */
(function () {
  function start() {
    var C = CAROUSEL_CONFIG;
    var screenAR = C.width / C.height;
    var n = C.images.length;
    var cycle = C.intvl + C.transDur;

    // deterministic PRNG (mulberry32) — stable transition choice per boundary.
    var seed = C.seed >>> 0;
    function rand() {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var boundaryAnim = {};
    function animFor(step) {
      if (!boundaryAnim[step]) boundaryAnim[step] = C.transitions[Math.floor(rand() * C.transitions.length)];
      return boundaryAnim[step];
    }

    function kb(i) { return C.kenBurns(ars[i], screenAR); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    var stage = document.getElementById('stage');

    // Ken Burns transform for image i at local progress t in [0,1].
    function kbTransform(i, t) {
      var cfg = kbCfg[i];
      var zoom = lerp(cfg.zoomFrom, cfg.zoomTo, t);
      var panX = 0, panY = 0;
      var amt = cfg.panAmount * (t - 0.5);
      if (cfg.panAxis === 'x') panX = amt * 100;
      else if (cfg.panAxis === 'y') panY = amt * 100;
      return 'scale(' + zoom.toFixed(4) + ') translate(' + panX.toFixed(3) + '%,' + panY.toFixed(3) + '%)';
    }

    // --- build all layers ONCE ---
    var ars = [];
    var kbCfg = [];
    var layers = [];   // outer .layer (carries animate.css animation)
    var inners = [];   // inner .kb (carries Ken Burns transform)
    for (var i = 0; i < n; i++) {
      var im = document.getElementById('ci' + i);
      ars.push(im && im.naturalWidth > 0 ? im.naturalWidth / im.naturalHeight : screenAR);
      kbCfg.push(C.kenBurns(ars[i], screenAR));

      var layer = document.createElement('div');
      layer.className = 'layer';
      layer.style.display = 'none';
      var inner = document.createElement('div');
      inner.className = 'kb';
      var cfg = kbCfg[i];
      if (cfg.mode === 'blur-contain') {
        var bg = document.createElement('img');
        bg.src = C.images[i];
        bg.className = 'pic blurbg';
        inner.appendChild(bg);
      }
      var img = document.createElement('img');
      img.src = C.images[i];
      img.className = 'pic' + (cfg.mode === 'blur-contain' ? ' contain' : '');
      inner.appendChild(img);
      layer.appendChild(inner);
      stage.appendChild(layer);
      layers.push(layer);
      inners.push(inner);
    }

    // Reset a layer to hidden + no animation.
    function hide(i) {
      var l = layers[i];
      if (l.style.display !== 'none') l.style.display = 'none';
      if (l.style.animationName !== 'none') l.style.animationName = 'none';
    }

    function render() {
      var hashMatch = /[#&]t=([0-9.]+)/.exec(window.location.hash);
      var elapsed = (hashMatch ? parseFloat(hashMatch[1]) : 0) / 1000;
      var step = Math.floor(elapsed / cycle);
      var inStep = elapsed - step * cycle;
      var cur = ((step % n) + n) % n;
      var nxt = (cur + 1) % n;
      var inTransition = inStep >= C.intvl;
      // Ken Burns progress for the holding image: advance across the whole window.
      var holdT = Math.min(inStep / cycle, 1);

      for (var i = 0; i < n; i++) {
        if (i === cur) {
          var base = layers[i];
          base.style.display = 'block';
          base.style.zIndex = '1';
          base.style.opacity = '1';
          if (base.style.animationName !== 'none') base.style.animationName = 'none';
          inners[i].style.transform = kbTransform(i, inTransition ? 1 : holdT);
        } else if (inTransition && i === nxt) {
          var p = (inStep - C.intvl) / C.transDur; // 0..1
          var dur = C.transDur;
          var top = layers[i];
          top.style.display = 'block';
          top.style.zIndex = '2';
          top.style.animationName = animFor(step);
          top.style.animationDuration = dur + 's';
          top.style.animationTimingFunction = 'linear';
          top.style.animationFillMode = 'both';
          top.style.animationPlayState = 'paused';
          top.style.animationDelay = (-(p * dur)).toFixed(4) + 's';
          inners[i].style.transform = kbTransform(i, p);
        } else {
          hide(i);
        }
      }
    }

    render();
    window.addEventListener('hashchange', render);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
