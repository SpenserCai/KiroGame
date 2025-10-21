# 项目启动文件示例

本文档提供项目启动所需的关键文件示例。

## package.json

```json
{
  "name": "ghost-match-game",
  "version": "1.0.0",
  "description": "小鬼消消乐 - 基于PixiJS的消除类游戏",
  "type": "module",
  "main": "src/main.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "node --test tests/**/*.test.js",
    "test:watch": "node --test --watch tests/**/*.test.js",
    "build:assets": "npm run build:ghosts && npm run build:special",
    "build:ghosts": "svg2png-cli assets/svg/ghosts/*.svg -o assets/images/ghosts -w 128 -h 128",
    "build:special": "svg2png-cli assets/svg/special/*.svg -o assets/images/special -w 128 -h 128"
  },
  "keywords": [
    "game",
    "match-3",
    "pixi.js",
    "puzzle",
    "javascript"
  ],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "pixi.js": "^8.0.0"
  },
  "devDependencies": {
    "svg2png": "^4.1.1"
  }
}
```

## server.js

```javascript
/**
 * 简单的开发服务器
 * 支持ES6模块和静态文件服务
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // 处理根路径
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // 获取文件扩展名
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // 服务器错误
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      // 成功返回文件
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Ghost Match Game Server`);
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
  console.log(`📝 Press Ctrl+C to stop`);
});
```

## index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小鬼消消乐 - Ghost Match Game</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      overflow: hidden;
    }
    
    #game-container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      position: relative;
    }
    
    /* PixiJS会自动创建canvas并添加到这个容器 */
    #pixi-container {
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    
    #loading {
      text-align: center;
      color: white;
      font-size: 24px;
      padding: 40px;
    }
    
    .hidden {
      display: none;
    }
    
    #error-message {
      color: #ff6b6b;
      background: rgba(255, 255, 255, 0.9);
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
      display: none;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div id="loading">
      <p>🎮 加载中...</p>
    </div>
    <!-- PixiJS应用将挂载到这个容器 -->
    <div id="pixi-container" class="hidden"></div>
    <div id="error-message"></div>
  </div>
  
  <!-- 使用ES6模块加载主文件 -->
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

## src/main.js (入口文件骨架)

```javascript
/**
 * 小鬼消消乐 - 主入口文件
 * 负责初始化游戏并启动游戏循环（基于PixiJS）
 */

import * as PIXI from './node_modules/pixi.js/dist/pixi.mjs';
import { GameConfig, GameState } from './config.js';
import { EventBus } from './core/EventBus.js';
import { GameEngine } from './core/GameEngine.js';
import { RenderEngine } from './rendering/RenderEngine.js';
import { InputManager } from './input/InputManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { ErrorHandler } from './utils/ErrorHandler.js';

class Game {
  constructor() {
    this.pixiApp = null;
    this.eventBus = null;
    this.gameEngine = null;
    this.renderEngine = null;
    this.inputManager = null;
    this.performanceMonitor = null;
  }
  
  async init() {
    try {
      // 获取容器元素
      const container = document.getElementById('pixi-container');
      if (!container) {
        throw new Error('PixiJS container not found');
      }
      
      // 初始化事件总线
      this.eventBus = new EventBus();
      
      // 初始化性能监控
      if (GameConfig.performance.enableMonitoring) {
        this.performanceMonitor = new PerformanceMonitor();
      }
      
      // 初始化各个模块
      this.gameEngine = new GameEngine(GameConfig, this.eventBus);
      this.renderEngine = new RenderEngine(container, GameConfig, this.eventBus);
      this.inputManager = new InputManager(this.renderEngine.app, GameConfig, this.eventBus);
      
      // 初始化游戏（会创建PixiJS应用）
      await this.renderEngine.init();
      this.pixiApp = this.renderEngine.app;
      
      await this.gameEngine.init();
      await this.inputManager.init();
      
      // 隐藏加载提示，显示游戏
      document.getElementById('loading').classList.add('hidden');
      container.classList.remove('hidden');
      
      console.log('✅ Game initialized successfully');
      console.log('🎮 PixiJS version:', PIXI.VERSION);
      
      // 启动游戏循环（使用PixiJS的ticker）
      this.start();
      
    } catch (error) {
      ErrorHandler.handle({
        type: 'INIT_ERROR',
        message: 'Failed to initialize game',
        error: error
      });
      
      // 显示错误信息
      const errorDiv = document.getElementById('error-message');
      errorDiv.textContent = `初始化失败: ${error.message}`;
      errorDiv.style.display = 'block';
    }
  }
  
  start() {
    // 使用PixiJS的ticker作为游戏循环
    this.pixiApp.ticker.add((ticker) => {
      const deltaTime = ticker.deltaMS / 1000; // 转换为秒
      
      // 更新游戏状态
      this.gameEngine.update(deltaTime);
      
      // 更新性能监控
      if (this.performanceMonitor) {
        this.performanceMonitor.update(ticker.FPS);
      }
    });
    
    console.log('🚀 Game loop started');
  }
  
  pause() {
    if (this.pixiApp) {
      this.pixiApp.ticker.stop();
      this.gameEngine.pause();
    }
  }
  
  resume() {
    if (this.pixiApp) {
      this.pixiApp.ticker.start();
      this.gameEngine.resume();
    }
  }
  
  destroy() {
    if (this.pixiApp) {
      this.pixiApp.destroy(true, { children: true, texture: true });
    }
  }
}

