/**
 * 粒子效果管理器 - 管理所有粒子效果
 */

import * as PIXI from 'pixi.js';
import { Particle } from './Particle.js';
import { ParticleEmitter } from './ParticleEmitter.js';
import { ObjectPool } from '../utils/PerformanceMonitor.js';

/**
 * 粒子效果管理器类
 */
export class ParticleEffects {
  /**
   * 创建粒子效果管理器
   * @param {PIXI.Application} app - PixiJS 应用
   * @param {Object} config - 游戏配置
   */
  constructor(app, config) {
    this.app = app;
    this.config = config;

    // 创建粒子容器（使用普通 Container，因为 ParticleContainer 在 v8 中有限制）
    this.particleContainer = new PIXI.Container();
    this.particleContainer.label = 'particleContainer';

    // 发射器列表
    this.emitters = [];

    // 粒子对象池
    this.particlePool = new ObjectPool(
      () => this._createParticleSprite(),
      (particle) => particle.reset(),
      50 // 初始池大小
    );

    // 统计信息
    this.stats = {
      totalParticles: 0,
      activeParticles: 0,
      emittersCount: 0
    };
  }

  /**
   * 创建粒子精灵（内部方法）
   * @private
   */
  _createParticleSprite() {
    // 创建简单的圆形粒子纹理
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(0, 0, 4);
    graphics.endFill();

    const texture = this.app.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);

    // 添加到粒子容器
    this.particleContainer.addChild(sprite);

