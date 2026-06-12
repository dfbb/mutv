// 字色覆盖共享逻辑：检测 preset 自带的"填充/描边发光"声明，供 --font-fg/bg-color
// 的"只替换已有、没有就不加"语义使用。
//
// 纯字符串启发式（在 preset 的已 scope CSS 源串上扫描），故意保守：
//   hasFill       —— 声明了文字填充：color / -webkit-text-fill-color / background-clip:text 渐变
//   hasStroke     —— 声明了描边或发光：非 none 的 text-shadow，或有宽度的 text-stroke
//   hasTextStroke —— 单指有宽度的 -webkit-text-stroke（用于是否覆盖 text-stroke-color）

// color: / -webkit-text-fill-color:（前置分隔符以排除 background-color 等误配）
const FILL_COLOR_RE = /(?:^|[;{>\s])(?:-webkit-text-fill-)?color\s*:/i;
const CLIP_TEXT_RE = /background-clip\s*:\s*text/i;
// text-shadow: 非 none（尾随 \S 逼 \s* 吃尽空白，避免断言躲到空格前）
const TEXT_SHADOW_RE = /text-shadow\s*:\s*(?!none\b)\S/i;
// -webkit-text-stroke / -webkit-text-stroke-width：值非 0、非 none
const TEXT_STROKE_RE = /(?:-webkit-)?text-stroke(?:-width)?\s*:\s*(?!0(?:px|em|rem)?[\s;}])(?!none)[^\s;}]/i;

export function detectColorTargets(css) {
  const c = String(css || '');
  const hasTextStroke = TEXT_STROKE_RE.test(c);
  return {
    hasFill: FILL_COLOR_RE.test(c) || CLIP_TEXT_RE.test(c),
    hasStroke: TEXT_SHADOW_RE.test(c) || hasTextStroke,
    hasTextStroke,
  };
}
