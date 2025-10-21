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
   * 创建 UI 元素
   */
  createUI() {
    // 创建分数文本
    this.scoreText = new PIXI.Text({
      text: '分数: 0',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    this.scoreText.position.set(20, 20);
    this.layers.ui.addChild(this.scoreText);

    // 创建 FPS 显示（如果启用调试模式）
    if (this.config.debug.showFPS) {
      this.fpsText = new PIXI.Text({
        text: 'FPS: 60',
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fill: 0x00FF00,
          stroke: { color: 0x000000, width: 2 }
        }
      });
      this.fpsText.anchor.set(1, 0);
      this.fpsText.position.set(this.config.rendering.canvasWidth - 20, this.config.rendering.canvasHeight - 30);
      this.layers.ui.addChild(this.fpsText);
    }

    // 创建计时器文本
    this.timerText = new PIXI.Text({
      text: '时间: 60',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    this.timerText.anchor.set(1, 0);
    this.timerText.position.set(this.config.rendering.canvasWidth - 20, 20);
    this.layers.ui.addChild(this.timerText);

    // 创建移动次数文本
    this.movesText = new PIXI.Text({
      text: '移动: 0',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 2 }
      }
    });
    this.movesText.position.set(20, 60);
    this.layers.ui.addChild(this.movesText);

    // 创建暂停按钮
    this.pauseButton = this.createButton('暂停', this.config.rendering.canvasWidth / 2 - 50, 20, 100, 40);
    this.pauseButton.on('pointerdown', () => {
      this.eventBus.emit('game:pause');
      this.showPauseMenu();
    });
    this.layers.ui.addChild(this.pauseButton);

    console.log('✅ UI 元素创建完成');
  }

  /**
   * 创建按钮
   * @param {string} text - 按钮文字
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {PIXI.Container} 按钮容器
   */
  createButton(text, x, y, width, height) {
    const button = new PIXI.Container();
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // 按钮背景
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 8);
    bg.fill({ color: 0x3498db, alpha: 0.9 });
    bg.stroke({ color: 0x2980b9, width: 2 });
    button.addChild(bg);

    // 按钮文字
    const buttonText = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xFFFFFF
      }
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(width / 2, height / 2);
    button.addChild(buttonText);

    // 悬停效果
    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 8);
      bg.fill({ color: 0x5dade2, alpha: 1 });
      bg.stroke({ color: 0x2980b9, width: 2 });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 8);
      bg.fill({ color: 0x3498db, alpha: 0.9 });
      bg.stroke({ color: 0x2980b9, width: 2 });
    });

    // 点击效果
    button.on('pointerdown', () => {
      button.scale.set(0.95);
    });

    button.on('pointerup', () => {
      button.scale.set(1.0);
    });

    return button;
  }

  /**
   * 更新分数显示
   * @param {number} score - 当前分数
   */
  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.text = `分数: ${score}`;
    }
  }

  /**
   * 更新计时器显示
   * @param {number} time - 剩余时间（秒）
   */
  updateTimer(time) {
    if (this.timerText) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      this.timerText.text = `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // 时间少于10秒时显示红色警告
      if (time <= this.config.timer.warningTime) {
        this.timerText.style.fill = 0xFF0000;
      } else {
        this.timerText.style.fill = 0xFFFFFF;
      }
    }
  }

  /**
   * 更新移动次数显示
   * @param {number} moves - 移动次数
   */
  updateMoves(moves) {
    if (this.movesText) {
      this.movesText.text = `移动: ${moves}`;
    }
  }

  /**
   * 更新 FPS 显示
   * @param {number} fps - 当前 FPS
   */
  updateFPS(fps) {
    if (this.fpsText) {
      this.fpsText.text = `FPS: ${Math.round(fps)}`;
    }
  }

  /**
   * 显示分数增加动画
   * @param {number} delta - 增加的分数
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   */
  showScoreDelta(delta, x, y) {
    const deltaText = new PIXI.Text({
      text: `+${delta}`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    deltaText.anchor.set(0.5);
    deltaText.position.set(x, y);
    this.layers.effects.addChild(deltaText);

    // 简单的上浮淡出动画
    let elapsed = 0;
    const duration = 1000;
    const startY = y;

    const animate = (delta) => {
      elapsed += delta;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.layers.effects.removeChild(deltaText);
        deltaText.destroy();
        return;
      }

      deltaText.position.y = startY - progress * 50;
      deltaText.alpha = 1 - progress;
    };

    this.app.ticker.add(animate);
  }

  /**
   * 创建开始菜单
   */
  createStartMenu() {
    const menu = new PIXI.Container();
    menu.label = 'startMenu';

    // 半透明背景
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, this.config.rendering.canvasWidth, this.config.rendering.canvasHeight);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    menu.addChild(overlay);

    // 标题
    const title = new PIXI.Text({
      text: '小鬼消消乐',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 5 }
      }
    });
    title.anchor.set(0.5);
    title.position.set(this.config.rendering.canvasWidth / 2, 200);
    menu.addChild(title);

    // 开始按钮
    const startButton = this.createButton(
      '开始游戏',
      this.config.rendering.canvasWidth / 2 - 75,
      350,
      150,
      50
    );
    startButton.on('pointerdown', () => {
      this.eventBus.emit('game:start');
    });
    menu.addChild(startButton);

    this.startMenu = menu;
    this.layers.ui.addChild(menu);
  }

  /**
   * 隐藏开始菜单
   */
  hideStartMenu() {
    if (this.startMenu) {
      this.layers.ui.removeChild(this.startMenu);
      this.startMenu.destroy({ children: true });
      this.startMenu = null;
    }
  }

  /**
   * 创建暂停菜单
   */
  createPauseMenu() {
    const menu = new PIXI.Container();
    menu.label = 'pauseMenu';

    // 半透明背景
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, this.config.rendering.canvasWidth, this.config.rendering.canvasHeight);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    menu.addChild(overlay);

    // 暂停文字
    const pauseText = new PIXI.Text({
      text: '游戏暂停',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 5 }
      }
    });
    pauseText.anchor.set(0.5);
    pauseText.position.set(this.config.rendering.canvasWidth / 2, 200);
    menu.addChild(pauseText);

    // 继续按钮
    const resumeButton = this.createButton(
      '继续游戏',
      this.config.rendering.canvasWidth / 2 - 75,
      300,
      150,
      50
    );
    resumeButton.on('pointerdown', () => {
      this.hidePauseMenu();
      this.eventBus.emit('game:resume');
    });
    menu.addChild(resumeButton);

    // 重新开始按钮
    const restartButton = this.createButton(
      '重新开始',
      this.config.rendering.canvasWidth / 2 - 75,
      370,
      150,
      50
    );
    restartButton.on('pointerdown', () => {
      this.hidePauseMenu();
      this.eventBus.emit('game:restart');
    });
    menu.addChild(restartButton);

    this.pauseMenu = menu;
    this.layers.ui.addChild(menu);
  }

  /**
   * 显示暂停菜单
   */
  showPauseMenu() {
    if (!this.pauseMenu) {
      this.createPauseMenu();
    }
  }

  /**
   * 隐藏暂停菜单
   */
  hidePauseMenu() {
    if (this.pauseMenu) {
      this.layers.ui.removeChild(this.pauseMenu);
      this.pauseMenu.destroy({ children: true });
      this.pauseMenu = null;
    }
  }

  /**
   * 创建游戏结束界面
   * @param {Object} data - 游戏结束数据
   */
  createGameOverUI(data) {
    const menu = new PIXI.Container();
    menu.label = 'gameOverMenu';

    // 半透明背景
    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, this.config.rendering.canvasWidth, this.config.rendering.canvasHeight);
    overlay.fill({ color: 0x000000, alpha: 0.8 });
    menu.addChild(overlay);

    // 游戏结束文字
    const gameOverText = new PIXI.Text({
      text: '游戏结束',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xFF6B6B,
        stroke: { color: 0x000000, width: 5 }
      }
    });
    gameOverText.anchor.set(0.5);
    gameOverText.position.set(this.config.rendering.canvasWidth / 2, 150);
    menu.addChild(gameOverText);

    // 最终分数
    const scoreText = new PIXI.Text({
      text: `最终分数: ${data.finalScore}`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 32,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    scoreText.anchor.set(0.5);
    scoreText.position.set(this.config.rendering.canvasWidth / 2, 250);
    menu.addChild(scoreText);

    // 移动次数
    const movesText = new PIXI.Text({
      text: `移动次数: ${data.moves}`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 2 }
      }
    });
    movesText.anchor.set(0.5);
    movesText.position.set(this.config.rendering.canvasWidth / 2, 300);
    menu.addChild(movesText);

    // 重新开始按钮
    const restartButton = this.createButton(
      '重新开始',
      this.config.rendering.canvasWidth / 2 - 75,
      370,
      150,
      50
    );
    restartButton.on('pointerdown', () => {
      this.hideGameOverUI();
      this.eventBus.emit('game:restart');
    });
    menu.addChild(restartButton);

    this.gameOverMenu = menu;
    this.layers.ui.addChild(menu);
  }

  /**
   * 隐藏游戏结束界面
   */
  hideGameOverUI() {
    if (this.gameOverMenu) {
      this.layers.ui.removeChild(this.gameOverMenu);
      this.gameOverMenu.destroy({ children: true });
      this.gameOverMenu = null;
    }
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
