/**
 * 图标类 - 表示游戏板上的一个图标
 */

// 图标状态常量
export const TileState = {
  NORMAL: 'normal',       // 正常状态
  SELECTED: 'selected',   // 被选中
  MATCHED: 'matched',     // 已匹配待消除
  FALLING: 'falling',     // 下落中
  SPAWNING: 'spawning'    // 生成中
};

// 特殊图标类型常量
export const SpecialTileType = {
  NONE: 'none',           // 普通图标
  BOMB: 'bomb',           // 炸弹（4连生成）
  COLOR_BOMB: 'color_bomb', // 彩色炸弹（5连生成）
  ROW_CLEAR: 'row_clear',   // 横向消除（L/T型生成）
  COL_CLEAR: 'col_clear'    // 纵向消除（L/T型生成）
};

/**
 * 图标类
 */
export class Tile {
  /**
   * 创建图标
   * @param {number} type - 图标类型 (0-4)
   * @param {number} x - 网格X坐标
   * @param {number} y - 网格Y坐标
   */
  constructor(type, x, y) {
    this.type = type;                           // 图标类型
    this.x = x;                                 // 网格X坐标
    this.y = y;                                 // 网格Y坐标
    this.id = Tile.generateId();                // 唯一标识
    this.state = TileState.NORMAL;              // 当前状态
    this.isSpecial = false;                     // 是否为特殊图标
    this.specialType = SpecialTileType.NONE;    // 特殊图标类型
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  static generateId() {
    return `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置位置
   * @param {number} x - 网格X坐标
   * @param {number} y - 网格Y坐标
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置状态
   * @param {string} state - 新状态
   */
  setState(state) {
    if (!Object.values(TileState).includes(state)) {
      console.warn(`无效的图标状态: ${state}`);
      return;
    }
    this.state = state;
  }

  /**
   * 设置为特殊图标
   * @param {string} specialType - 特殊图标类型
   */
  setSpecial(specialType) {
    if (!Object.values(SpecialTileType).includes(specialType)) {
      console.warn(`无效的特殊图标类型: ${specialType}`);
      return;
    }
    this.isSpecial = true;
    this.specialType = specialType;
  }

  /**
   * 重置为普通图标
   */
  resetSpecial() {
    this.isSpecial = false;
    this.specialType = SpecialTileType.NONE;
  }

  /**
   * 检查是否为普通图标
   * @returns {boolean}
   */
  isNormal() {
    return !this.isSpecial;
  }

  /**
   * 克隆图标
   * @returns {Tile} 新的图标实例
   */
  clone() {
    const cloned = new Tile(this.type, this.x, this.y);
    cloned.state = this.state;
    cloned.isSpecial = this.isSpecial;
    cloned.specialType = this.specialType;
    return cloned;
  }

  /**
   * 转换为字符串（用于调试）
   * @returns {string}
   */
  toString() {
    const special = this.isSpecial ? ` [${this.specialType}]` : '';
    return `Tile(type=${this.type}, pos=(${this.x},${this.y}), state=${this.state}${special})`;
  }

  /**
   * 转换为JSON对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      state: this.state,
      isSpecial: this.isSpecial,
      specialType: this.specialType
    };
  }
}

export default Tile;
