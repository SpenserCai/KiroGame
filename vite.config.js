import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
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
