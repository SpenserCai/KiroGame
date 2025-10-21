/**
 * 游戏引擎 - 核心游戏逻辑协调器
 */

import { GameEvents } from './EventBus.js';
import { GameState } from './StateManager.js';

/**
 * 游戏引擎类
 */
export class GameEngine {
  /**
   * 创建游戏引擎
   * @param {Object} config - 游戏配置
   * @param {EventBus} eventBus - 事件总线
   * @param {BoardManager} boardManager - 游戏板管理器
   * @param {MatchDetector} matchDetector - 匹配检测器
   * @param {StateManager} stateManager - 状态管理器
   * @param {AnimationController} animationController - 动画控制器（可选）
   */
  constructor(config, eventBus, boardManager, matchDetector, stateManager, animationController = null) {
    this.config = config;
    this.eventBus = eventBus;
    this.boardManager = boardManager;
    this.matchDetector = matchDetector;
    this.stateManager = stateManager;
    this.animationController = animationController;
    
    // 游戏数据
    this.score = 0;
    this.moves = 0;
    this.comboCount = 0;
    
    // 处理状态
    this.isProcessing = false;
    
    // 绑定方法
    this.handleSwap = this.handleSwap.bind(this);
  }

  /**
   * 设置动画控制器
   * @param {AnimationController} animationController - 动画控制器
   */
  setAnimationController(animationController) {
    this.animationController = animationController;
  }

  /**
   * 初始化游戏引擎
   */
  init() {
    // 重置游戏数据
    this.score = 0;
    this.moves = 0;
    this.comboCount = 0;
    this.isProcessing = false;
    
    // 订阅事件
    this.setupEventListeners();
    
    console.log('✅ GameEngine 初始化完成');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 订阅交换开始事件
    this.eventBus.on(GameEvents.TILE_SWAP_START, this.handleSwap);
    
    // 订阅游戏重置事件
    this.eventBus.on(GameEvents.GAME_RESET, () => this.reset());
  }

  /**
   * 处理交换请求
   * @param {Object} data - 交换数据 {tile1, tile2, pos1, pos2, sprite1, sprite2}
   */
  async handleSwap(data) {
    const { tile1, tile2, pos1, pos2, sprite1, sprite2 } = data;
    
    // 如果正在处理，忽略新的交换请求
    if (this.isProcessing) {
      console.log('⚠️  正在处理中，忽略交换请求');
      return;
    }
    
    // 检查游戏状态
    if (!this.stateManager.isState(GameState.PLAYING)) {
      console.log('⚠️  游戏未在进行中，忽略交换请求');
      return;
    }
    
    // 标记为处理中
    this.isProcessing = true;
    
    // 切换到动画状态
    this.stateManager.setState(GameState.ANIMATING);
    
    // 禁用输入
    this.eventBus.emit(GameEvents.INPUT_DISABLED);
    
    try {
      // 执行交换
      this.boardManager.swapTiles(pos1, pos2);
      
      // 发布交换完成事件
      this.eventBus.emit(GameEvents.TILE_SWAP_COMPLETE, {
        tile1,
        tile2,
        pos1,
        pos2
      });
      
      // 播放交换动画
      if (this.animationController && sprite1 && sprite2) {
        await this.animationController.animateSwap(
          sprite1,
          sprite2,
          this.config.animation.swapDuration
        );
      } else {
        // 降级：使用延时模拟
        await this.delay(this.config.animation.swapDuration);
      }
      
      // 检测匹配
      const matches = this.matchDetector.findMatches(this.boardManager);
      
      if (matches.length > 0) {
        // 有匹配：处理匹配消除流程
        console.log(`✅ 发现匹配: ${matches.length} 个`);
        this.moves++;
        
        // 重置连锁计数
        this.comboCount = 1;
        
        // 处理匹配（传递 renderEngine）
        await this.processMatches(this.renderEngine);
      } else {
        // 无匹配：交换回原位置
        console.log('❌ 无匹配，交换回原位置');
        
        this.boardManager.swapTiles(pos1, pos2);
        
        // 发布交换回退事件
        this.eventBus.emit(GameEvents.TILE_SWAP_REVERT, {
          tile1,
          tile2,
          pos1,
          pos2
        });
        
        // 播放回退动画
        if (this.animationController && sprite1 && sprite2) {
          await this.animationController.animateSwap(
            sprite1,
            sprite2,
            this.config.animation.swapDuration
          );
        } else {
          // 降级：使用延时模拟
          await this.delay(this.config.animation.swapDuration);
        }
        
        // 发布无匹配事件
        this.eventBus.emit(GameEvents.MATCH_NONE);
      }
      
    } catch (error) {
      console.error('❌ 交换处理错误:', error);
      this.eventBus.emit(GameEvents.ERROR, {
        type: 'SWAP_ERROR',
        message: '交换处理失败',
        error
      });
    } finally {
      // 恢复状态
      this.isProcessing = false;
      
      // 切换回游戏状态
      if (this.stateManager.isState(GameState.ANIMATING)) {
        this.stateManager.setState(GameState.PLAYING);
      }
      
      // 启用输入
      this.eventBus.emit(GameEvents.INPUT_ENABLED);
    }
  }

