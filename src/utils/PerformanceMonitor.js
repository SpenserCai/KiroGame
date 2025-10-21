/**
 * 性能监控器
 * 监控游戏性能指标（FPS、内存、帧时间等）
 */

export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = config;
    this.enabled = config.debug?.enabled || false;
    this.showFPS = config.debug?.showFPS || false;
    
    // 性能指标
    this.fps = 0;
    this.frameTime = 0;
    this.avgFrameTime = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    
    // 帧时间历史（用于计算平均值）
    this.frameTimeHistory = [];
    this.historySize = 60; // 保留60帧的历史
    
    // 内存监控
    this.memoryUsage = 0;
    this.peakMemoryUsage = 0;
    
    // 计时器
    this.lastTime = performance.now();
    this.startTime = this.lastTime;
    
    // 统计数据
    this.totalFrames = 0;
    this.droppedFrames = 0;
    
    // UI元素
    this.statsElement = null;
    
    // 性能警告阈值
    this.fpsWarningThreshold = 30;
    this.memoryWarningThreshold = 100 * 1024 * 1024; // 100MB
  }

  /**
   * 初始化性能监控器
   */
  init() {
    if (!this.enabled) {
      return;
    }

    // 创建性能显示UI
    if (this.showFPS) {
      this.createStatsUI();
    }

    console.log('📊 性能监控器已启动');
  }

  /**
   * 创建性能统计UI
   */
  createStatsUI() {
    this.statsElement = document.createElement('div');
    this.statsElement.id = 'performance-stats';
    this.statsElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      min-width: 150px;
      pointer-events: none;
    `;

    document.body.appendChild(this.statsElement);
  }

  /**
   * 更新性能指标
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(deltaTime) {
    if (!this.enabled) {
      return;
    }

    const now = performance.now();
    this.frameTime = now - this.lastTime;
    this.lastTime = now;

    // 计算FPS
    this.fps = 1000 / this.frameTime;
    this.totalFrames++;

    // 更新FPS范围
    if (this.fps < this.minFPS) this.minFPS = this.fps;
    if (this.fps > this.maxFPS) this.maxFPS = this.fps;

    // 检测掉帧
    if (this.fps < this.fpsWarningThreshold) {
      this.droppedFrames++;
    }

    // 更新帧时间历史
    this.frameTimeHistory.push(this.frameTime);
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift();
    }

    // 计算平均帧时间
    this.avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;

    // 更新内存使用（如果浏览器支持）
    if (performance.memory) {
      this.memoryUsage = performance.memory.usedJSHeapSize;
      if (this.memoryUsage > this.peakMemoryUsage) {
        this.peakMemoryUsage = this.memoryUsage;
      }

      // 内存警告
      if (this.memoryUsage > this.memoryWarningThreshold) {
        console.warn(`⚠️  内存使用过高: ${this.formatBytes(this.memoryUsage)}`);
      }
    }

    // 更新UI
    if (this.showFPS && this.statsElement) {
      this.updateStatsUI();
    }
  }

  /**
   * 更新性能统计UI
   */
  updateStatsUI() {
    if (!this.statsElement) {
      return;
    }

    const fpsColor = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
    const memoryMB = this.memoryUsage / (1024 * 1024);
    const peakMemoryMB = this.peakMemoryUsage / (1024 * 1024);

    let html = `
      <div style="color: ${fpsColor}; font-weight: bold;">
        FPS: ${this.fps.toFixed(1)}
      </div>
      <div style="color: #aaa; font-size: 10px;">
        Frame: ${this.frameTime.toFixed(2)}ms
      </div>
      <div style="color: #aaa; font-size: 10px;">
        Avg: ${this.avgFrameTime.toFixed(2)}ms
      </div>
    `;

    if (performance.memory) {
      html += `
        <div style="color: #aaa; font-size: 10px; margin-top: 5px;">
          Memory: ${memoryMB.toFixed(1)}MB
        </div>
        <div style="color: #aaa; font-size: 10px;">
          Peak: ${peakMemoryMB.toFixed(1)}MB
        </div>
      `;
    }

    html += `
      <div style="color: #aaa; font-size: 10px; margin-top: 5px;">
        Frames: ${this.totalFrames}
      </div>
      <div style="color: #aaa; font-size: 10px;">
        Dropped: ${this.droppedFrames}
      </div>
    `;

    this.statsElement.innerHTML = html;
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标对象
   */
  getMetrics() {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      avgFrameTime: this.avgFrameTime,
      minFPS: this.minFPS,
      maxFPS: this.maxFPS,
      memoryUsage: this.memoryUsage,
      peakMemoryUsage: this.peakMemoryUsage,
      totalFrames: this.totalFrames,
      droppedFrames: this.droppedFrames,
      uptime: performance.now() - this.startTime
    };
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const metrics = this.getMetrics();
    const uptimeSeconds = metrics.uptime / 1000;

    console.log('\n📊 性能报告');
    console.log('═══════════════════════════════════');
    console.log(`运行时间: ${uptimeSeconds.toFixed(2)}秒`);
    console.log(`总帧数: ${metrics.totalFrames}`);
    console.log(`平均FPS: ${(metrics.totalFrames / uptimeSeconds).toFixed(2)}`);
    console.log(`最低FPS: ${metrics.minFPS.toFixed(2)}`);
    console.log(`最高FPS: ${metrics.maxFPS.toFixed(2)}`);
    console.log(`平均帧时间: ${metrics.avgFrameTime.toFixed(2)}ms`);
    console.log(`掉帧数: ${metrics.droppedFrames} (${(metrics.droppedFrames / metrics.totalFrames * 100).toFixed(2)}%)`);
    
    if (performance.memory) {
      console.log(`当前内存: ${this.formatBytes(metrics.memoryUsage)}`);
      console.log(`峰值内存: ${this.formatBytes(metrics.peakMemoryUsage)}`);
    }
    
    console.log('═══════════════════════════════════\n');
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.fps = 0;
    this.frameTime = 0;
    this.avgFrameTime = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    this.frameTimeHistory = [];
    this.totalFrames = 0;
    this.droppedFrames = 0;
    this.memoryUsage = 0;
    this.peakMemoryUsage = 0;
    this.lastTime = performance.now();
    this.startTime = this.lastTime;
  }

  /**
   * 格式化字节数
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 销毁性能监控器
   */
  destroy() {
    if (this.statsElement && this.statsElement.parentNode) {
      this.statsElement.parentNode.removeChild(this.statsElement);
      this.statsElement = null;
    }
  }
}

/**
 * 对象池 - 用于复用对象，减少GC压力
 */
export class ObjectPool {
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;      // 创建对象的工厂函数
    this.reset = reset;           // 重置对象的函数
    this.pool = [];               // 对象池
    this.activeObjects = new Set(); // 活跃对象集合

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 获取对象
   * @returns {Object} 对象实例
   */
  acquire() {
    let obj;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.factory();
    }
    
    this.activeObjects.add(obj);
    return obj;
  }

  /**
   * 释放对象
   * @param {Object} obj - 要释放的对象
   */
  release(obj) {
    if (!this.activeObjects.has(obj)) {
      console.warn('Trying to release an object that is not active');
      return;
    }

    this.activeObjects.delete(obj);
    this.reset(obj);
    this.pool.push(obj);
  }

  /**
   * 释放所有活跃对象
   */
  releaseAll() {
    this.activeObjects.forEach(obj => {
      this.reset(obj);
      this.pool.push(obj);
    });
    this.activeObjects.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeObjects.size,
      totalCount: this.pool.length + this.activeObjects.size
    };
  }

  /**
   * 清空对象池
   */
  clear() {
    this.pool = [];
    this.activeObjects.clear();
  }
}

export default PerformanceMonitor;
