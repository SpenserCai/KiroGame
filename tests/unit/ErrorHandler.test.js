/**
 * ErrorHandler 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ErrorHandler, GameError, ErrorType } from '../../src/utils/ErrorHandler.js';

test('GameError - 创建游戏错误', () => {
  const error = new GameError(ErrorType.INIT_ERROR, '初始化失败', { detail: 'test' });
  
  assert.strictEqual(error.type, ErrorType.INIT_ERROR);
  assert.strictEqual(error.message, '初始化失败');
  assert.deepStrictEqual(error.details, { detail: 'test' });
  assert.ok(error.timestamp > 0);
});

test('ErrorHandler - 记录错误', () => {
  const handler = new ErrorHandler();
  const error = new GameError(ErrorType.LOGIC_ERROR, '逻辑错误');
  
  handler.handle(error);
  
  const log = handler.getErrorLog();
  assert.strictEqual(log.length, 1);
  assert.strictEqual(log[0].type, ErrorType.LOGIC_ERROR);
  assert.strictEqual(log[0].message, '逻辑错误');
});

test('ErrorHandler - 限制日志大小', () => {
  const handler = new ErrorHandler();
  handler.maxLogSize = 5;
  
  // 添加6个错误
  for (let i = 0; i < 6; i++) {
    handler.handle(new GameError(ErrorType.LOGIC_ERROR, `错误${i}`));
  }
  
  const log = handler.getErrorLog();
  assert.strictEqual(log.length, 5);
  assert.strictEqual(log[0].message, '错误1'); // 第一个被移除
});

test('ErrorHandler - 清除错误日志', () => {
  const handler = new ErrorHandler();
  
  handler.handle(new GameError(ErrorType.LOGIC_ERROR, '错误1'));
  handler.handle(new GameError(ErrorType.LOGIC_ERROR, '错误2'));
  
  assert.strictEqual(handler.getErrorLog().length, 2);
  
  handler.clearErrorLog();
  
  assert.strictEqual(handler.getErrorLog().length, 0);
});

test('ErrorHandler.validateConfig - 验证有效配置', () => {
  const validConfig = {
    board: { rows: 8, cols: 8, tileTypes: 5 },
    rendering: { tileSize: 64 },
    animation: {},
    scoring: {},
    timer: {}
  };
  
  assert.doesNotThrow(() => {
    ErrorHandler.validateConfig(validConfig);
  });
});

test('ErrorHandler.validateConfig - 缺少必需配置项', () => {
  const invalidConfig = {
    board: { rows: 8, cols: 8, tileTypes: 5 },
    rendering: { tileSize: 64 }
    // 缺少 animation, scoring, timer
  };
  
  assert.throws(() => {
    ErrorHandler.validateConfig(invalidConfig);
  }, {
    name: 'GameError',
    type: ErrorType.CONFIG_ERROR
  });
});

test('ErrorHandler.validateConfig - 游戏板行数超出范围', () => {
  const invalidConfig = {
    board: { rows: 25, cols: 8, tileTypes: 5 }, // 行数过大
    rendering: { tileSize: 64 },
    animation: {},
    scoring: {},
    timer: {}
  };
  
  assert.throws(() => {
    ErrorHandler.validateConfig(invalidConfig);
  }, {
    name: 'GameError',
    type: ErrorType.CONFIG_ERROR,
    message: '游戏板行数必须在4-20之间'
  });
});

test('ErrorHandler.validateConfig - 图标类型数量超出范围', () => {
  const invalidConfig = {
    board: { rows: 8, cols: 8, tileTypes: 15 }, // 类型过多
    rendering: { tileSize: 64 },
    animation: {},
    scoring: {},
    timer: {}
  };
  
  assert.throws(() => {
    ErrorHandler.validateConfig(invalidConfig);
  }, {
    name: 'GameError',
    type: ErrorType.CONFIG_ERROR,
    message: '图标类型数量必须在3-10之间'
  });
});

test('ErrorHandler.validateConfig - 图标尺寸超出范围', () => {
  const invalidConfig = {
    board: { rows: 8, cols: 8, tileTypes: 5 },
    rendering: { tileSize: 200 }, // 尺寸过大
    animation: {},
    scoring: {},
    timer: {}
  };
  
  assert.throws(() => {
    ErrorHandler.validateConfig(invalidConfig);
  }, {
    name: 'GameError',
    type: ErrorType.CONFIG_ERROR,
    message: '图标尺寸必须在32-128之间'
  });
});

test('ErrorHandler - 处理通用错误', () => {
  const handler = new ErrorHandler();
  const error = new Error('普通错误');
  
  // 在Node.js环境中，showErrorMessage会尝试访问document，这会失败
  // 我们只测试错误记录功能
  try {
    handler.handle(error);
  } catch (e) {
    // 预期在Node.js环境中会失败（因为没有document）
    // 但错误应该已经被记录
  }
  
  const log = handler.getErrorLog();
  assert.strictEqual(log.length, 1);
});

test('ErrorHandler - 恢复标志', () => {
  const handler = new ErrorHandler();
  
  assert.strictEqual(handler.isRecovering, false);
  
  // 模拟恢复过程
  handler.isRecovering = true;
  assert.strictEqual(handler.isRecovering, true);
  
  handler.isRecovering = false;
  assert.strictEqual(handler.isRecovering, false);
});
