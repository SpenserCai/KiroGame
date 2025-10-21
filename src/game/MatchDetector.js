/**
 * 匹配检测器 - 检测游戏板上的匹配模式
 */

/**
 * 匹配类 - 存储匹配信息
 */
export class Match {
  /**
   * 创建匹配对象
   * @param {Array<Tile>} tiles - 匹配的图标数组
   * @param {string} direction - 匹配方向 ('horizontal' | 'vertical')
   */
  constructor(tiles, direction) {
    this.tiles = tiles;           // 匹配的图标数组
    this.direction = direction;   // 匹配方向
    this.length = tiles.length;   // 匹配长度
  }

  /**
   * 获取匹配的位置数组
   * @returns {Array<{x, y}>}
   */
  getPositions() {
    return this.tiles.map(tile => ({ x: tile.x, y: tile.y }));
  }

  /**
   * 获取匹配的类型
   * @returns {number}
   */
  getType() {
    return this.tiles.length > 0 ? this.tiles[0].type : -1;
  }
}

/**
 * 匹配检测器类
 */
export class MatchDetector {
  constructor() {
    // 缓存相关
    this.validMovesCache = null;
    this.boardStateHash = null;
  }

  /**
   * 查找所有匹配
   * @param {BoardManager} board - 游戏板
   * @returns {Array<Match>} 匹配数组
   */
  findMatches(board) {
    const matches = [];
    const matchedTiles = new Set();  // 用于去重

    // 查找横向匹配
    const horizontalMatches = this.findHorizontalMatches(board);
    horizontalMatches.forEach(match => {
      matches.push(match);
      match.tiles.forEach(tile => matchedTiles.add(`${tile.x},${tile.y}`));
    });

    // 查找纵向匹配
    const verticalMatches = this.findVerticalMatches(board);
    verticalMatches.forEach(match => {
      matches.push(match);
      match.tiles.forEach(tile => matchedTiles.add(`${tile.x},${tile.y}`));
    });

    return matches;
  }

  /**
   * 查找横向匹配
   * @param {BoardManager} board - 游戏板
   * @returns {Array<Match>} 横向匹配数组
   */
  findHorizontalMatches(board) {
    const matches = [];

    for (let y = 0; y < board.rows; y++) {
      let currentType = -1;
      let currentMatch = [];

      for (let x = 0; x < board.cols; x++) {
        const tile = board.getTile(x, y);

        if (!tile) {
          // 遇到空位，检查当前匹配
          if (currentMatch.length >= 3) {
            matches.push(new Match(currentMatch, 'horizontal'));
          }
          currentMatch = [];
          currentType = -1;
          continue;
        }

        if (tile.type === currentType) {
          // 相同类型，添加到当前匹配
          currentMatch.push(tile);
        } else {
          // 不同类型，检查当前匹配
          if (currentMatch.length >= 3) {
            matches.push(new Match(currentMatch, 'horizontal'));
          }
          // 开始新的匹配
          currentMatch = [tile];
          currentType = tile.type;
        }
      }

      // 检查行末的匹配
      if (currentMatch.length >= 3) {
        matches.push(new Match(currentMatch, 'horizontal'));
      }
    }

    return matches;
  }

  /**
   * 查找纵向匹配
   * @param {BoardManager} board - 游戏板
   * @returns {Array<Match>} 纵向匹配数组
   */
  findVerticalMatches(board) {
    const matches = [];

    for (let x = 0; x < board.cols; x++) {
      let currentType = -1;
      let currentMatch = [];

      for (let y = 0; y < board.rows; y++) {
        const tile = board.getTile(x, y);

        if (!tile) {
          // 遇到空位，检查当前匹配
          if (currentMatch.length >= 3) {
            matches.push(new Match(currentMatch, 'vertical'));
          }
          currentMatch = [];
          currentType = -1;
          continue;
        }

        if (tile.type === currentType) {
          // 相同类型，添加到当前匹配
          currentMatch.push(tile);
        } else {
          // 不同类型，检查当前匹配
          if (currentMatch.length >= 3) {
            matches.push(new Match(currentMatch, 'vertical'));
          }
          // 开始新的匹配
          currentMatch = [tile];
          currentType = tile.type;
        }
      }

      // 检查列末的匹配
      if (currentMatch.length >= 3) {
        matches.push(new Match(currentMatch, 'vertical'));
      }
    }

    return matches;
  }

