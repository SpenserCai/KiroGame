/**
 * 游戏入口文件
 * 初始化 PixiJS 应用和所有游戏模块
 */
import * as PIXI from 'pixi.js';
import { GameConfig } from './config.js';
import { eventBus } from './core/EventBus.js';
import { BoardManager } from './game/BoardManager.js';
import { MatchDetector } from './game/MatchDetector.js';

class Game {
  constructor() {
    this.config = GameConfig;
    this.app = null;
    this.isInitialized = false;
    this.boardManager = null;
    this.matchDetector = null;
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      console.log('🎮 初始化游戏...');

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
      const container = document.getElementById('game-container');
      container.appendChild(this.app.canvas);

      // 隐藏加载提示
      const loading = document.getElementById('loading');
      if (loading) {
        loading.classList.add('hidden');
      }

      console.log('✅ PixiJS 应用初始化成功');

      // 初始化游戏模块
      this.initGameModules();

      // 创建演示界面
      this.createDemoUI();

      this.isInitialized = true;
      console.log('🎉 游戏初始化完成！');

    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      this.showError('游戏初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化游戏模块
   */
  initGameModules() {
    console.log('📦 初始化游戏模块...');

    // 创建匹配检测器
    this.matchDetector = new MatchDetector();

    // 创建游戏板管理器
    this.boardManager = new BoardManager(
      this.config.board.rows,
      this.config.board.cols,
      this.config.board.tileTypes,
      this.matchDetector
    );

    // 创建游戏板
    this.boardManager.createBoard();
    this.boardManager.ensureNoInitialMatches();

    console.log('✅ 游戏模块初始化完成');
    console.log('📊 游戏板状态:', this.boardManager.toString());

    // 检查是否有有效移动
    const hasValidMoves = this.matchDetector.hasValidMoves(this.boardManager);
    console.log(`🎯 有效移动: ${hasValidMoves ? '是' : '否'}`);
  }

  /**
   * 创建演示界面
   */
  createDemoUI() {
    // 标题
    const title = new PIXI.Text({
      text: '小鬼消消乐',
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: 0xffffff,
        fontWeight: 'bold'
      }
    });
    title.anchor.set(0.5);
    title.position.set(this.config.rendering.canvasWidth / 2, 50);
    this.app.stage.addChild(title);

    // 状态信息
    const statusText = new PIXI.Text({
      text: '✅ 第一阶段完成\n\n' +
        '已实现模块：\n' +
        '• 事件总线系统\n' +
        '• 图标和游戏板数据结构\n' +
        '• 匹配检测算法\n\n' +
        '打开控制台查看详细信息',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
        align: 'center',
        lineHeight: 28
      }
    });
    statusText.anchor.set(0.5);
    statusText.position.set(
      this.config.rendering.canvasWidth / 2,
      this.config.rendering.canvasHeight / 2
    );
    this.app.stage.addChild(statusText);

    // 游戏板可视化（简单的网格）
    this.drawBoardGrid();
  }

  /**
   * 绘制游戏板网格（简单可视化）
   */
  drawBoardGrid() {
    const graphics = new PIXI.Graphics();
    const { tileSize, boardOffsetX, boardOffsetY } = this.config.rendering;
    const { rows, cols } = this.config.board;

    // 绘制网格
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = this.boardManager.getTile(x, y);
        if (tile) {
          const color = this.config.colors[`type${tile.type}`];

          graphics.rect(
            boardOffsetX + x * tileSize,
            boardOffsetY + y * tileSize,
            tileSize - 2,
            tileSize - 2
          );
          graphics.fill(color);
        }
      }
    }

    this.app.stage.addChild(graphics);
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <p style="color: #ff6b6b; font-size: 18px;">❌ ${message}</p>
      `;
      loading.classList.remove('hidden');
    }
  }

  /**
   * 启动游戏
   */
  start() {
    if (!this.isInitialized) {
      console.error('游戏未初始化');
      return;
    }
    console.log('🚀 游戏开始！');
  }
}

// 创建游戏实例并初始化
const game = new Game();
game.init();

// 导出到 window 便于调试
window.game = game;
window.eventBus = eventBus;
