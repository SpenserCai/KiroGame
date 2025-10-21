# 事件流程图

本文档详细描述小鬼消消乐游戏中各个模块之间的事件交互流程。

## 游戏初始化流程

```
main.js
  └─> GameEngine.init()
       ├─> BoardManager.createBoard()
       │    └─> BoardManager.ensureNoInitialMatches()
       ├─> emit('game:init', { board, config })
       │    └─> RenderEngine 订阅 → 初始化Canvas
       └─> StateManager.setState('MENU')
            └─> emit('state:change', { from: null, to: 'MENU' })
                 └─> RenderEngine 订阅 → 渲染菜单界面
```

## 玩家交换图标流程

```
用户点击图标
  └─> InputManager.handleClick()
       ├─> 第一次点击
       │    └─> emit('tile:select', { tile, position })
       │         └─> RenderEngine 订阅 → 绘制高亮边框
       │
       └─> 第二次点击
            ├─> 检查是否相邻
            │    ├─> 不相邻
            │    │    └─> emit('tile:deselect', { tile })
            │    │         └─> RenderEngine 订阅 → 移除高亮
            │    │
            │    └─> 相邻
            │         └─> emit('tile:swap:start', { tile1, tile2 })
            │              └─> GameEngine 订阅 → handleSwap()
            │                   ├─> StateManager.setState('ANIMATING')
            │                   │    └─> emit('input:disabled')
            │                   │         └─> InputManager 订阅 → 禁用输入
            │                   │
            │                   ├─> BoardManager.swapTiles()
            │                   │
            │                   ├─> AnimationController.addAnimation(SwapAnimation)
            │                   │    └─> emit('animation:start')
            │                   │
            │                   └─> 动画完成后
            │                        └─> emit('tile:swap:complete', { tile1, tile2, hasMatch })
            │                             └─> GameEngine 订阅
            │                                  ├─> 有匹配 → processMatches()
            │                                  └─> 无匹配 → 交换回退
            │                                       └─> emit('tile:swap:revert')
            │                                            └─> AnimationController 订阅 → 播放回退动画
```

## 匹配消除流程

```
GameEngine.processMatches()
  ├─> MatchDetector.findMatches(board)
  │
  ├─> emit('match:found', { matches, totalTiles })
  │    └─> RenderEngine 订阅 → 高亮匹配的图标
  │
  ├─> 创建消除动画时间线
  │    └─> AnimationTimeline.addPhase(removeAnimations)
  │         ├─> emit('tile:remove:start', { tiles })
  │         │
  │         └─> 动画完成后
  │              └─> emit('tile:remove:complete', { tiles })
  │                   └─> GameEngine 订阅
  │                        ├─> BoardManager.removeTiles()
  │                        ├─> calculateScore(matches, comboCount)
  │                        ├─> emit('score:update', { score, delta, combo })
  │                        │    └─> RenderEngine 订阅 → 更新分数显示
  │                        │
  │                        └─> 如果是连锁
  │                             └─> emit('combo:trigger', { comboCount, multiplier })
  │                                  └─> RenderEngine 订阅 → 显示连锁特效
  │
  └─> 继续下落流程
```

## 下落和填充流程

```
GameEngine (消除完成后)
  ├─> BoardManager.applyGravity()
  │    └─> 计算所有图标的下落路径
  │
  ├─> emit('tile:fall:start', { movements })
  │    └─> AnimationTimeline.addPhase(fallAnimations)
  │         └─> 动画完成后
  │              └─> emit('tile:fall:complete')
  │
  ├─> BoardManager.fillBoard()
  │    └─> 在顶部生成新图标
  │
  ├─> emit('tile:spawn:start', { tiles })
  │    └─> AnimationTimeline.addPhase(spawnAnimations)
  │         └─> 动画完成后
  │              └─> emit('tile:spawn:complete')
  │                   └─> GameEngine 订阅
  │                        ├─> MatchDetector.findMatches()
  │                        │    ├─> 有新匹配 → 回到消除流程（连锁）
  │                        │    └─> 无新匹配 → 游戏板稳定
  │                        │
  │                        └─> emit('board:stable')
  │                             └─> GameEngine 订阅
  │                                  ├─> StateManager.setState('PLAYING')
  │                                  ├─> emit('input:enabled')
  │                                  │    └─> InputManager 订阅 → 启用输入
  │                                  │
  │                                  └─> MatchDetector.hasValidMoves()
  │                                       ├─> 有可用移动 → 等待玩家操作
  │                                       └─> 无可用移动
  │                                            └─> emit('moves:none')
  │                                                 └─> GameEngine 订阅
  │                                                      ├─> 选项1：自动洗牌
  │                                                      │    └─> emit('board:shuffle')
  │                                                      │         └─> BoardManager.shuffleBoard()
  │                                                      │
  │                                                      └─> 选项2：游戏结束
  │                                                           └─> emit('game:over', { reason, finalScore })
  │                                                                └─> StateManager.setState('GAME_OVER')
```

