#!/usr/bin/env node

/**
 * SVG 转 PNG 转换脚本
 * 使用 sharp 库将 assets/svg/ 目录下的所有 SVG 文件转换为 128x128 PNG
 * 
 * 优势：
 * - 高性能（基于 libvips）
 * - 跨平台兼容（Windows/Mac/Linux）
 * - 支持透明度和高质量输出
 * - 活跃维护，社区支持好
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  sourceDir: path.join(__dirname, '../assets/svg'),
  targetDir: path.join(__dirname, '../assets/images'),
  size: 128,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * 确保目录存在
 */
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
}

/**
 * 转换单个 SVG 文件为 PNG
 */
async function convertSvgToPng(svgPath, pngPath, retries = 0) {
  try {
    await sharp(svgPath)
      .resize(CONFIG.size, CONFIG.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(pngPath);
    
    return true;
  } catch (error) {
    if (retries < CONFIG.maxRetries) {
      console.warn(`⚠️  转换失败，重试 ${retries + 1}/${CONFIG.maxRetries}: ${path.basename(svgPath)}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * (retries + 1)));
      return convertSvgToPng(svgPath, pngPath, retries + 1);
    }
    throw error;
  }
}

/**
 * 扫描目录并转换所有 SVG 文件
 */
async function convertDirectory(sourceDir, targetDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const results = {
    success: [],
    failed: []
  };

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      // 递归处理子目录
      await ensureDir(targetPath);
      const subResults = await convertDirectory(sourcePath, targetPath);
      results.success.push(...subResults.success);
      results.failed.push(...subResults.failed);
    } else if (entry.name.endsWith('.svg')) {
      // 转换 SVG 文件
      const pngName = entry.name.replace('.svg', '.png');
      const pngPath = path.join(targetDir, pngName);

      try {
        await convertSvgToPng(sourcePath, pngPath);
        results.success.push(pngName);
        console.log(`✅ 转换成功: ${pngName}`);
      } catch (error) {
        results.failed.push({ file: entry.name, error: error.message });
        console.error(`❌ 转换失败: ${entry.name} - ${error.message}`);
      }
    }
  }

  return results;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始转换 SVG 文件...\n');
  console.log(`源目录: ${CONFIG.sourceDir}`);
  console.log(`目标目录: ${CONFIG.targetDir}`);
  console.log(`输出尺寸: ${CONFIG.size}x${CONFIG.size}px\n`);

  try {
    // 检查源目录是否存在
    try {
      await fs.access(CONFIG.sourceDir);
    } catch {
      console.error(`❌ 源目录不存在: ${CONFIG.sourceDir}`);
      console.log('\n💡 提示: 请先在 assets/svg/ 目录下放置 SVG 文件');
      process.exit(1);
    }

    // 确保目标目录存在
    await ensureDir(CONFIG.targetDir);

    // 转换所有文件
    const results = await convertDirectory(CONFIG.sourceDir, CONFIG.targetDir);

    // 输出结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 转换结果统计:');
    console.log(`✅ 成功: ${results.success.length} 个文件`);
    console.log(`❌ 失败: ${results.failed.length} 个文件`);

    if (results.success.length > 0) {
      console.log('\n成功转换的文件:');
      results.success.forEach(file => console.log(`  - ${file}`));
    }

    if (results.failed.length > 0) {
      console.log('\n失败的文件:');
      results.failed.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
      process.exit(1);
    }

    console.log('\n✨ 所有文件转换完成！');
  } catch (error) {
    console.error('\n❌ 转换过程出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
