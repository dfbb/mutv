/**
 * 把 gl-transitions 的转场按风格分三组。用于 --bg-image-trans <soft|cool|hard>。
 * 名字须与 transitions/<Name>.glsl 的 name 字段一致（transform.js 输出的 name）。
 */
export const GROUPS = {
  soft: [
    'fade', 'fadecolor', 'fadegrayscale', 'dissolve',
    'wind', 'wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown',
    'directionalwipe', 'Directional', 'SimpleZoom', 'ZoomInCircles',
    'circleopen', 'CircleCrop', 'circle', 'Radial', 'angular',
    'CrossZoom', 'Swirl', 'PolkaDotsCurtain',
    'morph', 'colorphase', 'LinearBlur', 'GridFlip', 'Bounce',
    'doorway', 'Mosaic', 'SimpleFlip', 'Slides',
    'luma', 'luminance_melt',
  ],
  cool: [
    'cube', 'BookFlip', 'swap',
    'flyeye', 'ButterflyWaveScrawler', 'polar_function',
    'rotate_scale_fade', 'rotateTransition', 'StereoViewer', 'kaleidoscope',
    'ripple', 'WaterDrop', 'undulatingBurnOut',
    'crosshatch', 'crosswarp', 'cannabisleaf', 'CrazyParametricFun',
    'GlitchMemories', 'multiply_blend', 'windowslice', 'squareswire',
    'Dreamy', 'DreamyZoom', 'powerKaleido', 'pinwheel', 'squeeze',
    'BowTieHorizontal', 'BowTieVertical',
  ],
  hard: [
    'GlitchDisplace', 'static_wipe', 'TVStatic',
    'pixelize', 'AdvancedMosaic', 'BlockDissolve',
    'burn', 'burn0', 'DoomScreenTransition', 'randomsquares',
    'randomNoisex', 'hexagonalize', 'chessboard',
    'InvertedPageCurl',
    'displacement', 'heart',
    'StaticFade', 'FilmBurn', 'HSVfade', 'Overexposure',
  ],
};

/** 返回某组里在实际可用集合(availableNames)内的转场名数组。 */
export function groupTransitions(group, availableNames) {
  const avail = new Set(availableNames);
  const names = (GROUPS[group] || GROUPS.soft).filter((n) => avail.has(n));
  // 该组若过滤后为空，退回到 availableNames 全集，保证总能转场
  return names.length ? names : availableNames.slice();
}

/** 校验组名合法。 */
export const VALID_GROUPS = ['soft', 'cool', 'hard'];
export function isValidGroup(g) {
  return VALID_GROUPS.includes(g);
}
