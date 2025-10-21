/**
 * 游戏主入口
 * 初始化所有模块并启动游戏
 */

import * as PIXI from 'pixi.js';
import { GameConfig } from './config.js';
import { EventBus } from './core/EventBus.js';
import { BoardManager } from './game/BoardManager.js';
import { MatchDetector } from './game/MatchDetector.js';
import { RenderEngine } from './rendering/RenderEngine.js';
import { TileTextureFactory } from './rendering/TileTextureFactory.js';
import { InputManager } from './input/InputManager.js';

/**
 * 游戏主类
 */
class Game {
  constructor() {
    this.config = GameConfig;
    this.eventBus = new EventBus();
    
    // 核心模块
    this.boardManager = null;
    this.matchDetector = null;
    this.renderEngine = null;
    this.textureFactory = null;
    this.inputManager = null;
    
    // 初始化状态
    this.isInitialized = false;
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      console.log('🎮 开始初始化游戏...\n');

      // 1. 创建事件总线
      console.log('📡 初始化事件总线...');
      // EventBus 已在构造函数中创建

      // 2. 创建游戏板管理器
      console.log('🎲 初始化游戏板管理器...');
      this.matchDetector = new MatchDetector();
      this.boardManager = new BoardManager(
        this.config.board.rows,
        this.config.board.cols,
        this.config.board.tileTypes,
        this.matchDetector
      );

      // 3. 创建游戏板
      console.log('🎯 创建游戏板...');
      this.boardManager.createBoard();
      this.boardManager.ensureNoInitialMatches();
      console.log(`  ✅ 游戏板创建完成: ${this.config.board.rows}x${this.config.board.cols}`);

      // 4. 初始化纹理工厂
      console.log('\n🎨 加载纹理资源...');
      this.textureFactory = new TileTextureFactory(this.config);
      
      // 显示加载进度
      await this.textureFactory.init((progress) => {
        // 可以在这里更新加载进度UI
        if (progress % 20 === 0 || progress === 100) {
          console.log(`  📦 加载进度: ${progress.toFixed(0)}%`);
        }
      });

      // 5. 初始化渲染引擎
      console.log('\n🖼️  初始化渲染引擎...');
      const container = document.getElementById('game-container');
      if (!container) {
        throw new Error('Game container not found');
      }

      this.renderEngine = new RenderEngine(container, this.config, this.eventBus);
      await this.renderEngine.init();

      // 6. 渲染游戏板
      console.log('🎨 渲染游戏板...');
      this.renderEngine.renderBoard(this.boardManager, this.textureFactory);

      // 7. 初始化输入管理器
      console.log('\n🎮 初始化输入管理器...');
      this.inputManager = new InputManager(
        this.renderEngine.app,
        this.config,
        this.eventBus
      );
      this.inputManager.init();

      // 为所有精灵添加交互事件
      this.renderEngine.tileSprites.forEach(sprite => {
        this.inputManager.addSpriteInteraction(sprite);
      });

      // 8. 订阅游戏事件
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('\n✨ 游戏初始化完成！\n');
      console.log('💡 提示: 点击相邻的图标进行交换');

    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 图标选中事件
    this.eventBus.on('tile:select', ({ tile }) => {
      this.renderEngine.highlightTile(tile);
    });

    // 图标取消选中事件
    this.eventBus.on('tile:deselect', () => {
      this.renderEngine.unhighlightTile();
    });

    // 图标交换事件
    this.eventBus.on('tile:swap:start', ({ tile1, tile2, pos1, pos2 }) => {
      console.log(`🔄 交换请求: (${pos1.x}, ${pos1.y}) <-> (${pos2.x}, ${pos2.y})`);
      
      // 取消高亮
      this.renderEngine.unhighlightTile();
      
      // TODO: 在后续阶段实现交换动画和匹配检测
      // 目前只是简单交换位置
      this.boardManager.swapTiles(pos1, pos2);
      
      // 更新精灵位置
      const sprite1 = this.renderEngine.getTileSprite(tile1.id);
      const sprite2 = this.renderEngine.getTileSprite(tile2.id);
      
      if (sprite1 && sprite2) {
        this.renderEngine.updateTileSprite(sprite1, tile1);
        this.renderEngine.updateTileSprite(sprite2, tile2);
      }
      
      // 检测匹配
      const matches = this.matchDetector.findMatches(this.boardManager);
      if (matches.length > 0) {
        console.log(`✅ 发现匹配: ${matches.length} 个`);
        matches.forEach((match, index) => {
          console.log(`  匹配 ${index + 1}: ${match.tiles.length} 个图标 (${match.direction})`);
        });
      } else {
        console.log('❌ 无匹配，交换回原位置');
        // 交换回原位置
        this.boardManager.swapTiles(pos1, pos2);
        this.renderEngine.updateTileSprite(sprite1, tile1);
        this.renderEngine.updateTileSprite(sprite2, tile2);
      }
    });
  }

  /**
   * 启动游戏
   */
  start() {
    if (!this.isInitialized) {
      console.error('❌ 游戏未初始化');
      return;
    }

    console.log('🚀 游戏开始！');
    this.eventBus.emit('game:start', {});
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.renderEngine) {
      this.renderEngine.destroy();
    }
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    console.log('🗑️  游戏已清理');
  }
}

// 创建游戏实例
const game = new Game();

// 初始化并启动游戏
game.init().then(() => {
  game.start();
}).catch(error => {
  console.error('❌ 游戏启动失败:', error);
});

// 导出游戏实例（便于调试）
window.game = game;

export default game;
