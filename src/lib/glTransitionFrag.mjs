/**
 * 生成 fragment/vertex shader 源码。移植自 gl-transition 的 makeFrag 思路，
 * 但 getFromColor/getToColor 走自定义 sampleSlide：支持 cover + Ken Burns
 * (zoom/pan)，以及 ⑤ 的单 pass「模糊 cover 背景 + contain 前景」。
 *
 * 不依赖 gl-transition npm 包（其依赖 gl-shader 且仅 CommonJS）。
 */

export const VERT = `attribute vec2 _p;
varying vec2 _uv;
void main(){ gl_Position = vec4(_p,0.0,1.0); _uv = 0.5*(_p+1.0); }`;

// 共享采样逻辑：ratio=画布宽高比；r=图片宽高比；mode: 0=cover(含 Ken Burns), 5=blur-contain
const SAMPLE_CHUNK = `
uniform float ratio;
vec2 coverUV(vec2 uv, float r, float zoom, vec2 pan){
  vec2 c = vec2(min(ratio/r, 1.0), min(r/ratio, 1.0));
  return 0.5 + (uv-0.5)*c/zoom + pan;
}
vec2 containUV(vec2 uv, float r){
  vec2 c = vec2(max(ratio/r, 1.0), max(r/ratio, 1.0));
  return 0.5 + (uv-0.5)*c;
}
bool _inBounds(vec2 p){ return p.x>=0.0 && p.x<=1.0 && p.y>=0.0 && p.y<=1.0; }
vec4 blurCover(sampler2D tex, vec2 uv, float r){
  vec4 sum = vec4(0.0);
  float o = 0.012;
  for(int i=0;i<5;i++){
    for(int j=0;j<5;j++){
      vec2 d = vec2(float(i)-2.0, float(j)-2.0)*o;
      sum += texture2D(tex, clamp(coverUV(uv+d, r, 1.0, vec2(0.0)),0.0,1.0));
    }
  }
  return sum/25.0;
}
vec4 sampleSlide(sampler2D tex, vec2 uv, float r, float mode, float zoom, vec2 pan){
  if(mode > 4.5){ // ⑤ blur-contain
    vec2 cuv = containUV(uv, r);
    if(_inBounds(cuv)) return texture2D(tex, cuv);
    return blurCover(tex, uv, r) * 0.7; // 背景压暗
  }
  return texture2D(tex, clamp(coverUV(uv, r, zoom, pan),0.0,1.0));
}
uniform sampler2D from, to;
uniform float fromR, toR, fromMode, toMode, fromZoom, toZoom;
uniform vec2 fromPan, toPan;
vec4 getFromColor(vec2 uv){ return sampleSlide(from, uv, fromR, fromMode, fromZoom, fromPan); }
vec4 getToColor(vec2 uv){ return sampleSlide(to, uv, toR, toMode, toZoom, toPan); }
`;

/**
 * gl-transitions 把可调参数写成带默认值注释的 uniform，例如：
 *   uniform float reflection; // = 0.4
 *   uniform vec3 color /* = vec3(0.9,0.4,0.2) *\/;
 * 我们不暴露这些参数，故把它们就地转成 const 并填入默认值，否则 regl 会因
 * 缺少 uniform 值而无法构建 draw command（表现为转场帧黑屏/报错）。
 *
 * 此外，不少转场用一个「背景填充色」uniform（backColor / bgcolor / backgroundColor）
 * 填充被裁掉/越界的区域，默认值是黑或暗灰 —— 这正是转场中点露黑/塌缩成黑的根源。
 * 我们把这些背景色的默认值统一替换成一个不可能自然出现的「哨兵色」（SENTINEL），
 * 再在主函数里检测：凡是输出≈哨兵色的像素，回退到 cover 交叉淡化基线。这样精准命中
 * 「转场填充的背景」，既不误伤本就很暗的图像，也覆盖所有填充型转场。
 *
 * GLSL 的 const 要求字面量类型匹配（如 const float a = 4.0 而非 4），故对裸
 * 整数字面量补 .0。
 */
// 哨兵色：用于标记「转场填充的空白背景」。取一组极不可能在真实画面出现的精确浮点值。
const SENTINEL_RGB = 'vec3(0.00392157, 0.00784314, 0.00392157)'; // ≈ (1,2,1)/255
const BG_UNIFORM_NAMES = /^(backColor|bgColor|bgcolor|backgroundColor)$/;

