# 快速参考

本文档提供小鬼消消乐项目的快速参考信息，方便开发者快速查找常用命令、配置和API。

**技术栈说明**：
- **运行环境**: 现代浏览器（游戏逻辑完全在浏览器端运行）
- **核心技术**: PixiJS v8.14.0 + 原生 JavaScript（ES6+ Modules）
- **开发工具**: Vite v5.0 + Node.js 18+（仅用于开发环境）
- **部署方式**: 纯前端应用，可部署到任何静态服务器

## 📋 目录

- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [项目结构](#项目结构)
- [核心模块API](#核心模块api)
- [事件列表](#事件列表)
- [配置参数](#配置参数)
- [常见问题](#常见问题)

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/ghost-match-game.git
cd ghost-match-game

# 2. 安装依赖
npm install

# 3. 构建资源（如果有SVG源文件）
npm run build:assets

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:5173
```

## 常用命令

### 开发

```bash
# 启动开发服务器（自动打开浏览器）
npm run dev

# 启动开发服务器（指定端口）
PORT=3000 npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 构建资源（SVG转PNG）
npm run build:assets
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式（自动重新运行）
npm run test:watch

# 运行特定测试文件
node --test tests/unit/BoardManager.test.js
```

### 部署

```bash
# Netlify部署
netlify deploy --prod --dir=dist

# Vercel部署
vercel --prod

# GitHub Pages部署
gh-pages -d dist
```

## 项目结构

```
ghost-match-game/
├── src/
│   ├── main.js                 # 入口文件
│   ├── config.js               # 游戏配置
│   ├── core/                   # 核心模块
│   │   ├── EventBus.js         # 事件总线
│   │   ├── GameEngine.js       # 游戏引擎
│   │   └── StateManager.js     # 状态管理
│   ├── game/                   # 游戏逻辑
│   │   ├── BoardManager.js     # 游戏板管理
│   │   ├── MatchDetector.js    # 匹配检测
│   │   ├── Tile.js             # 图标类
│   │   └── SpecialTileManager.js # 特殊图标
│   ├── rendering/              # 渲染引擎
│   │   ├── RenderEngine.js     # 主渲染引擎
│   │   └── TileTextureFactory.js # 纹理工厂
│   ├── input/                  # 输入管理
│   │   └── InputManager.js
│   ├── animation/              # 动画系统
│   │   ├── AnimationController.js
│   │   ├── Tween.js
│   │   └── Easing.js
│   └── utils/                  # 工具函数
│       ├── ErrorHandler.js
│       └── PerformanceMonitor.js
├── assets/
│   ├── svg/                    # SVG源文件
│   └── images/                 # PNG资源
├── tests/
│   └── unit/                   # 单元测试
├── scripts/
│   └── convert-svg.js          # SVG转PNG脚本
├── index.html                  # HTML入口
├── vite.config.js              # Vite配置
└── package.json                # 项目配置
```

## 核心模块API

### EventBus

```javascript
import { EventBus } from './core/EventBus.js';

const eventBus = new EventBus();

// 订阅事件
eventBus.on('tile:select', (data) => {
  console.log('Tile selected:', data);
});

// 发布事件
eventBus.emit('tile:select', { tile, position });

// 取消订阅
eventBus.off('tile:select', callback);

// 一次性订阅
eventBus.once('game:start', () => {
  console.log('Game started!');
});
```

### GameEngine

```javascript
import { GameEngine } from './core/GameEngine.js';

const engine = new GameEngine(config, eventBus);

// 初始化游戏
await engine.init();

// 开始游戏
engine.start();

// 暂停游戏
engine.pause();

// 恢复游戏
engine.resume();

// 重置游戏
engine.reset();

// 更新游戏状态（每帧调用）
engine.update(deltaTime);
```

### BoardManager

```javascript
import { BoardManager } from './game/BoardManager.js';

const board = new BoardManager(8, 8, 5);

// 创建游戏板
board.createBoard();

// 获取图标
const tile = board.getTile(x, y);

// 设置图标
board.setTile(x, y, tile);

// 交换图标
board.swapTiles(pos1, pos2);

// 移除图标
board.removeTiles([pos1, pos2, pos3]);

// 检查是否相邻
const isAdjacent = board.isAdjacent(pos1, pos2);

// 应用重力
board.applyGravity();

// 填充游戏板
board.fillBoard();

// 洗牌
board.shuffleBoard();
```

### MatchDetector

```javascript
import { MatchDetector } from './game/MatchDetector.js';

const detector = new MatchDetector();

// 查找所有匹配
const matches = detector.findMatches(board);

// 检查是否有可用移动
const hasValidMoves = detector.hasValidMoves(board);

// 查找可能的移动
const possibleMoves = detector.findPossibleMoves(board);

// 清除缓存
detector.clearCache();
```

### RenderEngine

```javascript
import { RenderEngine } from './rendering/RenderEngine.js';

const renderer = new RenderEngine(container, config, eventBus);

// 初始化（加载资源）
await renderer.init();

// 创建图标精灵
const sprite = renderer.createTileSprite(tile);

// 更新分数显示
renderer.updateScore(score);

// 更新计时器显示
renderer.updateTimer(time);

// 高亮图标
renderer.highlightTile(tile);

// 取消高亮
renderer.unhighlightTile(tile);

// 调整大小
renderer.resize();

// 销毁
renderer.destroy();
```

### AnimationController

```javascript
import { AnimationController } from './animation/AnimationController.js';

const animator = new AnimationController(eventBus);

// 交换动画
await animator.animateSwap(sprite1, sprite2, 200);

// 消除动画
await animator.animateRemove([sprite1, sprite2], 300);

// 下落动画
await animator.animateFall(sprite, targetY, 400);

// 生成动画
await animator.animateSpawn(sprite, 200);

// 选中动画（循环）
animator.animateSelection(sprite);

// 停止选中动画
animator.stopSelection(sprite);

// 检查是否有动画正在播放
const isAnimating = animator.isAnimating();

// 停止所有动画
animator.stopAll();
```

## 事件列表

### 游戏生命周期

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `game:init` | `{ board, config }` | 游戏初始化完成 |
| `game:start` | `{}` | 游戏开始 |
| `game:reset` | `{}` | 游戏重置 |
| `game:over` | `{ reason, finalScore }` | 游戏结束 |

### 图标事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `tile:select` | `{ tile, position }` | 图标被选中 |
| `tile:deselect` | `{ tile }` | 图标取消选中 |
| `tile:swap:start` | `{ tile1, tile2 }` | 开始交换 |
| `tile:swap:complete` | `{ tile1, tile2, hasMatch }` | 交换完成 |
| `tile:swap:revert` | `{ tile1, tile2 }` | 交换回退 |

### 匹配事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `match:found` | `{ matches, totalTiles }` | 发现匹配 |
| `match:none` | `{}` | 无匹配 |

### 消除事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `tile:remove:start` | `{ tiles }` | 开始消除 |
| `tile:remove:complete` | `{ tiles }` | 消除完成 |

### 下落和生成事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `tile:fall:start` | `{ movements }` | 开始下落 |
| `tile:fall:complete` | `{}` | 下落完成 |
| `tile:spawn:start` | `{ tiles }` | 开始生成 |
| `tile:spawn:complete` | `{}` | 生成完成 |

### 分数和连锁事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `score:update` | `{ score, delta, combo }` | 分数更新 |
| `combo:trigger` | `{ comboCount, multiplier }` | 触发连锁 |

### 状态和输入事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `state:change` | `{ from, to }` | 状态变化 |
| `input:enabled` | `{}` | 启用输入 |
| `input:disabled` | `{}` | 禁用输入 |

### 动画事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `animation:start` | `{ type, duration }` | 动画开始 |
| `animation:complete` | `{ type }` | 动画完成 |
| `animation:queue:empty` | `{}` | 动画队列清空 |

### 游戏板事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `board:stable` | `{}` | 游戏板稳定 |
| `board:shuffle` | `{}` | 游戏板洗牌 |
| `moves:none` | `{}` | 无可用移动 |

### 计时器事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `timer:start` | `{}` | 计时器开始 |
| `timer:update` | `{ time }` | 计时器更新 |
| `timer:pause` | `{}` | 计时器暂停 |
| `timer:resume` | `{}` | 计时器恢复 |
| `timer:end` | `{}` | 计时器结束 |
| `timer:warning` | `{}` | 计时器警告 |

### 特殊图标事件

| 事件名 | 数据载荷 | 说明 |
|--------|---------|------|
| `special:create` | `{ tile, type }` | 创建特殊图标 |
| `special:activate` | `{ tile, type }` | 激活特殊图标 |
| `special:combo` | `{ tile1, tile2 }` | 特殊图标组合 |

## 配置参数

### 游戏板配置

```javascript
board: {
  rows: 8,                    // 行数
  cols: 8,                    // 列数
  tileTypes: 5,               // 图标类型数量
  maxInitAttempts: 100,       // 初始化最大尝试次数
  shuffleOnNoMoves: true,     // 无可用移动时自动洗牌
  shuffleDelay: 3000,         // 洗牌延迟（毫秒）
}
```

### 渲染配置

```javascript
rendering: {
  canvasWidth: 600,           // Canvas宽度
  canvasHeight: 700,          // Canvas高度
  tileSize: 64,               // 图标尺寸
  padding: 8,                 // 图标间距
  boardOffsetX: 40,           // 游戏板X偏移
  boardOffsetY: 120,          // 游戏板Y偏移
  backgroundColor: '#2C3E50', // 背景颜色
  gridColor: '#34495E',       // 网格颜色
  selectedBorderColor: '#F39C12', // 选中边框颜色
  selectedBorderWidth: 4,     // 选中边框宽度
}
```

### 动画配置

```javascript
animation: {
  swapDuration: 200,          // 交换动画时长
  removeDuration: 300,        // 消除动画时长
  fallDuration: 400,          // 下落动画时长
  spawnDuration: 200,         // 生成动画时长
  swapEasing: 'easeInOutQuad',
  fallEasing: 'easeOutQuad',
  removeEasing: 'easeInQuad',
  spawnEasing: 'easeOutBounce',
}
```

### 分数配置

```javascript
scoring: {
  baseScore: 10,              // 基础分数
  comboMultiplier: 1.5,       // 连锁倍数
  match4Bonus: 20,            // 4连奖励
  match5Bonus: 50,            // 5连奖励
  bombMultiplier: 2,          // 炸弹分数倍数
  colorBombMultiplier: 5,     // 彩色炸弹分数倍数
  lineClearMultiplier: 3,     // 横向/纵向消除分数倍数
}
```

### 计时器配置

```javascript
timer: {
  enabled: true,              // 启用计时系统
  duration: 60,               // 游戏时长（秒）
  warningThreshold: 10,       // 警告阈值（秒）
  warningColor: '#E74C3C',    // 警告颜色
  showMilliseconds: false,    // 是否显示毫秒
}
```

### 特殊图标配置

```javascript
specialTiles: {
  enabled: true,              // 启用特殊图标
  bomb: {
    enabled: true,
    matchLength: 4,           // 需要4连
    explosionRadius: 1,       // 爆炸半径（1=3x3）
  },
  colorBomb: {
    enabled: true,
    matchLength: 5,           // 需要5连
  },
  rowClear: {
    enabled: true,
    requiresLShape: true,     // 需要L型或T型
  },
  colClear: {
    enabled: true,
    requiresLShape: true,
  },
}
```

## 常见问题

### 开发环境

**Q: 启动开发服务器失败？**

A: 检查以下几点：
1. Node.js版本是否>=18.0.0
2. 依赖是否正确安装（`npm install`）
3. 端口5173是否被占用

**Q: 热更新不工作？**

A: 尝试以下方法：
1. 重启开发服务器
2. 清除浏览器缓存
3. 检查文件是否在src目录下

### 资源构建

**Q: SVG转PNG失败？**

A: 检查以下几点：
1. sharp是否正确安装（`npm install sharp`）
2. SVG文件是否有效
3. 输出目录是否有写权限

**Q: 生成的PNG质量不好？**

A: 调整转换脚本中的质量参数：
```javascript
.png({ quality: 100 }) // 100为无损
```

### 游戏逻辑

**Q: 初始化时有匹配？**

A: 检查 `ensureNoInitialMatches()` 方法是否正确调用。

**Q: 无可用移动检测不准确？**

A: 确保 `hasValidMoves()` 方法在每次棋盘变化后调用，并清除缓存。

**Q: 连锁分数计算错误？**

A: 检查 `calculateScore()` 方法中的公式：
```javascript
multiplier = Math.pow(1.5, comboCount - 1)
```

### 渲染问题

**Q: 图标显示不正确？**

A: 检查以下几点：
1. 纹理是否正确加载
2. 精灵的anchor是否设置为0.5
3. 坐标转换是否正确

**Q: 动画卡顿？**

A: 优化建议：
1. 限制并发动画数量
2. 使用对象池复用精灵
3. 检查FPS是否达到60

### 部署问题

**Q: 部署后白屏？**

A: 检查以下几点：
1. base路径是否正确配置
2. 资源路径是否正确
3. 浏览器控制台是否有错误

**Q: 资源404？**

A: 确保：
1. 资源文件已复制到dist目录
2. 路径使用绝对路径（/assets/...）
3. 服务器配置正确

## 性能优化技巧

### 1. 减少重绘

```javascript
// 使用脏标记
if (!this.isDirty()) {
  return; // 跳过重绘
}
```

### 2. 对象池

```javascript
// 复用精灵对象
const spritePool = [];
function getSprite() {
  return spritePool.pop() || new PIXI.Sprite();
}
function releaseSprite(sprite) {
  spritePool.push(sprite);
}
```

### 3. 批量操作

```javascript
// 批量更新，减少事件触发
const updates = [];
// ... 收集更新
updates.forEach(update => apply(update));
```

### 4. 缓存计算结果

```javascript
// 缓存匹配检测结果
if (this.cachedResult && !boardChanged) {
  return this.cachedResult;
}
```

## 调试技巧

### 1. 启用调试模式

```javascript
// config.js
debug: {
  enabled: true,
  showGrid: true,
  showTileIds: true,
  logEvents: true,
}
```

### 2. 性能监控

```javascript
// 显示FPS
console.log('FPS:', app.ticker.FPS);

// 显示内存使用
console.log('Memory:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
```

### 3. 事件追踪

```javascript
// 记录所有事件
eventBus.on('*', (eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});
```

## 有用的链接

- [PixiJS文档](https://pixijs.com/docs)
- [Vite文档](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [项目GitHub](https://github.com/yourusername/ghost-match-game)

---

**最后更新**：2025-10-21  
**版本**：1.1.0
