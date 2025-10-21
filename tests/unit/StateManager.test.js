/**
 * StateManager 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { StateManager, GameState } from '../../src/core/StateManager.js';
import { EventBus } from '../../src/core/EventBus.js';

test('StateManager - 初始化', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  assert.strictEqual(stateManager.getCurrentState(), GameState.MENU, '初始状态应为MENU');
  assert.strictEqual(stateManager.getPreviousState(), null, '上一个状态应为null');
});

test('StateManager - 合法状态转换', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  // MENU -> PLAYING
  const success = stateManager.setState(GameState.PLAYING);
  
  assert.strictEqual(success, true, '应成功转换');
  assert.strictEqual(stateManager.getCurrentState(), GameState.PLAYING, '当前状态应为PLAYING');
  assert.strictEqual(stateManager.getPreviousState(), GameState.MENU, '上一个状态应为MENU');
});

test('StateManager - 非法状态转换', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  // MENU 不能直接转换到 GAME_OVER
  const success = stateManager.setState(GameState.GAME_OVER);
  
  assert.strictEqual(success, false, '应转换失败');
  assert.strictEqual(stateManager.getCurrentState(), GameState.MENU, '状态应保持为MENU');
});

test('StateManager - 状态转换事件', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  let eventFired = false;
  let eventData = null;
  
  eventBus.on('state:change', (data) => {
    eventFired = true;
    eventData = data;
  });
  
  stateManager.setState(GameState.PLAYING);
  
  assert.strictEqual(eventFired, true, '应发布state:change事件');
  assert.strictEqual(eventData.from, GameState.MENU, '事件数据from应为MENU');
  assert.strictEqual(eventData.to, GameState.PLAYING, '事件数据to应为PLAYING');
});

test('StateManager - 状态进入回调', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  let callbackCalled = false;
  
  stateManager.registerEnterCallback(GameState.PLAYING, () => {
    callbackCalled = true;
  });
  
  stateManager.setState(GameState.PLAYING);
  
  assert.strictEqual(callbackCalled, true, '应调用状态进入回调');
});

test('StateManager - 状态退出回调', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  let callbackCalled = false;
  
  stateManager.registerExitCallback(GameState.MENU, () => {
    callbackCalled = true;
  });
  
  stateManager.setState(GameState.PLAYING);
  
  assert.strictEqual(callbackCalled, true, '应调用状态退出回调');
});

test('StateManager - 状态检查方法', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.PLAYING, eventBus);
  
  assert.strictEqual(stateManager.isState(GameState.PLAYING), true, 'isState应返回true');
  assert.strictEqual(stateManager.isPlaying(), true, 'isPlaying应返回true');
  assert.strictEqual(stateManager.isPaused(), false, 'isPaused应返回false');
  assert.strictEqual(stateManager.isGameOver(), false, 'isGameOver应返回false');
  assert.strictEqual(stateManager.isAnimating(), false, 'isAnimating应返回false');
});

test('StateManager - 完整状态转换流程', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  
  // MENU -> PLAYING
  assert.strictEqual(stateManager.setState(GameState.PLAYING), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.PLAYING);
  
  // PLAYING -> ANIMATING
  assert.strictEqual(stateManager.setState(GameState.ANIMATING), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.ANIMATING);
  
  // ANIMATING -> PLAYING
  assert.strictEqual(stateManager.setState(GameState.PLAYING), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.PLAYING);
  
  // PLAYING -> PAUSED
  assert.strictEqual(stateManager.setState(GameState.PAUSED), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.PAUSED);
  
  // PAUSED -> PLAYING
  assert.strictEqual(stateManager.setState(GameState.PLAYING), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.PLAYING);
  
  // PLAYING -> GAME_OVER
  assert.strictEqual(stateManager.setState(GameState.GAME_OVER), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.GAME_OVER);
  
  // GAME_OVER -> MENU
  assert.strictEqual(stateManager.setState(GameState.MENU), true);
  assert.strictEqual(stateManager.getCurrentState(), GameState.MENU);
});

test('StateManager - 重置', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.PLAYING, eventBus);
  
  stateManager.reset();
  
  assert.strictEqual(stateManager.getCurrentState(), GameState.MENU, '重置后状态应为MENU');
  assert.strictEqual(stateManager.getPreviousState(), null, '重置后上一个状态应为null');
});

console.log('✅ StateManager 测试完成');
