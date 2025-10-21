/**
 * ParticleEmitter 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock Particle
class MockParticle {
  constructor() {
    this.isAlive = true;
    this.updateCount = 0;
  }

  update(deltaTime) {
    this.updateCount++;
    if (this.updateCount >= 3) {
      this.isAlive = false;
      return true; // 死亡
    }
    return false;
  }

  reset() {
    this.isAlive = false;
    this.updateCount = 0;
  }
}

// 动态导入 ParticleEmitter 类
const { ParticleEmitter } = await import('../../src/rendering/ParticleEmitter.js');

test('ParticleEmitter - 创建发射器', () => {
  const config = { type: 'explosion' };
  const emitter = new ParticleEmitter(config);

  assert.strictEqual(emitter.config, config);
  assert.strictEqual(emitter.particles.length, 0);
  assert.strictEqual(emitter.isActive, true);
  assert.strictEqual(emitter.age, 0);
});

test('ParticleEmitter - 发射粒子', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  const particleFactory = () => new MockParticle();
  emitter.emit(5, particleFactory);

  assert.strictEqual(emitter.particles.length, 5);
});

test('ParticleEmitter - 更新粒子', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  const particleFactory = () => new MockParticle();
  emitter.emit(3, particleFactory);

  // 第一次更新
  let isDead = emitter.update(0.1);
  assert.strictEqual(isDead, false);
  assert.strictEqual(emitter.particles.length, 3);
  assert.strictEqual(emitter.age, 0.1);

  // 第二次更新
  isDead = emitter.update(0.1);
  assert.strictEqual(isDead, false);
  assert.strictEqual(emitter.particles.length, 3);

  // 第三次更新（粒子开始死亡）
  isDead = emitter.update(0.1);
  assert.strictEqual(isDead, true);
  assert.strictEqual(emitter.particles.length, 0);
  assert.strictEqual(emitter.isActive, false);
});

test('ParticleEmitter - 移除死亡粒子', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  // 创建一个立即死亡的粒子
  const deadParticle = {
    update: () => true,
    reset: () => {}
  };

  emitter.particles.push(deadParticle);
  emitter.update(0.1);

  assert.strictEqual(emitter.particles.length, 0);
});

test('ParticleEmitter - 销毁发射器', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  const particleFactory = () => new MockParticle();
  emitter.emit(5, particleFactory);

  emitter.destroy();

  assert.strictEqual(emitter.particles.length, 0);
  assert.strictEqual(emitter.isActive, false);
});

test('ParticleEmitter - 获取活跃粒子数量', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  assert.strictEqual(emitter.getActiveCount(), 0);

  const particleFactory = () => new MockParticle();
  emitter.emit(10, particleFactory);

  assert.strictEqual(emitter.getActiveCount(), 10);
});

test('ParticleEmitter - 空发射器更新', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  const isDead = emitter.update(0.1);

  assert.strictEqual(isDead, true);
  assert.strictEqual(emitter.isActive, false);
});

test('ParticleEmitter - 粒子工厂返回 null', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  const particleFactory = () => null;
  emitter.emit(5, particleFactory);

  assert.strictEqual(emitter.particles.length, 0);
});

test('ParticleEmitter - 累积年龄', () => {
  const emitter = new ParticleEmitter({ type: 'test' });

  // 添加一些粒子，这样发射器不会立即变为不活跃
  const particleFactory = () => new MockParticle();
  emitter.emit(5, particleFactory);

  emitter.update(0.1);
  assert.ok(Math.abs(emitter.age - 0.1) < 0.001);

  emitter.update(0.2);
  assert.ok(Math.abs(emitter.age - 0.3) < 0.001);

  emitter.update(0.5);
  assert.ok(Math.abs(emitter.age - 0.8) < 0.001);
});
