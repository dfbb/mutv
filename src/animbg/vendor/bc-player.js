/**
 * bc-player.js — 共享 butterchurn 播放器壳。
 *
 * 薄壳 HTML 须:① 先加载 butterchurn.min.js + butterchurnPresets.min.js;
 * ② 设 window.__BC_PRESET = "<原 preset 名>";③ 再加载本文件。
 *
 * 本文件建 visualizer、loadPreset,并暴露:
 *   window.__bcReady          — true 表示可渲染
 *   window.__bcRenderAt(af)   — af = {timeByteArray, timeByteArrayL, timeByteArrayR, elapsedTime}
 *                               用注入的时域字节渲染一帧(供父窗逐帧调用)
 *
 * 离线注入:render({audioLevels}) 绕开实时 analyser(见 butterchurn renderer.js)。
 * 任意失败均 try/catch,画深色兜底,绝不抛出破坏渲染。
 */
(function () {
  window.__bcReady = false;
  var canvas = document.getElementById('bc');
  var W = window.innerWidth || 1920;
  var H = window.innerHeight || 1080;
  if (canvas) { canvas.width = W; canvas.height = H; }

  function fallback() {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = '#07080d'; ctx.fillRect(0, 0, W, H); }
  }

  try {
    var BC = window.butterchurn && (window.butterchurn.default || window.butterchurn);
    var BCP = window.butterchurnPresets && (window.butterchurnPresets.default || window.butterchurnPresets);
    if (!BC || !BCP || !canvas) { fallback(); return; }

    var presets = BCP.getPresets();
    var key = window.__BC_PRESET;
    var preset = presets[key] || presets[Object.keys(presets)[0]];

    var ac = new (window.AudioContext || window.webkitAudioContext)();
    var viz = BC.createVisualizer(ac, canvas, {width: W, height: H});
    viz.loadPreset(preset, 0);

    window.__bcRenderAt = function (af) {
      try {
        viz.render({
          audioLevels: {
            timeByteArray: af.timeByteArray,
            timeByteArrayL: af.timeByteArrayL,
            timeByteArrayR: af.timeByteArrayR,
          },
          elapsedTime: af.elapsedTime,
        });
      } catch (e) { /* 单帧渲染失败不致命 */ }
    };
    window.__bcReady = true;
  } catch (e) {
    fallback();
    console.error('bc-player init failed:', e && e.message);
  }
})();
