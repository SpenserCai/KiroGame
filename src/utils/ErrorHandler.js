/**
 * 错误处理器
 * 统一处理游戏中的各种错误
 */

/**
 * 游戏错误类
 */
export class GameError extends Error {
  constructor(type, message, details = null) {
    super(message);
    this.name = 'GameError';
    this.type = type;
    this.details = details;
    this.timestamp = Date.now();
  }
}

/**
 * 错误类型常量
 */
export const ErrorType = {
  INIT_ERROR: 'INIT_ERROR',           // 初始化错误
  LOGIC_ERROR: 'LOGIC_ERROR',         // 游戏逻辑错误
  RENDER_ERROR: 'RENDER_ERROR',       // 渲染错误
  ANIMATION_ERROR: 'ANIMATION_ERROR', // 动画错误
  RESOURCE_ERROR: 'RESOURCE_ERROR',   // 资源加载错误
  CONFIG_ERROR: 'CONFIG_ERROR',       // 配置错误
  CONTEXT_LOST: 'CONTEXT_LOST'        // WebGL上下文丢失
};

/**
 * 错误处理器类
 */
export class ErrorHandler {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.errorLog = [];
    this.maxLogSize = 50;
    this.isRecovering = false;
  }

  /**
   * 处理错误
   * @param {GameError|Error} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  handle(error, context = {}) {
    // 记录错误
    this.logError(error, context);

    // 根据错误类型处理
    if (error instanceof GameError) {
      this.handleGameError(error, context);
    } else {
      this.handleGenericError(error, context);
    }

    // 发布错误事件
    if (this.eventBus) {
      this.eventBus.emit('error', {
        type: error.type || 'UNKNOWN_ERROR',
        message: error.message,
        error,
        context
      });
    }
  }

  /**
   * 处理游戏错误
   * @param {GameError} error - 游戏错误
   * @param {Object} context - 错误上下文
   */
  handleGameError(error, context) {
    console.error(`[${error.type}] ${error.message}`, error.details || '');

    switch (error.type) {
      case ErrorType.INIT_ERROR:
        this.handleInitError(error, context);
        break;

      case ErrorType.LOGIC_ERROR:
        this.handleLogicError(error, context);
        break;

      case ErrorType.RENDER_ERROR:
        this.handleRenderError(error, context);
        break;

      case ErrorType.ANIMATION_ERROR:
        this.handleAnimationError(error, context);
        break;

      case ErrorType.RESOURCE_ERROR:
        this.handleResourceError(error, context);
        break;

      case ErrorType.CONFIG_ERROR:
        this.handleConfigError(error, context);
        break;

      case ErrorType.CONTEXT_LOST:
        this.handleContextLost(error, context);
        break;

      default:
        this.showErrorMessage('发生未知错误，请刷新页面重试');
    }
  }

  /**
   * 处理通用错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  handleGenericError(error, context) {
    console.error('Unexpected error:', error);
    this.showErrorMessage('发生意外错误，请刷新页面重试');
  }

  /**
   * 处理初始化错误
   */
  handleInitError(error, context) {
    this.showErrorMessage(
      '游戏初始化失败',
      error.message,
      [{ text: '刷新页面', action: () => window.location.reload() }]
    );
  }

  /**
   * 处理逻辑错误
   */
  handleLogicError(error, context) {
    console.warn('Logic error occurred, attempting to recover...');
    
    // 尝试恢复游戏状态
    if (context.gameEngine && !this.isRecovering) {
      this.isRecovering = true;
      try {
        context.gameEngine.reset();
        this.showErrorMessage('游戏状态异常，已自动重置', '', [], 2000);
      } catch (e) {
        console.error('Failed to recover:', e);
        this.showErrorMessage('无法恢复游戏状态，请刷新页面');
      } finally {
        this.isRecovering = false;
      }
    }
  }

  /**
   * 处理渲染错误
   */
  handleRenderError(error, context) {
    console.warn('Render error occurred, attempting to recover...');
    
    // 尝试重新初始化渲染器
    if (context.renderEngine && !this.isRecovering) {
      this.isRecovering = true;
      try {
        // 简单的恢复策略：标记需要重绘
        if (context.renderEngine.markDirty) {
          context.renderEngine.markDirty();
        }
        this.showErrorMessage('渲染异常，已尝试恢复', '', [], 2000);
      } catch (e) {
        console.error('Failed to recover render engine:', e);
        this.showErrorMessage('渲染引擎故障，请刷新页面');
      } finally {
        this.isRecovering = false;
      }
    }
  }

  /**
   * 处理动画错误
   */
  handleAnimationError(error, context) {
    console.warn('Animation error occurred, skipping animation...');
    
    // 动画错误通常不致命，跳过即可
    if (context.animationController) {
      try {
        context.animationController.stopAll();
      } catch (e) {
        console.error('Failed to stop animations:', e);
      }
    }
  }

  /**
   * 处理资源加载错误
   */
  handleResourceError(error, context) {
    this.showErrorMessage(
      '资源加载失败',
      error.message,
      [
        { text: '重试', action: () => window.location.reload() },
        { text: '取消', action: () => {} }
      ]
    );
  }

  /**
   * 处理配置错误
   */
  handleConfigError(error, context) {
    this.showErrorMessage(
      '配置错误',
      error.message,
      [{ text: '确定', action: () => window.location.reload() }]
    );
  }

  /**
   * 处理WebGL上下文丢失
   */
  handleContextLost(error, context) {
    console.error('WebGL context lost');
    
    this.showErrorMessage(
      'WebGL上下文丢失',
      '可能是GPU资源不足或驱动问题',
      [
        { text: '刷新页面', action: () => window.location.reload() },
        { text: '稍后重试', action: () => {} }
      ]
    );

    // 尝试恢复上下文
    if (context.renderEngine && context.renderEngine.app) {
      const canvas = context.renderEngine.app.canvas;
      if (canvas) {
        canvas.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored');
          window.location.reload();
        }, { once: true });
      }
    }
  }

  /**
   * 显示错误消息
   * @param {string} title - 错误标题
   * @param {string} message - 错误消息
   * @param {Array} buttons - 按钮配置
   * @param {number} autoClose - 自动关闭时间（毫秒）
   */
  showErrorMessage(title, message = '', buttons = [], autoClose = 0) {
    // 创建错误提示UI
    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'error-dialog';
    dialog.style.cssText = `
      background: #2c3e50;
      color: #ecf0f1;
      padding: 30px;
      border-radius: 10px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0 0 15px 0;
      color: #e74c3c;
      font-size: 24px;
    `;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0 0 20px 0;
      color: #bdc3c7;
      font-size: 16px;
      line-height: 1.5;
    `;

    dialog.appendChild(titleEl);
    if (message) {
      dialog.appendChild(messageEl);
    }

    // 添加按钮
    if (buttons.length > 0) {
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
      `;

      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
          padding: 10px 20px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s;
        `;
        button.onmouseover = () => button.style.background = '#2980b9';
        button.onmouseout = () => button.style.background = '#3498db';
        button.onclick = () => {
          document.body.removeChild(overlay);
          if (btn.action) btn.action();
        };
        buttonContainer.appendChild(button);
      });

      dialog.appendChild(buttonContainer);
    }

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 自动关闭
    if (autoClose > 0) {
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, autoClose);
    }
  }

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  logError(error, context) {
    const logEntry = {
      timestamp: Date.now(),
      type: error.type || 'UNKNOWN',
      message: error.message,
      stack: error.stack,
      context
    };

    this.errorLog.push(logEntry);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * 获取错误日志
   * @returns {Array} 错误日志
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * 验证配置
   * @param {Object} config - 配置对象
   * @throws {GameError} 配置错误
   */
  static validateConfig(config) {
    const required = ['board', 'rendering', 'animation', 'scoring', 'timer'];
    
    for (const key of required) {
      if (!config[key]) {
        throw new GameError(
          ErrorType.CONFIG_ERROR,
          `缺少必需的配置项: ${key}`
        );
      }
    }

    // 验证游戏板配置
    if (config.board.rows < 4 || config.board.rows > 20) {
      throw new GameError(
        ErrorType.CONFIG_ERROR,
        '游戏板行数必须在4-20之间'
      );
    }

    if (config.board.cols < 4 || config.board.cols > 20) {
      throw new GameError(
        ErrorType.CONFIG_ERROR,
        '游戏板列数必须在4-20之间'
      );
    }

    if (config.board.tileTypes < 3 || config.board.tileTypes > 10) {
      throw new GameError(
        ErrorType.CONFIG_ERROR,
        '图标类型数量必须在3-10之间'
      );
    }

    // 验证渲染配置
    if (config.rendering.tileSize < 32 || config.rendering.tileSize > 128) {
      throw new GameError(
        ErrorType.CONFIG_ERROR,
        '图标尺寸必须在32-128之间'
      );
    }

    return true;
  }
}

export default ErrorHandler;
