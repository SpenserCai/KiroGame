/**
 * 游戏板管理器 - 管理游戏板的数据结构和基本操作
 */

import { Tile } from './Tile.js';

/**
 * 游戏板管理器类
 */
export class BoardManager {
  /**
   * 创建游戏板管理器
   * @param {number} rows - 行数
   * @param {number} cols - 列数
   * @param {number} tileTypes - 图标类型数量
   * @param {Object} matchDetector - 匹配检测器实例（可选，用于初始化检测）
   */
  constructor(rows, cols, tileTypes, matchDetector = null) {
    this.rows = rows;
    this.cols = cols;
    this.tileTypes = tileTypes;
    this.matchDetector = matchDetector;
    this.grid = [];  // 二维数组存储Tile
  }

  /**
   * 创建游戏板并随机填充图标
   * @returns {Tile[][]} 游戏板网格
   */
  createBoard() {
    this.grid = [];
    
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        const type = this._getRandomType();
        this.grid[y][x] = new Tile(type, x, y);
      }
    }

    return this.grid;
  }

  /**
   * 获取随机图标类型
   * @returns {number} 图标类型 (0 到 tileTypes-1)
   */
  _getRandomType() {
    return Math.floor(Math.random() * this.tileTypes);
  }

  /**
   * 获取指定位置的图标
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Tile|null} 图标对象，如果位置无效返回null
   */
  getTile(x, y) {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    return this.grid[y][x];
  }

  /**
   * 设置指定位置的图标
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Tile} tile - 图标对象
   */
  setTile(x, y, tile) {
    if (!this.isValidPosition(x, y)) {
      console.warn(`尝试在无效位置设置图标: (${x}, ${y})`);
      return;
    }
    
    if (tile) {
      tile.setPosition(x, y);
    }
    
    this.grid[y][x] = tile;
  }

  /**
   * 检查位置是否有效
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否有效
   */
  isValidPosition(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  /**
   * 检查两个位置是否相邻（水平或垂直）
   * @param {Object} pos1 - 位置1 {x, y}
   * @param {Object} pos2 - 位置2 {x, y}
   * @returns {boolean} 是否相邻
   */
  isAdjacent(pos1, pos2) {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    
    // 相邻条件：横向或纵向距离为1，且另一方向距离为0
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  /**
   * 交换两个图标的位置
   * @param {Object} pos1 - 位置1 {x, y}
   * @param {Object} pos2 - 位置2 {x, y}
   * @returns {boolean} 是否交换成功
   */
  swapTiles(pos1, pos2) {
    if (!this.isValidPosition(pos1.x, pos1.y) || !this.isValidPosition(pos2.x, pos2.y)) {
      return false;
    }

    const tile1 = this.getTile(pos1.x, pos1.y);
    const tile2 = this.getTile(pos2.x, pos2.y);

    if (!tile1 || !tile2) {
      return false;
    }

    // 交换位置
    this.setTile(pos1.x, pos1.y, tile2);
    this.setTile(pos2.x, pos2.y, tile1);

    return true;
  }

  /**
   * 移除指定位置的图标
   * @param {Array<{x, y}>} positions - 位置数组
   */
  removeTiles(positions) {
    positions.forEach(pos => {
      if (this.isValidPosition(pos.x, pos.y)) {
        this.grid[pos.y][pos.x] = null;
      }
    });
  }

  /**
   * 获取所有空位置
   * @returns {Array<{x, y}>} 空位置数组
   */
  getEmptyPositions() {
    const emptyPositions = [];
    
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === null) {
          emptyPositions.push({ x, y });
        }
      }
    }
    
    return emptyPositions;
  }

  /**
   * 应用重力使图标下落
   * @returns {Array<{tile, from, to}>} 移动记录数组
   */
  applyGravity() {
    const movements = [];

    // 从下往上遍历每一列
    for (let x = 0; x < this.cols; x++) {
      let writeY = this.rows - 1;  // 写入位置（从底部开始）

      // 从下往上扫描
      for (let y = this.rows - 1; y >= 0; y--) {
        const tile = this.grid[y][x];
        
        if (tile !== null) {
          // 如果当前位置不是写入位置，说明需要下落
          if (y !== writeY) {
            const from = { x, y };
            const to = { x, y: writeY };
            
            movements.push({ tile, from, to });
            
            // 移动图标
            this.grid[writeY][x] = tile;
            this.grid[y][x] = null;
            tile.setPosition(x, writeY);
          }
          
          writeY--;  // 写入位置上移
        }
      }
    }

    return movements;
  }

  /**
   * 填充游戏板（在顶部生成新图标）
   * @returns {Array<Tile>} 新生成的图标数组
   */
  fillBoard() {
    const newTiles = [];

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (this.grid[y][x] === null) {
          const type = this._getRandomType();
          const tile = new Tile(type, x, y);
          this.grid[y][x] = tile;
          newTiles.push(tile);
        }
      }
    }

    return newTiles;
  }

  /**
   * 确保初始化时无匹配
   * 使用智能替换算法，最多尝试100次
   * @returns {boolean} 是否成功消除所有初始匹配
   */
  ensureNoInitialMatches() {
    if (!this.matchDetector) {
      console.warn('未提供匹配检测器，跳过初始匹配检测');
      return true;
    }

    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const matches = this.matchDetector.findMatches(this);

      if (matches.length === 0) {
        return true;  // 成功：无匹配
      }

      // 策略：只替换匹配的图标，而不是重新生成整个棋盘
      for (const match of matches) {
        for (const tile of match.tiles) {
          let newType;
          let safeType = false;

          // 尝试找到一个不会产生新匹配的类型
          for (let i = 0; i < this.tileTypes; i++) {
            newType = i;
            tile.type = newType;

            // 检查这个位置是否还会产生匹配
            if (!this.wouldCreateMatch(tile.x, tile.y)) {
              safeType = true;
              break;
            }
          }

          // 如果所有类型都会产生匹配，随机选择一个
          if (!safeType) {
            tile.type = this._getRandomType();
          }
        }
      }

      attempts++;
    }

    // 如果100次尝试后仍有匹配，强制重新生成整个棋盘
    console.warn('100次尝试后仍有初始匹配，重新生成棋盘');
    this.createBoard();
    return this.ensureNoInitialMatches();
  }

  /**
   * 检查指定位置是否会产生匹配
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否会产生匹配
   */
  wouldCreateMatch(x, y) {
    const tile = this.getTile(x, y);
    // ✅ 特殊图标不参与匹配
    if (!tile || tile.isSpecial) return false;

    // 检查横向
    let horizontalCount = 1;
    
    // 向左检查
    for (let i = x - 1; i >= 0; i--) {
      const leftTile = this.getTile(i, y);
      // ✅ 跳过特殊图标
      if (leftTile && !leftTile.isSpecial && leftTile.type === tile.type) {
        horizontalCount++;
      } else {
        break;
      }
    }
    
    // 向右检查
    for (let i = x + 1; i < this.cols; i++) {
      const rightTile = this.getTile(i, y);
      // ✅ 跳过特殊图标
      if (rightTile && !rightTile.isSpecial && rightTile.type === tile.type) {
        horizontalCount++;
      } else {
        break;
      }
    }
    
    if (horizontalCount >= 3) return true;

    // 检查纵向
    let verticalCount = 1;
    
    // 向上检查
    for (let i = y - 1; i >= 0; i--) {
      const upTile = this.getTile(x, i);
      // ✅ 跳过特殊图标
      if (upTile && !upTile.isSpecial && upTile.type === tile.type) {
        verticalCount++;
      } else {
        break;
      }
    }
    
    // 向下检查
    for (let i = y + 1; i < this.rows; i++) {
      const downTile = this.getTile(x, i);
      // ✅ 跳过特殊图标
      if (downTile && !downTile.isSpecial && downTile.type === tile.type) {
        verticalCount++;
      } else {
        break;
      }
    }
    
    if (verticalCount >= 3) return true;

    return false;
  }

  /**
   * 洗牌游戏板
   */
  shuffleBoard() {
    // 收集所有图标类型
    const types = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const tile = this.grid[y][x];
        if (tile) {
          types.push(tile.type);
        }
      }
    }

    // Fisher-Yates 洗牌算法
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    // 重新分配类型
    let index = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const tile = this.grid[y][x];
        if (tile) {
          tile.type = types[index++];
        }
      }
    }

    // 确保洗牌后无初始匹配
    this.ensureNoInitialMatches();
  }

  /**
   * 创建特殊图标
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} specialType - 特殊图标类型
   * @returns {Tile|null} 创建的特殊图标
   */
  createSpecialTile(x, y, specialType) {
    if (!this.isValidPosition(x, y)) {
      console.warn(`尝试在无效位置创建特殊图标: (${x}, ${y})`);
      return null;
    }

    const tile = this.getTile(x, y);
    if (tile) {
      tile.setSpecial(specialType);
      console.log(`✨ 创建特殊图标: ${specialType} at (${x}, ${y})`);
      return tile;
    }

    return null;
  }

  /**
   * 克隆游戏板（用于检测）
   * @returns {BoardManager} 新的游戏板实例
   */
  clone() {
    const cloned = new BoardManager(this.rows, this.cols, this.tileTypes, this.matchDetector);
    cloned.grid = [];

    for (let y = 0; y < this.rows; y++) {
      cloned.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        const tile = this.grid[y][x];
        cloned.grid[y][x] = tile ? tile.clone() : null;
      }
    }

    return cloned;
  }

  /**
   * 获取游戏板的字符串表示（用于调试）
   * @returns {string}
   */
  toString() {
    let str = '\n游戏板状态:\n';
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const tile = this.grid[y][x];
        str += tile ? tile.type : '-';
        str += ' ';
      }
      str += '\n';
    }
    return str;
  }
}

export default BoardManager;
