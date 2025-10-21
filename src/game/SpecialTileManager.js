/**
 * 特殊图标管理器 - 管理特殊图标的生成和激活
 */

import { SpecialTileType } from './Tile.js';

/**
 * 特殊图标管理器类
 */
export class SpecialTileManager {
  /**
   * 创建特殊图标管理器
   * @param {Object} config - 游戏配置
   * @param {BoardManager} boardManager - 游戏板管理器
   */
  constructor(config, boardManager) {
    this.config = config;
    this.boardManager = boardManager;
  }

  /**
   * 检测匹配并确定是否生成特殊图标
   * @param {Array<Match>} matches - 匹配数组
   * @returns {Object|null} 特殊图标信息 {type, position} 或 null
   */
  detectSpecialTileGeneration(matches) {
    if (matches.length === 0) return null;

    // 按匹配长度排序，优先处理最长的匹配
    const sortedMatches = [...matches].sort((a, b) => b.length - a.length);

    for (const match of sortedMatches) {
      // 5连或更多：生成彩色炸弹
      if (match.length >= 5) {
        const centerPos = this._getMatchCenter(match);
        return {
          type: SpecialTileType.COLOR_BOMB,
          position: centerPos,
          matchType: match.direction,
          matchLength: match.length
        };
      }

      // 4连：生成炸弹
      if (match.length === 4) {
        const centerPos = this._getMatchCenter(match);
        return {
          type: SpecialTileType.BOMB,
          position: centerPos,
          matchType: match.direction,
          matchLength: match.length
        };
      }
    }

    // 检测L型或T型匹配（多个匹配重叠）
    const lShapeInfo = this._detectLShapeMatch(matches);
    if (lShapeInfo) {
      return lShapeInfo;
    }

    return null;
  }

  /**
   * 获取匹配的中心位置
   * @param {Match} match - 匹配对象
   * @returns {{x, y}} 中心位置
   */
  _getMatchCenter(match) {
    const tiles = match.tiles;
    const centerIndex = Math.floor(tiles.length / 2);
    return {
      x: tiles[centerIndex].x,
      y: tiles[centerIndex].y
    };
  }

