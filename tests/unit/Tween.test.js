/**
 * Tween 补间动画测试
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Tween } from '../../src/animation/Tween.js';

describe('Tween', () => {
  let target;

  beforeEach(() => {
    // 创建一个模拟的精灵对象
    target = {
      x: 0,
      y: 0,
      alpha: 1,
      scale: {
        x: 1,
        y: 1
      }
    };
  });

  describe('简单属性动画', () => {
    it('应该能够补间简单属性', () => {
      const tween = new Tween(target, { x: 100, y: 200 }, 1000);
      
      // 更新到 50% 进度
      tween.update(500);
      
      assert.ok(Math.abs(target.x - 50) < 1, `target.x 应该接近 50，实际值: ${target.x}`);
      assert.ok(Math.abs(target.y - 100) < 1, `target.y 应该接近 100，实际值: ${target.y}`);
      assert.strictEqual(tween.isComplete, false);
    });

    it('应该在动画完成时设置精确的最终值', () => {
      const tween = new Tween(target, { x: 100, alpha: 0.5 }, 1000);
      
      // 更新到 100% 进度
      tween.update(1000);
      
      assert.strictEqual(target.x, 100);
      assert.strictEqual(target.alpha, 0.5);
      assert.strictEqual(tween.isComplete, true);
    });
  });

  describe('嵌套属性动画', () => {
    it('应该能够补间嵌套属性 (scale.x)', () => {
      const tween = new Tween(target, { 'scale.x': 2, 'scale.y': 2 }, 1000);
      
      // 更新到 50% 进度
      tween.update(500);
      
      assert.ok(Math.abs(target.scale.x - 1.5) < 0.1, `target.scale.x 应该接近 1.5，实际值: ${target.scale.x}`);
      assert.ok(Math.abs(target.scale.y - 1.5) < 0.1, `target.scale.y 应该接近 1.5，实际值: ${target.scale.y}`);
      assert.strictEqual(tween.isComplete, false);
    });

    it('应该在嵌套属性动画完成时设置精确的最终值', () => {
      const tween = new Tween(target, { 'scale.x': 0, 'scale.y': 0 }, 1000);
      
      // 更新到 100% 进度
      tween.update(1000);
      
      assert.strictEqual(target.scale.x, 0);
      assert.strictEqual(target.scale.y, 0);
      assert.strictEqual(tween.isComplete, true);
    });

    it('应该能够同时补间简单属性和嵌套属性', () => {
      const tween = new Tween(
        target,
        {
          x: 100,
          alpha: 0,
          'scale.x': 0,
          'scale.y': 0
        },
        1000
      );
      
      // 更新到 50% 进度
      tween.update(500);
      
      assert.ok(Math.abs(target.x - 50) < 1, `target.x 应该接近 50，实际值: ${target.x}`);
      assert.ok(Math.abs(target.alpha - 0.5) < 0.1, `target.alpha 应该接近 0.5，实际值: ${target.alpha}`);
      assert.ok(Math.abs(target.scale.x - 0.5) < 0.1, `target.scale.x 应该接近 0.5，实际值: ${target.scale.x}`);
      assert.ok(Math.abs(target.scale.y - 0.5) < 0.1, `target.scale.y 应该接近 0.5，实际值: ${target.scale.y}`);
    });
  });

  describe('Promise 支持', () => {
    it('应该在动画完成时解析 Promise', async () => {
      const tween = new Tween(target, { x: 100 }, 100);
      
      // 启动动画并等待完成
      const promise = tween.promise;
      tween.update(100);
      
      const result = await promise;
      assert.strictEqual(result, target);
      assert.strictEqual(target.x, 100);
    });

    it('应该在动画停止时拒绝 Promise', async () => {
      const tween = new Tween(target, { x: 100 }, 1000);
      
      const promise = tween.promise;
      tween.stop();
      
      await assert.rejects(promise, /Tween stopped/);
    });
  });

  describe('动画控制', () => {
    it('应该能够暂停和恢复动画', () => {
      const tween = new Tween(target, { x: 100 }, 1000);
      
      // 更新到 25%
      tween.update(250);
      assert.ok(Math.abs(target.x - 25) < 1, `target.x 应该接近 25，实际值: ${target.x}`);
      
      // 暂停
      tween.pause();
      tween.update(250); // 这次更新应该被忽略
      assert.ok(Math.abs(target.x - 25) < 1, `暂停后 target.x 应该保持 25，实际值: ${target.x}`);
      
      // 恢复
      tween.resume();
      tween.update(250);
      assert.ok(Math.abs(target.x - 50) < 1, `恢复后 target.x 应该接近 50，实际值: ${target.x}`);
    });

    it('应该能够跳到结束状态', () => {
      const tween = new Tween(target, { x: 100, 'scale.x': 2 }, 1000);
      
      tween.finish();
      
      assert.strictEqual(target.x, 100);
      assert.strictEqual(target.scale.x, 2);
      assert.strictEqual(tween.isComplete, true);
    });
  });

  describe('错误处理', () => {
    it('应该警告不存在的简单属性', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      new Tween(target, { nonExistent: 100 }, 1000);
      
      assert.ok(
        warnings.some(w => w.includes('目标对象没有属性 "nonExistent"')),
        '应该警告不存在的属性'
      );
      
      console.warn = originalWarn;
    });

    it('应该警告不存在的嵌套属性', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      new Tween(target, { 'scale.z': 100 }, 1000);
      
      assert.ok(
        warnings.some(w => w.includes('目标对象没有属性 "scale.z"')),
        '应该警告不存在的嵌套属性'
      );
      
      console.warn = originalWarn;
    });
  });
});

console.log('✅ Tween 所有测试通过');
