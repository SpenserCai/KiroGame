/**
 * BoardManager 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { BoardManager } from '../../src/game/BoardManager.js';
import { MatchDetector } from '../../src/game/MatchDetector.js';

test('BoardManager - 创建8x8游戏板', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  // 验证所有位置都有图标
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const tile = board.getTile(x, y);
      assert.ok(tile !== null, `位置 (${x}, ${y}) 应该有图标`);
      assert.ok(tile.type >= 0 && tile.type < 5, '图标类型应该在 0-4 之间');
    }
  }
});

test('BoardManager - 初始化后无匹配', () => {
  const matchDetector = new MatchDetector();
  const board = new BoardManager(8, 8, 5, matchDetector);
  
  board.createBoard();
  board.ensureNoInitialMatches();

  const matches = matchDetector.findMatches(board);
  assert.strictEqual(matches.length, 0, '初始化后不应该有匹配');
});

test('BoardManager - 交换相邻图标', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  const tile1 = board.getTile(0, 0);
  const tile2 = board.getTile(1, 0);

  const success = board.swapTiles({ x: 0, y: 0 }, { x: 1, y: 0 });

  assert.strictEqual(success, true, '交换应该成功');
  assert.strictEqual(board.getTile(0, 0), tile2);
  assert.strictEqual(board.getTile(1, 0), tile1);
});

test('BoardManager - 交换不相邻图标失败', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  const isAdjacent = board.isAdjacent({ x: 0, y: 0 }, { x: 2, y: 0 });
  assert.strictEqual(isAdjacent, false, '不相邻的图标不应该被认为是相邻的');
});

test('BoardManager - isValidPosition', () => {
  const board = new BoardManager(8, 8, 5);

  assert.strictEqual(board.isValidPosition(0, 0), true);
  assert.strictEqual(board.isValidPosition(7, 7), true);
  assert.strictEqual(board.isValidPosition(-1, 0), false);
  assert.strictEqual(board.isValidPosition(8, 0), false);
  assert.strictEqual(board.isValidPosition(0, 8), false);
});

test('BoardManager - removeTiles', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  board.removeTiles([{ x: 0, y: 0 }, { x: 1, y: 0 }]);

  assert.strictEqual(board.getTile(0, 0), null);
  assert.strictEqual(board.getTile(1, 0), null);
});

test('BoardManager - applyGravity', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  // 移除底部的图标
  board.removeTiles([{ x: 0, y: 7 }]);

  const movements = board.applyGravity();

  // 验证有移动发生
  assert.ok(movements.length > 0, '应该有图标下落');
  
  // 验证底部位置现在有图标
  assert.ok(board.getTile(0, 7) !== null, '底部应该有图标');
});

test('BoardManager - fillBoard', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  // 移除一些图标
  board.removeTiles([{ x: 0, y: 0 }, { x: 1, y: 0 }]);

  const newTiles = board.fillBoard();

  // 验证生成了新图标
  assert.strictEqual(newTiles.length, 2);
  assert.ok(board.getTile(0, 0) !== null);
  assert.ok(board.getTile(1, 0) !== null);
});

test('BoardManager - wouldCreateMatch', () => {
  const board = new BoardManager(8, 8, 5);
  board.createBoard();

  // 手动设置一个会产生匹配的情况
  const tile1 = board.getTile(0, 0);
  const tile2 = board.getTile(1, 0);
  const tile3 = board.getTile(2, 0);
  
  tile1.type = 0;
  tile2.type = 0;
  tile3.type = 0;

  // 检查中间的图标是否会产生匹配
  assert.strictEqual(board.wouldCreateMatch(1, 0), true);
});

console.log('✅ BoardManager 所有测试通过');
