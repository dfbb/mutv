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
bool inBounds(vec2 p){ return p.x>=0.0 && p.x<=1.0 && p.y>=0.0 && p.y<=1.0; }
vec4 blurCover(sampler2D tex, vec2 uv, float r){
  vec4 sum = vec4(0.0);
  float o = 0.012;
  for(int i=-2;i<=2;i++){
    for(int j=-2;j<=2;j++){
      vec2 d = vec2(float(i),float(j))*o;
      sum += texture2D(tex, clamp(coverUV(uv+d, r, 1.0, vec2(0.0)),0.0,1.0));
    }
  }
  return sum/25.0;
}
vec4 sampleSlide(sampler2D tex, vec2 uv, float r, float mode, float zoom, vec2 pan){
  if(mode > 4.5){ // ⑤ blur-contain
    vec2 cuv = containUV(uv, r);
    if(inBounds(cuv)) return texture2D(tex, cuv);
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

/** 转场 fragment：注入某个 gl-transition 的 glsl（含 transition(uv) 函数）。 */
export function buildFragSource(transitionGlsl) {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
${transitionGlsl}
void main(){ gl_FragColor = transition(_uv); }`;
}

/** 稳态 fragment：无转场，直接画 from（带 Ken Burns）。 */
export function buildPassthroughFragSource() {
  return `precision highp float;
varying vec2 _uv;
uniform float progress;
${SAMPLE_CHUNK}
void main(){ gl_FragColor = getFromColor(_uv); }`;
}
