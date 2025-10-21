# 部署指南

本文档提供小鬼消消乐游戏的详细部署指南，包括本地开发、生产构建和多种部署平台的配置说明。

## 目录

1. [开发环境设置](#开发环境设置)
2. [生产构建](#生产构建)
3. [部署平台](#部署平台)
4. [性能优化](#性能优化)
5. [监控和维护](#监控和维护)

## 开发环境设置

### 前置要求

确保系统已安装以下软件：

- **Node.js**：v18.0.0 或更高版本
- **npm**：v9.0.0 或更高版本（通常随Node.js安装）
- **Git**：用于版本控制

验证安装：
```bash
node --version  # 应显示 v18.x.x 或更高
npm --version   # 应显示 v9.x.x 或更高
git --version   # 应显示 git version 2.x.x
```

### 克隆项目

```bash
# 克隆仓库
git clone https://github.com/yourusername/ghost-match-game.git

# 进入项目目录
cd ghost-match-game
```

### 安装依赖

```bash
# 安装所有依赖（包括 PixiJS、Vite、sharp）
npm install

# 如果遇到权限问题（Mac/Linux）
sudo npm install

# 如果遇到网络问题，可以使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 构建资源

如果项目包含SVG源文件，需要先转换为PNG：

```bash
# 转换所有SVG为PNG（使用sharp库）
npm run build:assets

# 这会将 assets/svg/ 中的SVG转换为PNG并保存到 assets/images/
```

### 启动开发服务器

```bash
# 启动Vite开发服务器
npm run dev

# 服务器会自动打开浏览器访问 http://localhost:5173
# 修改代码会自动热更新（HMR）
```

### 开发模式特性

- ⚡ **快速启动**：Vite按需编译，启动速度快
- 🔥 **热模块替换**：修改代码立即生效，无需刷新
- 🐛 **Source Maps**：便于调试，可以看到原始代码
- 📊 **性能监控**：开发模式下显示FPS和性能指标

## 生产构建

### 构建命令

```bash
# 构建生产版本
npm run build

# 构建完成后，产物在 dist/ 目录
```

### 构建产物

```
dist/
├── index.html              # 入口HTML（已优化）
├── assets/
│   ├── index-[hash].js    # 主应用代码（已压缩）
│   ├── pixi-[hash].js     # PixiJS库（单独打包）
│   ├── index-[hash].css   # 样式文件（如果有）
│   └── images/            # 图片资源
│       ├── ghosts/
│       └── special/
└── vite.svg               # Favicon（可选）
```

### 构建优化

Vite自动应用以下优化：

1. **代码压缩**：使用Terser压缩JavaScript
2. **Tree-shaking**：移除未使用的代码
3. **代码分割**：PixiJS单独打包，利用浏览器缓存
4. **资源优化**：
   - 小于4KB的资源内联为base64
   - 图片资源使用内容哈希命名（利于缓存）
5. **移除console**：生产环境自动移除console.log
6. **Source Maps**：生成source map便于调试（可选）

### 预览构建结果

```bash
# 本地预览生产构建
npm run preview

# 访问 http://localhost:4173
```

### 构建配置调整

如需自定义构建配置，编辑 `vite.config.js`：

```javascript
export default defineConfig({
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 资源目录
    assetsDir: 'assets',
    
    // 是否生成source map
    sourcemap: false, // 生产环境可以关闭以减小体积
    
    // chunk大小警告阈值（KB）
    chunkSizeWarningLimit: 1000,
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
        },
      },
    },
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // 移除console
        drop_debugger: true,     // 移除debugger
        pure_funcs: ['console.log'], // 移除特定函数
      },
    },
  },
});
```

## 部署平台

### 1. Netlify（推荐）

Netlify是最简单的部署方式，支持自动部署和CDN加速。

#### 方式A：通过Git自动部署

1. **连接仓库**
   - 访问 [Netlify](https://www.netlify.com/)
   - 点击 "Add new site" → "Import an existing project"
   - 选择Git提供商（GitHub/GitLab/Bitbucket）
   - 授权并选择仓库

2. **配置构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **环境变量**（如果需要）
   - 在 "Site settings" → "Environment variables" 添加

4. **部署**
   - 点击 "Deploy site"
   - 每次推送到主分支会自动重新部署

#### 方式B：通过CLI手动部署

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login

# 初始化项目
netlify init

# 构建并部署
npm run build
netlify deploy --prod --dir=dist
```

#### Netlify配置文件

创建 `netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 2. Vercel

Vercel提供优秀的性能和开发体验。

#### 通过Git自动部署

1. **连接仓库**
   - 访问 [Vercel](https://vercel.com/)
   - 点击 "New Project"
   - 导入Git仓库

2. **配置**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **部署**
   - 点击 "Deploy"
   - 自动部署完成

#### 通过CLI部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

#### Vercel配置文件

创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. GitHub Pages

适合开源项目，免费托管。

#### 配置步骤

1. **修改Vite配置**

编辑 `vite.config.js`，添加base路径：

```javascript
export default defineConfig({
  base: '/ghost-match-game/', // 替换为你的仓库名
  // ... 其他配置
});
```

2. **构建并部署**

```bash
# 构建
npm run build