  /**
   * 处理匹配消除流程
   * @param {RenderEngine} renderEngine - 渲染引擎（可选，用于获取精灵）
   */
  async processMatches(renderEngine = null) {
    let hasMatches = true;
    
    while (hasMatches) {
      // 查找匹配
      const matches = this.matchDetector.findMatches(this.boardManager);
      
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }
      
      // 计算总消除图标数
      const totalTiles = matches.reduce((sum, match) => sum + match.tiles.length, 0);
      
      // 发布匹配发现事件
      this.eventBus.emit(GameEvents.MATCH_FOUND, {
        matches,
        totalTiles,
        comboCount: this.comboCount
      });
      
      // 计算并更新分数
      const scoreData = this.calculateScore(matches, this.comboCount);
      this.score += scoreData.score;
      
      // 发布分数更新事件
      this.eventBus.emit(GameEvents.SCORE_UPDATE, {
        score: this.score,
        delta: scoreData.score,
        combo: this.comboCount,
        basePoints: scoreData.basePoints,
        multiplier: scoreData.multiplier,
        tilesCleared: scoreData.tilesCleared
      });
      
      // 如果是连锁，发布连锁事件
      if (this.comboCount > 1) {
        this.eventBus.emit(GameEvents.COMBO_TRIGGER, {
          comboCount: this.comboCount,
          multiplier: scoreData.multiplier
        });
      }
      
      // 收集要移除的图标位置
      const tilesToRemove = [];
      const tileIdsToRemove = new Set();
      
      matches.forEach(match => {
        match.tiles.forEach(tile => {
          if (!tileIdsToRemove.has(tile.id)) {
            tilesToRemove.push(tile);
            tileIdsToRemove.add(tile.id);
          }
        });
      });
      
      // 发布开始移除事件
      this.eventBus.emit(GameEvents.TILE_REMOVE_START, {
        tiles: tilesToRemove
      });
      
      // 播放消除动画
      if (this.animationController && renderEngine) {
        const sprites = tilesToRemove
          .map(tile => renderEngine.getTileSprite(tile.id))
          .filter(sprite => sprite !== undefined);
        
        if (sprites.length > 0) {
          await this.animationController.animateRemove(
            sprites,
            this.config.animation.removeDuration
          );
        }
      } else {
        // 降级：使用延时模拟
        await this.delay(this.config.animation.removeDuration);
      }
      
      // 从游戏板移除图标
      const positions = tilesToRemove.map(tile => ({ x: tile.x, y: tile.y }));
      this.boardManager.removeTiles(positions);
      
      // 发布移除完成事件
      this.eventBus.emit(GameEvents.TILE_REMOVE_COMPLETE, {
        tiles: tilesToRemove,
        positions
      });
      
      // 应用重力（图标下落）
      const movements = this.boardManager.applyGravity();
      
      if (movements.length > 0) {
        // 发布下落开始事件
        this.eventBus.emit(GameEvents.TILE_FALL_START, {
          movements
        });
        
        // 播放下落动画
        if (this.animationController && renderEngine) {
          const fallAnimations = movements
            .map(({ tile, to }) => {
              const sprite = renderEngine.getTileSprite(tile.id);
              if (sprite) {
                const { y: targetY } = renderEngine.gridToScreen(to.x, to.y);
                return { sprite, targetY };
              }
              return null;
            })
            .filter(anim => anim !== null);
          
          if (fallAnimations.length > 0) {
            await this.animationController.animateFallBatch(
              fallAnimations,
              this.config.animation.fallDuration
            );
          }
        } else {
          // 降级：使用延时模拟
          await this.delay(this.config.animation.fallDuration);
        }
        
        // 发布下落完成事件
        this.eventBus.emit(GameEvents.TILE_FALL_COMPLETE, {
          movements
        });
      }
      
      // 填充游戏板（生成新图标）
      const newTiles = this.boardManager.fillBoard();
      
      if (newTiles.length > 0) {
        // 发布生成开始事件
        this.eventBus.emit(GameEvents.TILE_SPAWN_START, {
          tiles: newTiles
        });
        
        // 播放生成动画
        if (this.animationController && renderEngine) {
          const newSprites = newTiles
            .map(tile => renderEngine.getTileSprite(tile.id))
            .filter(sprite => sprite !== undefined);
          
          if (newSprites.length > 0) {
            await this.animationController.animateSpawnBatch(
              newSprites,
              this.config.animation.spawnDuration
            );
          }
        } else {
          // 降级：使用延时模拟
          await this.delay(this.config.animation.spawnDuration);
        }
        
        // 发布生成完成事件
        this.eventBus.emit(GameEvents.TILE_SPAWN_COMPLETE, {
          tiles: newTiles
        });
      }
      
      // 清除匹配检测器缓存
      this.matchDetector.clearCache();
      
      // 增加连锁计数
      this.comboCount++;
      
      // 继续检测新的匹配（连锁反应）
    }
    
