# 实现计划

## 第一阶段：基础架构和核心数据结构

- [x] 1. 创建项目结构和配置文件
  - 创建 package.json 定义项目元数据、启动脚本（dev、build、preview、test、build:assets）和依赖（pixi.js: ^8.14.0）、开发依赖（vite: ^5.0.0, sharp: ^0.33.0）
  - 创建 vite.config.js 配置 Vite 开发服务器（端口 5173、自动打开浏览器、PixiJS 预构建优化）
  - 创建资源目录结构（assets/svg/ghosts/、assets/svg/special/、assets/images/ghosts/、assets/images/special/）
  - 运行 `npm install` 安装 PixiJS、Vite 和 svg2png 依赖
  - 创建 index.html 作为游戏入口页面，包含游戏容器 div、基本样式和 `<script type="module" src="/src/main.js">`
  - 创建 src/config.js 定义游戏配置对象（游戏板尺寸、图标类型、动画时长、颜色、分数规则、计时器配置、资源路径等）
  - 创建基本的目录结构（src/core/、src/game/、src/rendering/、src/input/、src/animation/、src/utils/、tests/unit/）
  - 创建 .gitignore 文件（忽略 node_modules、dist、生成的 PNG 等）
  - 验证：运行 `npm run dev` 能启动 Vite 服务器，浏览器自动打开 localhost:5173 能看到 PixiJS 初始化的画布
  - _需求: 1.1, 7.4, 7.6, 7.7, 10.1_

- [x] 2. 实现事件总线系统
  - 创建src/core/EventBus.js实现发布-订阅模式
  - 实现on()、off()、emit()、once()方法
  - 添加事件名称验证和错误处理
  - 定义所有游戏事件常量（参考design.md的事件表格）
  - 验证：编写简单测试确保事件订阅和发布正常工作
  - _需求: 7.2_

- [x] 3. 实现图标和游戏板数据结构
  - 创建src/game/Tile.js定义图标类（type、x、y、id、state属性）
  - 创建src/game/BoardManager.js实现游戏板管理器
  - 实现createBoard()方法生成8x8网格并随机填充5种图标类型
  - 实现getTile()、setTile()、isValidPosition()、isAdjacent()等基础方法
  - 实现ensureNoInitialMatches()方法（使用智能替换算法，最多尝试100次）
  - 实现wouldCreateMatch()辅助方法检查指定位置是否会产生匹配
  - 验证：创建游戏板后检查无初始匹配，所有位置都有图标
  - _需求: 1.1, 1.2, 1.3_

- [x] 4. 实现匹配检测算法
  - 创建src/game/MatchDetector.js实现匹配检测器
  - 定义Match类存储匹配信息（tiles、direction、length）
  - 实现findHorizontalMatches()横向扫描算法（检测连续3个或更多相同类型）
  - 实现findVerticalMatches()纵向扫描算法
  - 实现findMatches()整合横向和纵向匹配结果（去重）
  - 实现checkMatchAtPosition()快速检查指定位置的匹配（用于优化）
  - 验证：使用性能监控确保在10ms内完成8x8棋盘扫描
  - _需求: 3.1, 3.2, 8.5_

## 第二阶段：美术资源准备和PixiJS渲染引擎

- [x] 5. 设计和生成图标资源
  - 创建 scripts/convert-svg.js 脚本，使用 sharp 库实现 SVG 转 PNG 功能（替代过时的 svg2png）
  - 脚本功能：自动扫描 assets/svg/ 目录，转换所有 SVG 为 128x128 PNG，保持透明度
  - 使用 Figma、Illustrator 或其他矢量工具设计 5 种普通小鬼图标 SVG（128x128px，透明背景）
  - 设计 4 种特殊图标 SVG：炸弹、彩色炸弹、横向消除、纵向消除（带特效光晕）
  - 确保所有 SVG 使用透明背景、居中对齐、适当内边距（8-16px）
  - 将 SVG 文件保存到 assets/svg/ghosts/ 和 assets/svg/special/ 目录
  - 运行 `npm run build:assets` 将 SVG 转换为 PNG（128x128）
  - 验证生成的 PNG 文件质量、透明度和边缘抗锯齿
  - 在 assets/images/ 目录创建 .gitkeep 文件保留目录结构
  - 添加转换失败的错误处理、重试机制（最多3次）和详细提示
  - sharp 优势：高性能、跨平台兼容、活跃维护
  - _需求: 1.4, 1.6, 6.1, 9.4_

