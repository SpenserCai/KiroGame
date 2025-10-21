/**
 * Particle 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock PIXI.Sprite
class MockSprite {
  constructor() {
    this.position = { 
      x: 0, 
      y: 0,
      set: function(x, y) { this.x = x; this.y = y; }
    };
    this.x = 0;
    this.y = 0;
    this.scale = { x: 1, y: 1, set: function(value) { this.x = value; this.y = value; } };
    this.alpha = 1;
    this.tint = 0xFFFFFF;
    this.visible = true;
  }
}

// 动态导入 Particle 类
const { Particle } = await import('../../src/rendering/Particle.js');

test('Particle - 创建粒子', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  assert.strictEqual(particle.sprite, sprite);
  assert.strictEqual(particle.velocity.x, 0);
  assert.strictEqual(particle.velocity.y, 0);
  assert.strictEqual(particle.lifetime, 1.0);
  assert.strictEqual(particle.age, 0);
  assert.strictEqual(particle.isAlive, true);
});

test('Particle - 初始化粒子', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 100,
    y: 200,
    velocityX: 50,
    velocityY: -100,
    accelerationX: 10,
    accelerationY: 200,
    lifetime: 0.5,
    scale: 1.5,
    alpha: 0.8,
    tint: 0xFF0000
  });

  assert.strictEqual(sprite.position.x, 100);
  assert.strictEqual(sprite.position.y, 200);
  assert.strictEqual(particle.velocity.x, 50);
  assert.strictEqual(particle.velocity.y, -100);
  assert.strictEqual(particle.acceleration.x, 10);
  assert.strictEqual(particle.acceleration.y, 200);
  assert.strictEqual(particle.lifetime, 0.5);
  assert.strictEqual(particle.initialScale, 1.5);
  assert.strictEqual(particle.initialAlpha, 0.8);
  assert.strictEqual(sprite.tint, 0xFF0000);
  assert.strictEqual(particle.isAlive, true);
});

test('Particle - 更新粒子位置', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 100,
    velocityY: 50,
    accelerationX: 0,
    accelerationY: 0,
    lifetime: 1.0,
    scale: 1.0,
    alpha: 1.0
  });

  // 更新 0.1 秒
  const isDead = particle.update(0.1);

  assert.strictEqual(isDead, false);
  assert.strictEqual(sprite.x, 10); // 100 * 0.1
  assert.strictEqual(sprite.y, 5);  // 50 * 0.1
  assert.strictEqual(particle.age, 0.1);
});

test('Particle - 应用加速度', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 100,
    accelerationY: 200,
    lifetime: 1.0,
    scale: 1.0,
    alpha: 1.0
  });

  // 更新 0.1 秒
  particle.update(0.1);

  // 速度应该增加
  assert.strictEqual(particle.velocity.x, 10);  // 100 * 0.1
  assert.strictEqual(particle.velocity.y, 20);  // 200 * 0.1
});

test('Particle - 透明度衰减', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    lifetime: 1.0,
    scale: 1.0,
    alpha: 1.0
  });

  // 更新到生命周期的一半
  particle.update(0.5);

  // 透明度应该衰减到 0.5
  assert.strictEqual(sprite.alpha, 0.5);
});

test('Particle - 缩放衰减', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    lifetime: 1.0,
    scale: 1.0,
    alpha: 1.0
  });

  // 更新到生命周期的一半
  particle.update(0.5);

  // 缩放应该衰减（1 - 0.5 * 0.8 = 0.6）
  assert.strictEqual(sprite.scale.x, 0.6);
  assert.strictEqual(sprite.scale.y, 0.6);
});

test('Particle - 生命周期结束', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    lifetime: 0.5,
    scale: 1.0,
    alpha: 1.0
  });

  // 更新到生命周期结束
  const isDead = particle.update(0.6);

  assert.strictEqual(isDead, true);
  assert.strictEqual(particle.isAlive, false);
  assert.strictEqual(sprite.visible, false);
});

test('Particle - 重置粒子', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 100,
    y: 200,
    velocityX: 50,
    velocityY: -100,
    accelerationX: 10,
    accelerationY: 200,
    lifetime: 0.5,
    scale: 1.5,
    alpha: 0.8
  });

  particle.update(0.1);
  particle.reset();

  assert.strictEqual(sprite.visible, false);
  assert.strictEqual(particle.velocity.x, 0);
  assert.strictEqual(particle.velocity.y, 0);
  assert.strictEqual(particle.age, 0);
  assert.strictEqual(particle.isAlive, false);
});

test('Particle - 多次更新', () => {
  const sprite = new MockSprite();
  const particle = new Particle(sprite);

  particle.init({
    x: 0,
    y: 0,
    velocityX: 100,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 100,
    lifetime: 1.0,
    scale: 1.0,
    alpha: 1.0
  });

  // 第一次更新
  particle.update(0.1);
  assert.strictEqual(sprite.x, 10);
  // 速度先更新：velocityY = 0 + 100*0.1 = 10
  // 位置再更新：y = 0 + 10*0.1 = 1
  assert.strictEqual(sprite.y, 1);
  assert.strictEqual(particle.velocity.y, 10);

  // 第二次更新
  particle.update(0.1);
  assert.strictEqual(sprite.x, 20);
  // 速度先更新：velocityY = 10 + 100*0.1 = 20
  // 位置再更新：y = 1 + 20*0.1 = 3
  assert.strictEqual(sprite.y, 3);
  assert.strictEqual(particle.velocity.y, 20);
});
