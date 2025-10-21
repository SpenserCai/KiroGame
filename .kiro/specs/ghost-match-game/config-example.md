# 配置文件示例

本文档提供完整的游戏配置文件示例和说明。

## src/config.js

```javascript
/**
 * 小鬼消消乐游戏配置
 * 所有游戏参数都在此文件中定义，便于调整和扩展
 */

export const GameConfig = {
  // ==================== 游戏板配置 ====================
  board: {
    rows: 8,                    // 游戏板行数
    cols: 8,                    // 游戏板列数
    tileTypes: 5,               // 图标类型数量（建议5-7种）
    
    // 初始化配置
    maxInitAttempts: 100,       // 确保无初始匹配的最大尝试次数
    shuffleOnNoMoves: true,     // 无可用移动时是否自动洗牌
    shuffleDelay: 3000,         // 洗牌前的延迟（毫秒）
  },

  // ==================== 渲染配置 ====================
  rendering: {
    // Canvas尺寸
    canvasWidth: 600,           // Canvas宽度
    canvasHeight: 700,          // Canvas高度（包含UI区域）
    
    // 游戏板布局
    tileSize: 64,               // 单个图标尺寸（像素）
    padding: 8,                 // 图标间距
    boardOffsetX: 40,           // 游戏板X偏移（居中）
    boardOffsetY: 120,          // 游戏板Y偏移（为UI留空间）
    
    // 视觉效果
    backgroundColor: '#2C3E50', // 背景颜色
    gridColor: '#34495E',       // 网格线颜色
    selectedBorderColor: '#F39C12', // 选中边框颜色
    selectedBorderWidth: 4,     // 选中边框宽度
    
    // UI配置
    uiHeight: 100,              // 顶部UI区域高度
    fontSize: 24,               // 字体大小
    fontFamily: 'Arial, sans-serif',
    textColor: '#ECF0F1',       // 文字颜色
    
    // 性能配置
    enableDirtyFlag: true,      // 启用脏标记优化
    showFPS: true,              // 显示FPS（开发模式）
  },

  // ==================== 动画配置 ====================
  animation: {
    // 动画时长（毫秒）
    swapDuration: 200,          // 交换动画
    swapRevertDuration: 300,    // 交换回退动画
    removeDuration: 300,        // 消除动画
    fallDuration: 400,          // 下落动画
    spawnDuration: 200,         // 生成动画
    
    // 缓动函数配置
    swapEasing: 'easeInOutQuad',
    fallEasing: 'easeOutQuad',
    removeEasing: 'easeInQuad',
    spawnEasing: 'easeOutBounce',
    
    // 动画效果
    removeEffect: 'scale',      // 消除效果：'scale' | 'fade' | 'both'
    removeScaleEnd: 0,          // 缩放结束值
    removeFadeEnd: 0,           // 淡出结束值
    
    // 性能配置
    maxConcurrentAnimations: 100, // 最大并发动画数
  },

  // ==================== 分数配置 ====================
  scoring: {
    baseScore: 10,              // 每个图标基础分数
    comboMultiplier: 1.5,       // 连锁倍数（指数增长）
    
    // 额外奖励
    match4Bonus: 20,            // 4连额外奖励
    match5Bonus: 50,            // 5连及以上额外奖励
    
    // 特殊图标分数倍数
    bombMultiplier: 2,          // 炸弹消除分数倍数
    colorBombMultiplier: 5,     // 彩色炸弹分数倍数
    lineClearMultiplier: 3,     // 横向/纵向消除分数倍数
    
    // 显示配置
    showScorePopup: true,       // 显示分数弹出提示
    scorePopupDuration: 1000,   // 分数提示持续时间
  },

  // ==================== 计时器配置 ====================
  timer: {
    enabled: true,              // 启用计时系统
    duration: 60,               // 游戏时长（秒）
    warningThreshold: 10,       // 警告阈值（秒）
    warningColor: '#E74C3C',    // 警告颜色（红色）
    showMilliseconds: false,    // 是否显示毫秒
  },

  // ==================== 图标颜色配置 ====================
  colors: {
    // 5种基础图标类型
    type0: {
      primary: '#E74C3C',       // 红色小鬼
      secondary: '#C0392B',
      name: '红色小鬼'
    },
    type1: {
      primary: '#3498DB',       // 蓝色小鬼
      secondary: '#2980B9',
      name: '蓝色小鬼'
    },
    type2: {
      primary: '#F1C40F',       // 黄色小鬼
      secondary: '#F39C12',
      name: '黄色小鬼'
    },
    type3: {
      primary: '#2ECC71',       // 绿色小鬼
      secondary: '#27AE60',
      name: '绿色小鬼'
    },
    type4: {
      primary: '#9B59B6',       // 紫色小鬼
      secondary: '#8E44AD',
      name: '紫色小鬼'
    },
    
    // 可选：第6、7种类型（扩展用）
    type5: {
      primary: '#E67E22',       // 橙色小鬼
      secondary: '#D35400',
      name: '橙色小鬼'
    },
    type6: {
      primary: '#1ABC9C',       // 青色小鬼
      secondary: '#16A085',
      name: '青色小鬼'
    },
  },

  // ==================== 图标形状配置 ====================
  shapes: {
    // 每种类型使用不同的形状
    type0: 'circle',            // 圆形
    type1: 'square',            // 方形
    type2: 'triangle',          // 三角形
    type3: 'star',              // 五角星
    type4: 'diamond',           // 菱形
    type5: 'hexagon',           // 六边形
    type6: 'pentagon',          // 五边形
  },

  // ==================== 输入配置 ====================
  input: {
    enableTouch: true,          // 启用触摸支持
    enableMouse: true,          // 启用鼠标支持
    enableKeyboard: false,      // 启用键盘支持（方向键移动选择）
    
    // 交互配置
    clickMode: 'select-swap',   // 点击模式：'select-swap' | 'drag'
    dragThreshold: 10,          // 拖拽阈值（像素）
    
    // 反馈配置
    hoverEffect: true,          // 鼠标悬停高亮
    clickFeedback: true,        // 点击反馈动画
  },

  // ==================== 音效配置 ====================
  audio: {
    enabled: false,             // 启用音效（默认关闭，需要音频文件）
    volume: 0.5,                // 音量（0-1）
    
    // 音效文件路径
    sounds: {
      swap: './assets/sounds/swap.mp3',
      match: './assets/sounds/match.mp3',
      remove: './assets/sounds/pop.mp3',
      fall: './assets/sounds/fall.mp3',
      combo: './assets/sounds/combo.mp3',
      gameOver: './assets/sounds/gameover.mp3',
    },
  },

  // ==================== 性能配置 ====================
  performance: {
    targetFPS: 60,              // 目标帧率
    maxDeltaTime: 100,          // 最大帧时间（防止卡顿时动画跳跃）
    
    // 性能监控
    enableMonitoring: true,     // 启用性能监控
    fpsWarningThreshold: 30,    // FPS警告阈值
    
    // 优化选项
    enableRequestIdleCallback: false, // 使用空闲时间处理非关键任务
  },

  // ==================== 调试配置 ====================
  debug: {
    enabled: false,             // 启用调试模式
    showGrid: false,            // 显示网格坐标
    showTileIds: false,         // 显示图标ID
    showMatchHints: false,      // 显示可用移动提示
    logEvents: false,           // 记录所有事件
    logPerformance: false,      // 记录性能数据
  },

  // ==================== 游戏规则配置 ====================
  rules: {
    minMatchLength: 3,          // 最小匹配长度
    allowDiagonalMatch: false,  // 是否允许对角线匹配
    allowLShapeMatch: true,     // 是否允许L型匹配
    allowTShapeMatch: true,     // 是否允许T型匹配
    
    // 无可用移动处理
    autoShuffleOnNoMoves: true, // 无可用移动时自动洗牌
    shuffleDelay: 2000,         // 洗牌延迟（毫秒）
    showShuffleWarning: true,   // 显示洗牌警告
  },

  // ==================== 特殊图标配置 ====================
  specialTiles: {
    enabled: true,              // 启用特殊图标系统
    
    // 炸弹（4连生成）
    bomb: {
      enabled: true,
      matchLength: 4,           // 需要4连匹配
      explosionRadius: 1,       // 爆炸半径（1=3x3范围）
      color: '#FF6B6B',         // 炸弹颜色
    },
    
    // 彩色炸弹（5连生成）
    colorBomb: {
      enabled: true,
      matchLength: 5,           // 需要5连匹配
      color: '#FFFFFF',         // 彩色炸弹颜色（彩虹效果）
    },
    
    // 横向消除（L型或T型生成）
    rowClear: {
      enabled: true,
      requiresLShape: true,     // 需要L型或T型匹配
      color: '#3498DB',         // 横向消除颜色
    },
    
    // 纵向消除（L型或T型生成）
    colClear: {
      enabled: true,
      requiresLShape: true,     // 需要L型或T型匹配
      color: '#2ECC71',         // 纵向消除颜色
    },
    
    // 组合效果
    combos: {
      enabled: true,            // 启用特殊图标组合
      bombBomb: '5x5explosion', // 炸弹+炸弹=5x5爆炸
      bombRow: '3rows',         // 炸弹+横向=3行消除
      bombCol: '3cols',         // 炸弹+纵向=3列消除
      bombColor: 'allBombs',    // 炸弹+彩色=所有图标变炸弹
      colorColor: 'clearAll',   // 彩色+彩色=清空全部
    },
  },

};

// ==================== 导出常量 ====================

// 游戏状态常量
export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ANIMATING: 'animating',
  GAME_OVER: 'game_over',
  ERROR: 'error',
};

// 图标状态常量
export const TileState = {
  NORMAL: 'normal',
  SELECTED: 'selected',
  MATCHED: 'matched',
  FALLING: 'falling',
  SPAWNING: 'spawning',
};

// 特殊图标类型常量
export const SpecialTileType = {
  NONE: 'none',
  BOMB: 'bomb',                 // 炸弹（4连生成）
  COLOR_BOMB: 'color_bomb',     // 彩色炸弹（5连生成）
  ROW_CLEAR: 'row_clear',       // 横向消除（L型/T型生成）
  COL_CLEAR: 'col_clear',       // 纵向消除（L型/T型生成）
};

// 动画类型常量
export const AnimationType = {
  SWAP: 'swap',
  SWAP_REVERT: 'swap_revert',
  REMOVE: 'remove',
  FALL: 'fall',
  SPAWN: 'spawn',
};

// 错误类型常量
export const ErrorType = {
  INIT_ERROR: 'init_error',
  LOGIC_ERROR: 'logic_error',
  RENDER_ERROR: 'render_error',
  ANIMATION_ERROR: 'animation_error',
};

// 事件名称常量
export const GameEvent = {
  // 游戏生命周期
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_RESET: 'game:reset',
  GAME_OVER: 'game:over',
  
  // 图标事件
  TILE_SELECT: 'tile:select',
  TILE_DESELECT: 'tile:deselect',
  TILE_SWAP_START: 'tile:swap:start',
  TILE_SWAP_COMPLETE: 'tile:swap:complete',
  TILE_SWAP_REVERT: 'tile:swap:revert',
  
  // 匹配事件
  MATCH_FOUND: 'match:found',
  MATCH_NONE: 'match:none',
  
  // 消除事件
  TILE_REMOVE_START: 'tile:remove:start',
  TILE_REMOVE_COMPLETE: 'tile:remove:complete',
  
  // 下落事件
  TILE_FALL_START: 'tile:fall:start',
  TILE_FALL_COMPLETE: 'tile:fall:complete',
  
  // 生成事件
  TILE_SPAWN_START: 'tile:spawn:start',
  TILE_SPAWN_COMPLETE: 'tile:spawn:complete',
  
  // 分数事件
  SCORE_UPDATE: 'score:update',
  COMBO_TRIGGER: 'combo:trigger',
  
  // 状态事件
  STATE_CHANGE: 'state:change',
  
  // 动画事件
  ANIMATION_START: 'animation:start',
  ANIMATION_COMPLETE: 'animation:complete',
  ANIMATION_QUEUE_EMPTY: 'animation:queue:empty',
  
  // 输入事件
  INPUT_ENABLED: 'input:enabled',
  INPUT_DISABLED: 'input:disabled',
  
  // 游戏板事件
  BOARD_STABLE: 'board:stable',
  BOARD_SHUFFLE: 'board:shuffle',
  MOVES_NONE: 'moves:none',
  
  // 错误事件
  ERROR: 'error',
  
  // 性能事件
  PERFORMANCE_WARNING: 'performance:warning',
  
  // 计时器事件
  TIMER_START: 'timer:start',
  TIMER_UPDATE: 'timer:update',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_END: 'timer:end',
  TIMER_WARNING: 'timer:warning',
  
  // 特殊图标事件
  SPECIAL_TILE_CREATE: 'special:create',
  SPECIAL_TILE_ACTIVATE: 'special:activate',
  SPECIAL_TILE_COMBO: 'special:combo',
};

// 默认导出
export default GameConfig;
```

## 使用示例

```javascript
// 在其他模块中导入配置
import { GameConfig, GameState, GameEvent } from './config.js';

// 使用配置
const tileSize = GameConfig.rendering.tileSize;
const baseScore = GameConfig.scoring.baseScore;

// 使用常量
if (currentState === GameState.PLAYING) {
  // ...
}

eventBus.emit(GameEvent.TILE_SELECT, { tile });
```

## 配置调整建议

### 简单模式（适合新手）
```javascript
board: { rows: 6, cols: 6, tileTypes: 4 }
scoring: { baseScore: 10, comboMultiplier: 1.3 }
```

### 困难模式（适合高手）
```javascript
board: { rows: 10, cols: 10, tileTypes: 7 }
scoring: { baseScore: 5, comboMultiplier: 2.0 }
```

### 快速模式（快节奏）
```javascript
animation: {
  swapDuration: 100,
  removeDuration: 150,
  fallDuration: 200,
  spawnDuration: 100,
}
```

### 慢速模式（观赏动画）
```javascript
animation: {
  swapDuration: 400,
  removeDuration: 600,
  fallDuration: 800,
  spawnDuration: 400,
}
```