- [x] 6. 实现 PixiJS 渲染引擎基础
  - 创建 src/rendering/RenderEngine.js 实现渲染引擎
  - 在构造函数中接收容器元素、配置和事件总线
  - 实现 init() 初始化 PIXI.Application（设置宽高、背景色、抗锯齿、分辨率）
  - 将 PixiJS canvas 挂载到指定的 DOM 容器
  - 创建场景图层次结构（backgroundLayer、boardLayer、effectLayer、uiLayer）使用 PIXI.Container
  - 实现 createBackground() 使用 PIXI.Graphics 绘制游戏板背景网格和边框
  - 实现 gridToScreen() 和 screenToGrid() 坐标转换工具函数
  - 实现 resize() 方法监听窗口大小变化并调整 PixiJS 应用
  - 验证：浏览器中能看到 PixiJS 渲染的背景网格，调整窗口大小能自适应
  - _需求: 1.4, 9.5_

- [x] 7. 实现图标纹理加载和精灵系统
  - 创建 src/rendering/TileTextureFactory.js 实现图标纹理工厂
  - 实现 init() 方法使用 PIXI.Assets.load() 批量加载所有 PNG 资源（使用 Vite 的绝对路径 /assets/images/...）
  - 定义资源清单（普通图标 5 个 + 特殊图标 4 个）
  - 实现纹理缓存机制（Map 存储，避免重复加载）
  - 实现 getTexture(key) 方法获取缓存的纹理，添加错误处理和重试机制（最多3次，每次间隔递增）
  - 实现 hasTexture(key) 方法检查纹理是否存在
  - 在 RenderEngine 中实现 createTileSprite(tile) 创建图标精灵（设置 anchor、size、position、eventMode）
  - 实现 updateTileSprite(sprite, tile) 更新精灵位置和状态
  - 实现 renderBoard(board) 遍历游戏板并创建所有图标精灵，添加到 boardLayer
  - 实现选中状态的高亮效果（使用 PIXI.Graphics 绘制边框，添加到 effectLayer）
  - 添加加载进度显示（使用 onProgress 回调，显示百分比）
  - 添加资源加载失败的错误处理、重试机制和用户友好的错误提示
  - 验证：游戏板上能看到 5 种不同的小鬼图标精灵，点击能看到高亮边框，加载进度正确显示
  - _需求: 1.6, 6.1, 9.4_

- [x] 8. 实现输入管理器（基于 PixiJS 事件系统）
  - 创建 src/input/InputManager.js 实现输入管理器
  - 在构造函数中接收 PixiJS 应用、配置和事件总线
  - 为每个图标精灵设置 eventMode='static' 和 cursor='pointer'（PixiJS v8 新 API）
  - 使用 PixiJS 的 pointerdown 事件监听图标点击
  - 实现图标选中逻辑（第一次点击选中，第二次点击尝试交换）
  - 检查两个图标是否相邻（水平或垂直）
  - 通过事件总线发布 tile:select、tile:deselect 和 tile:swap:start 事件
  - 实现输入启用/禁用功能（订阅 input:enabled 和 input:disabled 事件）
  - 添加悬停效果（可选，使用 pointerover 和 pointerout 事件）
  - 验证：点击图标能看到选中高亮，点击相邻图标触发交换事件，点击不相邻图标取消选中
  - _需求: 2.1, 2.2, 2.3, 2.4_

- [x] 9. 实现游戏板交换逻辑
  - 在BoardManager中实现isAdjacent()检查两个位置是否相邻（水平或垂直）
  - 实现swapTiles()交换两个图标的位置
  - 在交换后检测是否产生匹配
  - 如果不产生匹配，标记需要交换回原位置
  - _需求: 2.3, 2.4, 2.5_

