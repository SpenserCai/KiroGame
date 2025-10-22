/*
 * @Author: SpenserCai
 * @Date: 2025-10-21 11:46:02
 * @version: 
 * @LastEditors: SpenserCai
 * @LastEditTime: 2025-10-22 15:19:48
 * @Description: file content
 */
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './', // 使用相对路径，适配任意部署路径
  publicDir: false, // 禁用默认的 public 目录
  server: {
    port: 5173,
    open: true, // 自动打开浏览器
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'], // 将 PixiJS 单独打包
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pixi.js'], // 预构建 PixiJS
  },
  plugins: [
    // 构建时复制 assets 目录到 dist，保持目录结构
    viteStaticCopy({
      targets: [
        {
          src: 'assets',
          dest: '.', // 复制到 dist 根目录
        },
      ],
    }),
  ],
});
