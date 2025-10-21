/**
 * 状态管理器 - 管理游戏状态机和状态转换
 */

import { GameEvents } from './EventBus.js';

/**
 * 游戏状态常量
 */
export const GameState = {
  MENU: 'menu',                // 主菜单
  PLAYING: 'playing',          // 游戏中
  PAUSED: 'paused',            // 暂停
  GAME_OVER: 'game_over',      // 游戏结束
  ANIMATING: 'animating'       // 动画播放中
};

/**
 * 状态管理器类
 */
export class StateManager {
  /**
   * 创建状态管理器
   * @param {string} initialState - 初始状态
   * @param {EventBus} eventBus - 事件总线
   */
  constructor(initialState = GameState.MENU, eventBus) {
    this.currentState = initialState;
    this.previousState = null;
    this.eventBus = eventBus;
    
    // 状态转换规则表
    this.transitionRules = this._initTransitionRules();
    
    // 状态进入/退出回调
    this.stateEnterCallbacks = new Map();
    this.stateExitCallbacks = new Map();
  }

  /**
   * 初始化状态转换规则
   * @returns {Map} 状态转换规则表
   */
  _initTransitionRules() {
    const rules = new Map();
    
    // MENU 可以转换到 PLAYING
    rules.set(GameState.MENU, [GameState.PLAYING]);
    
    // PLAYING 可以转换到 ANIMATING, PAUSED, GAME_OVER
    rules.set(GameState.PLAYING, [
      GameState.ANIMATING,
      GameState.PAUSED,
      GameState.GAME_OVER
    ]);
    
    // ANIMATING 可以转换到 PLAYING, GAME_OVER
    rules.set(GameState.ANIMATING, [
      GameState.PLAYING,
      GameState.GAME_OVER
    ]);
    
    // PAUSED 可以转换到 PLAYING, MENU
    rules.set(GameState.PAUSED, [
      GameState.PLAYING,
      GameState.MENU
    ]);
    
    // GAME_OVER 可以转换到 MENU
    rules.set(GameState.GAME_OVER, [GameState.MENU]);
    
    return rules;
  }

  /**
   * 获取当前状态
   * @returns {string} 当前状态
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * 获取上一个状态
   * @returns {string|null} 上一个状态
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * 检查是否可以转换到目标状态
   * @param {string} targetState - 目标状态
   * @returns {boolean} 是否可以转换
   */
  canTransition(targetState) {
    const allowedStates = this.transitionRules.get(this.currentState);
    
    if (!allowedStates) {
      console.warn(`未定义状态 ${this.currentState} 的转换规则`);
      return false;
    }
    
    return allowedStates.includes(targetState);
  }

  /**
   * 设置新状态
   * @param {string} newState - 新状态
   * @param {Object} data - 状态数据（可选）
   * @returns {boolean} 是否成功转换
   */
  setState(newState, data = {}) {
    // 验证状态
    if (!Object.values(GameState).includes(newState)) {
      console.error(`无效的状态: ${newState}`);
      return false;
    }
    
    // 如果状态相同，不做任何操作
    if (this.currentState === newState) {
      return true;
    }
    
    // 检查是否可以转换
    if (!this.canTransition(newState)) {
      console.warn(`无法从 ${this.currentState} 转换到 ${newState}`);
      return false;
    }
    
    const oldState = this.currentState;
    
    // 执行状态退出回调
    this.onStateExit(oldState, data);
    
    // 更新状态
    this.previousState = oldState;
    this.currentState = newState;
    
    // 执行状态进入回调
    this.onStateEnter(newState, data);
    
    // 发布状态变化事件
    if (this.eventBus) {
      this.eventBus.emit(GameEvents.STATE_CHANGE, {
        from: oldState,
        to: newState,
        data
      });
    }
    
    console.log(`🔄 状态转换: ${oldState} -> ${newState}`);
    
    return true;
  }

  /**
   * 状态进入回调
   * @param {string} state - 进入的状态
   * @param {Object} data - 状态数据
   */
  onStateEnter(state, data) {
    const callback = this.stateEnterCallbacks.get(state);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error(`状态进入回调错误 (${state}):`, error);
      }
    }
  }

  /**
   * 状态退出回调
   * @param {string} state - 退出的状态
   * @param {Object} data - 状态数据
   */
  onStateExit(state, data) {
    const callback = this.stateExitCallbacks.get(state);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error(`状态退出回调错误 (${state}):`, error);
      }
    }
  }

  /**
   * 注册状态进入回调
   * @param {string} state - 状态
   * @param {Function} callback - 回调函数
   */
  registerEnterCallback(state, callback) {
    if (typeof callback !== 'function') {
      throw new Error('回调必须是函数');
    }
    this.stateEnterCallbacks.set(state, callback);
  }

  /**
   * 注册状态退出回调
   * @param {string} state - 状态
   * @param {Function} callback - 回调函数
   */
  registerExitCallback(state, callback) {
    if (typeof callback !== 'function') {
      throw new Error('回调必须是函数');
    }
    this.stateExitCallbacks.set(state, callback);
  }

  /**
   * 检查是否处于指定状态
   * @param {string} state - 状态
   * @returns {boolean}
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * 检查是否处于游戏中状态（PLAYING 或 ANIMATING）
   * @returns {boolean}
   */
  isPlaying() {
    return this.currentState === GameState.PLAYING || 
           this.currentState === GameState.ANIMATING;
  }

  /**
   * 检查是否处于暂停状态
   * @returns {boolean}
   */
  isPaused() {
    return this.currentState === GameState.PAUSED;
  }

  /**
   * 检查是否处于游戏结束状态
   * @returns {boolean}
   */
  isGameOver() {
    return this.currentState === GameState.GAME_OVER;
  }

  /**
   * 检查是否处于动画状态
   * @returns {boolean}
   */
  isAnimating() {
    return this.currentState === GameState.ANIMATING;
  }

  /**
   * 重置状态管理器
   */
  reset() {
    this.previousState = null;
    this.currentState = GameState.MENU;
    console.log('🔄 状态管理器已重置');
  }
}

export default StateManager;
