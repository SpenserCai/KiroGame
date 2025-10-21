/**
 * 动画控制器
 * 管理所有游戏动画效果
 */

import { Tween } from './Tween.js';
import { GameEvents } from '../core/EventBus.js';

/**
 * 动画控制器类
 */
export class AnimationController {
  /**
   * 创建动画控制器
   * @param {EventBus} eventBus - 事件总线
   * @param {Object} config - 游戏配置
   */
  constructor(eventBus, config) {
    this.eventBus = eventBus;
    this.config = config;
    
    // 活动的补间动画列表
    this.activeTweens = [];
    
    // 选中动画映射表（sprite -> tween）
    this.selectionTweens = new Map();
    
    // 动画计数器
    this.animationCount = 0;
  }

  /**
   * 更新所有活动的补间动画
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(deltaTime) {
    if (this.activeTweens.length === 0) {
      return;
    }
    
    // 更新所有补间动画
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i];
      const isComplete = tween.update(deltaTime);
      
      // 移除已完成的动画
      if (isComplete) {
        this.activeTweens.splice(i, 1);
      }
    }
    
    // 如果所有动画完成，发布事件
    if (this.activeTweens.length === 0 && this.animationCount > 0) {
      this.eventBus.emit(GameEvents.ANIMATION_QUEUE_EMPTY);
      this.animationCount = 0;
    }
  }

  /**
   * 添加补间动画到活动列表
   * @param {Tween} tween - 补间动画对象
   */
  _addTween(tween) {
    this.activeTweens.push(tween);
    this.animationCount++;
  }

  /**
   * 交换动画
   * @param {PIXI.Sprite} sprite1 - 精灵1
   * @param {PIXI.Sprite} sprite2 - 精灵2
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 动画完成的 Promise
   */
  animateSwap(sprite1, sprite2, duration) {
    // 记录目标位置
    const target1 = { x: sprite2.position.x, y: sprite2.position.y };
    const target2 = { x: sprite1.position.x, y: sprite1.position.y };
    
    // 创建补间动画
    const tween1 = new Tween(
      sprite1.position,
      target1,
      duration,
      'easeInOutQuad'
    );
    
    const tween2 = new Tween(
      sprite2.position,
      target2,
      duration,
      'easeInOutQuad'
    );
    
    // 添加到活动列表
    this._addTween(tween1);
    this._addTween(tween2);
    
    // 发布动画开始事件
    this.eventBus.emit(GameEvents.ANIMATION_START, {
      type: 'swap',
      duration
    });
    
    // 返回 Promise.all，等待两个动画都完成
    return Promise.all([tween1.promise, tween2.promise]).then(() => {
      this.eventBus.emit(GameEvents.ANIMATION_COMPLETE, {
        type: 'swap'
      });
    });
  }

  /**
   * 消除动画（缩放到0 + 淡出）
   * @param {Array<PIXI.Sprite>} sprites - 精灵数组
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 动画完成的 Promise
   */
  animateRemove(sprites, duration) {
    const promises = [];
    
    for (const sprite of sprites) {
      // 创建缩放和淡出动画
      const tween = new Tween(
        sprite,
        {
          'scale.x': 0,
          'scale.y': 0,
          alpha: 0
        },
        duration,
        'easeInQuad'
      );
      
      this._addTween(tween);
      promises.push(tween.promise);
    }
    
    // 发布动画开始事件
    this.eventBus.emit(GameEvents.ANIMATION_START, {
      type: 'remove',
      duration,
      count: sprites.length
    });
    
    // 返回 Promise.all，等待所有动画完成
    return Promise.all(promises).then(() => {
      this.eventBus.emit(GameEvents.ANIMATION_COMPLETE, {
        type: 'remove'
      });
    });
  }

  /**
   * 下落动画
   * @param {PIXI.Sprite} sprite - 精灵对象
   * @param {number} targetY - 目标Y坐标
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 动画完成的 Promise
   */
  animateFall(sprite, targetY, duration) {
    // 创建下落动画（使用缓出效果模拟重力）
    const tween = new Tween(
      sprite.position,
      { y: targetY },
      duration,
      'easeOutQuad'
    );
    
    this._addTween(tween);
    
    return tween.promise;
  }

  /**
   * 批量下落动画
   * @param {Array<{sprite, targetY}>} movements - 移动数组
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 所有动画完成的 Promise
   */
  animateFallBatch(movements, duration) {
    if (movements.length === 0) {
      return Promise.resolve();
    }
    
    const promises = movements.map(({ sprite, targetY }) => 
      this.animateFall(sprite, targetY, duration)
    );
    
    // 发布动画开始事件
    this.eventBus.emit(GameEvents.ANIMATION_START, {
      type: 'fall',
      duration,
      count: movements.length
    });
    
    return Promise.all(promises).then(() => {
      this.eventBus.emit(GameEvents.ANIMATION_COMPLETE, {
        type: 'fall'
      });
    });
  }

