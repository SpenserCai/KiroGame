/**
 * 游戏配置对象
 * 包含游戏板尺寸、图标类型、动画时长、颜色、分数规则、计时器配置等
 */
export const GameConfig = {
  // 游戏板配置
  board: {
    rows: 8,
    cols: 8,
    tileTypes: 5  // 普通图标类型数量
  },

  // 渲染配置
  rendering: {
    tileSize: 64,           // 图标尺寸（像素）
    padding: 8,             // 图标间距
    boardOffsetX: 50,       // 游戏板X偏移
    boardOffsetY: 100,      // 游戏板Y偏移
    canvasWidth: 600,       // 画布宽度
    canvasHeight: 700,      // 画布高度
    backgroundColor: 0x2c3e50,  // 背景颜色
    gridColor: 0x34495e,    // 网格颜色
    selectionColor: 0xf39c12,  // 选中边框颜色
    selectionWidth: 3       // 选中边框宽度
  },

  // 动画配置
  animation: {
    swapDuration: 200,      // 交换动画时长（毫秒）
    removeDuration: 300,    // 消除动画时长
    fallDuration: 400,      // 下落动画时长
    spawnDuration: 200,     // 生成动画时长
    maxConcurrentAnimations: 20  // 最大并发动画数量
  },

  // 分数配置
  scoring: {
    baseScore: 10,          // 每个图标基础分数
    comboMultiplier: 1.5,   // 连锁倍数
    match4Bonus: 20,        // 4连额外奖励
    match5Bonus: 50,        // 5连及以上额外奖励
    specialTileMultiplier: 2  // 特殊图标分数倍数
  },

  // 计时器配置
  timer: {
    defaultTime: 60,        // 默认游戏时长（秒）
    warningTime: 10         // 警告时间阈值（秒）
  },

  // 图标颜色配置（用于调试，实际使用PNG纹理）
  colors: {
    type0: 0xFF6B6B,  // 红色小鬼
    type1: 0x4ECDC4,  // 青色小鬼
    type2: 0xFFE66D,  // 黄色小鬼
    type3: 0xA8E6CF,  // 绿色小鬼
    type4: 0xC7CEEA   // 紫色小鬼
  },

  // 资源路径配置
  assets: {
    images: {
      ghosts: [
        '/assets/images/ghosts/ghost-red.png',
        '/assets/images/ghosts/ghost-blue.png',
        '/assets/images/ghosts/ghost-yellow.png',
        '/assets/images/ghosts/ghost-green.png',
        '/assets/images/ghosts/ghost-purple.png'
      ],
      special: {
        bomb: '/assets/images/special/bomb.png',
        colorBomb: '/assets/images/special/color-bomb.png',
        rowClear: '/assets/images/special/row-clear.png',
        colClear: '/assets/images/special/col-clear.png'
      }
    }
  },

  // 特殊图标配置
  specialTiles: {
    bomb: {
      matchLength: 4,       // 需要4连才能生成
      effectRange: 1        // 3x3范围（中心±1）
    },
    colorBomb: {
      matchLength: 5        // 需要5连才能生成
    },
    lineClear: {
      matchType: 'L_SHAPE'  // L型或T型匹配生成
    }
  },

  // 性能配置
  performance: {
    targetFPS: 60,
    maxMemoryMB: 100,
    matchDetectionTimeoutMS: 5
  },

  // 粒子效果配置
  particles: {
    enabled: true,                    // 是否启用粒子效果
    maxParticles: 10000,              // 最大粒子数
    
    explosion: {
      count: 25,                      // 爆炸粒子数量
      lifetime: 0.5,                  // 生命周期（秒）
      speed: { min: 100, max: 200 },  // 初速度范围（像素/秒）
      gravity: 200,                   // 重力加速度（像素/秒²）
      size: { min: 4, max: 8 }        // 粒子大小范围（像素）
    },
    
    combo: {
      baseCount: 10,                  // 基础粒子数
      countPerCombo: 10,              // 每连锁增加的粒子数
      lifetime: 0.8,                  // 生命周期（秒）
      speed: { min: 150, max: 300 }   // 初速度范围（像素/秒）
    },
    
    special: {
      bomb: {
        count: 60,
        lifetime: 0.6,
        speed: { min: 200, max: 400 }
      },
      colorBomb: {
        count: 120,
        lifetime: 1.0,
        speed: { min: 100, max: 300 }
      },
      lineClear: {
        count: 40,
        lifetime: 0.5,
        speed: { min: 300, max: 500 }
      }
    },
    
    ambient: {
      count: 15,                      // 背景粒子数量
      lifetime: 5.0,                  // 生命周期（秒）
      speed: { min: 20, max: 50 }     // 下落速度（像素/秒）
    }
  },

  // 调试配置
  debug: {
    enabled: false,         // 是否启用调试模式
    showFPS: false,         // 是否显示FPS
    showGrid: true,         // 是否显示网格
    logEvents: false        // 是否记录事件
  }
};

export default GameConfig;
