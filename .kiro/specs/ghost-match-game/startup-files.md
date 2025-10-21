# 项目启动文件示例

本文档提供项目启动所需的关键文件示例。

## package.json

```json
{
  "name": "ghost-match-game",
  "version": "1.0.0",
  "description": "小鬼消消乐 - 基于 PixiJS 的浏览器消除类游戏",
  "type": "module",
  "main": "src/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "node --test tests/unit/**/*.test.js",
    "test:watch": "node --test --watch tests/unit/**/*.test.js",
    "build:assets": "node scripts/convert-svg.js"
  },
  "keywords": [
    "game",
    "match-3",
    "pixi.js",
    "puzzle",
    "javascript",
    "browser-game"
  ],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "pixi.js": "^8.14.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "sharp": "^0.33.0"
  }
}
```

## vite.config.js

```javascript
/**
 * Vite 配置文件
 * 用于开发服务器和生产构建
 */
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 5173,
    open: true, // 自动打开浏览器
    host: true, // 允许外部访问
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // 生成 source map 便于调试
    
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'], // 将 PixiJS 单独打包
        },
      },
    },
  },
  
  // 路径别名（可选）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets'),
    },
  },
  
  // 优化配置
  optimizeDeps: {
    include: ['pixi.js'], // 预构建 PixiJS
  },
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
 * 负责初始化游戏并启动游戏循环（基于 PixiJS）
 */

// 从 npm 包导入 PixiJS v8.14.0（Vite 会自动处理）
import * as PIXI from 'pixi.js';
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
      console.log('🎮 PixiJS version:', PIXI.VERSION); // 应该显示 8.14.0
      
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
# 依赖
node_modules/

# 日志文件
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# 操作系统文件
.DS_Store
Thumbs.db
*.swp
*.swo

# IDE 配置
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# 测试覆盖率
coverage/
*.lcov

# 构建输出
dist/
dist-ssr/
build/

# Vite 缓存
.vite/
*.local

# 环境变量
.env
.env.local
.env.*.local

# 临时文件
tmp/
temp/
*.tmp

# 生成的 PNG 资源（由 SVG 生成）
# 注意：团队协作时可以选择提交 PNG 以避免每个人都需要转换
assets/images/ghosts/*.png
assets/images/special/*.png

# 但保留目录结构
!assets/images/ghosts/.gitkeep
!assets/images/special/.gitkeep
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
   
   # 转换所有SVG为PNG（使用 sharp 库）
   npm run build:assets
   ```
   
   这会执行 `scripts/convert-svg.js` 脚本，自动将所有 SVG 转换为 128x128 的 PNG。

3. **转换脚本说明**
   
   `scripts/convert-svg.js` 使用 sharp 库进行转换：
   - 自动扫描 `assets/svg/` 目录下的所有 SVG 文件
   - 转换为 128x128 的 PNG 格式
   - 保持透明度和高质量
   - 输出到 `assets/images/` 对应目录

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

## scripts/convert-svg.js