function inlineParamUniforms(glsl) {
  const replaceDefault = (type, name, def) => {
    // 背景填充色 → 哨兵色（仅 vec3/vec4，保留 vec4 的 alpha=1）
    if (BG_UNIFORM_NAMES.test(name)) {
      if (type === 'vec3') return `const vec3 ${name} = ${SENTINEL_RGB};`;
      if (type === 'vec4') return `const vec4 ${name} = vec4(${SENTINEL_RGB}, 1.0);`;
    }
    return `const ${type} ${name} = ${coerceFloatLiteral(type, def)};`;
  };
  // 形式一：行尾 // = 默认值
  let out = glsl.replace(
    /uniform\s+(\w+)\s+(\w+)\s*;\s*\/\/\s*=\s*(.+?)\s*$/gm,
    (_m, type, name, def) => replaceDefault(type, name, def)
  );
  // 形式二：块注释 /* = 默认值 */ 在分号前
  out = out.replace(
    /uniform\s+(\w+)\s+(\w+)\s*\/\*\s*=\s*(.+?)\s*\*\/\s*;/g,
    (_m, type, name, def) => replaceDefault(type, name, def)
  );
  return out;
}

// 把内联 const 的默认值字面量强制成匹配的 GLSL 类型。
//  - float：裸整数补小数点（const float 要求浮点字面量，如 3 → 3.0）
//  - bool：gl-transitions 常用 // = 1 / // = 0 表示真假，但 GLSL 不能把 int 赋给 bool，
//    需转成 true/false（如 luminance_melt 的 `uniform bool direction; // = 1`）。
function coerceFloatLiteral(type, def) {
  const d = def.trim();
  if (type === 'float' && /^[+-]?\d+$/.test(d)) return d + '.0';
  if (type === 'bool') {
    if (/^(1|1\.0|true)$/i.test(d)) return 'true';
    if (/^(0|0\.0|false)$/i.test(d)) return 'false';
  }
  return d;
}

/** 转场 fragment：注入某个 gl-transition 的 glsl（含 transition(uv) 函数）。 */
export function buildFragSource(transitionGlsl) {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
${inlineParamUniforms(transitionGlsl)}
void main(){
  vec4 t = transition(_uv);
  vec4 base = mix(getFromColor(_uv), getToColor(_uv), progress);
  // ① NaN/Inf 兜底：部分转场在中点除零（GridFlip 的 /abs(cp-0.5)、PolkaDots 的
  //    progress/distance(uv,center)）会产出 NaN/Inf，GPU 渲染成黑且无法用普通比较捕获
  //    （NaN 与任何值比较恒为 false）。WebGL1 无 isnan，用 !(x<=0 || x>0) 识别 NaN，
  //    用 abs(x) > 1e20 识别 Inf。任一通道异常即整像素回退到 cover 基线。
  bvec3 nanv = bvec3(!(t.r<=0.0||t.r>0.0), !(t.g<=0.0||t.g>0.0), !(t.b<=0.0||t.b>0.0));
  bvec3 infv = greaterThan(abs(t.rgb), vec3(1e20));
  float bad = any(nanv) || any(infv) ? 1.0 : 0.0;
  // ② 背景填充兜底：填充型转场（circle/CircleCrop/GridFlip/Rectangle/rotate_scale_fade…）
  //    在裁掉/越界区域填入背景色，其默认值已被 inlineParamUniforms 换成哨兵色。凡输出≈
  //    哨兵色的像素，回退到基线，消除转场露黑/中点塌缩，且不误伤暗图。
  const vec3 SENTINEL = ${SENTINEL_RGB};
  float isFill = 1.0 - step(0.012, distance(t.rgb, SENTINEL));
  // ③ 纯黑兜底：极少数转场把内容硬乘成纯黑（如 SimpleFlip 的 step 裁剪），同样回退。
  float tl = max(t.r, max(t.g, t.b));
  float bl = max(base.r, max(base.g, base.b));
  float isBlack = step(tl, 0.02) * step(0.02, bl);
  float fallback = max(bad, max(isFill, isBlack));
  // 注意：不能用 mix(t, base, fallback) —— 若 t 含 NaN，NaN*0 仍是 NaN，无法消除。
  // 必须用三元选择直接丢弃 t。
  gl_FragColor = fallback > 0.5 ? base : t;
}`;
}

/** 稳态 fragment：无转场，直接画 from（带 Ken Burns）。 */
export function buildPassthroughFragSource() {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
void main(){ gl_FragColor = getFromColor(_uv); }`;
}
