/* CSS carousel browser runtime. Expects global CAROUSEL_CONFIG, the animate.css
 * stylesheet, and pre-loaded <img id="ci0">, <img id="ci1">, ... elements.
 *
 * Design (pure CSS, no WebGL):
 *   - A stack of layers inside #stage. The CURRENT image is the base layer, always
 *     fully opaque with a Ken Burns transform — so the screen is NEVER black.
 *   - During a transition the NEXT image sits on top and plays an animate.css "In"
 *     keyframe (fadeIn/zoomIn/flipInX/…). We freeze that keyframe at the exact
 *     progress p via: animation-name + animation-duration + animation-delay:-(p*dur)
 *     + animation-play-state:paused. Every frame is a static DOM snapshot, so
 *     Remotion screenshots it reliably.
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

    // deterministic PRNG (mulberry32) — same as the old runtime, so transition
    // choice per boundary is stable across re-renders.
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

    // image aspect ratios from the decoded <img> elements
    var ars = [];
    for (var i = 0; i < n; i++) {
      var im = document.getElementById('ci' + i);
      ars.push(im && im.naturalWidth > 0 ? im.naturalWidth / im.naturalHeight : screenAR);
    }
    function kb(i) { return C.kenBurns(ars[i], screenAR); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    var stage = document.getElementById('stage');

    // Build one Ken Burns transform string for image i at local progress t in [0,1].
    // cover: scale to fill + optional pan along the slack axis. We size the inner
    // <img> with object-fit:cover so it always fills; transform adds zoom + pan.
    function kbTransform(i, t) {
      var cfg = kb(i);
      var zoom = lerp(cfg.zoomFrom, cfg.zoomTo, t);
      var panX = 0, panY = 0;
      var amt = cfg.panAmount * (t - 0.5);
      if (cfg.panAxis === 'x') panX = amt * 100; // percent of element
      else if (cfg.panAxis === 'y') panY = amt * 100;
      return 'scale(' + zoom.toFixed(4) + ') translate(' + panX.toFixed(3) + '%,' + panY.toFixed(3) + '%)';
    }

    // Create a layer (absolute-positioned full-stage) holding image i.
    // The outer div carries the animate.css animation; the inner img carries Ken Burns.
    function makeLayer(i) {
      var layer = document.createElement('div');
      layer.className = 'layer';
      var inner = document.createElement('div');
      inner.className = 'kb';
      var img = document.createElement('img');
      img.src = C.images[i];
      var cfg = kb(i);
      img.className = 'pic' + (cfg.mode === 'blur-contain' ? ' contain' : '');
      // blur-contain: a blurred cover copy behind a contained sharp copy
      if (cfg.mode === 'blur-contain') {
        var bg = document.createElement('img');
        bg.src = C.images[i];
        bg.className = 'pic blurbg';
        inner.appendChild(bg);
      }
      inner.appendChild(img);
      layer.appendChild(inner);
      return {layer: layer, inner: inner};
    }

    function render() {
      var hashMatch = /[#&]t=([0-9.]+)/.exec(window.location.hash);
      var elapsed = (hashMatch ? parseFloat(hashMatch[1]) : 0) / 1000;
      var step = Math.floor(elapsed / cycle);
      var inStep = elapsed - step * cycle;
      var cur = ((step % n) + n) % n;
      var nxt = (cur + 1) % n;

      stage.textContent = '';

      var inTransition = inStep >= C.intvl;
      // local Ken Burns progress for the holding image: advance smoothly across the
      // whole hold+transition window so motion feels continuous.
      var holdT = Math.min(inStep / cycle, 1);

      // base layer = current image (always opaque → never black)
      var base = makeLayer(cur);
      base.inner.style.transform = kbTransform(cur, inTransition ? 1 : holdT);
      stage.appendChild(base.layer);

      if (inTransition) {
        var p = (inStep - C.intvl) / C.transDur; // 0..1
        var anim = animFor(step);
        var top = makeLayer(nxt);
        top.inner.style.transform = kbTransform(nxt, p);
        // Freeze the animate.css keyframe at progress p:
        var dur = C.transDur;
        top.layer.style.animationName = anim;
        top.layer.style.animationDuration = dur + 's';
        top.layer.style.animationTimingFunction = 'linear';
        top.layer.style.animationFillMode = 'both';
        top.layer.style.animationPlayState = 'paused';
        top.layer.style.animationDelay = (-(p * dur)).toFixed(4) + 's';
        stage.appendChild(top.layer);
      }
    }

    render();
    window.addEventListener('hashchange', render);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