```javascript
/**
 * SVG 转 PNG 转换脚本
 * 使用 sharp 库将 assets/svg/ 目录下的所有 SVG 转换为 PNG
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 配置
const config = {
  inputDir: join(projectRoot, 'assets/svg'),
  outputDir: join(projectRoot, 'assets/images'),
  size: 128, // 输出尺寸 128x128
  quality: 100, // PNG 质量
};

/**
 * 确保目录存在
 */
async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
}

/**
 * 转换单个 SVG 文件为 PNG
 */
async function convertSvgToPng(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(config.size, config.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
      })
      .png({ quality: config.quality })
      .toFile(outputPath);
    
    console.log(`✅ 转换成功: ${basename(inputPath)} -> ${basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ 转换失败: ${basename(inputPath)}`, error.message);
    return false;
  }
}

/**
 * 递归扫描目录并转换所有 SVG 文件
 */
async function convertDirectory(inputDir, outputDir) {
  try {
    const entries = await readdir(inputDir, { withFileTypes: true });
    let successCount = 0;
    let failCount = 0;

    for (const entry of entries) {
      const inputPath = join(inputDir, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        const subOutputDir = join(outputDir, entry.name);
        await ensureDir(subOutputDir);
        const result = await convertDirectory(inputPath, subOutputDir);
        successCount += result.success;
        failCount += result.fail;
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.svg') {
        // 转换 SVG 文件
        const outputFileName = basename(entry.name, '.svg') + '.png';
        const outputPath = join(outputDir, outputFileName);
        
        const success = await convertSvgToPng(inputPath, outputPath);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    return { success: successCount, fail: failCount };
  } catch (error) {
    console.error(`❌ 读取目录失败: ${inputDir}`, error.message);
    return { success: 0, fail: 0 };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🎨 开始转换 SVG 为 PNG...\n');
  console.log(`输入目录: ${config.inputDir}`);
  console.log(`输出目录: ${config.outputDir}`);
  console.log(`输出尺寸: ${config.size}x${config.size}\n`);

  // 确保输出目录存在
  await ensureDir(config.outputDir);

  // 开始转换
  const startTime = Date.now();
  const result = await convertDirectory(config.inputDir, config.outputDir);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log(`✅ 转换完成！`);
  console.log(`成功: ${result.success} 个文件`);
  console.log(`失败: ${result.fail} 个文件`);
  console.log(`耗时: ${duration} 秒`);
  console.log('='.repeat(50));

  // 如果有失败的文件，退出码为 1
  if (result.fail > 0) {
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error('❌ 转换过程出错:', error);
  process.exit(1);
});
```

## README.md

```markdown
# 小鬼消消乐 (Ghost Match Game)

一款基于 PixiJS v8.0 的浏览器消除类益智游戏。

## 特性

- ✨ 基于 PixiJS 的高性能 WebGL 渲染
- 🎨 精美的精灵动画和视觉效果
- 🎮 流畅的补间动画系统
- 🏗️ 模块化事件驱动架构
- 🔧 高度可配置的游戏参数
- 📱 响应式设计，支持多种屏幕尺寸
- ⚡ Vite 驱动的快速开发体验

## 技术栈

- **渲染引擎**: PixiJS v8.14.0（WebGL + Canvas 降级）
- **开发工具**: Vite v5.0（开发服务器和构建工具）
- **包管理**: npm
- **运行环境**: 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- **开发环境**: Node.js 18+（仅用于开发服务器）
- **模块系统**: ES6+ Modules
- **编程语言**: 原生 JavaScript（无需 TypeScript）
- **图像处理**: sharp v0.33.0（SVG 转 PNG）

## 快速开始

### 前置要求

确保已安装 Node.js 18 或更高版本：

\`\`\`bash
node --version  # 应该显示 v18.x.x 或更高
\`\`\`

### 安装依赖

\`\`\`bash
# 克隆或下载项目后，在项目根目录运行
npm install
\`\`\`

这将安装：
- PixiJS v8.14.0（渲染引擎）
- Vite v5.0（开发服务器）
- sharp v0.33.0（图像处理工具，用于 SVG 转 PNG）

### 开发模式

\`\`\`bash
npm run dev
\`\`\`

Vite 会自动：
- 启动开发服务器（默认端口 5173）
- 打开浏览器
- 启用热模块替换（HMR）

### 生产构建

\`\`\`bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
\`\`\`

构建产物在 `dist/` 目录，可直接部署到静态服务器。

### 测试

\`\`\`bash
# 运行单元测试
npm test

# 监听模式（自动重新运行）
npm run test:watch
\`\`\`

### 资源构建

如果你修改了 SVG 图标：

\`\`\`bash
npm run build:assets
\`\`\`

这会将 `assets/svg/` 中的 SVG 转换为 PNG 并保存到 `assets/images/`。

## 游戏玩法

1. 点击选中一个小鬼图标
2. 再点击相邻的图标进行交换
3. 形成3个或更多相同图标的连线即可消除
4. 消除后会产生连锁反应，获得更高分数
5. 尽可能获得高分！

## 项目结构

\`\`\`
ghost-match-game/
├── index.html              # 游戏入口页面
├── vite.config.js          # Vite 配置文件
├── package.json            # 项目配置和依赖
├── .gitignore              # Git 忽略文件
├── src/
│   ├── main.js            # 主入口文件（导入 PixiJS）
│   ├── config.js          # 游戏配置
│   ├── core/              # 核心模块
│   │   ├── EventBus.js    # 事件总线
│   │   ├── GameEngine.js  # 游戏引擎
│   │   └── StateManager.js# 状态管理器
│   ├── game/              # 游戏逻辑
│   │   ├── BoardManager.js    # 游戏板管理
│   │   ├── MatchDetector.js   # 匹配检测
│   │   ├── Tile.js            # 图标类
│   │   └── SpecialTileManager.js  # 特殊图标管理
│   ├── rendering/         # 渲染引擎（PixiJS）
│   │   ├── RenderEngine.js        # 渲染引擎主类
│   │   ├── TileTextureFactory.js  # 纹理工厂
│   │   └── ParticleEffects.js     # 粒子特效（可选）
│   ├── input/             # 输入管理
│   │   └── InputManager.js    # 输入管理器
│   ├── animation/         # 动画系统
│   │   ├── AnimationController.js  # 动画控制器
│   │   ├── Tween.js               # 补间动画
│   │   └── Easing.js              # 缓动函数
│   └── utils/             # 工具函数
│       ├── ErrorHandler.js    # 错误处理
│       └── PerformanceMonitor.js  # 性能监控
├── assets/
│   ├── svg/               # SVG 源文件
│   │   ├── ghosts/       # 普通图标 SVG
│   │   └── special/      # 特殊图标 SVG
│   └── images/           # PNG 资源（由 SVG 生成）
│       ├── ghosts/       # 普通图标 PNG
│       └── special/      # 特殊图标 PNG
├── tests/
│   └── unit/             # 单元测试
│       ├── BoardManager.test.js
│       ├── MatchDetector.test.js
│       ├── EventBus.test.js
│       └── SpecialTiles.test.js
└── dist/                 # 构建输出（生产环境）
\`\`\`

## 配置

游戏配置位于 `src/config.js`，可以调整：

- **游戏板配置**: 行数、列数、图标类型数量
- **渲染配置**: Canvas 尺寸、图标大小、颜色主题
- **动画配置**: 动画时长、缓动函数
- **分数规则**: 基础分数、连锁倍数、特殊图标奖励
- **计时器**: 游戏时长、警告阈值
- **特殊图标**: 启用/禁用、生成条件、效果强度
- **性能配置**: 目标 FPS、性能监控

示例：

\`\`\`javascript
// src/config.js
export const GameConfig = {
  board: {
    rows: 8,
    cols: 8,
    tileTypes: 5,
  },
  timer: {
    duration: 60, // 改为 90 秒
  },
  scoring: {
    baseScore: 10,
    comboMultiplier: 1.5, // 提高连锁倍数
  },
};
\`\`\`

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
