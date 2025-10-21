# 精灵缩放问题修复文档

## 问题描述

用户报告了两个与精灵大小相关的问题：
1. 选中的图标会被放大/缩小
2. 第二次及之后消除补齐的图标会被放大

## 根本原因分析

### 问题根源

PNG 资源的原始尺寸是 **128x128 像素**，但游戏配置中的 `tileSize` 是 **64 像素**。

在原来的 `RenderEngine.createTileSprite` 实现中：

```javascript
// ❌ 错误的做法
sprite.scale.set(1.0);  // 先设置 scale 为 1.0
sprite.width = 64;      // 然后设置 width
sprite.height = 64;     // 然后设置 height
```

**这导致了什么问题？**

1. 当设置 `sprite.width = 64` 时，PixiJS 会自动计算并修改 `scale`
2. 因为纹理是 128x128，要显示为 64x64，PixiJS 会将 scale 设置为 `64/128 = 0.5`
3. 所以精灵的实际 scale 是 **0.5**，而不是我们以为的 1.0

**这就是为什么：**
- 动画从 scale 0 到 1.0 时，精灵会变成 128x128（放大了 2 倍）
- 所有使用硬编码 1.0 的地方都会导致精灵显示为 128x128

### 架构问题

原来的实现混合使用了两种控制大小的方式：
- 通过 `width/height` 属性（会自动修改 scale）
- 通过 `scale` 属性（直接控制缩放）

这种混合使用导致了状态不一致和难以追踪的 bug。

## 解决方案

### 核心原则

**统一使用 `scale` 来控制精灵大小，不再使用 `width/height`**

### 实现细节

#### 1. RenderEngine.createTileSprite

```javascript
// ✅ 正确的做法
const targetSize = this.config.rendering.tileSize;  // 64
const textureSize = Math.max(texture.width, texture.height);  // 128
const correctScale = targetSize / textureSize;  // 0.5

sprite.scale.set(correctScale);  // 设置正确的缩放
sprite.normalScale = correctScale;  // 存储正常缩放值
```

**关键改进：**
- 计算正确的缩放比例：`correctScale = tileSize / textureSize`
- 只使用 `scale` 来控制大小，不再设置 `width/height`
- 将正常缩放值存储在 `sprite.normalScale` 中，供其他模块使用

#### 2. AnimationController

所有动画方法都改为使用 `sprite.normalScale`：

```javascript
// ✅ 使用 normalScale 而不是硬编码的 1.0
const normalScale = sprite.normalScale || 1.0;

// 选中动画
sprite.scale.set(normalScale);

// 生成动画
const tween = new Tween(sprite, {
  'scale.x': normalScale,
  'scale.y': normalScale,
  alpha: 1.0
}, duration, 'easeOutCubic');

// 停止动画
sprite.scale.set(normalScale);
```

#### 3. main.js 事件处理

所有恢复精灵状态的地方都使用 `normalScale`：

```javascript
// ✅ 下落完成
const normalScale = sprite.normalScale || 1.0;
sprite.scale.set(normalScale);

// ✅ 生成完成
const normalScale = sprite.normalScale || 1.0;
sprite.scale.set(normalScale);

// ✅ 输入启用
const normalScale = sprite.normalScale || 1.0;
sprite.scale.set(normalScale);
```

## 架构优势

### 1. 模块化和解耦

- **RenderEngine**：负责计算和存储正确的缩放值（`normalScale`）
- **AnimationController**：使用 `normalScale` 进行动画，不需要知道纹理的实际尺寸
- **main.js**：使用 `normalScale` 恢复状态，不需要知道计算细节

### 2. 单一数据源

- `sprite.normalScale` 是精灵"正常大小"的唯一数据源
- 所有模块都从这个属性读取，而不是硬编码值
- 如果将来纹理尺寸改变，只需要修改 `createTileSprite` 中的计算逻辑

### 3. 可扩展性

如果将来需要支持不同尺寸的纹理：
- 只需要在 `createTileSprite` 中调整计算逻辑
- 其他模块无需修改

### 4. 防御性编程

所有使用 `normalScale` 的地方都有默认值：
```javascript
const normalScale = sprite.normalScale || 1.0;
```

这确保了即使某个精灵没有 `normalScale` 属性，代码也不会崩溃。

## 修改文件清单

1. **src/rendering/RenderEngine.js**
   - 修改 `createTileSprite` 方法
   - 计算并存储 `normalScale`
   - 移除 `width/height` 设置

2. **src/animation/AnimationController.js**
   - 修改 `animateSelection` 使用 `normalScale`
   - 修改 `stopSelection` 使用 `normalScale`
   - 修改 `animateSpawn` 使用 `normalScale`
   - 修改 `stopAll` 使用 `normalScale`

3. **src/main.js**
   - 修改 `tile:fall:complete` 事件处理
   - 修改 `tile:spawn:complete` 事件处理
   - 修改 `input:enabled` 事件处理

## 测试验证

请测试以下场景：

1. **初始渲染**：所有图标大小一致，为 64x64
2. **选中图标**：只有边框高亮，图标大小不变
3. **第一次消除**：消除动画正常，补齐的图标大小正确
4. **连续消除**：多次连锁后，所有图标大小保持一致
5. **快速操作**：快速点击多个图标，不会出现大小异常

## 技术细节

### PixiJS Sprite 大小控制

PixiJS 提供了两种控制精灵大小的方式：

1. **通过 scale 属性**（推荐）
   ```javascript
   sprite.scale.set(0.5);  // 缩放到原始尺寸的 50%
   ```

2. **通过 width/height 属性**（不推荐混用）
   ```javascript
   sprite.width = 64;   // 设置显示宽度
   sprite.height = 64;  // 设置显示高度
   // 这会自动修改 scale！
   ```

**重要提示**：不要同时使用这两种方式，否则会导致状态不一致。

### 为什么选择 scale

1. **一致性**：动画系统使用 scale 进行补间
2. **精确性**：scale 是相对值，不受纹理尺寸影响
3. **性能**：直接修改 scale 比通过 width/height 更高效

## 总结

这次修复从根本上解决了精灵大小不一致的问题，通过：

1. **统一使用 scale 控制大小**
2. **引入 normalScale 作为单一数据源**
3. **所有模块使用 normalScale 而不是硬编码值**
4. **符合模块化和解耦的架构原则**

这是一个彻底的、非临时补丁的稳定修复。
