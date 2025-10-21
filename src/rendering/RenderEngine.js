/**
 * 渲染引擎 - 基于 PixiJS
 * 负责管理场景图、精灵渲染和视觉效果
 */

import * as PIXI from 'pixi.js';
import { GameConfig } from '../config.js';

export class RenderEngine {
  constructor(containerElement, config, eventBus) {
    this.container = containerElement;
    this.config = config || GameConfig;
    this.eventBus = eventBus;
    
    // PixiJS 应用实例
    this.app = null;
    
    // 场景图层
    this.layers = {
      background: null,
      board: null,
      effects: null,
      ui: null
    };
    
    // 精灵映射表（tile.id -> sprite）
    this.tileSprites = new Map();
    
    // 选中效果图形
    this.selectionGraphics = null;
    
    // 初始化状态
    this.isInitialized = false;
  }

  /**
   * 初始化 PixiJS 应用
   */
  async init() {
    try {
      // 创建 PixiJS 应用
      this.app = new PIXI.Application();
      
      await this.app.init({
        width: this.config.rendering.canvasWidth,
        height: this.config.rendering.canvasHeight,
        backgroundColor: this.config.rendering.backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      // 将 canvas 挂载到容器
      this.container.appendChild(this.app.canvas);

      // 创建场景图层
      this.createLayers();

      // 创建背景
      this.createBackground();

      // 监听窗口大小变化
      window.addEventListener('resize', () => this.resize());

      this.isInitialized = true;
      console.log('✅ RenderEngine 初始化完成');

      return true;
    } catch (error) {
      console.error('❌ RenderEngine 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建场景图层
   */
  createLayers() {
    // 背景层
    this.layers.background = new PIXI.Container();
    this.layers.background.label = 'backgroundLayer';
    this.app.stage.addChild(this.layers.background);

    // 游戏板层
    this.layers.board = new PIXI.Container();
    this.layers.board.label = 'boardLayer';
    this.app.stage.addChild(this.layers.board);

    // 特效层
    this.layers.effects = new PIXI.Container();
    this.layers.effects.label = 'effectLayer';
    this.app.stage.addChild(this.layers.effects);

    // UI 层
    this.layers.ui = new PIXI.Container();
    this.layers.ui.label = 'uiLayer';
    this.app.stage.addChild(this.layers.ui);

    console.log('✅ 场景图层创建完成');
  }

  /**
   * 创建背景网格
   */
  createBackground() {
    const graphics = new PIXI.Graphics();
    const { rows, cols } = this.config.board;
    const { tileSize, padding, boardOffsetX, boardOffsetY, gridColor } = this.config.rendering;

    // 绘制网格背景
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const screenX = x * tileSize + boardOffsetX;
        const screenY = y * tileSize + boardOffsetY;

        // 绘制网格单元格
        graphics.rect(screenX, screenY, tileSize, tileSize);
        graphics.fill({ color: gridColor, alpha: 0.3 });
        graphics.stroke({ color: gridColor, width: 1, alpha: 0.5 });
      }
    }

    this.layers.background.addChild(graphics);
    console.log('✅ 背景网格创建完成');
  }

  /**
   * 网格坐标转屏幕坐标
   */
  gridToScreen(gridX, gridY) {
    const { tileSize, boardOffsetX, boardOffsetY } = this.config.rendering;
    return {
      x: gridX * tileSize + boardOffsetX + tileSize / 2,
      y: gridY * tileSize + boardOffsetY + tileSize / 2
    };
  }

  /**
   * 屏幕坐标转网格坐标
   */
  screenToGrid(screenX, screenY) {
    const { tileSize, boardOffsetX, boardOffsetY } = this.config.rendering;
    return {
      x: Math.floor((screenX - boardOffsetX) / tileSize),
      y: Math.floor((screenY - boardOffsetY) / tileSize)
    };
  }

  /**
   * 调整画布大小
   */
  resize() {
    if (!this.app) return;

    const parent = this.container;
    const { canvasWidth, canvasHeight } = this.config.rendering;

    // 计算缩放比例
    const scaleX = parent.clientWidth / canvasWidth;
    const scaleY = parent.clientHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // 调整 canvas 大小
    this.app.renderer.resize(canvasWidth * scale, canvasHeight * scale);
    this.app.stage.scale.set(scale);

    console.log(`🔄 画布大小调整: ${canvasWidth * scale}x${canvasHeight * scale}`);
  }

  /**
   * 高亮选中的图标
   */
  highlightTile(tile) {
    if (!this.selectionGraphics) {
      this.selectionGraphics = new PIXI.Graphics();
      this.layers.effects.addChild(this.selectionGraphics);
    }

    const { x, y } = this.gridToScreen(tile.x, tile.y);
    const { tileSize, selectionColor, selectionWidth } = this.config.rendering;

    this.selectionGraphics.clear();
    this.selectionGraphics.rect(
      x - tileSize / 2,
      y - tileSize / 2,
      tileSize,
      tileSize
    );
    this.selectionGraphics.stroke({ 
      color: selectionColor, 
      width: selectionWidth 
    });
  }

  /**
   * 取消高亮
   */
  unhighlightTile() {
    if (this.selectionGraphics) {
      this.selectionGraphics.clear();
    }
  }

  /**
   * 创建图标精灵
   * @param {Tile} tile - 图标数据
   * @param {TileTextureFactory} textureFactory - 纹理工厂
   */
  createTileSprite(tile, textureFactory) {
    // 获取纹理
    const textureKey = tile.isSpecial ? tile.specialType : `type${tile.type}`;
    const texture = textureFactory.getTexture(textureKey);

    if (!texture) {
      throw new Error(`Texture not found for key: ${textureKey}`);
    }

    // 创建精灵
    const sprite = new PIXI.Sprite(texture);

    // 设置锚点为中心（便于旋转和缩放）
    sprite.anchor.set(0.5);

    // ✅ 关键修复：计算正确的缩放比例
    // 不要使用 width/height，因为那会自动修改 scale
    // 而是直接设置 scale 来控制大小
    const targetSize = this.config.rendering.tileSize;
    const textureSize = Math.max(texture.width, texture.height);
    const correctScale = targetSize / textureSize;
    
    // 设置正确的缩放（这是精灵的"正常"大小）
    sprite.scale.set(correctScale);

    // 设置初始透明度
    sprite.alpha = 1.0;

    // 计算屏幕位置
    const { x: screenX, y: screenY } = this.gridToScreen(tile.x, tile.y);
    sprite.position.set(screenX, screenY);

    // 设置交互属性
    sprite.eventMode = 'static'; // PixiJS v8 新 API
    sprite.cursor = 'pointer';

    // 存储图块数据引用（便于事件处理）
    sprite.tileData = tile;
    
    // ✅ 存储正常缩放值（用于动画恢复）
    sprite.normalScale = correctScale;

    // 添加到游戏板层
    this.layers.board.addChild(sprite);

    // 缓存精灵
    this.tileSprites.set(tile.id, sprite);

    return sprite;
  }

  /**
   * 更新图标精灵
   * @param {PIXI.Sprite} sprite - 精灵对象
   * @param {Tile} tile - 图标数据
   */
  updateTileSprite(sprite, tile) {
    const { x: screenX, y: screenY } = this.gridToScreen(tile.x, tile.y);
    sprite.position.set(screenX, screenY);
    sprite.tileData = tile;
  }

  /**
   * 移除图标精灵
   * @param {string} tileId - 图标ID
   */
  removeTileSprite(tileId) {
    const sprite = this.tileSprites.get(tileId);
    if (sprite) {
      this.layers.board.removeChild(sprite);
      sprite.destroy();
      this.tileSprites.delete(tileId);
    }
  }

  /**
   * 渲染游戏板
   * @param {Board} board - 游戏板数据
   * @param {TileTextureFactory} textureFactory - 纹理工厂
   */
  renderBoard(board, textureFactory) {
    // 清除现有精灵
    this.tileSprites.forEach((sprite, id) => {
      this.layers.board.removeChild(sprite);
      sprite.destroy();
    });
    this.tileSprites.clear();

    // 创建所有图标精灵
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const tile = board.getTile(x, y);
        if (tile) {
          this.createTileSprite(tile, textureFactory);
        }
      }
    }

    console.log(`✅ 游戏板渲染完成: ${this.tileSprites.size} 个精灵`);
  }

  /**
   * 获取图标精灵
   */
  getTileSprite(tileId) {
    return this.tileSprites.get(tileId);
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.tileSprites.clear();
    this.isInitialized = false;
    console.log('🗑️  RenderEngine 已清理');
  }
}

export default RenderEngine;
