/**
 * 缓动函数集合
 * 用于补间动画的缓动效果
 */

export const Easing = {
  /**
   * 线性缓动（无缓动效果）
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  linear: (t) => t,

  /**
   * 二次方缓入
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeInQuad: (t) => t * t,

  /**
   * 二次方缓出
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeOutQuad: (t) => t * (2 - t),

  /**
   * 二次方缓入缓出
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeInOutQuad: (t) => {
    if (t < 0.5) {
      return 2 * t * t;
    }
    return -1 + (4 - 2 * t) * t;
  },

  /**
   * 三次方缓入
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeInCubic: (t) => t * t * t,

  /**
   * 三次方缓出
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeOutCubic: (t) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },

  /**
   * 弹跳缓出效果
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeOutBounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    } else if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    } else {
      const t2 = t - 2.625 / 2.75;
      return 7.5625 * t2 * t2 + 0.984375;
    }
  },

  /**
   * 弹性缓出效果
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },

  /**
   * 背部缓出效果（超出后回弹）
   * @param {number} t - 进度 (0-1)
   * @returns {number} 缓动后的进度
   */
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

export default Easing;
