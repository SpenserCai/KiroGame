# 👻 小鬼消消乐 - Ghost Match Game

一款基于 PixiJS v8.14.0 的浏览器消除类益智游戏。

## 🎮 游戏简介

小鬼消消乐是一款经典的三消游戏，玩家通过交换相邻的小鬼图标来形成三个或更多相同图标的连线，从而消除它们并获得分数。游戏采用模块化架构设计，使用 PixiJS 作为渲染引擎，确保代码解耦、可扩展且易于维护。

## ✨ 当前功能（第二阶段完成）

- ✅ 8x8 游戏板显示
- ✅ 5 种不同的小鬼图标
- ✅ 点击选中图标（高亮边框）
- ✅ 点击相邻图标进行交换
- ✅ 自动检测匹配（3连或更多）
- ✅ 无匹配时自动交换回原位置
- ✅ 悬停效果
- ✅ 响应式布局

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 即可开始游戏。

### 构建生产版本

```bash
npm run build
```

构建结果将输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

## 🎨 美术资源

### SVG 转 PNG

游戏使用 SVG 作为源文件，通过 sharp 库自动转换为 PNG：

```bash
npm run build:assets
```

这将扫描 `assets/svg/` 目录下的所有 SVG 文件，并转换为 128x128 的 PNG 文件，保存到 `assets/images/` 目录。

### 图标列表

**普通小鬼图标**:
- 红色小鬼 (ghost-red)
- 蓝色小鬼 (ghost-blue)
- 黄色小鬼 (ghost-yellow)
- 绿色小鬼 (ghost-green)
- 紫色小鬼 (ghost-purple)

**特殊图标**（待实现）:
- 炸弹 (bomb)
- 彩色炸弹 (color-bomb)
- 横向消除 (row-clear)
- 纵向消除 (col-clear)

## 🧪 测试

### 运行单元测试

```bash
npm test
```

### 监听模式

```bash
npm run test:watch
```

### 测试覆盖率

当前测试覆盖率：
- EventBus: 100% (8/8 测试通过)
- BoardManager: 100% (9/9 测试通过)
- MatchDetector: 100% (8/8 测试通过)
- 总计: 25/25 测试通过

## 📁 项目结构

```
ghost-match-game/
├── index.html              # 游戏入口页面
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── README.md               # 项目说明
├── scripts/
│   └── convert-svg.js      # SVG 转 PNG 脚本
├── src/
│   ├── main.js            # 游戏主入口
│   ├── config.js          # 游戏配置
│   ├── core/
│   │   └── EventBus.js    # 事件总线
│   ├── game/
│   │   ├── Tile.js        # 图标类
│   │   ├── BoardManager.js # 游戏板管理器
│   │   └── MatchDetector.js # 匹配检测器
│   ├── rendering/
│   │   ├── RenderEngine.js        # 渲染引擎
│   │   └── TileTextureFactory.js  # 纹理工厂
│   ├── input/
│   │   └── InputManager.js        # 输入管理器
│   ├── animation/         # 动画模块（待实现）
│   └── utils/             # 工具模块（待实现）
├── assets/
│   ├── svg/               # SVG 源文件
│   │   ├── ghosts/       # 普通小鬼图标 SVG
│   │   └── special/      # 特殊图标 SVG
│   └── images/            # PNG 资源
│       ├── ghosts/       # 普通小鬼图标 PNG
│       └── special/      # 特殊图标 PNG
└── tests/
    └── unit/
        ├── EventBus.test.js
        ├── BoardManager.test.js
        └── MatchDetector.test.js
```

## 🛠️ 技术栈

- **渲染引擎**: PixiJS v8.14.0
- **开发工具**: Vite v5.0
- **包管理**: npm
- **图像处理**: sharp v0.33.0
- **测试框架**: Node.js 内置 test runner
- **编程语言**: JavaScript (ES6+ Modules)

## 📋 开发计划

### ✅ 第一阶段：基础架构和核心数据结构
- ✅ 项目结构和配置
- ✅ 事件总线系统
- ✅ 图标和游戏板数据结构
- ✅ 匹配检测算法

### ✅ 第二阶段：美术资源准备和 PixiJS 渲染引擎
- ✅ 设计和生成图标资源
- ✅ 实现 PixiJS 渲染引擎基础
- ✅ 实现图标纹理加载和精灵系统
- ✅ 实现输入管理器

### ⏳ 第三阶段：游戏循环和核心逻辑
- ⏳ 实现状态管理器
- ⏳ 实现游戏引擎核心逻辑
- ⏳ 实现消除和分数系统
- ⏳ 实现下落和填充机制

### ⏳ 第四阶段：动画系统
- ⏳ 实现补间动画系统
- ⏳ 实现动画控制器
- ⏳ 集成动画到游戏流程

### ⏳ 第五阶段：UI 和游戏循环
- ⏳ 实现游戏主循环
- ⏳ 实现 UI 渲染
- ⏳ 实现菜单和暂停功能

### ⏳ 第六阶段：计时系统和特殊图标
- ⏳ 实现计时系统
- ⏳ 实现特殊图标系统
- ⏳ 实现可用移动检测和洗牌
- ⏳ 实现游戏结束界面

### ⏳ 第七阶段：优化和完善
- ⏳ 实现错误处理
- ⏳ 实现性能监控和优化
- ⏳ 编写单元测试
- ⏳ 编写集成测试

### ⏳ 第八阶段：测试和打磨
- ⏳ 游戏平衡性调整
- ⏳ 添加音效和粒子效果
- ⏳ 多轮游戏测试

## 🎯 游戏规则

1. 点击一个小鬼图标进行选中
2. 再点击相邻的小鬼图标进行交换
3. 形成三个或更多相同的小鬼连线即可消除
4. 消除后上方的小鬼会下落填充空位
5. 顶部会生成新的小鬼填充
6. 连续消除会触发连锁反应，获得更高分数

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。

---

**当前版本**: v0.2.0 (第二阶段完成)  
**最后更新**: 2024