## 动画系统事件流

```
AnimationController
  ├─> addAnimation(animation)
  │    └─> emit('animation:start', { type, duration })
  │         └─> RenderEngine 订阅 → 设置isAnimating=true
  │
  ├─> update(deltaTime) [每帧调用]
  │    ├─> 更新所有动画进度
  │    └─> 动画完成时
  │         └─> emit('animation:complete', { type })
  │              └─> 触发onComplete回调
  │
  └─> 队列清空时
       └─> emit('animation:queue:empty')
            └─> RenderEngine 订阅 → 设置isAnimating=false
```

## 状态管理事件流

```
StateManager.setState(newState)
  ├─> 验证状态转换是否合法
  │
  ├─> emit('state:change', { from: oldState, to: newState })
  │    └─> 所有模块订阅
  │         ├─> RenderEngine → 根据状态渲染不同界面
  │         ├─> InputManager → 根据状态启用/禁用输入
  │         └─> GameEngine → 根据状态执行不同逻辑
  │
  └─> 状态特定事件
       ├─> MENU → emit('game:start') [玩家点击开始]
       ├─> PLAYING → emit('input:enabled')
       ├─> PAUSED → emit('input:disabled')
       ├─> ANIMATING → emit('input:disabled')
       └─> GAME_OVER → emit('game:over')
```

## 错误处理事件流

```
任何模块发生错误
  └─> emit('error', { type, message, error })
       └─> ErrorHandler 订阅
            ├─> 记录错误日志
            ├─> 根据错误类型决定处理策略
            │    ├─> INIT_ERROR → 显示错误提示，阻止游戏启动
            │    ├─> LOGIC_ERROR → 尝试恢复游戏状态
            │    └─> RENDER_ERROR → 尝试重新初始化渲染器
            │
            └─> 严重错误时
                 └─> StateManager.setState('ERROR')
                      └─> 显示错误界面和重启选项
```

## 性能监控事件流

```
PerformanceMonitor.update() [每帧调用]
  ├─> 计算FPS和帧时间
  │
  └─> 如果性能低于阈值
       └─> emit('performance:warning', { fps, frameTime })
            └─> GameEngine 订阅
                 ├─> 降低动画质量
                 ├─> 减少粒子效果
                 └─> 记录性能日志
```

## 完整游戏循环事件流

```
main.js
  └─> requestAnimationFrame(gameLoop)
       ├─> 计算deltaTime
       │
       ├─> GameEngine.update(deltaTime)
       │    ├─> AnimationController.update(deltaTime)
       │    │    └─> 触发各种animation:complete事件
       │    │
       │    └─> 根据当前状态执行逻辑
       │
       ├─> RenderEngine.render(gameState)
       │    ├─> 检查isDirty()
       │    ├─> 如果需要重绘
       │    │    ├─> clear()
       │    │    ├─> renderBackground()
       │    │    ├─> renderBoard()
       │    │    └─> renderUI()
       │    └─> 清除脏标记（如果没有动画）
       │
       ├─> PerformanceMonitor.update()
       │
       └─> requestAnimationFrame(gameLoop) [递归]
```

## 事件订阅关系总结

| 模块 | 订阅的事件 | 发布的事件 |
|------|-----------|-----------|
| **GameEngine** | tile:swap:start, tile:swap:complete, tile:remove:complete, tile:spawn:complete, board:stable, moves:none | game:init, match:found, score:update, combo:trigger, game:over |
| **RenderEngine** | game:init, tile:select, tile:deselect, score:update, state:change, animation:start, animation:queue:empty | - |
| **InputManager** | input:enabled, input:disabled, state:change | tile:select, tile:deselect, tile:swap:start |
| **AnimationController** | tile:swap:start, tile:swap:revert, tile:remove:start, tile:fall:start, tile:spawn:start | animation:start, animation:complete, animation:queue:empty |
| **StateManager** | game:start, game:over, moves:none | state:change, input:enabled, input:disabled |
| **BoardManager** | tile:remove:complete, board:shuffle | - |
| **MatchDetector** | - | - |
| **ErrorHandler** | error | - |
| **PerformanceMonitor** | - | performance:warning |

## 关键时序约束

1. **交换动画必须在匹配检测之前完成**
2. **消除动画必须在下落动画之前完成**
3. **下落动画必须在生成动画之前完成**
4. **生成动画完成后才能检测新匹配**
5. **动画播放期间必须禁用用户输入**
6. **状态转换必须是原子操作，不能被中断**
7. **分数更新必须在消除完成后立即触发**
8. **连锁检测必须在每次填充完成后执行**