# 部署到gh-pages分支
# 方式1：使用gh-pages包
npm install -g gh-pages
gh-pages -d dist

# 方式2：使用git subtree
git subtree push --prefix dist origin gh-pages
```

3. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)
   - 保存

4. **访问**
   - 访问 `https://yourusername.github.io/ghost-match-game/`

#### 自动化部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 4. 自托管服务器

适合需要完全控制的场景。

#### Nginx配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 网站根目录
    root /var/www/ghost-match-game/dist;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache配置

创建 `.htaccess`：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# 启用gzip压缩
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# 缓存控制
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

#### 部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash

# 构建
echo "Building..."
npm run build

# 上传到服务器
echo "Uploading to server..."
rsync -avz --delete dist/ user@yourserver.com:/var/www/ghost-match-game/

# 重启Nginx（如果需要）
ssh user@yourserver.com "sudo systemctl reload nginx"

echo "Deployment complete!"
```

### 5. Docker部署

适合容器化部署。

#### Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  ghost-match-game:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

#### 部署命令

```bash
# 构建镜像
docker build -t ghost-match-game .

# 运行容器
docker run -d -p 8080:80 ghost-match-game

# 或使用docker-compose
docker-compose up -d
```

## 性能优化

### 1. 资源优化

#### 图片优化

```bash
# 使用sharp优化PNG（已在构建脚本中）
# 确保PNG质量设置合理（100为无损，80-90为有损但体积更小）
```

#### 代码分割

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'vendor': ['other-large-library'],
        },
      },
    },
  },
});
```

### 2. CDN加速

#### 使用CDN托管PixiJS

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8.14.0/dist/pixi.min.js"></script>
```

然后在 `vite.config.js` 中配置external：

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['pixi.js'],
      output: {
        globals: {
          'pixi.js': 'PIXI'
        }
      }
    }
  }
});
```

### 3. 缓存策略

#### Service Worker（可选）

创建 `public/sw.js`：

```javascript
const CACHE_NAME = 'ghost-match-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/pixi.js',
  '/assets/images/ghosts/',
  '/assets/images/special/',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

注册Service Worker：

```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 4. 性能监控

#### 添加性能指标

```javascript
// 在main.js中添加
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  
  // 发送到分析服务（可选）
  // analytics.track('page_load', { time: perfData.loadEventEnd - perfData.fetchStart });
});
```

## 监控和维护

### 1. 错误监控

#### 集成Sentry（可选）

```bash
npm install @sentry/browser
```

```javascript
// main.js
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  release: 'ghost-match-game@1.0.0',
});
```

### 2. 分析工具

#### Google Analytics

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. 更新策略

#### 版本管理

```json
// package.json
{
  "version": "1.0.0"
}
```

#### 更新通知

```javascript
// 检查新版本
async function checkForUpdates() {
  const response = await fetch('/version.json');
  const { version } = await response.json();
  
  if (version !== currentVersion) {
    // 提示用户刷新
    showUpdateNotification();
  }
}
```

## 故障排查

### 常见问题

#### 1. 白屏问题

**原因**：资源加载失败或JavaScript错误

**解决**：
- 检查浏览器控制台错误
- 确认资源路径正确（特别是base路径）
- 检查CORS配置

#### 2. 资源404

**原因**：路径配置错误

**解决**：
- 检查 `vite.config.js` 中的 `base` 配置
- 确认资源文件已正确复制到dist目录

#### 3. 性能问题

**原因**：资源过大或代码未优化

**解决**：
- 检查构建产物大小
- 启用gzip压缩
- 使用CDN加速
- 优化图片资源

#### 4. 移动端兼容性

**原因**：触摸事件或屏幕尺寸问题

**解决**：
- 测试触摸事件
- 检查响应式布局
- 添加viewport meta标签

## 检查清单

部署前请确认：

- [ ] 所有依赖已安装
- [ ] 资源已构建（SVG转PNG）
- [ ] 生产构建成功
- [ ] 本地预览正常
- [ ] 配置文件正确（base路径等）
- [ ] 环境变量已设置
- [ ] 性能优化已应用
- [ ] 错误监控已配置
- [ ] 分析工具已集成
- [ ] 在目标浏览器测试
- [ ] 在移动设备测试
- [ ] 备份重要数据

## 参考资源

- [Vite部署文档](https://vitejs.dev/guide/static-deploy.html)
- [Netlify文档](https://docs.netlify.com/)
- [Vercel文档](https://vercel.com/docs)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [Nginx文档](https://nginx.org/en/docs/)

---

**最后更新**：2025-10-21  
**版本**：1.0.0
