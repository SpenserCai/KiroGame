/**
 * 输入管理器 - 基于 PixiJS 事件系统
 * 负责处理用户输入（鼠标/触摸）并转换为游戏事件
 */

import { GameEvents } from '../core/EventBus.js';

export class InputManager {
  constructor(app, config, eventBus) {
    this.app = app;
    this.config = config;
    this.eventBus = eventBus;
    
    // 输入状态
    this.selectedTile = null;
    this.isEnabled = true;
    
    // 绑定方法
    this.handleTileClick = this.handleTileClick.bind(this);
    this.handleTilePointerOver = this.handleTilePointerOver.bind(this);
    this.handleTilePointerOut = this.handleTilePointerOut.bind(this);
  }

  /**
   * 初始化输入管理器
   */
  init() {
    // 订阅输入启用/禁用事件
    this.eventBus.on(GameEvents.INPUT_ENABLED, () => this.enable());
    this.eventBus.on(GameEvents.INPUT_DISABLED, () => this.disable());
    
    console.log('✅ InputManager 初始化完成');
  }

  /**
   * 为精灵添加交互事件
   * @param {PIXI.Sprite} sprite - 图标精灵
   */
  addSpriteInteraction(sprite) {
    if (!sprite) return;

    // 设置交互属性
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    // 添加事件监听
    sprite.on('pointerdown', this.handleTileClick);
    sprite.on('pointerover', this.handleTilePointerOver);
    sprite.on('pointerout', this.handleTilePointerOut);
  }

  /**
   * 移除精灵的交互事件
   * @param {PIXI.Sprite} sprite - 图标精灵
   */
  removeSpriteInteraction(sprite) {
    if (!sprite) return;

    sprite.off('pointerdown', this.handleTileClick);
    sprite.off('pointerover', this.handleTilePointerOver);
    sprite.off('pointerout', this.handleTilePointerOut);
  }

  /**
   * 处理图标点击事件
   * @param {PIXI.FederatedPointerEvent} event - PixiJS 指针事件
   */
  handleTileClick(event) {
    if (!this.isEnabled) return;

    const sprite = event.currentTarget;
    const tile = sprite.tileData;

    if (!tile) return;

    // 第一次点击：选中图标
    if (!this.selectedTile) {
      this.selectedTile = tile;
      this.eventBus.emit(GameEvents.TILE_SELECT, { tile, position: { x: tile.x, y: tile.y } });
      console.log(`🎯 选中图标: (${tile.x}, ${tile.y})`);
      return;
    }

    // 第二次点击：尝试交换
    const tile1 = this.selectedTile;
    const tile2 = tile;

    // 检查是否点击同一个图标（取消选中）
    if (tile1.id === tile2.id) {
      this.eventBus.emit(GameEvents.TILE_DESELECT, { tile: tile1 });
      this.selectedTile = null;
      console.log('❌ 取消选中');
      return;
    }

    // 检查是否相邻
    const isAdjacent = this.isAdjacent(tile1, tile2);

    if (isAdjacent) {
      // 相邻：触发交换
      this.eventBus.emit(GameEvents.TILE_SWAP_START, { 
        tile1, 
        tile2,
        pos1: { x: tile1.x, y: tile1.y },
        pos2: { x: tile2.x, y: tile2.y }
      });
      console.log(`🔄 交换请求: (${tile1.x}, ${tile1.y}) <-> (${tile2.x}, ${tile2.y})`);
      this.selectedTile = null;
    } else {
      // 不相邻：取消选中第一个，选中第二个
      this.eventBus.emit(GameEvents.TILE_DESELECT, { tile: tile1 });
      this.selectedTile = tile2;
      this.eventBus.emit(GameEvents.TILE_SELECT, { tile: tile2, position: { x: tile2.x, y: tile2.y } });
      console.log(`⚠️  图标不相邻，重新选中: (${tile2.x}, ${tile2.y})`);
    }
  }

  /**
   * 处理鼠标悬停事件
   * @param {PIXI.FederatedPointerEvent} event - PixiJS 指针事件
   */
  handleTilePointerOver(event) {
    if (!this.isEnabled) return;

    const sprite = event.currentTarget;
    
    // 添加悬停效果（可选）
    sprite.alpha = 0.8;
  }

  /**
   * 处理鼠标移出事件
   * @param {PIXI.FederatedPointerEvent} event - PixiJS 指针事件
   */
  handleTilePointerOut(event) {
    if (!this.isEnabled) return;

    const sprite = event.currentTarget;
    
    // 恢复透明度
    sprite.alpha = 1.0;
  }

  /**
   * 检查两个图标是否相邻（水平或垂直）
   * @param {Tile} tile1 - 第一个图标
   * @param {Tile} tile2 - 第二个图标
   */
  isAdjacent(tile1, tile2) {
    const dx = Math.abs(tile1.x - tile2.x);
    const dy = Math.abs(tile1.y - tile2.y);
    
    // 相邻条件：水平或垂直相邻（不包括对角线）
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  /**
   * 启用输入
   */
  enable() {
    this.isEnabled = true;
    console.log('✅ 输入已启用');
  }

  /**
   * 禁用输入
   */
  disable() {
    this.isEnabled = false;
    this.selectedTile = null;
    console.log('🚫 输入已禁用');
  }

  /**
   * 清理资源
   */
  destroy() {
    this.selectedTile = null;
    this.isEnabled = false;
    console.log('🗑️  InputManager 已清理');
  }
}

export default InputManager;
