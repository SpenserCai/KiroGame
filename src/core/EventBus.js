/**
 * 事件总线 - 实现发布-订阅模式
 * 用于模块间的松耦合通信
 */

// 游戏事件常量
export const GameEvents = {
  // 游戏生命周期事件
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_RESET: 'game:reset',
  GAME_OVER: 'game:over',
  
  // 图标事件
  TILE_SELECT: 'tile:select',
  TILE_DESELECT: 'tile:deselect',
  TILE_SWAP_START: 'tile:swap:start',
  TILE_SWAP_COMPLETE: 'tile:swap:complete',
  TILE_SWAP_REVERT: 'tile:swap:revert',
  TILE_REMOVE_START: 'tile:remove:start',
  TILE_REMOVE_COMPLETE: 'tile:remove:complete',
  TILE_FALL_START: 'tile:fall:start',
  TILE_FALL_COMPLETE: 'tile:fall:complete',
  TILE_SPAWN_START: 'tile:spawn:start',
  TILE_SPAWN_COMPLETE: 'tile:spawn:complete',
  
  // 匹配事件
  MATCH_FOUND: 'match:found',
  MATCH_NONE: 'match:none',
  
  // 分数和连锁事件
  SCORE_UPDATE: 'score:update',
  COMBO_TRIGGER: 'combo:trigger',
  
  // 状态事件
  STATE_CHANGE: 'state:change',
  
  // 动画事件
  ANIMATION_START: 'animation:start',
  ANIMATION_COMPLETE: 'animation:complete',
  ANIMATION_QUEUE_EMPTY: 'animation:queue:empty',
  
  // 输入事件
  INPUT_ENABLED: 'input:enabled',
  INPUT_DISABLED: 'input:disabled',
  
  // 游戏板事件
  BOARD_STABLE: 'board:stable',
  BOARD_SHUFFLE: 'board:shuffle',
  
  // 移动检测事件
  MOVES_NONE: 'moves:none',
  
  // 计时器事件
  TIMER_UPDATE: 'timer:update',
  TIMER_WARNING: 'timer:warning',
  
  // 错误事件
  ERROR: 'error'
};

/**
 * 事件总线类
 */
export class EventBus {
  constructor() {
    // 存储事件监听器的 Map: eventName -> Set<callback>
    this.listeners = new Map();
    
    // 存储一次性监听器的 Set
    this.onceListeners = new Set();
    
    // 调试模式
    this.debug = false;
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(eventName, callback) {
    // 验证参数
    if (typeof eventName !== 'string' || !eventName) {
      throw new Error('事件名称必须是非空字符串');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('回调必须是函数');
    }

    // 如果事件不存在，创建新的 Set
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    // 添加回调到监听器集合
    this.listeners.get(eventName).add(callback);

    if (this.debug) {
      console.log(`[EventBus] 订阅事件: ${eventName}`);
    }

    // 返回取消订阅函数
    return () => this.off(eventName, callback);
  }

  /**
   * 取消订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const callbacks = this.listeners.get(eventName);
    callbacks.delete(callback);

    // 如果没有监听器了，删除事件
    if (callbacks.size === 0) {
      this.listeners.delete(eventName);
    }

    // 从一次性监听器集合中移除
    this.onceListeners.delete(callback);

    if (this.debug) {
      console.log(`[EventBus] 取消订阅事件: ${eventName}`);
    }
  }

  /**
   * 一次性订阅事件（触发一次后自动取消订阅）
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  once(eventName, callback) {
    // 验证参数
    if (typeof eventName !== 'string' || !eventName) {
      throw new Error('事件名称必须是非空字符串');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('回调必须是函数');
    }

    // 创建包装函数
    const wrappedCallback = (data) => {
      // 执行原始回调
      callback(data);
      // 自动取消订阅
      this.off(eventName, wrappedCallback);
    };

    // 标记为一次性监听器
    this.onceListeners.add(wrappedCallback);

    // 订阅事件
    return this.on(eventName, wrappedCallback);
  }

  /**
   * 发布事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  emit(eventName, data = null) {
    if (this.debug) {
      console.log(`[EventBus] 发布事件: ${eventName}`, data);
    }

    // 如果没有监听器，直接返回
    if (!this.listeners.has(eventName)) {
      return;
    }

    // 获取所有监听器并执行
    const callbacks = this.listeners.get(eventName);
    
    // 使用 Array.from 创建副本，避免在回调中修改监听器集合导致问题
    Array.from(callbacks).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] 事件处理错误 (${eventName}):`, error);
        // 发布错误事件
        if (eventName !== GameEvents.ERROR) {
          this.emit(GameEvents.ERROR, {
            type: 'EVENT_HANDLER_ERROR',
            message: `事件 ${eventName} 的处理器抛出错误`,
            error,
            eventName,
            data
          });
        }
      }
    });
  }

  /**
   * 清除所有监听器
   */
  clear() {
    this.listeners.clear();
    this.onceListeners.clear();
    
    if (this.debug) {
      console.log('[EventBus] 清除所有监听器');
    }
  }

  /**
   * 清除指定事件的所有监听器
   * @param {string} eventName - 事件名称
   */
  clearEvent(eventName) {
    if (this.listeners.has(eventName)) {
      this.listeners.delete(eventName);
      
      if (this.debug) {
        console.log(`[EventBus] 清除事件监听器: ${eventName}`);
      }
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param {string} eventName - 事件名称
   * @returns {number} 监听器数量
   */
  listenerCount(eventName) {
    if (!this.listeners.has(eventName)) {
      return 0;
    }
    return this.listeners.get(eventName).size;
  }

  /**
   * 获取所有事件名称
   * @returns {string[]} 事件名称数组
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    this.debug = true;
    console.log('[EventBus] 调试模式已启用');
  }

  /**
   * 禁用调试模式
   */
  disableDebug() {
    this.debug = false;
  }
}

// 导出单例实例
export const eventBus = new EventBus();

export default EventBus;