## 第三阶段：游戏循环和核心逻辑

- [x] 10. 实现状态管理器
  - 创建src/core/StateManager.js实现状态管理器
  - 定义游戏状态常量（MENU、PLAYING、PAUSED、GAME_OVER、ANIMATING）
  - 实现setState()、getCurrentState()方法
  - 实现状态转换验证逻辑canTransition()
  - 通过事件总线发布state:change事件
  - _需求: 5.1, 5.2, 5.3, 5.4_

- [x] 11. 实现游戏引擎核心逻辑
  - 创建src/core/GameEngine.js实现游戏引擎
  - 实现init()初始化游戏（创建游戏板、初始化分数为0）
  - 实现handleSwap()处理交换请求（验证相邻性、执行交换、检测匹配）
  - 实现processMatches()处理匹配消除流程
  - 订阅事件总线的相关事件（tile:select、tile:swap等）
  - _需求: 1.5, 2.3, 3.1_

- [x] 12. 实现消除和分数系统
  - 在BoardManager中实现removeTiles()移除指定位置的图标
  - 在GameEngine中实现calculateScore()方法
  - 实现分数计算公式：基础分数 × 连锁倍数 + 额外奖励
  - 连锁倍数公式：multiplier = 1.5 ^ (comboCount - 1)
  - 4连额外20分，5连及以上额外50分
  - 通过事件总线发布score:update和combo:trigger事件
  - 验证：测试不同连锁情况的分数计算是否正确
  - _需求: 3.4, 3.5_

- [x] 13. 实现下落和填充机制
  - 在BoardManager中实现applyGravity()使图标向下移动填充空位
  - 实现getEmptyPositions()获取所有空位置
  - 实现fillBoard()在顶部生成新的随机图标填充空位
  - 在下落和填充完成后再次检测匹配（实现连锁反应）
  - _需求: 4.1, 4.3, 4.4, 4.5_

## 第四阶段：动画系统（基于PixiJS + 轻量级补间）

- [x] 14. 实现补间动画系统
  - 创建src/animation/Easing.js定义缓动函数（linear、easeInQuad、easeOutQuad、easeInOutQuad、easeOutBounce）
  - 创建src/animation/Tween.js实现轻量级补间动画类
  - 实现Tween构造函数（target、props、duration、easing）
  - 实现update(deltaTime)方法更新补间进度
  - 支持Promise化的动画完成回调
  - 验证：创建简单的位置补间动画测试
  - _需求: 6.2, 6.3, 6.4_

- [x] 15. 实现动画控制器
  - 创建src/animation/AnimationController.js实现动画控制器
  - 实现animateSwap(sprite1, sprite2, duration)方法，返回Promise
  - 实现animateRemove(sprites, duration)方法（scale到0 + alpha到0）
  - 实现animateFall(sprite, targetY, duration)方法
  - 实现animateSpawn(sprite, duration)方法（从上方弹出）
  - 实现animateSelection(sprite)循环脉冲动画
  - 实现isAnimating()检查是否有动画正在播放
  - 动画开始时发布animation:start事件，完成时发布animation:complete事件
  - 验证：测试各种动画效果是否流畅
  - _需求: 2.5, 6.2, 6.3, 6.4_

- [x] 16. 集成动画到游戏流程
  - 在GameEngine的handleSwap()中使用async/await调用animateSwap()
  - 在processMatches()中使用Promise.all()并行播放消除动画
  - 在下落流程中使用Promise.all()并行播放所有下落动画
  - 在填充流程中使用Promise.all()并行播放所有生成动画
  - 实现动画序列：交换→匹配→消除→下落→生成→检测新匹配（连锁）
  - 确保动画播放期间禁用用户输入（通过状态管理切换到ANIMATING状态）
  - 验证：完整的交换-消除-下落-填充流程动画流畅无卡顿
  - _需求: 4.2, 6.3, 6.4_