  /**
   * 生成动画（从上方弹出）
   * @param {PIXI.Sprite} sprite - 精灵对象
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 动画完成的 Promise
   */
  animateSpawn(sprite, duration) {
    // 设置初始状态（缩放为0，透明）
    sprite.scale.set(0);
    sprite.alpha = 0;
    
    // 创建弹出动画
    const tween = new Tween(
      sprite,
      {
        'scale.x': 1,
        'scale.y': 1,
        alpha: 1
      },
      duration,
      'easeOutBounce'
    );
    
    this._addTween(tween);
    
    return tween.promise;
  }

  /**
   * 批量生成动画
   * @param {Array<PIXI.Sprite>} sprites - 精灵数组
   * @param {number} duration - 动画时长（毫秒）
   * @returns {Promise} 所有动画完成的 Promise
   */
  animateSpawnBatch(sprites, duration) {
    if (sprites.length === 0) {
      return Promise.resolve();
    }
    
    const promises = sprites.map(sprite => 
      this.animateSpawn(sprite, duration)
    );
    
    // 发布动画开始事件
    this.eventBus.emit(GameEvents.ANIMATION_START, {
      type: 'spawn',
      duration,
      count: sprites.length
    });
    
    return Promise.all(promises).then(() => {
      this.eventBus.emit(GameEvents.ANIMATION_COMPLETE, {
        type: 'spawn'
      });
    });
  }

  /**
   * 选中动画（微小脉冲，不放大）
   * @param {PIXI.Sprite} sprite - 精灵对象
   */
  animateSelection(sprite) {
    if (!sprite) {
      return;
    }
    
    // ✅ 先停止所有其他精灵的选中动画
    this.stopAllSelections();
    
    // 确保从原始大小开始
    sprite.scale.set(1.0);
    
    // 标记该精灵正在播放选中动画
    this.selectionTweens.set(sprite, true);
    
    // ✅ 微小脉冲循环（0.95-1.0，不放大）
    const pulse = () => {
      if (!this.selectionTweens.has(sprite)) {
        return;
      }
      
      // 缩小到 0.95
      const shrinkTween = new Tween(sprite.scale, { x: 0.95, y: 0.95 }, 400, 'easeInOutQuad');
      this._addTween(shrinkTween);
      
      shrinkTween.promise.then(() => {
        if (!this.selectionTweens.has(sprite)) {
          sprite.scale.set(1.0);
          return;
        }
        
        // 恢复到 1.0
        const expandTween = new Tween(sprite.scale, { x: 1.0, y: 1.0 }, 400, 'easeInOutQuad');
        this._addTween(expandTween);
        
        expandTween.promise.then(() => {
          pulse(); // 继续循环
        }).catch(() => {
          sprite.scale.set(1.0);
        });
      }).catch(() => {
        sprite.scale.set(1.0);
      });
    };
    
    pulse();
  }

  /**
   * 停止选中动画
   * @param {PIXI.Sprite} sprite - 精灵对象
   */
  stopSelection(sprite) {
    if (!sprite) {
      return;
    }
    
    // 先删除标记，防止循环继续
    const hadSelection = this.selectionTweens.has(sprite);
    this.selectionTweens.delete(sprite);
    
    // 停止所有与该精灵的 scale 相关的补间动画
    let stoppedCount = 0;
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i];
      // 检查是否是该精灵的 scale 动画
      if (tween.target === sprite.scale) {
        tween.stop();
        this.activeTweens.splice(i, 1);
        stoppedCount++;
      }
    }
    
    // ✅ 关键：立即恢复原始缩放（无论精灵当前处于什么状态）
    if (sprite.scale) {
      const currentScale = sprite.scale.x;
      sprite.scale.set(1.0);
      
      // 调试日志（可选）
      if (hadSelection && currentScale !== 1.0) {
        console.log(`🔄 恢复精灵缩放: ${currentScale.toFixed(2)} -> 1.0 (停止了 ${stoppedCount} 个动画)`);
      }
    }
  }

  /**
   * 检查是否有动画正在播放
   * @returns {boolean}
   */
  isAnimating() {
    return this.activeTweens.length > 0;
  }

  /**
   * 停止所有动画
   */
  stopAll() {
    // 停止所有补间动画
    this.activeTweens.forEach(tween => tween.stop());
    this.activeTweens = [];
    
    // 停止所有选中动画
    this.selectionTweens.forEach((value, sprite) => {
      if (sprite && sprite.scale) {
        sprite.scale.set(1.0);
      }
    });
    this.selectionTweens.clear();
    
    this.animationCount = 0;
    
    console.log('🛑 所有动画已停止');
  }

  /**
   * 停止所有选中动画
   */
  stopAllSelections() {
    // 复制 keys 以避免在迭代时修改 Map
    const sprites = Array.from(this.selectionTweens.keys());
    sprites.forEach(sprite => {
      this.stopSelection(sprite);
    });
  }

  /**
   * 获取活动动画数量
   */
  getActiveCount() {
    return this.activeTweens.length;
  }
}

export default AnimationController;