    // 所有匹配处理完成，游戏板稳定
    this.eventBus.emit(GameEvents.BOARD_STABLE);
    
    console.log(`✨ 匹配处理完成，连锁: ${this.comboCount - 1} 次，总分: ${this.score}`);
  }

  /**
   * 计算分数
   * @param {Array<Match>} matches - 匹配数组
   * @param {number} comboCount - 连锁计数
   * @returns {Object} 分数数据
   */
  calculateScore(matches, comboCount) {
    const baseScore = this.config.scoring.baseScore; // 10分
    const comboMultiplier = this.config.scoring.comboMultiplier; // 1.5
    const match4Bonus = this.config.scoring.match4Bonus; // 20分
    const match5Bonus = this.config.scoring.match5Bonus; // 50分
    
    // 计算总消除图标数
    const totalTiles = matches.reduce((sum, match) => sum + match.tiles.length, 0);
    
    // 基础分数：每个消除的图标10分
    const basePoints = totalTiles * baseScore;
    
    // 连锁倍数：第1次连锁1.0x，第2次1.5x，第3次2.25x，以此类推
    // 公式：multiplier = comboMultiplier ^ (comboCount - 1)
    const multiplier = Math.pow(comboMultiplier, comboCount - 1);
    
    // 最终分数 = 基础分数 × 连锁倍数
    let totalScore = Math.floor(basePoints * multiplier);
    
    // 额外奖励：4个或5个以上的匹配额外加分
    for (const match of matches) {
      if (match.tiles.length === 4) {
        totalScore += match4Bonus; // 4连额外20分
      } else if (match.tiles.length >= 5) {
        totalScore += match5Bonus; // 5连及以上额外50分
      }
    }
    
    return {
      score: totalScore,
      basePoints: basePoints,
      multiplier: multiplier,
      comboCount: comboCount,
      tilesCleared: totalTiles
    };
  }

  /**
   * 检查游戏结束
   */
  checkGameOver() {
    // 检查是否有可用移动
    const hasValidMoves = this.matchDetector.hasValidMoves(this.boardManager);
    
    if (!hasValidMoves) {
      console.log('❌ 无可用移动');
      this.eventBus.emit(GameEvents.MOVES_NONE);
      
      // 触发游戏结束
      this.stateManager.setState(GameState.GAME_OVER, {
        reason: 'no_moves',
        finalScore: this.score
      });
      
      this.eventBus.emit(GameEvents.GAME_OVER, {
        reason: 'no_moves',
        finalScore: this.score,
        moves: this.moves
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * 开始游戏
   */
  start() {
    this.stateManager.setState(GameState.PLAYING);
    this.eventBus.emit(GameEvents.GAME_START);
    console.log('🚀 游戏开始！');
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (this.stateManager.isState(GameState.PLAYING)) {
      this.stateManager.setState(GameState.PAUSED);
      this.eventBus.emit(GameEvents.INPUT_DISABLED);
      console.log('⏸️  游戏暂停');
    }
  }

  /**
   * 恢复游戏
   */
  resume() {
    if (this.stateManager.isState(GameState.PAUSED)) {
      this.stateManager.setState(GameState.PLAYING);
      this.eventBus.emit(GameEvents.INPUT_ENABLED);
      console.log('▶️  游戏继续');
    }
  }

  /**
   * 重置游戏
   */
  reset() {
    // 重置游戏数据
    this.score = 0;
    this.moves = 0;
    this.comboCount = 0;
    this.isProcessing = false;
    
    // 重新创建游戏板
    this.boardManager.createBoard();
    this.boardManager.ensureNoInitialMatches();
    
    // 清除缓存
    this.matchDetector.clearCache();
    
    // 重置状态
    this.stateManager.reset();
    
    console.log('🔄 游戏已重置');
  }

  /**
   * 更新游戏状态（每帧调用）
   * @param {number} deltaTime - 帧间隔时间（秒）
   */
  update(deltaTime) {
    // 这里可以添加每帧需要更新的逻辑
    // 例如：计时器更新、动画更新等
    // 目前暂时为空，后续阶段会添加
  }

  /**
   * 延时辅助函数
   * @param {number} ms - 延时毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取游戏数据
   */
  getGameData() {
    return {
      score: this.score,
      moves: this.moves,
      comboCount: this.comboCount,
      state: this.stateManager.getCurrentState()
    };
  }
}

export default GameEngine;