## 第五阶段：UI和游戏循环

- [x] 17. 实现游戏主循环（基于 PixiJS Ticker）
  - 在 src/main.js 中实现游戏入口（从 npm 导入 PixiJS：`import * as PIXI from 'pixi.js'`）
  - 创建 Game 类封装游戏初始化和生命周期管理
  - 实现 async init() 方法初始化所有模块（EventBus、GameEngine、RenderEngine、InputManager）
  - 等待 RenderEngine 和 TileTextureFactory 的资源加载完成
  - 使用 PIXI.Application 的 ticker 实现游戏循环
  - 在 ticker 回调中调用 GameEngine.update(deltaTime)，deltaTime = ticker.deltaMS / 1000
  - AnimationController 在每帧更新所有补间动画
  - 添加性能监控（可选，显示 FPS：ticker.FPS）
  - 实现错误处理（try-catch 包裹初始化逻辑）
  - 导出 game 实例到 window（便于调试）
  - 验证：游戏循环稳定运行，FPS 达到 60，控制台无错误
  - _需求: 8.1, 8.3_

- [x] 18. 实现 UI 渲染（使用 PixiJS Text 和 Graphics）
  - 在 RenderEngine 中实现 createUI() 方法
  - 使用 PIXI.Text 创建分数文本显示（字体、颜色、位置、对齐方式）
  - 使用 PIXI.Text 创建计时器文本显示（位置在右上角）
  - 实现 updateScore(score) 方法更新分数显示
  - 实现 updateTimer(time) 方法更新计时器显示（格式化为 MM:SS）
  - 实现分数变化的动画提示效果（使用补间动画缩放文本或显示 +分数 浮动文本）
  - 使用 PIXI.Graphics 绘制按钮背景（圆角矩形）
  - 使用 PIXI.Text 添加按钮文字（开始、暂停、重新开始）
  - 将按钮背景和文字组合到 PIXI.Container 中
  - 为按钮添加交互事件（eventMode='static'、pointerdown、pointerover、pointerout）
  - 实现按钮的悬停和点击视觉反馈（颜色变化、缩放效果）
  - 订阅事件总线的 score:update 和 timer:update 事件自动更新 UI
  - 验证：UI 元素正确显示，按钮可点击，分数和计时器实时更新
  - _需求: 5.5, 6.5, 9.1, 9.2, 10.2_

- [x] 19. 实现菜单和暂停功能
  - 实现开始菜单界面渲染
  - 实现暂停菜单界面渲染
  - 在InputManager中添加键盘事件监听（ESC键暂停）
  - 实现GameEngine的pause()、resume()、reset()方法
  - 在暂停状态下禁用游戏输入
  - _需求: 5.1, 5.4, 5.5_

## 第六阶段：计时系统和特殊图标

- [x] 20. 实现计时系统
  - 在GameEngine中添加计时器管理（remainingTime、isTimerRunning）
  - 实现startTimer()启动倒计时（默认60秒）
  - 实现pauseTimer()和resumeTimer()方法
  - 在update()中每帧减少remainingTime
  - 当remainingTime <= 0时触发游戏结束
  - 通过事件总线发布timer:update事件
  - 在RenderEngine中订阅timer:update，更新计时器显示
  - 实现剩余时间<10秒时的红色警告效果
  - 验证：计时器正确倒计时，时间到游戏结束
  - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 21. 实现特殊图标数据结构
  - 扩展Tile类添加isSpecial和specialType属性
  - 定义特殊图标类型常量（BOMB、COLOR_BOMB、ROW_CLEAR、COL_CLEAR）
  - 在TileTextureFactory中为特殊图标创建独特的纹理（添加特效、光晕等）
  - 在BoardManager中实现createSpecialTile()方法
  - 验证：能创建和渲染特殊图标
  - _需求: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 22. 实现特殊图标生成逻辑
  - 在GameEngine的processMatches()中检测匹配长度
  - 4连匹配：在匹配中心位置生成BOMB图标
  - 5连匹配：在匹配中心位置生成COLOR_BOMB图标
  - L型或T型匹配：在交叉位置生成ROW_CLEAR或COL_CLEAR图标
  - 特殊图标不参与本次消除，保留到游戏板上
  - 验证：形成4连或5连时正确生成特殊图标
  - _需求: 11.1, 11.3, 11.5_

