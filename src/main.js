/**
 * 游戏主入口
 * 初始化所有模块并启动游戏
 */

import { GameConfig } from './config.js';
import { EventBus } from './core/EventBus.js';
import { StateManager, GameState } from './core/StateManager.js';
import { GameEngine } from './core/GameEngine.js';
import { BoardManager } from './game/BoardManager.js';
import { MatchDetector } from './game/MatchDetector.js';
import { SpecialTileManager } from './game/SpecialTileManager.js';
import { RenderEngine } from './rendering/RenderEngine.js';
import { TileTextureFactory } from './rendering/TileTextureFactory.js';
import { InputManager } from './input/InputManager.js';
import { AnimationController } from './animation/AnimationController.js';
import { ErrorHandler, GameError, ErrorType } from './utils/ErrorHandler.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';

/**
 * 游戏主类
 */
class Game {
  constructor() {
    this.config = GameConfig;
    this.eventBus = new EventBus();
    this.errorHandler = new ErrorHandler(this.eventBus);
    this.performanceMonitor = new PerformanceMonitor(this.config);
    
    // 核心模块
    this.stateManager = null;
    this.gameEngine = null;
    this.boardManager = null;
    this.matchDetector = null;
    this.specialTileManager = null;
    this.renderEngine = null;
    this.textureFactory = null;
    this.inputManager = null;
    this.animationController = null;
    
    // 初始化状态
    this.isInitialized = false;
    
    // 设置全局错误处理
    this.setupGlobalErrorHandlers();
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandlers() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.errorHandler.handle(
        new GameError(ErrorType.LOGIC_ERROR, '未处理的Promise错误', event.reason),
        { gameEngine: this.gameEngine }
      );
      event.preventDefault();
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.errorHandler.handle(
        new GameError(ErrorType.LOGIC_ERROR, '全局错误', event.error),
        { gameEngine: this.gameEngine }
      );
    });
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      // 验证配置
      ErrorHandler.validateConfig(this.config);
      
      console.log('🎮 开始初始化游戏...\n');

      // 1. 创建事件总线
      console.log('📡 初始化事件总线...');
      // EventBus 已在构造函数中创建

      // 2. 创建状态管理器
      console.log('🎯 初始化状态管理器...');
      this.stateManager = new StateManager(GameState.MENU, this.eventBus);

      // 3. 创建游戏板管理器
      console.log('🎲 初始化游戏板管理器...');
      this.matchDetector = new MatchDetector();
      this.boardManager = new BoardManager(
        this.config.board.rows,
        this.config.board.cols,
        this.config.board.tileTypes,
        this.matchDetector
      );

      // 4. 创建游戏板
      console.log('🎯 创建游戏板...');
      this.boardManager.createBoard();
      this.boardManager.ensureNoInitialMatches();
      console.log(`  ✅ 游戏板创建完成: ${this.config.board.rows}x${this.config.board.cols}`);

      // 5. 创建动画控制器
      console.log('🎬 初始化动画控制器...');
      this.animationController = new AnimationController(this.eventBus, this.config);

      // 5.5 创建特殊图标管理器
      console.log('✨ 初始化特殊图标管理器...');
      this.specialTileManager = new SpecialTileManager(this.config, this.boardManager);

      // 6. 创建游戏引擎
      console.log('⚙️  初始化游戏引擎...');
      this.gameEngine = new GameEngine(
        this.config,
        this.eventBus,
        this.boardManager,
        this.matchDetector,
        this.stateManager,
        this.animationController,
        this.specialTileManager
      );
      this.gameEngine.init();

      // 7. 初始化纹理工厂
      console.log('\n🎨 加载纹理资源...');
      this.textureFactory = new TileTextureFactory(this.config);
      
      // 显示加载进度
      try {
        await this.textureFactory.init((progress) => {
          // 可以在这里更新加载进度UI
          if (progress % 20 === 0 || progress === 100) {
            console.log(`  📦 加载进度: ${progress.toFixed(0)}%`);
          }
        });
      } catch (error) {
        throw new GameError(
          ErrorType.RESOURCE_ERROR,
          '纹理资源加载失败',
          error
        );
      }

      // 8. 初始化渲染引擎
      console.log('\n🖼️  初始化渲染引擎...');
      const container = document.getElementById('game-container');
      if (!container) {
        throw new GameError(
          ErrorType.INIT_ERROR,
          '找不到游戏容器元素 #game-container'
        );
      }

      this.renderEngine = new RenderEngine(container, this.config, this.eventBus);
      try {
        await this.renderEngine.init();
        
        // 监听WebGL上下文丢失
        if (this.renderEngine.app && this.renderEngine.app.canvas) {
          this.renderEngine.app.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.errorHandler.handle(
              new GameError(ErrorType.CONTEXT_LOST, 'WebGL上下文丢失'),
              { renderEngine: this.renderEngine }
            );
          });
        }
      } catch (error) {
        throw new GameError(
          ErrorType.RENDER_ERROR,
          '渲染引擎初始化失败',
          error
        );
      }

      // 9. 创建 UI 元素
      console.log('🎨 创建 UI 元素...');
      this.renderEngine.createUI();

      // 10. 渲染游戏板
      console.log('🎨 渲染游戏板...');
      this.renderEngine.renderBoard(this.boardManager, this.textureFactory);

      // 11. 初始化输入管理器
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

      // 12. 设置游戏循环（更新动画和游戏逻辑）
      this.renderEngine.app.ticker.add((ticker) => {
        const deltaTime = ticker.deltaMS;
        
        // 更新性能监控
        this.performanceMonitor.update(deltaTime);
        
        // 更新动画和游戏逻辑
        this.animationController.update(deltaTime);
        this.gameEngine.update(deltaTime / 1000); // 转换为秒
      });

      // 13. 添加键盘事件监听
      this.setupKeyboardListeners();

      // 14. 订阅游戏事件
      this.setupEventListeners();

      // 15. 初始化性能监控器
      this.performanceMonitor.init();

      // 16. 显示开始菜单
      this.renderEngine.createStartMenu();

      this.isInitialized = true;
      console.log('\n✨ 游戏初始化完成！\n');
      console.log('💡 提示: 点击"开始游戏"按钮开始游戏');
      console.log('💡 游戏中按 ESC 键暂停/恢复游戏');
      
      if (this.config.debug.enabled) {
        console.log('💡 调试模式已启用');
        if (this.config.debug.showFPS) {
          console.log('💡 FPS显示已启用（右上角）');
        }
      }

    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      
      // 使用错误处理器处理
      if (error instanceof GameError) {
        this.errorHandler.handle(error, {
          gameEngine: this.gameEngine,
          renderEngine: this.renderEngine
        });
      } else {
        this.errorHandler.handle(
          new GameError(ErrorType.INIT_ERROR, '游戏初始化失败', error),
          { gameEngine: this.gameEngine, renderEngine: this.renderEngine }
        );
      }
      
      throw error;
    }
  }

  /**
   * 设置键盘事件监听
   */
  setupKeyboardListeners() {
    window.addEventListener('keydown', (event) => {
      // ESC 键暂停/恢复游戏
      if (event.key === 'Escape') {
        const currentState = this.stateManager.getCurrentState();
        if (currentState === 'playing') {
          this.eventBus.emit('game:pause');
          this.renderEngine.showPauseMenu();
        } else if (currentState === 'paused') {
          this.eventBus.emit('game:resume');
          this.renderEngine.hidePauseMenu();
        }
      }
    });
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 输入启用事件 - 清理所有选中动画并确保精灵状态正确
    this.eventBus.on('input:enabled', () => {
      this.animationController.stopAllSelections();
      
      // ✅ 额外保护：确保所有精灵的缩放和透明度正确（使用 normalScale）
      this.renderEngine.tileSprites.forEach((sprite) => {
        if (sprite && sprite.scale && sprite.alpha !== undefined) {
          const normalScale = sprite.normalScale || 1.0;
          sprite.scale.set(normalScale);
          sprite.alpha = 1.0;
        }
      });
    });

    // 图标选中事件
    this.eventBus.on('tile:select', ({ tile }) => {
      this.renderEngine.highlightTile(tile);
      
      // 播放选中动画
      const sprite = this.renderEngine.getTileSprite(tile.id);
      if (sprite) {
        this.animationController.animateSelection(sprite);
      }
    });

    // 图标取消选中事件
    this.eventBus.on('tile:deselect', ({ tile }) => {
      this.renderEngine.unhighlightTile();
      
      // 停止选中动画
      if (tile) {
        const sprite = this.renderEngine.getTileSprite(tile.id);
        if (sprite) {
          this.animationController.stopSelection(sprite);
        }
      }
    });

    // 交换开始事件（传递精灵信息给游戏引擎）
    this.eventBus.on('tile:swap:start', (data) => {
      const { tile1, tile2 } = data;
      
      // 获取精灵对象
      const sprite1 = this.renderEngine.getTileSprite(tile1.id);
      const sprite2 = this.renderEngine.getTileSprite(tile2.id);
      
      // 传递精灵信息给游戏引擎
      this.gameEngine.handleSwap({
        ...data,
        sprite1,
        sprite2
      });
    });

    // 交换完成事件（更新精灵位置）
    this.eventBus.on('tile:swap:complete', ({ tile1, tile2 }) => {
      this.renderEngine.unhighlightTile();
      
      const sprite1 = this.renderEngine.getTileSprite(tile1.id);
      const sprite2 = this.renderEngine.getTileSprite(tile2.id);
      
      if (sprite1 && sprite2) {
        this.renderEngine.updateTileSprite(sprite1, tile1);
        this.renderEngine.updateTileSprite(sprite2, tile2);
      }
    });

    // 交换回退事件
    this.eventBus.on('tile:swap:revert', ({ tile1, tile2 }) => {
      const sprite1 = this.renderEngine.getTileSprite(tile1.id);
      const sprite2 = this.renderEngine.getTileSprite(tile2.id);
      
      if (sprite1 && sprite2) {
        this.renderEngine.updateTileSprite(sprite1, tile1);
        this.renderEngine.updateTileSprite(sprite2, tile2);
      }
    });

    // 匹配发现事件
    this.eventBus.on('match:found', ({ matches, totalTiles, comboCount }) => {
      console.log(`✨ 发现匹配: ${matches.length} 个匹配，共 ${totalTiles} 个图标`);
      if (comboCount > 1) {
        console.log(`🔥 连锁 x${comboCount}!`);
      }
    });

    // 分数更新事件
    this.eventBus.on('score:update', ({ score, delta, combo, multiplier }) => {
      console.log(`💰 分数: ${score} (+${delta})`);
      if (combo > 1) {
        console.log(`   连锁倍数: x${multiplier.toFixed(2)}`);
        
        // 🎨 创建连锁特效
        if (this.renderEngine.particleEffects) {
          this.renderEngine.particleEffects.createComboBurst(combo);
        }
      }
      
      // ✅ 更新 UI 显示
      this.renderEngine.updateScore(score);
    });

    // 图标移除开始事件
    this.eventBus.on('tile:remove:start', ({ tiles }) => {
      // ✅ 停止被移除图标的选中动画
      tiles.forEach(tile => {
        const sprite = this.renderEngine.getTileSprite(tile.id);
        if (sprite) {
          this.animationController.stopSelection(sprite);
          
          // 🎨 创建消除爆炸粒子效果
          if (this.renderEngine.particleEffects) {
            const color = this.config.colors[`type${tile.type}`];
            this.renderEngine.particleEffects.createExplosion(
              sprite.x,
              sprite.y,
              color,
              25
            );
          }
        }
      });
    });

    // 图标移除完成事件
    this.eventBus.on('tile:remove:complete', ({ tiles }) => {
      // 移除精灵
      tiles.forEach(tile => {
        this.renderEngine.removeTileSprite(tile.id);
      });
    });

    // 图标下落开始事件（动画系统会处理）
    this.eventBus.on('tile:fall:start', () => {
      // 动画控制器会处理下落动画
    });

    // 图标下落完成事件
    this.eventBus.on('tile:fall:complete', ({ movements }) => {
      // 更新精灵位置（确保精确）
      movements.forEach(({ tile }) => {
        const sprite = this.renderEngine.getTileSprite(tile.id);
        if (sprite) {
          this.renderEngine.updateTileSprite(sprite, tile);
          // ✅ 确保下落后的精灵状态正确（使用 normalScale）
          const normalScale = sprite.normalScale || 1.0;
          sprite.scale.set(normalScale);
          sprite.alpha = 1.0;
        }
      });
    });

    // 图标生成开始事件
    this.eventBus.on('tile:spawn:start', ({ tiles }) => {
      // 创建新精灵（动画控制器会处理生成动画）
      tiles.forEach(tile => {
        try {
          const sprite = this.renderEngine.createTileSprite(tile, this.textureFactory);
          if (sprite) {
            this.inputManager.addSpriteInteraction(sprite);
          }
        } catch (error) {
          console.error(`❌ 创建精灵失败 (${tile.x}, ${tile.y}):`, error);
        }
      });
    });

    // 图标生成完成事件
    this.eventBus.on('tile:spawn:complete', ({ tiles }) => {
      // ✅ 确保所有新生成的精灵状态正确（使用 normalScale）
      tiles.forEach(tile => {
        const sprite = this.renderEngine.getTileSprite(tile.id);
        if (sprite) {
          const normalScale = sprite.normalScale || 1.0;
          sprite.scale.set(normalScale);
          sprite.alpha = 1.0;
        }
      });
    });

    // 游戏板稳定事件
    this.eventBus.on('board:stable', () => {
      console.log('✅ 游戏板稳定');
    });

    // 特殊图标生成事件
    this.eventBus.on('special:tile:created', ({ tile, specialType, position }) => {
      console.log(`✨ 特殊图标生成: ${specialType} at (${position.x}, ${position.y})`);
      
      // ✅ 更新精灵纹理（传入 textureFactory 以更新纹理）
      const sprite = this.renderEngine.getTileSprite(tile.id);
      if (sprite) {
        this.renderEngine.updateTileSprite(sprite, tile, this.textureFactory);
      }
    });

    // 特殊图标激活事件
    this.eventBus.on('special:tile:activated', ({ tile, targetTile, positions }) => {
      console.log(`⚡ 特殊图标激活: ${tile.specialType}, 影响 ${positions.length} 个图标`);
      
      // 🎨 创建特殊图标激活粒子效果
      if (this.renderEngine.particleEffects) {
        const sprite = this.renderEngine.getTileSprite(tile.id);
        if (sprite) {
          this.renderEngine.particleEffects.createSpecialActivation(
            tile.specialType,
            sprite.x,
            sprite.y
          );
        }
      }
    });

    // 特殊图标组合事件
    this.eventBus.on('special:combo:activated', ({ tile1, tile2, combo }) => {
      console.log(`💥 特殊组合: ${combo.description}`);
    });

    // 洗牌开始事件
    this.eventBus.on('board:shuffle:start', () => {
      console.log('🔀 开始洗牌...');
      // 可以显示洗牌提示UI
    });

    // 洗牌完成事件
    this.eventBus.on('board:shuffle', ({ score, time }) => {
      console.log('🔀 洗牌完成');
      
      // 重新渲染游戏板
      this.renderEngine.renderBoard(this.boardManager, this.textureFactory);
      
      // 为所有精灵添加交互事件
      this.renderEngine.tileSprites.forEach(sprite => {
        this.inputManager.addSpriteInteraction(sprite);
      });
    });

    // 匹配发现事件（传递渲染引擎给游戏引擎）
    this.eventBus.on('match:found', () => {
      // 确保 processMatches 可以访问渲染引擎
      if (!this.gameEngine.renderEngine) {
        this.gameEngine.renderEngine = this.renderEngine;
      }
    });

    // 游戏结束事件
    this.eventBus.on('game:over', ({ reason, finalScore, moves }) => {
      console.log(`\n🎮 游戏结束！`);
      console.log(`   原因: ${reason === 'no_moves' ? '无可用移动' : reason === 'time_up' ? '时间到' : reason}`);
      console.log(`   最终分数: ${finalScore}`);
      console.log(`   移动次数: ${moves}\n`);
      
      // 显示游戏结束界面
      this.renderEngine.createGameOverUI({ finalScore, moves, reason });
    });

    // 游戏开始事件
    this.eventBus.on('game:start', () => {
      // 隐藏开始菜单
      this.renderEngine.hideStartMenu();
      
      // 更新 UI
      this.renderEngine.updateScore(0);
      this.renderEngine.updateTimer(this.config.timer.defaultTime);
      this.renderEngine.updateMoves(0);
      
      // 启动游戏引擎（切换到 PLAYING 状态并启动计时器）
      this.gameEngine.start();
    });

    // 计时器更新事件
    this.eventBus.on('timer:update', ({ time }) => {
      this.renderEngine.updateTimer(time);
    });

    // 移动次数更新事件
    this.eventBus.on('moves:update', ({ moves }) => {
      this.renderEngine.updateMoves(moves);
    });

    // 游戏板重置事件
    this.eventBus.on('game:board:reset', () => {
      // 重新渲染游戏板
      this.renderEngine.renderBoard(this.boardManager, this.textureFactory);
      
      // 为所有精灵添加交互事件
      this.renderEngine.tileSprites.forEach(sprite => {
        this.inputManager.addSpriteInteraction(sprite);
      });
      
      // 隐藏游戏结束界面
      this.renderEngine.hideGameOverUI();
      
      // 更新 UI
      this.renderEngine.updateScore(0);
      this.renderEngine.updateTimer(this.config.timer.defaultTime);
      this.renderEngine.updateMoves(0);
    });

    // 状态变化事件
    this.eventBus.on('state:change', ({ from, to }) => {
      console.log(`🔄 状态变化: ${from} -> ${to}`);
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

    // 不自动启动游戏，等待用户点击开始按钮
    console.log('💡 点击"开始游戏"按钮开始游戏');
  }

  /**
   * 清理资源
   */
  destroy() {
    // 打印性能报告
    if (this.config.debug.enabled) {
      this.performanceMonitor.printReport();
    }
    
    if (this.renderEngine) {
      this.renderEngine.destroy();
    }
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
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
