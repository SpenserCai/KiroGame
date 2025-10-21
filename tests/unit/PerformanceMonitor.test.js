/**
 * PerformanceMonitor 和 ObjectPool 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { PerformanceMonitor, ObjectPool } from '../../src/utils/PerformanceMonitor.js';

// PerformanceMonitor 测试
test('PerformanceMonitor - 初始化', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  assert.strictEqual(monitor.enabled, true);
  assert.strictEqual(monitor.showFPS, false);
  assert.strictEqual(monitor.fps, 0);
  assert.strictEqual(monitor.totalFrames, 0);
});

test('PerformanceMonitor - 更新性能指标', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  // 模拟60fps（16.67ms每帧）
  monitor.update(16.67);
  
  assert.ok(monitor.fps > 0);
  assert.strictEqual(monitor.totalFrames, 1);
  assert.ok(monitor.frameTime > 0);
});

test('PerformanceMonitor - 计算平均帧时间', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  // 添加多个帧
  for (let i = 0; i < 10; i++) {
    monitor.update(16.67);
  }
  
  assert.ok(monitor.avgFrameTime > 0);
  assert.strictEqual(monitor.frameTimeHistory.length, 10);
});

test('PerformanceMonitor - 限制历史大小', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  monitor.historySize = 5;
  
  // 添加10个帧
  for (let i = 0; i < 10; i++) {
    monitor.update(16.67);
  }
  
  // 历史应该被限制在5个
  assert.strictEqual(monitor.frameTimeHistory.length, 5);
});

test('PerformanceMonitor - 检测掉帧', async () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  monitor.fpsWarningThreshold = 30;
  
  // 第一次调用update会初始化lastTime
  monitor.update(16.67);
  
  // 等待足够长的时间以模拟低FPS
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 第二次调用会计算实际的帧时间（应该>50ms，FPS<20）
  monitor.update(16.67);
  
  // 由于实际帧时间>50ms，FPS应该<20，低于阈值30
  assert.ok(monitor.droppedFrames >= 1);
});

test('PerformanceMonitor - 获取性能指标', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  monitor.update(16.67);
  
  const metrics = monitor.getMetrics();
  
  assert.ok(metrics.fps > 0);
  assert.ok(metrics.frameTime > 0);
  assert.strictEqual(metrics.totalFrames, 1);
  assert.strictEqual(metrics.droppedFrames, 0);
  assert.ok(metrics.uptime >= 0);
});

test('PerformanceMonitor - 重置统计', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  monitor.update(16.67);
  monitor.update(16.67);
  
  assert.strictEqual(monitor.totalFrames, 2);
  
  monitor.reset();
  
  assert.strictEqual(monitor.totalFrames, 0);
  assert.strictEqual(monitor.fps, 0);
  assert.strictEqual(monitor.frameTimeHistory.length, 0);
});

test('PerformanceMonitor - 格式化字节数', () => {
  const config = {
    debug: { enabled: true, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  assert.strictEqual(monitor.formatBytes(0), '0 B');
  assert.strictEqual(monitor.formatBytes(1024), '1 KB');
  assert.strictEqual(monitor.formatBytes(1024 * 1024), '1 MB');
  assert.strictEqual(monitor.formatBytes(1024 * 1024 * 1024), '1 GB');
});

test('PerformanceMonitor - 禁用时不更新', () => {
  const config = {
    debug: { enabled: false, showFPS: false }
  };
  const monitor = new PerformanceMonitor(config);
  
  monitor.update(16.67);
  
  // 禁用时不应该更新
  assert.strictEqual(monitor.totalFrames, 0);
});

// ObjectPool 测试
test('ObjectPool - 创建对象池', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 5);
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 5);
  assert.strictEqual(stats.activeCount, 0);
  assert.strictEqual(stats.totalCount, 5);
});

test('ObjectPool - 获取对象', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 3);
  
  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  
  assert.ok(obj1);
  assert.ok(obj2);
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 1); // 剩余1个
  assert.strictEqual(stats.activeCount, 2); // 活跃2个
});

test('ObjectPool - 释放对象', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 3);
  
  const obj = pool.acquire();
  obj.value = 100;
  
  pool.release(obj);
  
  // 对象应该被重置
  assert.strictEqual(obj.value, 0);
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 3); // 回到池中
  assert.strictEqual(stats.activeCount, 0);
});

test('ObjectPool - 池为空时创建新对象', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 2);
  
  // 获取所有对象
  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  const obj3 = pool.acquire(); // 池为空，应该创建新对象
  
  assert.ok(obj3);
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 0);
  assert.strictEqual(stats.activeCount, 3);
  assert.strictEqual(stats.totalCount, 3);
});

test('ObjectPool - 释放所有活跃对象', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 2);
  
  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  const obj3 = pool.acquire();
  
  obj1.value = 10;
  obj2.value = 20;
  obj3.value = 30;
  
  pool.releaseAll();
  
  // 所有对象应该被重置并回到池中
  assert.strictEqual(obj1.value, 0);
  assert.strictEqual(obj2.value, 0);
  assert.strictEqual(obj3.value, 0);
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 3);
  assert.strictEqual(stats.activeCount, 0);
});

test('ObjectPool - 清空对象池', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 5);
  
  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  
  pool.clear();
  
  const stats = pool.getStats();
  assert.strictEqual(stats.poolSize, 0);
  assert.strictEqual(stats.activeCount, 0);
  assert.strictEqual(stats.totalCount, 0);
});

test('ObjectPool - 释放非活跃对象警告', () => {
  const factory = () => ({ value: 0 });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 2);
  
  const obj = { value: 100 }; // 不是从池中获取的对象
  
  // 不应该抛出异常，但会有警告
  assert.doesNotThrow(() => {
    pool.release(obj);
  });
});

test('ObjectPool - 复用对象', () => {
  const factory = () => ({ value: 0, id: Math.random() });
  const reset = (obj) => { obj.value = 0; };
  
  const pool = new ObjectPool(factory, reset, 1);
  
  const obj1 = pool.acquire();
  const id1 = obj1.id;
  obj1.value = 100;
  
  pool.release(obj1);
  
  const obj2 = pool.acquire();
  const id2 = obj2.id;
  
  // 应该是同一个对象（复用）
  assert.strictEqual(id1, id2);
  assert.strictEqual(obj2.value, 0); // 已被重置
});
