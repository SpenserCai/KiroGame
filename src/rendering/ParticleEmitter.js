/**
 * 粒子发射器 - 管理一组粒子的发射和更新
 */

import { Particle } from './Particle.js';

/**
 * 粒子发射器类
 */
export class ParticleEmitter {
  /**
   * 创建粒子发射器
   * @param {Object} config - 发射器配置
   */
  constructor(config) {
    this.config = config;
    this.particles = [];
    this.isActive = true;
    this.age = 0;
  }

  /**
   * 发射粒子
   * @param {number} count - 粒子数量
   * @param {Function} particleFactory - 粒子工厂函数
   */
  emit(count, particleFactory) {
    for (let i = 0; i < count; i++) {
      const particle = particleFactory();
      if (particle) {
        this.particles.push(particle);
      }
    }
  }

  /**
   * 更新所有粒子
   * @param {number} deltaTime - 帧间隔时间（秒）
   * @returns {boolean} 是否所有粒子都已死亡
   */
  update(deltaTime) {
    if (!this.isActive) return true;

    this.age += deltaTime;

    // 更新所有粒子，移除死亡的粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const isDead = particle.update(deltaTime);

      if (isDead) {
        this.particles.splice(i, 1);
      }
    }

    // 如果所有粒子都死亡，标记发射器为不活跃
    if (this.particles.length === 0) {
      this.isActive = false;
      return true;
    }

    return false;
  }

  /**
   * 销毁发射器
   */
  destroy() {
    this.particles.forEach(particle => particle.reset());
    this.particles = [];
    this.isActive = false;
  }

  /**
   * 获取活跃粒子数量
   */
  getActiveCount() {
    return this.particles.length;
  }
}

export default ParticleEmitter;