  /**
   * 快速检查指定位置是否有匹配（只检查该位置，不扫描整个棋盘）
   * @param {BoardManager} board - 游戏板
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {boolean} 是否有匹配
   */
  checkMatchAtPosition(board, x, y) {
    const tile = board.getTile(x, y);
    if (!tile) return false;

    // 检查横向匹配
    let horizontalCount = 1;
    
    // 向左检查
    for (let i = x - 1; i >= 0; i--) {
      const leftTile = board.getTile(i, y);
      if (leftTile && leftTile.type === tile.type) {
        horizontalCount++;
      } else {
        break;
      }
    }
    
    // 向右检查
    for (let i = x + 1; i < board.cols; i++) {
      const rightTile = board.getTile(i, y);
      if (rightTile && rightTile.type === tile.type) {
        horizontalCount++;
      } else {
        break;
      }
    }
    
    if (horizontalCount >= 3) return true;

    // 检查纵向匹配
    let verticalCount = 1;
    
    // 向上检查
    for (let i = y - 1; i >= 0; i--) {
      const upTile = board.getTile(x, i);
      if (upTile && upTile.type === tile.type) {
        verticalCount++;
      } else {
        break;
      }
    }
    
    // 向下检查
    for (let i = y + 1; i < board.rows; i++) {
      const downTile = board.getTile(x, i);
      if (downTile && downTile.type === tile.type) {
        verticalCount++;
      } else {
        break;
      }
    }
    
    if (verticalCount >= 3) return true;

    return false;
  }

  /**
   * 检查是否有有效移动（优化版本，提前终止 + 缓存）
   * @param {BoardManager} board - 游戏板
   * @returns {boolean} 是否有有效移动
   */
  hasValidMoves(board) {
    // 检查缓存
    const boardHash = this.getBoardHash(board);
    if (this.validMovesCache !== null && this.boardStateHash === boardHash) {
      return this.validMovesCache;
    }

    const { rows, cols } = board;

    // 遍历所有可能的交换
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = board.getTile(x, y);
        if (!tile) continue;

        // 只检查右侧和下方的交换（避免重复检查）
        const adjacentPositions = [
          { x: x + 1, y: y },     // 右
          { x: x, y: y + 1 }      // 下
        ];

        for (const adj of adjacentPositions) {
          if (!board.isValidPosition(adj.x, adj.y)) continue;

          const adjTile = board.getTile(adj.x, adj.y);
          if (!adjTile) continue;

          // 模拟交换
          board.swapTiles({ x, y }, adj);

          // 快速检查：只检查交换的两个位置周围是否产生匹配
          const hasMatch = this.checkMatchAtPosition(board, x, y) ||
                          this.checkMatchAtPosition(board, adj.x, adj.y);

          // 交换回来
          board.swapTiles({ x, y }, adj);

          if (hasMatch) {
            // 缓存结果
            this.validMovesCache = true;
            this.boardStateHash = boardHash;
            return true; // 找到有效移动，立即返回
          }
        }
      }
    }

    // 缓存结果
    this.validMovesCache = false;
    this.boardStateHash = boardHash;
    return false; // 无有效移动
  }

  /**
   * 查找所有可能的移动
   * @param {BoardManager} board - 游戏板
   * @returns {Array<{from, to}>} 可能的移动数组
   */
  findPossibleMoves(board) {
    const possibleMoves = [];
    const { rows, cols } = board;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = board.getTile(x, y);
        if (!tile) continue;

        // 检查右侧和下方的交换
        const adjacentPositions = [
          { x: x + 1, y: y },
          { x: x, y: y + 1 }
        ];

        for (const adj of adjacentPositions) {
          if (!board.isValidPosition(adj.x, adj.y)) continue;

          const adjTile = board.getTile(adj.x, adj.y);
          if (!adjTile) continue;

          // 模拟交换
          board.swapTiles({ x, y }, adj);

          // 检查是否产生匹配
          const hasMatch = this.checkMatchAtPosition(board, x, y) ||
                          this.checkMatchAtPosition(board, adj.x, adj.y);

          // 交换回来
          board.swapTiles({ x, y }, adj);

          if (hasMatch) {
            possibleMoves.push({
              from: { x, y },
              to: adj
            });
          }
        }
      }
    }

    return possibleMoves;
  }

  /**
   * 生成游戏板哈希值（用于缓存）
   * @param {BoardManager} board - 游戏板
   * @returns {string} 哈希值
   */
  getBoardHash(board) {
    let hash = '';
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const tile = board.getTile(x, y);
        hash += tile ? tile.type : '-';
      }
    }
    return hash;
  }

  /**
   * 清除缓存（在游戏板变化时调用）
   */
  clearCache() {
    this.validMovesCache = null;
    this.boardStateHash = null;
  }
}

export default MatchDetector;
