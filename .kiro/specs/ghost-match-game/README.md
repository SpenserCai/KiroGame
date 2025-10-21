# 小鬼消消乐 - 设计文档

欢迎查阅小鬼消消乐（Ghost Match Game）的完整设计文档。本项目是一款基于 PixiJS v8.14.0 的浏览器消除类益智游戏。

## 📚 文档目录

### 🚀 快速开始

如果你是第一次接触本项目，建议按以下顺序阅读：

1. **[SUMMARY.md](./SUMMARY.md)** - 项目总览
   - 项目概述和游戏玩法
   - 技术架构和选型理由
   - 开发计划和里程碑
   - 快速开始指南

2. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** ⭐ 推荐
   - 常用命令速查
   - 核心模块API参考
   - 完整事件列表
   - 配置参数说明
   - 常见问题解答

### 📋 需求和设计

3. **[requirements.md](./requirements.md)** - 需求文档
   - 12个功能需求
   - 详细的验收标准
   - 术语表

4. **[design.md](./design.md)** - 设计文档
   - 技术选型详解
   - 系统架构设计
   - 8个核心模块详细说明
   - 数据结构和接口定义
   - 算法实现细节

5. **[event-flow.md](./event-flow.md)** - 事件流程
   - 游戏初始化流程
   - 玩家交换图标流程
   - 匹配消除流程
   - 下落和填充流程
   - 完整的事件交互图

### 🎨 视觉和配置

6. **[visual-design-guide.md](./visual-design-guide.md)** - 视觉设计指南
   - 普通图标设计规范（5种类型）
   - 特殊图标设计规范（4种类型）
   - UI元素设计（分数、计时器、按钮）
   - 动画效果设计
   - 设计工具推荐
   - 导出规范和性能考虑

7. **[config-example.md](./config-example.md)** - 配置示例
   - 完整的配置文件示例
   - 所有配置参数说明
   - 常量定义
   - 配置调整建议

### 🛠️ 实现和部署

8. **[tasks.md](./tasks.md)** - 任务分解
   - 33个详细任务
   - 8个开发阶段
   - 每个任务的验收标准
   - 预计时间和依赖关系

9. **[startup-files.md](./startup-files.md)** - 启动文件
   - package.json 示例
   - vite.config.js 配置
   - index.html 模板
   - main.js 入口文件
   - SVG转PNG脚本（使用sharp）
   - .gitignore 配置

10. **[deployment-guide.md](./deployment-guide.md)** - 部署指南
    - 开发环境设置
    - 生产构建详解
    - 多平台部署（Netlify、Vercel、GitHub Pages、自托管、Docker）
    - 性能优化策略
    - 监控和维护
    - 故障排查

### 📝 更新记录

11. **[CHANGELOG.md](./CHANGELOG.md)** - 更新日志
    - 版本历史
    - 重要修正说明
    - 新增功能列表
    - 影响评估

## 🎯 按需查找

### 我想...

- **快速开始开发** → [SUMMARY.md](./SUMMARY.md) → 快速开始部分
- **查看API文档** → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → 核心模块API
- **了解事件系统** → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → 事件列表 或 [event-flow.md](./event-flow.md)
- **调整游戏参数** → [config-example.md](./config-example.md) 或 [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → 配置参数
- **设计游戏图标** → [visual-design-guide.md](./visual-design-guide.md)
- **部署到生产环境** → [deployment-guide.md](./deployment-guide.md)
- **查看开发任务** → [tasks.md](./tasks.md)
- **了解技术架构** → [design.md](./design.md)
- **查看更新内容** → [CHANGELOG.md](./CHANGELOG.md)

## 📊 项目信息

### 技术栈

- **渲染引擎**: PixiJS v8.14.0（WebGL + Canvas降级）
- **开发工具**: Vite v5.0（开发服务器和构建工具）
- **包管理**: npm
- **模块系统**: ES6+ Modules
- **图像处理**: sharp v0.33.0（SVG转PNG）
- **测试框架**: Node.js内置test runner（v18+）

### 项目规模

- **开发周期**: 约13天（2周）
- **代码量**: 约1500行（预估）
- **文档数量**: 11个核心文档
- **任务数量**: 33个任务，8个阶段
- **测试覆盖率**: 40-50%（核心逻辑80%+）

### 性能目标

- **FPS**: 60帧/秒
- **内存**: <100MB
- **匹配检测**: <5ms（8x8棋盘）
- **加载时间**: <2秒

## 🔗 外部资源

### 官方文档

- [PixiJS官方文档](https://pixijs.com/docs)
- [PixiJS示例](https://pixijs.com/examples)
- [Vite官方文档](https://vitejs.dev/)
- [sharp文档](https://sharp.pixelplumbing.com/)

### 学习资源

- [MDN Web Docs - Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [JavaScript.info](https://javascript.info/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

### 设计灵感

- [Candy Crush](https://www.king.com/game/candycrush) - 经典消除游戏
- [Bejeweled](https://www.ea.com/games/bejeweled) - 宝石消除
- [Puzzle & Dragons](https://www.gunghoonline.com/games/puzzle-dragons/) - 特效动画

## 🤝 贡献指南

### 文档更新

如需更新文档，请：

1. 修改对应的markdown文件
2. 如有必要，更新本README.md的索引

### 版本管理

文档版本遵循语义化版本（Semantic Versioning）：

- **主版本号（Major）**: 不兼容的重大变更
- **次版本号（Minor）**: 向下兼容的功能新增
- **修订号（Patch）**: 向下兼容的问题修正

当前版本：**1.1.0**

## 📞 联系方式

- **项目仓库**: [GitHub](https://github.com/yourusername/ghost-match-game)
- **问题反馈**: [Issues](https://github.com/yourusername/ghost-match-game/issues)
- **讨论区**: [Discussions](https://github.com/yourusername/ghost-match-game/discussions)

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../../LICENSE) 文件。

---

**最后更新**: 2025-10-21  
**文档版本**: 1.1.0  
**项目状态**: ✅ 设计完成，准备开始实现

---

## 🎮 开始你的游戏开发之旅！

选择一个文档开始阅读，或者直接运行：

```bash
npm install
npm run dev
```

祝你开发愉快！🚀
