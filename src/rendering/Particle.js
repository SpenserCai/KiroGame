/**
 * 粒子类 - 单个粒子的数据和行为
 */

/**
 * 粒子类
 */
export class Particle {
  /**
   * 创建粒子
   * @param {PIXI.Sprite} sprite - PixiJS 精灵对象
   */
  constructor(sprite) {
    this.sprite = sprite;
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.lifetime = 1.0;
    this.age = 0;
    this.initialScale = 1.0;
    this.initialAlpha = 1.0;
    this.isAlive = true;
  }

  /**
   * 初始化粒子（用于对象池复用）
   * @param {Object} config - 粒子配置
   */
  init(config) {
    const {
      x = 0,
      y = 0,
      velocityX = 0,
      velocityY = 0,
      accelerationX = 0,
      accelerationY = 0,
      lifetime = 1.0,
      scale = 1.0,
      alpha = 1.0,
      tint = 0xFFFFFF
    } = config;

    this.sprite.position.set(x, y);
    this.velocity.x = velocityX;
    this.velocity.y = velocityY;
    this.acceleration.x = accelerationX;
    this.acceleration.y = accelerationY;
    this.lifetime = lifetime;
    this.age = 0;
    this.initialScale = scale;
    this.initialAlpha = alpha;
    this.sprite.scale.set(scale);
    this.sprite.alpha = alpha;
    this.sprite.tint = tint;
    this.sprite.visible = true;
    this.isAlive = true;
  }

  /**
   * 更新粒子状态
   * @param {number} deltaTime - 帧间隔时间（秒）
   * @returns {boolean} 是否死亡
   */
  update(deltaTime) {
    if (!this.isAlive) return true;

    // 更新年龄
    this.age += deltaTime;

    // 检查是否超过生命周期
    if (this.age >= this.lifetime) {
      this.isAlive = false;
      this.sprite.visible = false;
      return true;
    }

    // 更新速度（应用加速度）
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;

    // 更新位置
    this.sprite.x += this.velocity.x * deltaTime;
    this.sprite.y += this.velocity.y * deltaTime;

    // 计算生命周期进度（0-1）
    const progress = this.age / this.lifetime;

    // 更新透明度（线性衰减）
    this.sprite.alpha = this.initialAlpha * (1 - progress);

    // 更新缩放（缓慢缩小到 20%）
    this.sprite.scale.set(this.initialScale * (1 - progress * 0.8));

    return false;
  }

  /**
   * 重置粒子（用于对象池回收）
   */
  reset() {
    this.sprite.visible = false;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.age = 0;
    this.isAlive = false;
  }
}

export default Particle;
