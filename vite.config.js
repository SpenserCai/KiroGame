import { defineConfig } from 'vite';

export default defineConfig({
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
});