  /**
   * 检测L型或T型匹配
   * @param {Array<Match>} matches - 匹配数组
   * @returns {Object|null} 特殊图标信息或null
   */
  _detectLShapeMatch(matches) {
    if (matches.length < 2) return null;

    // 查找重叠的匹配（横向和纵向交叉）
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const match1 = matches[i];
        const match2 = matches[j];

        // 必须是不同方向的匹配
        if (match1.direction === match2.direction) continue;

        // 查找交叉点
        const intersection = this._findIntersection(match1, match2);
        if (intersection) {
          // 根据匹配方向决定生成横向还是纵向消除
          const specialType = match1.direction === 'horizontal' 
            ? SpecialTileType.ROW_CLEAR 
            : SpecialTileType.COL_CLEAR;

          return {
            type: specialType,
            position: intersection,
            matchType: 'L_SHAPE',
            matchLength: match1.length + match2.length
          };
        }
      }
    }

    return null;
  }

  /**
   * 查找两个匹配的交叉点
   * @param {Match} match1 - 匹配1
   * @param {Match} match2 - 匹配2
   * @returns {{x, y}|null} 交叉点位置或null
   */
  _findIntersection(match1, match2) {
    for (const tile1 of match1.tiles) {
      for (const tile2 of match2.tiles) {
        if (tile1.x === tile2.x && tile1.y === tile2.y) {
          return { x: tile1.x, y: tile1.y };
        }
      }
    }
    return null;
  }

  /**
   * 创建特殊图标
   * @param {number} type - 普通图标类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} specialType - 特殊图标类型
   * @returns {Tile} 特殊图标
   */
  createSpecialTile(type, x, y, specialType) {
    const tile = this.boardManager.getTile(x, y);
    if (tile) {
      tile.setSpecial(specialType);
      return tile;
    }
    return null;
  }

  /**
   * 检测特殊图标激活
   * @param {Tile} tile - 被激活的特殊图标
   * @param {Tile} swappedTile - 交换的图标（用于彩色炸弹）
   * @returns {Array<{x, y}>} 要消除的位置数组
   */
  detectSpecialTileActivation(tile, swappedTile = null) {
    if (!tile.isSpecial) return [];

    let positions = [];

    switch (tile.specialType) {
      case SpecialTileType.BOMB:
        positions = this._getBombRange(tile.x, tile.y);
        break;
      
      case SpecialTileType.COLOR_BOMB:
        positions = this._getColorBombTargets(swappedTile);
        // ✅ 彩色炸弹本身也要被消除
        positions.push({ x: tile.x, y: tile.y });
        break;
      
      case SpecialTileType.ROW_CLEAR:
        positions = this._getRowTargets(tile.y);
        break;
      
      case SpecialTileType.COL_CLEAR:
        positions = this._getColTargets(tile.x);
        break;
      
      default:
        return [];
    }

    return positions;
  }

  /**
   * 获取炸弹范围（3x3）
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @returns {Array<{x, y}>} 位置数组
   */
  _getBombRange(x, y) {
    const positions = [];
    const range = this.config.specialTiles.bomb.effectRange; // 1

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const newX = x + dx;
        const newY = y + dy;
        
        if (this.boardManager.isValidPosition(newX, newY)) {
          positions.push({ x: newX, y: newY });
        }
      }
    }

    return positions;
  }

  /**
   * 获取彩色炸弹目标（所有相同类型）
   * @param {Tile} targetTile - 目标图标
   * @returns {Array<{x, y}>} 位置数组
   */
  _getColorBombTargets(targetTile) {
    if (!targetTile) return [];

    const positions = [];
    const targetType = targetTile.type;

    for (let y = 0; y < this.boardManager.rows; y++) {
      for (let x = 0; x < this.boardManager.cols; x++) {
        const tile = this.boardManager.getTile(x, y);
        // ✅ 包含所有相同类型的图标（包括普通图标和特殊图标）
        if (tile && tile.type === targetType) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  /**
   * 获取整行目标
   * @param {number} y - 行号
   * @returns {Array<{x, y}>} 位置数组
   */
  _getRowTargets(y) {
    const positions = [];
    
    for (let x = 0; x < this.boardManager.cols; x++) {
      if (this.boardManager.getTile(x, y)) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  /**
   * 获取整列目标
   * @param {number} x - 列号
   * @returns {Array<{x, y}>} 位置数组
   */
  _getColTargets(x) {
    const positions = [];
    
    for (let y = 0; y < this.boardManager.rows; y++) {
      if (this.boardManager.getTile(x, y)) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  /**
   * 检测特殊图标组合效果
   * @param {Tile} tile1 - 特殊图标1
   * @param {Tile} tile2 - 特殊图标2
   * @returns {Object|null} 组合效果信息
   */
  detectSpecialCombo(tile1, tile2) {
    if (!tile1.isSpecial || !tile2.isSpecial) return null;

    const combo = {
      type: 'combo',
      positions: [],
      multiplier: 5
    };

    // 炸弹 + 炸弹 = 5x5范围
    if (tile1.specialType === SpecialTileType.BOMB && 
        tile2.specialType === SpecialTileType.BOMB) {
      combo.positions = this._getLargeExplosion(tile1.x, tile1.y, 2);
      combo.description = '双炸弹组合：5x5爆炸';
    }
    // 炸弹 + 横向/纵向消除 = 3行或3列
    else if ((tile1.specialType === SpecialTileType.BOMB && 
              (tile2.specialType === SpecialTileType.ROW_CLEAR || 
               tile2.specialType === SpecialTileType.COL_CLEAR)) ||
             (tile2.specialType === SpecialTileType.BOMB && 
              (tile1.specialType === SpecialTileType.ROW_CLEAR || 
               tile1.specialType === SpecialTileType.COL_CLEAR))) {
      const lineClearTile = tile1.specialType === SpecialTileType.BOMB ? tile2 : tile1;
      const bombTile = tile1.specialType === SpecialTileType.BOMB ? tile1 : tile2;
      
      if (lineClearTile.specialType === SpecialTileType.ROW_CLEAR) {
        // 3行消除
        combo.positions = this._getMultipleRows(bombTile.y, 1);
        combo.description = '炸弹+横向消除：3行爆炸';
      } else {
        // 3列消除
        combo.positions = this._getMultipleCols(bombTile.x, 1);
        combo.description = '炸弹+纵向消除：3列爆炸';
      }
    }
    // 彩色炸弹 + 任何特殊图标 = 将所有该类型转换为特殊图标
    else if (tile1.specialType === SpecialTileType.COLOR_BOMB || 
             tile2.specialType === SpecialTileType.COLOR_BOMB) {
      combo.type = 'color_bomb_combo';
      combo.description = '彩色炸弹组合：超级爆炸';
      // 彩色炸弹组合：消除整个棋盘
      for (let y = 0; y < this.boardManager.rows; y++) {
        for (let x = 0; x < this.boardManager.cols; x++) {
          if (this.boardManager.getTile(x, y)) {
            combo.positions.push({ x, y });
          }
        }
      }
    }
    // 横向 + 纵向消除 = 十字消除
    else if ((tile1.specialType === SpecialTileType.ROW_CLEAR && 
              tile2.specialType === SpecialTileType.COL_CLEAR) ||
             (tile1.specialType === SpecialTileType.COL_CLEAR && 
              tile2.specialType === SpecialTileType.ROW_CLEAR)) {
      const rowTile = tile1.specialType === SpecialTileType.ROW_CLEAR ? tile1 : tile2;
      const colTile = tile1.specialType === SpecialTileType.COL_CLEAR ? tile1 : tile2;
      
      combo.positions = [
        ...this._getRowTargets(rowTile.y),
        ...this._getColTargets(colTile.x)
      ];
      combo.description = '十字消除：整行+整列';
    }

    return combo.positions.length > 0 ? combo : null;
  }

  /**
   * 获取大范围爆炸
   * @param {number} x - 中心X
   * @param {number} y - 中心Y
   * @param {number} range - 范围
   * @returns {Array<{x, y}>}
   */
  _getLargeExplosion(x, y, range) {
    const positions = [];

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const newX = x + dx;
        const newY = y + dy;
        
        if (this.boardManager.isValidPosition(newX, newY)) {
          positions.push({ x: newX, y: newY });
        }
      }
    }

    return positions;
  }

  /**
   * 获取多行
   * @param {number} centerY - 中心行
   * @param {number} range - 范围
   * @returns {Array<{x, y}>}
   */
  _getMultipleRows(centerY, range) {
    const positions = [];

    for (let dy = -range; dy <= range; dy++) {
      const y = centerY + dy;
      if (y >= 0 && y < this.boardManager.rows) {
        positions.push(...this._getRowTargets(y));
      }
    }

    return positions;
  }

  /**
   * 获取多列
   * @param {number} centerX - 中心列
   * @param {number} range - 范围
   * @returns {Array<{x, y}>}
   */
  _getMultipleCols(centerX, range) {
    const positions = [];

    for (let dx = -range; dx <= range; dx++) {
      const x = centerX + dx;
      if (x >= 0 && x < this.boardManager.cols) {
        positions.push(...this._getColTargets(x));
      }
    }

    return positions;
  }

  /**
   * 计算特殊图标消除的额外分数
   * @param {string} specialType - 特殊图标类型
   * @param {number} tilesCleared - 消除的图标数量
   * @returns {number} 额外分数
   */
  calculateSpecialBonus(specialType, tilesCleared) {
    const baseScore = this.config.scoring.baseScore;
    const multiplier = this.config.scoring.specialTileMultiplier;

    let bonus = 0;

    switch (specialType) {
      case SpecialTileType.BOMB:
        bonus = tilesCleared * baseScore * 2;
        break;
      case SpecialTileType.COLOR_BOMB:
        bonus = tilesCleared * baseScore * 5;
        break;
      case SpecialTileType.ROW_CLEAR:
      case SpecialTileType.COL_CLEAR:
        bonus = tilesCleared * baseScore * 3;
        break;
    }

    return Math.floor(bonus);
  }
}

export default SpecialTileManager;