- [x] 23. 实现特殊图标激活效果
  - 在MatchDetector中实现detectSpecialTileActivation()方法
  - BOMB激活：返回周围3x3范围内的所有图标位置
  - COLOR_BOMB激活：返回游戏板上所有与交换图标相同类型的位置
  - ROW_CLEAR激活：返回整行图标位置
  - COL_CLEAR激活：返回整列图标位置
  - 在GameEngine中处理特殊图标激活，消除对应位置的图标
  - 实现特殊图标组合效果（两个特殊图标交换）
  - 为特殊图标消除添加额外分数奖励（2-5倍）
  - 在RenderEngine中为特殊图标激活添加特殊视觉效果（粒子、闪光等）
  - 验证：特殊图标激活效果正确，视觉效果震撼
  - _需求: 11.2, 11.4, 11.6, 11.7, 11.8, 11.9, 11.10_

- [x] 24. 实现可用移动检测和洗牌
  - 在MatchDetector中实现hasValidMoves()方法（优化版本，提前终止 + 缓存）
  - 只检查右侧和下方的交换（避免重复检查）
  - 使用checkMatchAtPosition()快速检查，不扫描整个棋盘
  - 找到一个有效移动立即返回true（提前终止优化）
  - 实现缓存机制：使用getBoardHash()生成棋盘哈希值，避免重复计算
  - 在棋盘变化时清除缓存（clearCache()）
  - 在每次下落填充完成后调用检测
  - 当检测到无可用移动时，延迟2秒后自动洗牌
  - 在BoardManager中实现shuffleBoard()洗牌算法（保持分数和时间不变）
  - 显示"重新洗牌"提示动画
  - 验证：无可用移动时自动洗牌，洗牌后有可用移动，缓存机制正常工作
  - _需求: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 25. 实现游戏结束界面
  - 在RenderEngine中实现createGameOverUI()方法
  - 使用PIXI.Graphics创建半透明遮罩层
  - 显示"游戏结束"文本、最终分数、游戏时长
  - 创建"重新开始"按钮
  - 实现重新开始功能（重置游戏板、分数、计时器）
  - 验证：时间到或无可用移动时显示游戏结束界面
  - _需求: 10.5_

- [x] 26. 实现响应式布局
  - 在RenderEngine中实现resize()方法
  - 监听window resize事件自动调整PixiJS应用大小
  - 根据屏幕尺寸动态计算图标大小和间距
  - 重新定位所有UI元素
  - 确保游戏在不同屏幕尺寸下正确显示
  - 验证：调整浏览器窗口大小，游戏界面自适应
  - _需求: 9.5_

## 第七阶段：优化和完善

- [x] 27. 实现错误处理
  - 创建src/utils/ErrorHandler.js实现错误处理器
  - 定义GameError类和错误类型常量
  - 在关键模块中添加try-catch错误捕获
  - 实现PixiJS上下文丢失的恢复机制
  - 添加配置验证逻辑
  - 在界面上显示友好的错误提示
  - 验证：模拟各种错误场景，确保不会崩溃
  - _需求: 7.3_

- [x] 28. 实现性能监控和优化
  - 创建src/utils/PerformanceMonitor.js实现性能监控器
  - 监控FPS和帧时间（使用PixiJS的ticker.FPS）
  - 在开发模式下显示性能指标（使用PIXI.Text显示在右上角）
  - 实现对象池优化：复用Tween对象和精灵对象
  - 优化纹理生成：确保每种图标类型只生成一次纹理
  - 使用PixiJS的culling优化：不渲染屏幕外的对象
  - 验证：确保达到60fps的性能目标，内存使用稳定
  - _需求: 8.1, 8.2, 8.4_

