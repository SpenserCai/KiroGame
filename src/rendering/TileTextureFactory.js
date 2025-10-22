/**
 * 图标纹理工厂
 * 负责加载和管理所有图标纹理资源
 */

import * as PIXI from 'pixi.js';
import { GameConfig } from '../config.js';

export class TileTextureFactory {
  constructor(config) {
    this.config = config || GameConfig;
    this.textures = new Map();
    this.isLoaded = false;
    this.loadProgress = 0;
  }

  /**
   * 初始化并加载所有纹理
   * @param {Function} onProgress - 加载进度回调 (progress: 0-100)
   */
  async init(onProgress) {
    console.log('🎨 开始加载纹理资源...');

    // 定义资源清单
    const assets = [
      // 普通图标
      { alias: 'type0', src: './assets/images/ghosts/ghost-red.png' },
      { alias: 'type1', src: './assets/images/ghosts/ghost-blue.png' },
      { alias: 'type2', src: './assets/images/ghosts/ghost-yellow.png' },
      { alias: 'type3', src: './assets/images/ghosts/ghost-green.png' },
      { alias: 'type4', src: './assets/images/ghosts/ghost-purple.png' },

      // 特殊图标 - 使用下划线命名以匹配 Tile.js 中的 SpecialTileType 常量
      { alias: 'bomb', src: './assets/images/special/bomb.png' },
      { alias: 'color_bomb', src: './assets/images/special/color-bomb.png' },
      { alias: 'row_clear', src: './assets/images/special/row-clear.png' },
      { alias: 'col_clear', src: './assets/images/special/col-clear.png' }
    ];

    try {
      // 批量加载资源
      const promises = assets.map((asset, index) =>
        PIXI.Assets.load(asset.src).then(texture => {
          this.loadProgress = ((index + 1) / assets.length) * 100;
          if (onProgress) {
            onProgress(this.loadProgress);
          }
          console.log(`  ✅ 加载完成: ${asset.alias} (${this.loadProgress.toFixed(0)}%)`);
          return { alias: asset.alias, texture };
        })
      );

      const results = await Promise.all(promises);

      // 缓存纹理到 Map
      results.forEach(({ alias, texture }) => {
        this.textures.set(alias, texture);
      });

      this.isLoaded = true;
      console.log('✅ 所有纹理加载完成！');
      return true;

    } catch (error) {
      console.error('❌ 纹理加载失败:', error);

      // 尝试重新加载失败的资源
      await this.retryFailedAssets(assets);
    }
  }

  /**
   * 重试加载失败的资源
   */
  async retryFailedAssets(assets, maxRetries = 3) {
    console.log('🔄 重试加载失败的资源...');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 检查哪些资源加载失败
        const failedAssets = assets.filter(asset =>
          !PIXI.Assets.cache.has(asset.src)
        );

        if (failedAssets.length === 0) {
          console.log('✅ 所有资源加载成功');
          this.isLoaded = true;
          return;
        }

        console.log(`  尝试 ${attempt}/${maxRetries}: ${failedAssets.length} 个资源`);

        // 重新加载失败的资源
        await Promise.all(
          failedAssets.map(asset => PIXI.Assets.load(asset.src))
        );

      } catch (error) {
        if (attempt === maxRetries) {
          console.error('❌ 资源加载失败，已达最大重试次数:', error);
          throw new Error('Critical: Asset loading failed after retries');
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * 获取纹理
   * @param {string} key - 纹理键名 (type0-4, bomb, color_bomb, row_clear, col_clear)
   */
  getTexture(key) {
    if (!this.isLoaded) {
      throw new Error('Textures not loaded yet. Call init() first.');
    }

    const texture = this.textures.get(key);
    if (!texture) {
      console.warn(`⚠️  纹理未找到: ${key}`);
      return null;
    }

    return texture;
  }

  /**
   * 检查纹理是否存在
   */
  hasTexture(key) {
    return this.textures.has(key);
  }

  /**
   * 获取加载进度
   */
  getProgress() {
    return this.loadProgress;
  }
}

export default TileTextureFactory;
