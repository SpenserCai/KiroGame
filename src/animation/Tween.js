/**
 * 轻量级补间动画类
 * 用于实现精灵属性的平滑过渡
 */

import { Easing } from './Easing.js';

/**
 * 补间动画类
 */
export class Tween {
  /**
   * 创建补间动画
   * @param {Object} target - 目标对象（通常是 PixiJS Sprite）
   * @param {Object} props - 要补间的属性 {x: 100, y: 200, alpha: 0.5, ...}
   * @param {number} duration - 动画时长（毫秒）
   * @param {string|Function} easing - 缓动函数名称或自定义函数
   */
  constructor(target, props, duration, easing = 'linear') {
    this.target = target;
    this.startProps = {};
    this.endProps = props;
    this.duration = duration;
    this.elapsed = 0;
    this.isComplete = false;
    this.isPaused = false;
    
    // 解析缓动函数
    if (typeof easing === 'string') {
      this.easing = Easing[easing] || Easing.linear;
    } else if (typeof easing === 'function') {
      this.easing = easing;
    } else {
      this.easing = Easing.linear;
    }
    
    // 记录起始值
    for (let key in props) {
      if (target[key] !== undefined) {
        this.startProps[key] = target[key];
      } else {
        console.warn(`Tween: 目标对象没有属性 "${key}"`);
      }
    }
    
    // Promise 支持
    this._resolvePromise = null;
    this._rejectPromise = null;
    this.promise = new Promise((resolve, reject) => {
      this._resolvePromise = resolve;
      this._rejectPromise = reject;
    });
  }

  /**
   * 更新补间动画
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   * @returns {boolean} 是否完成
   */
  update(deltaTime) {
    if (this.isComplete || this.isPaused) {
      return this.isComplete;
    }
    
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);
    
    // 更新目标对象的属性
    for (let key in this.endProps) {
      const start = this.startProps[key];
      const end = this.endProps[key];
      
      if (start !== undefined && end !== undefined) {
        this.target[key] = start + (end - start) * easedProgress;
      }
    }
    
    // 检查是否完成
    if (progress >= 1) {
      this.isComplete = true;
      
      // 确保最终值精确
      for (let key in this.endProps) {
        this.target[key] = this.endProps[key];
      }
      
      // 解析 Promise
      if (this._resolvePromise) {
        this._resolvePromise(this.target);
      }
    }
    
    return this.isComplete;
  }

  /**
   * 暂停动画
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复动画
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * 停止动画
   */
  stop() {
    this.isComplete = true;
    if (this._rejectPromise) {
      this._rejectPromise(new Error('Tween stopped'));
    }
  }

  /**
   * 跳到结束状态
   */
  finish() {
    this.elapsed = this.duration;
    this.update(0);
  }

  /**
   * 获取当前进度 (0-1)
   */
  getProgress() {
    return Math.min(this.elapsed / this.duration, 1);
  }

  /**
   * 检查是否正在运行
   */
  isRunning() {
    return !this.isComplete && !this.isPaused;
  }
}

export default Tween;
