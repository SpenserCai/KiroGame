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
    // ✅ 先停止该精灵上所有动画（防止冲突）
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i];
      if (tween.target === sprite || tween.target === sprite.scale) {
        tween.stop();
        this.activeTweens.splice(i, 1);
      }
    }
    
    // ✅ 获取正常缩放值
    const normalScale = sprite.normalScale || 1.0;
    
    // 设置初始状态（缩放为0，透明）
    sprite.scale.set(0);
    sprite.alpha = 0;
    
    // ✅ 动画到正常缩放值（而不是硬编码的 1.0）
    const tween = new Tween(
      sprite,
      {
        'scale.x': normalScale,
        'scale.y': normalScale,
        alpha: 1.0
      },
      duration,
      'easeOutCubic'
    );
    
    this._addTween(tween);
    
    // ✅ 确保动画完成后精确设置为正常缩放
    return tween.promise.then(() => {
      sprite.scale.set(normalScale);
      sprite.alpha = 1.0;
      return sprite;
    }).catch((error) => {
      // 即使动画被中断，也要恢复正常状态
      sprite.scale.set(normalScale);
      sprite.alpha = 1.0;
      throw error;
    });
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
   * 选中动画（不改变大小，只通过边框高亮表示）
   * @param {PIXI.Sprite} sprite - 精灵对象
   */
  animateSelection(sprite) {
    if (!sprite) {
      return;
    }
    
    // ✅ 先停止所有其他精灵的选中动画
    this.stopAllSelections();
    
    // ✅ 停止该精灵上所有动画
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i];
      if (tween.target === sprite || tween.target === sprite.scale || tween.target === sprite.position) {
        tween.stop();
        this.activeTweens.splice(i, 1);
      }
    }
    
    // ✅ 强制设置为正常缩放（使用 normalScale）
    const normalScale = sprite.normalScale || 1.0;
    sprite.scale.set(normalScale);
    
    // 标记该精灵正在播放选中动画（虽然现在没有实际动画）
    this.selectionTweens.set(sprite, true);
    
    // ✅ 不播放任何动画，保持原始大小
    // 选中状态完全由 RenderEngine 的 highlightTile 边框来表示
  }

  /**
   * 停止选中动画
   * @param {PIXI.Sprite} sprite - 精灵对象
   */
  stopSelection(sprite) {
    if (!sprite) {
      return;
    }
    
    // 先删除标记
    this.selectionTweens.delete(sprite);
    
    // 停止所有与该精灵相关的补间动画
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tween = this.activeTweens[i];
      // 检查是否是该精灵的动画（scale 或 position）
      if (tween.target === sprite.scale || tween.target === sprite.position || tween.target === sprite) {
        tween.stop();
        this.activeTweens.splice(i, 1);
      }
    }
    
    // ✅ 关键：立即恢复正常缩放（使用 normalScale）
    const normalScale = sprite.normalScale || 1.0;
    if (sprite.scale) {
      sprite.scale.set(normalScale);
    }
    if (sprite.alpha !== undefined) {
      sprite.alpha = 1.0;
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
    
    // 停止所有选中动画，恢复正常缩放
    this.selectionTweens.forEach((value, sprite) => {
      if (sprite && sprite.scale) {
        const normalScale = sprite.normalScale || 1.0;
        sprite.scale.set(normalScale);
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
