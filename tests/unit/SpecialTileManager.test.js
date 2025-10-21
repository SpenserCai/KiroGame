/**
 * SpecialTileManager 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { SpecialTileManager } from '../../src/game/SpecialTileManager.js';
import { BoardManager } from '../../src/game/BoardManager.js';
import { Tile, SpecialTileType } from '../../src/game/Tile.js';
import { Match } from '../../src/game/MatchDetector.js';
import config from '../../src/config.js';

// 辅助函数：创建测试用的匹配对象
function createMatch(tiles, direction) {
  return new Match(tiles, direction);
}

// 辅助函数：创建测试用的图标
function createTile(type, x, y) {
  return new Tile(type, x, y);
}

test('SpecialTileManager - 4连生成炸弹', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建4连匹配
  const tiles = [
    createTile(0, 0, 0),
    createTile(0, 1, 0),
    createTile(0, 2, 0),
    createTile(0, 3, 0)
  ];
  const match = createMatch(tiles, 'horizontal');
  
  const result = specialManager.detectSpecialTileGeneration([match]);
  
  assert.ok(result);
  assert.strictEqual(result.type, SpecialTileType.BOMB);
  assert.strictEqual(result.matchLength, 4);
  // 中心位置应该是索引1或2（4个元素的中心）
  assert.ok(result.position.x === 1 || result.position.x === 2);
});

test('SpecialTileManager - 5连生成彩色炸弹', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建5连匹配
  const tiles = [
    createTile(1, 0, 0),
    createTile(1, 1, 0),
    createTile(1, 2, 0),
    createTile(1, 3, 0),
    createTile(1, 4, 0)
  ];
  const match = createMatch(tiles, 'horizontal');
  
  const result = specialManager.detectSpecialTileGeneration([match]);
  
  assert.ok(result);
  assert.strictEqual(result.type, SpecialTileType.COLOR_BOMB);
  assert.strictEqual(result.matchLength, 5);
  assert.strictEqual(result.position.x, 2); // 中心位置
});

test('SpecialTileManager - L型匹配生成横向消除', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建L型匹配（横向 + 纵向交叉）
  const horizontalTiles = [
    createTile(2, 1, 2),
    createTile(2, 2, 2),
    createTile(2, 3, 2)
  ];
  const verticalTiles = [
    createTile(2, 2, 0),
    createTile(2, 2, 1),
    createTile(2, 2, 2)
  ];
  
  const horizontalMatch = createMatch(horizontalTiles, 'horizontal');
  const verticalMatch = createMatch(verticalTiles, 'vertical');
  
  const result = specialManager.detectSpecialTileGeneration([horizontalMatch, verticalMatch]);
  
  assert.ok(result);
  assert.strictEqual(result.type, SpecialTileType.ROW_CLEAR);
  assert.strictEqual(result.matchType, 'L_SHAPE');
  assert.strictEqual(result.position.x, 2);
  assert.strictEqual(result.position.y, 2);
});

test('SpecialTileManager - T型匹配生成纵向消除', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建T型匹配（纵向 + 横向交叉）
  const verticalTiles = [
    createTile(3, 3, 1),
    createTile(3, 3, 2),
    createTile(3, 3, 3)
  ];
  const horizontalTiles = [
    createTile(3, 2, 2),
    createTile(3, 3, 2),
    createTile(3, 4, 2)
  ];
  
  const verticalMatch = createMatch(verticalTiles, 'vertical');
  const horizontalMatch = createMatch(horizontalTiles, 'horizontal');
  
  const result = specialManager.detectSpecialTileGeneration([verticalMatch, horizontalMatch]);
  
  assert.ok(result);
  assert.strictEqual(result.type, SpecialTileType.COL_CLEAR);
  assert.strictEqual(result.matchType, 'L_SHAPE');
  assert.strictEqual(result.position.x, 3);
  assert.strictEqual(result.position.y, 2);
});

test('SpecialTileManager - 3连不生成特殊图标', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建普通3连匹配
  const tiles = [
    createTile(0, 0, 0),
    createTile(0, 1, 0),
    createTile(0, 2, 0)
  ];
  const match = createMatch(tiles, 'horizontal');
  
  const result = specialManager.detectSpecialTileGeneration([match]);
  
  assert.strictEqual(result, null);
});

test('SpecialTileManager - 炸弹激活效果（3x3范围）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建炸弹图标（直接创建，不依赖棋盘状态）
  const bombTile = createTile(0, 3, 3);
  bombTile.setSpecial(SpecialTileType.BOMB);
  
  // 将炸弹放置到棋盘上
  boardManager.setTile(3, 3, bombTile);
  
  const positions = specialManager.detectSpecialTileActivation(bombTile);
  
  // 3x3范围应该有9个位置（如果都在棋盘内）
  assert.ok(positions.length > 0);
  assert.ok(positions.length <= 9);
  
  // 验证包含中心位置
  const hasCenter = positions.some(pos => pos.x === 3 && pos.y === 3);
  assert.ok(hasCenter);
  
  // 验证包含周围位置
  const hasAdjacent = positions.some(pos => 
    Math.abs(pos.x - 3) <= 1 && Math.abs(pos.y - 3) <= 1
  );
  assert.ok(hasAdjacent);
});

test('SpecialTileManager - 彩色炸弹激活效果（所有相同类型）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建彩色炸弹
  const colorBombTile = createTile(1, 4, 4);
  colorBombTile.setSpecial(SpecialTileType.COLOR_BOMB);
  boardManager.setTile(4, 4, colorBombTile);
  
  // 创建目标图标（类型0）
  const targetTile = createTile(0, 5, 5);
  boardManager.setTile(5, 5, targetTile);
  
  // 手动设置一些类型0的图标
  for (let i = 0; i < 3; i++) {
    const tile = createTile(0, i, 0);
    boardManager.setTile(i, 0, tile);
  }
  
  const positions = specialManager.detectSpecialTileActivation(colorBombTile, targetTile);
  
  // 应该包含所有类型0的图标
  assert.ok(positions.length > 0);
  
  // 验证彩色炸弹本身也被包含
  const hasBomb = positions.some(pos => pos.x === 4 && pos.y === 4);
  assert.ok(hasBomb);
});

test('SpecialTileManager - 横向消除激活效果（整行）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建横向消除图标
  const rowClearTile = createTile(0, 2, 3);
  rowClearTile.setSpecial(SpecialTileType.ROW_CLEAR);
  boardManager.setTile(2, 3, rowClearTile);
  
  const positions = specialManager.detectSpecialTileActivation(rowClearTile);
  
  // 应该包含整行（8个位置）
  assert.strictEqual(positions.length, config.board.cols);
  
  // 验证所有位置都在同一行
  const allSameRow = positions.every(pos => pos.y === 3);
  assert.ok(allSameRow);
});

test('SpecialTileManager - 纵向消除激活效果（整列）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建纵向消除图标
  const colClearTile = createTile(0, 5, 2);
  colClearTile.setSpecial(SpecialTileType.COL_CLEAR);
  boardManager.setTile(5, 2, colClearTile);
  
  const positions = specialManager.detectSpecialTileActivation(colClearTile);
  
  // 应该包含整列（8个位置）
  assert.strictEqual(positions.length, config.board.rows);
  
  // 验证所有位置都在同一列
  const allSameCol = positions.every(pos => pos.x === 5);
  assert.ok(allSameCol);
});

test('SpecialTileManager - 双炸弹组合效果（5x5范围）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建两个炸弹
  const bomb1 = createTile(0, 3, 3);
  const bomb2 = createTile(0, 4, 3);
  bomb1.setSpecial(SpecialTileType.BOMB);
  bomb2.setSpecial(SpecialTileType.BOMB);
  boardManager.setTile(3, 3, bomb1);
  boardManager.setTile(4, 3, bomb2);
  
  const combo = specialManager.detectSpecialCombo(bomb1, bomb2);
  
  assert.ok(combo);
  assert.strictEqual(combo.type, 'combo');
  assert.ok(combo.positions.length > 9); // 应该大于单个炸弹的3x3
  assert.strictEqual(combo.description, '双炸弹组合：5x5爆炸');
});

test('SpecialTileManager - 炸弹+横向消除组合（3行）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建炸弹和横向消除
  const bomb = createTile(0, 3, 3);
  const rowClear = createTile(0, 4, 3);
  bomb.setSpecial(SpecialTileType.BOMB);
  rowClear.setSpecial(SpecialTileType.ROW_CLEAR);
  boardManager.setTile(3, 3, bomb);
  boardManager.setTile(4, 3, rowClear);
  
  const combo = specialManager.detectSpecialCombo(bomb, rowClear);
  
  assert.ok(combo);
  assert.strictEqual(combo.type, 'combo');
  assert.strictEqual(combo.description, '炸弹+横向消除：3行爆炸');
  // 应该包含3行的所有图标
  assert.ok(combo.positions.length >= config.board.cols * 3);
});

test('SpecialTileManager - 横向+纵向消除组合（十字）', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建横向和纵向消除
  const rowClear = createTile(0, 3, 3);
  const colClear = createTile(0, 4, 3);
  rowClear.setSpecial(SpecialTileType.ROW_CLEAR);
  colClear.setSpecial(SpecialTileType.COL_CLEAR);
  boardManager.setTile(3, 3, rowClear);
  boardManager.setTile(4, 3, colClear);
  
  const combo = specialManager.detectSpecialCombo(rowClear, colClear);
  
  assert.ok(combo);
  assert.strictEqual(combo.type, 'combo');
  assert.strictEqual(combo.description, '十字消除：整行+整列');
  // 应该包含一行+一列的所有图标
  const expectedCount = config.board.cols + config.board.rows - 1; // 减1是因为交叉点重复
  assert.ok(combo.positions.length >= expectedCount);
});

test('SpecialTileManager - 彩色炸弹组合标记', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 创建彩色炸弹和炸弹
  const colorBomb = createTile(0, 3, 3);
  const bomb = createTile(0, 4, 3);
  colorBomb.setSpecial(SpecialTileType.COLOR_BOMB);
  bomb.setSpecial(SpecialTileType.BOMB);
  boardManager.setTile(3, 3, colorBomb);
  boardManager.setTile(4, 3, bomb);
  
  const combo = specialManager.detectSpecialCombo(colorBomb, bomb);
  
  assert.ok(combo);
  assert.strictEqual(combo.type, 'color_bomb_combo');
  assert.strictEqual(combo.description, '彩色炸弹组合：超级爆炸');
  // 彩色炸弹组合应该消除整个棋盘
  assert.ok(combo.positions.length > 0);
});

test('SpecialTileManager - 计算炸弹特殊分数', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  const bonus = specialManager.calculateSpecialBonus(SpecialTileType.BOMB, 9);
  
  // 炸弹：tilesCleared * baseScore * 2
  // 9 * 10 * 2 = 180
  assert.strictEqual(bonus, 180);
});

test('SpecialTileManager - 计算彩色炸弹特殊分数', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  const bonus = specialManager.calculateSpecialBonus(SpecialTileType.COLOR_BOMB, 15);
  
  // 彩色炸弹：tilesCleared * baseScore * 5
  // 15 * 10 * 5 = 750
  assert.strictEqual(bonus, 750);
});

test('SpecialTileManager - 计算横向/纵向消除特殊分数', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  const bonus = specialManager.calculateSpecialBonus(SpecialTileType.ROW_CLEAR, 8);
  
  // 横向/纵向消除：tilesCleared * baseScore * 3
  // 8 * 10 * 3 = 240
  assert.strictEqual(bonus, 240);
});

test('SpecialTileManager - 普通图标不触发特殊激活', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 普通图标
  const normalTile = createTile(0, 3, 3);
  boardManager.setTile(3, 3, normalTile);
  
  const positions = specialManager.detectSpecialTileActivation(normalTile);
  
  assert.strictEqual(positions.length, 0);
});

test('SpecialTileManager - 非特殊图标不触发组合', () => {
  const boardManager = new BoardManager(config.board.rows, config.board.cols, config.board.tileTypes);
  boardManager.createBoard();
  const specialManager = new SpecialTileManager(config, boardManager);
  
  // 两个普通图标
  const tile1 = createTile(0, 3, 3);
  const tile2 = createTile(0, 4, 3);
  boardManager.setTile(3, 3, tile1);
  boardManager.setTile(4, 3, tile2);
  
  const combo = specialManager.detectSpecialCombo(tile1, tile2);
  
  assert.strictEqual(combo, null);
});
