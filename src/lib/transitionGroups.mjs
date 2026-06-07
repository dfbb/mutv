/**
 * 把 animate.css 的「入场动画」(In 类) 按风格分三组。用于 --bg-image-trans <soft|cool|hard>。
 * 名字须与 animate.css 的 @keyframes 名一致（即去掉 animate__ 前缀的类名），
 * 由 buildCarousel 直接用作 animation-name 驱动「下一张图」入场，冻结在每帧进度。
 */
export const GROUPS = {
  // 柔和：淡入、轻缩放、轻滑动 —— 不突兀
  soft: [
    'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight',
    'fadeInTopLeft', 'fadeInTopRight', 'fadeInBottomLeft', 'fadeInBottomRight',
    'zoomIn', 'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight',
  ],
  // 酷炫：翻转、旋转、大幅滑动/缩放、卷入
  cool: [
    'flipInX', 'flipInY', 'rotateIn',
    'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight',
    'zoomInUp', 'zoomInDown', 'zoomInLeft', 'zoomInRight',
    'fadeInUpBig', 'fadeInDownBig', 'fadeInLeftBig', 'fadeInRightBig',
    'rollIn',
  ],
  // 强烈：弹跳、光速、回弹、夸张
  hard: [
    'bounceIn', 'bounceInUp', 'bounceInDown', 'bounceInLeft', 'bounceInRight',
    'backInUp', 'backInDown', 'backInLeft', 'backInRight',
    'lightSpeedInLeft', 'lightSpeedInRight', 'jackInTheBox',
  ],
};

/** 返回某组里在实际可用集合(availableNames)内的动画名数组。 */
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
