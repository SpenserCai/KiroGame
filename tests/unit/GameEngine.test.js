/**
 * GameEngine 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../../src/core/GameEngine.js';
import { EventBus } from '../../src/core/EventBus.js';
import { StateManager, GameState } from '../../src/core/StateManager.js';
import { BoardManager } from '../../src/game/BoardManager.js';
import { MatchDetector } from '../../src/game/MatchDetector.js';
import { GameConfig } from '../../src/config.js';

test('GameEngine - 初始化', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  gameEngine.init();
  
  assert.strictEqual(gameEngine.score, 0, '初始分数应为0');
  assert.strictEqual(gameEngine.moves, 0, '初始移动次数应为0');
  assert.strictEqual(gameEngine.comboCount, 0, '初始连锁计数应为0');
  assert.strictEqual(gameEngine.isProcessing, false, '初始处理状态应为false');
});

test('GameEngine - 分数计算（单次消除）', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  // 创建一个3连匹配
  const tiles = [
    { type: 0, x: 0, y: 0 },
    { type: 0, x: 1, y: 0 },
    { type: 0, x: 2, y: 0 }
  ];
  
  const matches = [{ tiles, direction: 'horizontal', length: 3 }];
  
  const scoreData = gameEngine.calculateScore(matches, 1);
  
  assert.strictEqual(scoreData.score, 30, '3连应得30分');
  assert.strictEqual(scoreData.basePoints, 30, '基础分应为30');
  assert.strictEqual(scoreData.multiplier, 1, '第1次连锁倍数应为1.0');
  assert.strictEqual(scoreData.tilesCleared, 3, '应消除3个图标');
});

test('GameEngine - 分数计算（4连额外奖励）', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  // 创建一个4连匹配
  const tiles = [
    { type: 0, x: 0, y: 0 },
    { type: 0, x: 1, y: 0 },
    { type: 0, x: 2, y: 0 },
    { type: 0, x: 3, y: 0 }
  ];
  
  const matches = [{ tiles, direction: 'horizontal', length: 4 }];
  
  const scoreData = gameEngine.calculateScore(matches, 1);
  
  // 4连：40分基础 + 20分奖励 = 60分
  assert.strictEqual(scoreData.score, 60, '4连应得60分（40基础+20奖励）');
  assert.strictEqual(scoreData.tilesCleared, 4, '应消除4个图标');
});

test('GameEngine - 分数计算（5连额外奖励）', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  // 创建一个5连匹配
  const tiles = [
    { type: 0, x: 0, y: 0 },
    { type: 0, x: 1, y: 0 },
    { type: 0, x: 2, y: 0 },
    { type: 0, x: 3, y: 0 },
    { type: 0, x: 4, y: 0 }
  ];
  
  const matches = [{ tiles, direction: 'horizontal', length: 5 }];
  
  const scoreData = gameEngine.calculateScore(matches, 1);
  
  // 5连：50分基础 + 50分奖励 = 100分
  assert.strictEqual(scoreData.score, 100, '5连应得100分（50基础+50奖励）');
  assert.strictEqual(scoreData.tilesCleared, 5, '应消除5个图标');
});

test('GameEngine - 分数计算（连锁倍数）', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  // 创建一个3连匹配
  const tiles = [
    { type: 0, x: 0, y: 0 },
    { type: 0, x: 1, y: 0 },
    { type: 0, x: 2, y: 0 }
  ];
  
  const matches = [{ tiles, direction: 'horizontal', length: 3 }];
  
  // 第1次连锁
  const score1 = gameEngine.calculateScore(matches, 1);
  assert.strictEqual(score1.score, 30, '第1次连锁：30分 × 1.0 = 30分');
  assert.strictEqual(score1.multiplier, 1, '第1次连锁倍数应为1.0');
  
  // 第2次连锁
  const score2 = gameEngine.calculateScore(matches, 2);
  assert.strictEqual(score2.score, 45, '第2次连锁：30分 × 1.5 = 45分');
  assert.strictEqual(score2.multiplier, 1.5, '第2次连锁倍数应为1.5');
  
  // 第3次连锁
  const score3 = gameEngine.calculateScore(matches, 3);
  assert.strictEqual(score3.score, 67, '第3次连锁：30分 × 2.25 = 67分（向下取整）');
  assert.ok(Math.abs(score3.multiplier - 2.25) < 0.01, '第3次连锁倍数应为2.25');
});

test('GameEngine - 启动游戏', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  gameEngine.init();
  
  // 订阅游戏开始事件
  let gameStarted = false;
  eventBus.on('game:start', () => {
    gameStarted = true;
  });
  
  gameEngine.start();
  
  assert.strictEqual(stateManager.getCurrentState(), GameState.PLAYING, '游戏状态应为PLAYING');
  assert.strictEqual(gameStarted, true, '应发布game:start事件');
});

test('GameEngine - 重置游戏', () => {
  const eventBus = new EventBus();
  const stateManager = new StateManager(GameState.MENU, eventBus);
  const matchDetector = new MatchDetector();
  const boardManager = new BoardManager(8, 8, 5, matchDetector);
  
  const gameEngine = new GameEngine(
    GameConfig,
    eventBus,
    boardManager,
    matchDetector,
    stateManager
  );
  
  gameEngine.init();
  
  // 修改游戏数据
  gameEngine.score = 100;
  gameEngine.moves = 5;
  gameEngine.comboCount = 3;
  
  // 重置游戏
  gameEngine.reset();
  
  assert.strictEqual(gameEngine.score, 0, '重置后分数应为0');
  assert.strictEqual(gameEngine.moves, 0, '重置后移动次数应为0');
  assert.strictEqual(gameEngine.comboCount, 0, '重置后连锁计数应为0');
  assert.strictEqual(stateManager.getCurrentState(), GameState.MENU, '重置后状态应为MENU');
});

console.log('✅ GameEngine 测试完成');