- [x] 29. 编写单元测试
  - 创建tests/unit/目录和测试文件
  - 为BoardManager编写测试（目标覆盖率：80%+）：
    * 创建8x8游戏板验证
    * 初始化后无匹配
    * 交换相邻和不相邻图标
    * 边界情况测试
    * 重力应用和下落逻辑
  - 为MatchDetector编写测试（目标覆盖率：80%+）：
    * 横向3连、4连、5连匹配
    * 纵向3连、4连、5连匹配
    * L型和T型重叠匹配
    * 无匹配情况
    * hasValidMoves准确性
    * 缓存机制验证
  - 为EventBus编写测试（目标覆盖率：80%+）：
    * 订阅和发布
    * 取消订阅
    * once一次性订阅
    * 多订阅者
    * 错误处理
  - 为SpecialTileManager编写测试（目标覆盖率：70%+）：
    * 4连生成炸弹
    * 5连生成彩色炸弹
    * L型/T型生成横向/纵向消除
    * 特殊图标激活效果
    * 特殊图标组合效果
  - 为GameEngine编写测试（目标覆盖率：60%+）：
    * 分数计算逻辑
    * 连锁倍数计算
    * 计时器逻辑
  - 使用Node.js内置test runner运行：`npm test`
  - 总体目标覆盖率：40-50%（核心逻辑高覆盖，渲染动画手动测试）
  - 验证：所有测试通过，覆盖率达标
  - _需求: 7.1, 7.3_

- [x] 30. 编写集成测试
  - 创建tests/integration.test.js
  - 测试完整的交换-匹配-消除-下落流程：
    * 模拟玩家交换
    * 验证匹配检测
    * 验证消除和分数增加
    * 验证下落和填充
  - 测试连锁反应：
    * 设置会产生连锁的棋盘
    * 验证连锁自动触发
    * 验证分数倍数计算正确
  - 测试状态转换：
    * 验证MENU→PLAYING→PAUSED→PLAYING流程
    * 验证动画期间状态为ANIMATING
  - 测试无可用移动：
    * 设置无可用移动的棋盘
    * 验证检测正确
    * 验证洗牌或游戏结束
  - 测试错误场景：
    * 无效的交换请求
    * 越界访问
    * Canvas上下文丢失
  - _需求: 7.1, 7.3_

## 第八阶段：测试和打磨

- [ ] 31. 编写单元测试
  - 创建tests/unit/目录和测试文件
  - 为BoardManager编写测试：创建游戏板、初始化无匹配、交换图标、边界情况
  - 为MatchDetector编写测试：横向/纵向匹配、L型/T型匹配、hasValidMoves准确性
  - 为EventBus编写测试：订阅/发布、取消订阅、once一次性订阅
  - 为特殊图标系统编写测试：生成逻辑、激活效果、组合效果
  - 使用Node.js内置test runner运行：`npm test`
  - 目标覆盖率：50%（重点测试核心逻辑，渲染和动画主要靠手动测试）
  - 验证：所有测试通过
  - _需求: 7.1, 7.3_

- [ ] 32. 编写集成测试和端到端测试
  - 测试完整的交换-匹配-消除-下落流程
  - 测试连锁反应和分数计算
  - 测试特殊图标生成和激活
  - 测试计时系统和游戏结束
  - 测试无可用移动和洗牌
  - 测试状态转换和错误场景
  - 验证：所有核心功能正常工作
  - _需求: 7.1, 7.3_

- [ ] 33. 游戏平衡性调整和打磨
  - 调整计时器时长（测试60秒、90秒、120秒哪个更合适）
  - 调整特殊图标生成频率和效果强度
  - 调整分数计算公式，确保游戏有挑战性但不过于困难
  - 优化动画时长和缓动函数，确保游戏节奏流畅
  - 添加音效（可选，如果时间允许）
  - 添加粒子效果和视觉特效（使用PixiJS的ParticleContainer）
  - 进行多轮游戏测试，收集反馈并调整
  - _需求: 所有需求_
