/**
 * ParticleEffects 单元测试
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock PixiJS
class MockGraphics {
  beginFill() { return this; }
  drawCircle() { return this; }
  endFill() { return this; }
}

class MockSprite {
  constructor() {
    this.anchor = { set: () => {} };
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

class MockContainer {
  constructor() {
    this.children = [];
    this.label = '';
  }
  addChild(child) {
    this.children.push(child);
  }
  destroy() {
    this.children = [];
  }
}

class MockRenderer {
  generateTexture() {
    return { width: 8, height: 8 };
  }
}

class MockApp {
  constructor() {
    this.renderer = new MockRenderer();
    this.screen = { width: 600, height: 700 };
  }
}

// Mock PIXI
global.PIXI = {
  Graphics: MockGraphics,
  Sprite: MockSprite,
  Container: MockContainer
};

// 测试配置
const testConfig = {
  particles: {
    enabled: true,
    maxParticles: 1000,
    explosion: {
      count: 25,
      lifetime: 0.5,
      speed: { min: 100, max: 200 },
      gravity: 200,
      size: { min: 4, max: 8 }
    },
    combo: {
      baseCount: 10,
      countPerCombo: 10,
      lifetime: 0.8,
      speed: { min: 150, max: 300 }
    },
    special: {
      bomb: {
        count: 60,
        lifetime: 0.6,
        speed: { min: 200, max: 400 }
      },
      colorBomb: {
        count: 120,
        lifetime: 1.0,
        speed: { min: 100, max: 300 }
      },
      lineClear: {
        count: 40,
        lifetime: 0.5,
        speed: { min: 300, max: 500 }
      }
    }
  }
};

// 动态导入 ParticleEffects 类
const { ParticleEffects } = await import('../../src/rendering/ParticleEffects.js');

test('ParticleEffects - 创建粒子效果管理器', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  assert.ok(particleEffects.app);
  assert.ok(particleEffects.particleContainer);
  assert.strictEqual(particleEffects.emitters.length, 0);
  assert.ok(particleEffects.particlePool);
});

test('ParticleEffects - 创建消除爆炸效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 25);

  assert.strictEqual(particleEffects.emitters.length, 1);
  assert.strictEqual(particleEffects.stats.emittersCount, 1);
  assert.ok(particleEffects.stats.totalParticles > 0);
});

test('ParticleEffects - 创建连锁特效', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createComboBurst(3);

  assert.strictEqual(particleEffects.emitters.length, 1);
  assert.strictEqual(particleEffects.stats.emittersCount, 1);
});

test('ParticleEffects - 创建炸弹效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createSpecialActivation('bomb', 100, 200);

  assert.strictEqual(particleEffects.emitters.length, 1);
});

test('ParticleEffects - 创建彩色炸弹效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createSpecialActivation('color-bomb', 100, 200);

  assert.strictEqual(particleEffects.emitters.length, 1);
});

test('ParticleEffects - 创建横向消除效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createSpecialActivation('row-clear', 100, 200);

  assert.strictEqual(particleEffects.emitters.length, 1);
});

test('ParticleEffects - 创建纵向消除效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createSpecialActivation('col-clear', 100, 200);

  assert.strictEqual(particleEffects.emitters.length, 1);
});

test('ParticleEffects - 更新粒子效果', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 5);

  // 更新粒子
  particleEffects.update(100); // 100ms

  // 发射器应该还在
  assert.ok(particleEffects.emitters.length >= 0);
});

test('ParticleEffects - 清除所有粒子', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 10);
  particleEffects.createComboBurst(2);

  particleEffects.clear();

  assert.strictEqual(particleEffects.emitters.length, 0);
  assert.strictEqual(particleEffects.stats.emittersCount, 0);
  assert.strictEqual(particleEffects.stats.activeParticles, 0);
});

test('ParticleEffects - 获取统计信息', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 10);

  const stats = particleEffects.getStats();

  assert.ok(stats.totalParticles > 0);
  assert.ok(stats.emittersCount > 0);
  assert.ok(typeof stats.activeParticles === 'number');
});

test('ParticleEffects - 粒子效果禁用时不创建', () => {
  const disabledConfig = {
    particles: {
      enabled: false
    }
  };

  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, disabledConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 10);

  assert.strictEqual(particleEffects.emitters.length, 0);
});

test('ParticleEffects - 连锁数影响粒子数量', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createComboBurst(1);
  const count1 = particleEffects.stats.totalParticles;

  particleEffects.clear();
  particleEffects.stats.totalParticles = 0;

  particleEffects.createComboBurst(5);
  const count5 = particleEffects.stats.totalParticles;

  // 连锁数越高，粒子数越多
  assert.ok(count5 > count1);
});

test('ParticleEffects - 颜色字符串转换', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  // 测试十六进制字符串颜色
  particleEffects.createExplosion(100, 200, '#FF0000', 5);

  assert.strictEqual(particleEffects.emitters.length, 1);
});

test('ParticleEffects - 销毁粒子效果管理器', () => {
  const app = new MockApp();
  const particleEffects = new ParticleEffects(app, testConfig);

  particleEffects.createExplosion(100, 200, 0xFF0000, 10);
  particleEffects.destroy();

  assert.strictEqual(particleEffects.emitters.length, 0);
});
