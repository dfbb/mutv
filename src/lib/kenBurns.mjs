/**
 * Ken Burns 配置：根据 图片宽高比(imgAR) 与 屏幕宽高比(screenAR) 决定
 * 缩放/平移方式。R = imgAR / screenAR，把"图片相对屏幕的宽窄"与屏幕比例解耦，
 * 横竖屏共用同一套阈值。所有缩放等比，平移只移动取样窗口，绝不拉伸。
 *
 * 返回 {bucket, mode, zoomFrom, zoomTo, panAxis, panAmount}
 *  - bucket: 1..5 对应设计 6 条规则的 5 档
 *  - mode: 'cover' | 'blur-contain'（仅 ⑤）
 *  - zoomFrom/zoomTo: 等比缩放系数（>=1，1 表示恰好 cover）
 *  - panAxis: 'none' | 'x' | 'y'（cover 后有富余的轴）
 *  - panAmount: 取样窗口在 panAxis 上可平移的归一化幅度 [0,1)
 */
export function kenBurnsConfig(imgAR, screenAR) {
  const R = imgAR / screenAR;
  if (R < 0.55) {
    // ⑤ 极窄：背景模糊 cover + 前景 contain (panAmount=0: contain layer is fixed, no panning)
    return {bucket: 5, mode: 'blur-contain', zoomFrom: 1.0, zoomTo: 1.04, panAxis: 'none', panAmount: 0};
  }
  if (R < 0.8) {
    // ③ 明显窄：cover + 轻微放大 + 上下平移
    return {bucket: 3, mode: 'cover', zoomFrom: 1.05, zoomTo: 1.05, panAxis: 'y', panAmount: 0.18};
  }
  if (R < 1.25) {
    // ① 接近：cover 居中 + 轻微放大
    return {bucket: 1, mode: 'cover', zoomFrom: 1.0, zoomTo: 1.08, panAxis: 'none', panAmount: 0};
  }
  if (R < 1.8) {
    // ② 明显宽：cover + 轻微放大 + 左右平移
    return {bucket: 2, mode: 'cover', zoomFrom: 1.05, zoomTo: 1.05, panAxis: 'x', panAmount: 0.18};
  }
  // ④ 极宽：cover + 小幅缩放 + 横向慢移（幅度大）
  return {bucket: 4, mode: 'cover', zoomFrom: 1.0, zoomTo: 1.03, panAxis: 'x', panAmount: 0.4};
}