    // 创建粒子对象
    return new Particle(sprite);
  }

  /**
   * 从对象池获取粒子
   * @private
   */
  _acquireParticle() {
    return this.particlePool.acquire();
  }

  /**
   * 释放粒子到对象池
   * @private
   */
  _releaseParticle(particle) {
    this.particlePool.release(particle);
  }

  /**
   * 创建消除爆炸效果
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string|number} color - 颜色（十六进制字符串或数字）
   * @param {number} count - 粒子数量
   */
  createExplosion(x, y, color, count = 25) {
    if (!this.config.particles?.enabled) return;

    const explosionConfig = this.config.particles.explosion;
    const emitter = new ParticleEmitter({ type: 'explosion' });

    // 转换颜色
    const tint = typeof color === 'string' 
      ? parseInt(color.replace('#', ''), 16) 
      : color;

    // 发射粒子
    emitter.emit(count, () => {
      const particle = this._acquireParticle();

      // 随机方向和速度
      const angle = Math.random() * Math.PI * 2;
      const speed = explosionConfig.speed.min + 
                   Math.random() * (explosionConfig.speed.max - explosionConfig.speed.min);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      // 随机大小
      const size = explosionConfig.size.min + 
                  Math.random() * (explosionConfig.size.max - explosionConfig.size.min);
      const scale = size / 8; // 基础大小是 8px

      particle.init({
        x,
        y,
        velocityX,
        velocityY,
        accelerationX: 0,
        accelerationY: explosionConfig.gravity,
        lifetime: explosionConfig.lifetime,
        scale,
        alpha: 1.0,
        tint
      });

      this.stats.totalParticles++;
      return particle;
    });

    this.emitters.push(emitter);
    this.stats.emittersCount++;
  }

  /**
   * 创建连锁特效
   * @param {number} comboCount - 连锁数
   */
  createComboBurst(comboCount) {
    if (!this.config.particles?.enabled) return;

    const comboConfig = this.config.particles.combo;
    const emitter = new ParticleEmitter({ type: 'combo' });

    // 根据连锁数计算粒子数量
    const count = Math.min(
      comboConfig.baseCount + (comboCount - 1) * comboConfig.countPerCombo,
      100 // 最多 100 个粒子
    );

    // 屏幕中央位置
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;

    // 彩虹色数组
    const rainbowColors = [
      0xFF0000, // 红
      0xFF7F00, // 橙
      0xFFFF00, // 黄
      0x00FF00, // 绿
      0x0000FF, // 蓝
      0x4B0082, // 靛
      0x9400D3  // 紫
    ];

    // 发射粒子
    emitter.emit(count, () => {
      const particle = this._acquireParticle();

      // 螺旋扩散
      const index = emitter.particles.length;
      const angle = (index / count) * Math.PI * 2 * 3; // 3圈螺旋
      const speed = comboConfig.speed.min + 
                   Math.random() * (comboConfig.speed.max - comboConfig.speed.min);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      // 彩虹色
      const colorIndex = Math.floor((index / count) * rainbowColors.length);
      const tint = rainbowColors[colorIndex];

      particle.init({
        x: centerX,
        y: centerY,
        velocityX,
        velocityY,
        accelerationX: 0,
        accelerationY: 0,
        lifetime: comboConfig.lifetime,
        scale: 1.0 + comboCount * 0.1, // 连锁越高，粒子越大
        alpha: 1.0,
        tint
      });

      this.stats.totalParticles++;
      return particle;
    });

    this.emitters.push(emitter);
    this.stats.emittersCount++;
  }

  /**
   * 创建特殊图标激活效果
   * @param {string} type - 特殊图标类型
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  createSpecialActivation(type, x, y) {
    if (!this.config.particles?.enabled) return;

    const specialConfig = this.config.particles.special;

    switch (type) {
      case 'bomb':
        this._createBombEffect(x, y, specialConfig.bomb);
        break;
      case 'color-bomb':
        this._createColorBombEffect(specialConfig.colorBomb);
        break;
      case 'row-clear':
        this._createLineClearEffect(x, y, 'horizontal', specialConfig.lineClear);
        break;
      case 'col-clear':
        this._createLineClearEffect(x, y, 'vertical', specialConfig.lineClear);
        break;
    }
  }

  /**
   * 创建炸弹效果（3x3 冲击波）
   * @private
   */
  _createBombEffect(x, y, config) {
    const emitter = new ParticleEmitter({ type: 'bomb' });

    // 橙红色火焰
    const fireColors = [0xFF4500, 0xFF6347, 0xFF8C00, 0xFFA500];

    emitter.emit(config.count, () => {
      const particle = this._acquireParticle();

      // 随机方向和速度
      const angle = Math.random() * Math.PI * 2;
      const speed = config.speed.min + 
                   Math.random() * (config.speed.max - config.speed.min);

      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      // 随机火焰色
      const tint = fireColors[Math.floor(Math.random() * fireColors.length)];

      particle.init({
        x,
        y,
        velocityX,
        velocityY,
        accelerationX: 0,
        accelerationY: 100, // 轻微向下
        lifetime: config.lifetime,
        scale: 1.2,
        alpha: 1.0,
        tint
      });

      this.stats.totalParticles++;
      return particle;
    });

    this.emitters.push(emitter);
    this.stats.emittersCount++;
  }

  /**
   * 创建彩色炸弹效果（全屏粒子雨）
   * @private
   */
  _createColorBombEffect(config) {
    const emitter = new ParticleEmitter({ type: 'colorBomb' });

    // 彩虹色
    const rainbowColors = [
      0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 
      0x0000FF, 0x4B0082, 0x9400D3
    ];

    emitter.emit(config.count, () => {
      const particle = this._acquireParticle();

      // 从顶部随机位置落下
      const startX = Math.random() * this.app.screen.width;
      const startY = -20;

      const speed = config.speed.min + 
                   Math.random() * (config.speed.max - config.speed.min);

      // 随机彩虹色
      const tint = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];

      particle.init({
        x: startX,
        y: startY,
        velocityX: (Math.random() - 0.5) * 50, // 轻微横向摆动
        velocityY: speed,
        accelerationX: 0,
        accelerationY: 50, // 加速下落
        lifetime: config.lifetime,
        scale: 1.5,
        alpha: 1.0,
        tint
      });

      this.stats.totalParticles++;
      return particle;
    });

    this.emitters.push(emitter);
    this.stats.emittersCount++;
  }

  /**
   * 创建横向/纵向消除效果（光束粒子）
   * @private
   */
  _createLineClearEffect(x, y, direction, config) {
    const emitter = new ParticleEmitter({ type: 'lineClear' });

    // 蓝白色光束
    const beamColors = [0x00BFFF, 0x87CEEB, 0xFFFFFF, 0xADD8E6];

    emitter.emit(config.count, () => {
      const particle = this._acquireParticle();

      const speed = config.speed.min + 
                   Math.random() * (config.speed.max - config.speed.min);

      let velocityX, velocityY;
      if (direction === 'horizontal') {
        // 横向扩散
        velocityX = (Math.random() > 0.5 ? 1 : -1) * speed;
        velocityY = (Math.random() - 0.5) * 50;
      } else {
        // 纵向扩散
        velocityX = (Math.random() - 0.5) * 50;
        velocityY = (Math.random() > 0.5 ? 1 : -1) * speed;
      }

      const tint = beamColors[Math.floor(Math.random() * beamColors.length)];

      particle.init({
        x,
        y,
        velocityX,
        velocityY,
        accelerationX: 0,
        accelerationY: 0,
        lifetime: config.lifetime,
        scale: 1.0,
        alpha: 1.0,
        tint
      });

      this.stats.totalParticles++;
      return particle;
    });

    this.emitters.push(emitter);
    this.stats.emittersCount++;
  }

  /**
   * 更新所有粒子效果
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(deltaTime) {
    const deltaSeconds = deltaTime / 1000;

    // 更新所有发射器，移除不活跃的
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      const isDead = emitter.update(deltaSeconds);

      if (isDead) {
        // 回收粒子到对象池
        emitter.particles.forEach(particle => {
          this._releaseParticle(particle);
        });
        emitter.destroy();
        this.emitters.splice(i, 1);
        this.stats.emittersCount--;
      }
    }

    // 更新统计信息
    this.stats.activeParticles = this.emitters.reduce(
      (sum, emitter) => sum + emitter.getActiveCount(),
      0
    );
  }

  /**
   * 清除所有粒子效果
   */
  clear() {
    this.emitters.forEach(emitter => {
      emitter.particles.forEach(particle => {
        this._releaseParticle(particle);
      });
      emitter.destroy();
    });
    this.emitters = [];
    this.stats.emittersCount = 0;
    this.stats.activeParticles = 0;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 销毁粒子效果管理器
   */
  destroy() {
    this.clear();
    this.particleContainer.destroy({ children: true });
  }
}

export default ParticleEffects;
