# MediRecX 静态文件部署指南

本指南说明如何部署 MediRecX 前端静态文件到各种托管平台。

## 📁 静态文件位置

静态文件已生成在 `medrec-frontend/out/` 目录中，包含：

```
out/
├── index.html          # 主页
├── wallet-test/        # 钱包测试页面
├── 404/               # 404错误页面
├── _next/             # Next.js 静态资源
│   └── static/
│       ├── chunks/    # JS代码块
│       ├── css/       # 样式文件
│       └── media/     # 字体和媒体文件
└── favicon.ico        # 网站图标
```

## 🌐 部署选项

### 1. GitHub Pages

#### 方法一：使用 GitHub Actions
1. 确保 `out/` 目录被推送到 GitHub
2. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci
      working-directory: medrec-frontend

    - name: Build
      run: npm run build
      working-directory: medrec-frontend

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: medrec-frontend/out
```

#### 方法二：手动部署
1. 推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 "Deploy from a branch"
4. 选择包含 `out` 文件夹的分支

### 2. Vercel

#### 自动部署
1. 连接 GitHub 仓库到 Vercel
2. Vercel 会自动检测 Next.js 项目
3. 配置构建命令：
   - Build Command: `npm run build`
   - Output Directory: `out`

#### 手动部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd medrec-frontend/out
vercel --prod
```

### 3. Netlify

#### 拖拽部署
1. 访问 [netlify.com](https://netlify.com)
2. 拖拽整个 `out` 文件夹到部署区域

#### 命令行部署
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
cd medrec-frontend/out
netlify deploy --prod --dir=.
```

### 4. AWS S3 + CloudFront

#### S3 存储桶设置
```bash
# 安装 AWS CLI
pip install awscli

# 配置 AWS
aws configure

# 创建存储桶
aws s3 mb s3://medrecx-frontend

# 上传文件
cd medrec-frontend/out
aws s3 sync . s3://medrecx-frontend --delete

# 设置公共读取权限
aws s3 website s3://medrecx-frontend --index-document index.html --error-document 404.html
```

#### CloudFront 分配
1. 在 AWS 控制台创建 CloudFront 分配
2. 设置 S3 存储桶作为源
3. 配置自定义域名（可选）

### 5. 其他平台

#### Firebase Hosting
```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 初始化项目
firebase init hosting

# 部署
cd medrec-frontend/out
firebase deploy
```

#### Surge.sh
```bash
# 安装 Surge
npm install -g surge

# 部署
cd medrec-frontend/out
surge
```

## 🔧 配置说明

### 环境变量
静态导出时，环境变量需要在构建时设置：

```bash
# 构建时设置环境变量
NEXT_PUBLIC_CONTRACT_ADDRESS=0x933861CA3D843262076A3a3aC9b8Cc88c8aE9D68 npm run build
```

### 路由配置
- 主页: `/`
- 钱包测试: `/wallet-test`
- 404页面: `/404`

### 静态资源
- 所有 JS/CSS 资源在 `_next/static/` 中
- 字体文件在 `_next/static/media/` 中
- 图片和其他媒体文件在 `public/` 中

## 🚀 测试部署

### 本地测试
```bash
# 安装 serve（推荐）
npm install -g serve

# 启动本地服务器
cd medrec-frontend/out
serve -s .

# 或使用 Python
python3 -m http.server 8080
```

### 功能验证清单
- [ ] 主页正常加载
- [ ] 钱包连接功能正常
- [ ] 患者/医生界面切换正常
- [ ] 语言切换功能正常
- [ ] 区块链连接到 Sepolia 正常
- [ ] 合约交互功能正常

## 🔒 安全注意事项

1. **HTTPS**: 确保托管平台支持 HTTPS
2. **CSP**: 配置适当的内容安全策略
3. **API 密钥**: 敏感信息使用环境变量
4. **更新**: 定期更新依赖和安全补丁

## 📊 性能优化

### 构建优化
```javascript
// next.config.ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  swcMinify: true,
  compress: true,
  images: {
    unoptimized: true, // 对于静态导出
  },
};
```

### CDN 配置
- 使用 CDN 分发静态资源
- 启用 gzip/brotli 压缩
- 配置适当的缓存头

## 🐛 故障排除

### 常见问题

#### 1. 路由问题
- 确保服务器支持 SPA 路由
- 配置正确的 fallback 到 `index.html`

#### 2. CORS 问题
- FHEVM 功能可能需要 CORS 配置
- MetaMask 连接需要 HTTPS

#### 3. 合约地址问题
- 确保前端使用正确的 Sepolia 合约地址
- 检查网络配置

#### 4. 构建失败
- 检查 Node.js 版本 (推荐 20+)
- 清理缓存: `rm -rf .next out`
- 重新安装依赖

## 📞 支持

如遇部署问题，请检查：
1. 浏览器开发者工具的错误信息
2. 服务器日志
3. 网络连接和 API 密钥配置
4. FHEVM 环境配置

---

**部署完成后，MediRecX 就可以通过静态托管的方式提供服务了！** 🎉