// 创建并启动游戏
const game = new Game();

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => game.init());
} else {
  game.init();
}

// 导出游戏实例（用于调试）
window.game = game;
window.PIXI = PIXI;
```

## .gitignore

```
# Node modules
node_modules/

# 日志文件
*.log
npm-debug.log*

# 操作系统文件
.DS_Store
Thumbs.db

# IDE配置
.vscode/
.idea/
*.swp
*.swo

# 测试覆盖率
coverage/

# 构建输出（如果将来添加构建步骤）
dist/
build/

# 环境变量
.env
.env.local

# 临时文件
tmp/
temp/

# 生成的PNG资源（由SVG生成，不提交到git）
# 注意：如果团队协作，可以选择提交PNG以避免每个人都需要转换
assets/images/
```

## 资源构建说明

### SVG转PNG工作流

1. **设计SVG图标**
   - 使用Figma、Illustrator或其他矢量图形工具
   - 推荐尺寸：128x128px（画布大小）
   - 导出为SVG格式，保存到`assets/svg/`目录

2. **转换为PNG**
   ```bash
   # 安装依赖
   npm install
   
   # 转换所有SVG为PNG
   npm run build:assets
   
   # 或分别转换
   npm run build:ghosts   # 转换普通图标
   npm run build:special  # 转换特殊图标
   ```

3. **手动转换（可选）**
   ```bash
   # 转换单个文件
   ./node_modules/.bin/svg2png-cli assets/svg/ghosts/ghost-red.svg -o assets/images/ghosts -w 128 -h 128
   
   # 转换并指定不同尺寸
   ./node_modules/.bin/svg2png-cli assets/svg/ghosts/*.svg -o assets/images/ghosts@2x -w 256 -h 256
   ```

4. **验证生成的PNG**
   - 检查`assets/images/`目录
   - 确保所有PNG文件正确生成
   - 验证图标透明度和边缘质量

### SVG设计规范

**普通小鬼图标**：
- 尺寸：128x128px
- 格式：SVG
- 要求：
  - 透明背景
  - 居中对齐
  - 清晰的轮廓
  - 适当的内边距（建议8-16px）
  - 使用纯色或简单渐变

**特殊图标**：
- 尺寸：128x128px
- 格式：SVG
- 要求：
  - 透明背景
  - 视觉上更突出（可以使用光晕、特效）
  - 与普通图标有明显区别
  - 建议添加发光效果或边框

### 资源命名规范

```
assets/svg/ghosts/
  ├── ghost-red.svg      # 红色小鬼（类型0）
  ├── ghost-blue.svg     # 蓝色小鬼（类型1）
  ├── ghost-yellow.svg   # 黄色小鬼（类型2）
  ├── ghost-green.svg    # 绿色小鬼（类型3）
  └── ghost-purple.svg   # 紫色小鬼（类型4）

assets/svg/special/
  ├── bomb.svg           # 炸弹（4连生成）
  ├── color-bomb.svg     # 彩色炸弹（5连生成）
  ├── row-clear.svg      # 横向消除
  └── col-clear.svg      # 纵向消除
```

## README.md

```markdown
# 小鬼消消乐 (Ghost Match Game)

一款基于纯Node.js和Canvas的消除类益智游戏。

## 特性

- ✨ 纯JavaScript实现，零外部依赖
- 🎨 Canvas 2D渲染
- 🎮 流畅的动画效果
- 🏗️ 模块化架构设计
- 🔧 高度可配置
- 📱 响应式设计

## 技术栈

- Node.js 18+
- HTML5 Canvas API
- ES6+ Modules
- 原生JavaScript

## 快速开始

### 安装

确保已安装Node.js 18或更高版本：

\`\`\`bash
node --version
\`\`\`

### 运行

1. 克隆或下载项目
2. 在项目根目录运行：

\`\`\`bash
npm start
\`\`\`

3. 打开浏览器访问 `http://localhost:3000`

### 测试

运行单元测试：

\`\`\`bash
npm test
\`\`\`

## 游戏玩法

1. 点击选中一个小鬼图标
2. 再点击相邻的图标进行交换
3. 形成3个或更多相同图标的连线即可消除
4. 消除后会产生连锁反应，获得更高分数
5. 尽可能获得高分！

## 项目结构

\`\`\`
ghost-match-game/
├── index.html          # 游戏入口页面
├── server.js           # 开发服务器
├── package.json        # 项目配置
├── src/
│   ├── main.js        # 主入口文件
│   ├── config.js      # 游戏配置
│   ├── core/          # 核心模块
│   ├── game/          # 游戏逻辑
│   ├── rendering/     # 渲染引擎
│   ├── input/         # 输入管理
│   ├── animation/     # 动画系统
│   └── utils/         # 工具函数
└── tests/             # 测试文件
\`\`\`

## 配置

游戏配置位于 `src/config.js`，可以调整：

- 游戏板大小
- 图标类型数量
- 动画速度
- 分数规则
- 颜色主题
- 等等...

## 开发

### 架构设计

项目采用事件驱动架构，模块间通过事件总线通信，实现松耦合。

详细设计文档请参考：
- `.kiro/specs/ghost-match-game/design.md`
- `.kiro/specs/ghost-match-game/event-flow.md`

### 添加新功能

1. 在相应模块中实现功能
2. 通过事件总线发布/订阅事件
3. 更新配置文件（如需要）
4. 编写测试

## 许可证

MIT
\`\`\`
