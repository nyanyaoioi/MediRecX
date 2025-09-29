#!/bin/bash

# MediRecX 静态文件快速部署脚本
# 用法: ./deploy-static.sh [platform]
# 平台选项: local, vercel, netlify, surge, firebase

set -e

PLATFORM=${1:-local}
OUT_DIR="out"
PROJECT_NAME="medrecx"

echo "🚀 MediRecX 静态文件部署脚本"
echo "=================================="
echo "目标平台: $PLATFORM"
echo ""

# 检查构建文件是否存在
if [ ! -d "$OUT_DIR" ]; then
    echo "❌ 错误: $OUT_DIR 目录不存在，请先运行 'npm run build'"
    exit 1
fi

case $PLATFORM in
    "local")
        echo "🏠 启动本地服务器..."
        cd $OUT_DIR
        echo "📱 本地服务器运行在: http://localhost:8080"
        echo "按 Ctrl+C 停止服务器"
        python3 -m http.server 8080
        ;;

    "vercel")
        echo "▲ 部署到 Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "安装 Vercel CLI..."
            npm install -g vercel
        fi
        cd $OUT_DIR
        vercel --prod
        ;;

    "netlify")
        echo "🌐 部署到 Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "安装 Netlify CLI..."
            npm install -g netlify-cli
        fi
        cd $OUT_DIR
        netlify deploy --prod --dir=.
        ;;

    "surge")
        echo "⚡ 部署到 Surge..."
        if ! command -v surge &> /dev/null; then
            echo "安装 Surge CLI..."
            npm install -g surge
        fi
        cd $OUT_DIR
        surge --domain ${PROJECT_NAME}.surge.sh
        ;;

    "firebase")
        echo "🔥 部署到 Firebase..."
        if ! command -v firebase &> /dev/null; then
            echo "安装 Firebase CLI..."
            npm install -g firebase-tools
        fi

        # 检查是否已初始化
        if [ ! -f "firebase.json" ]; then
            echo "初始化 Firebase 项目..."
            firebase init hosting --project $PROJECT_NAME
        fi

        cd $OUT_DIR
        firebase deploy
        ;;

    "github-pages")
        echo "📄 准备 GitHub Pages 部署..."
        echo "📋 步骤:"
        echo "1. 推送代码到 GitHub 仓库"
        echo "2. 在仓库设置中启用 Pages"
        echo "3. 选择分支和 $OUT_DIR 文件夹"
        echo "4. 或使用 GitHub Actions 自动部署"
        echo ""
        echo "📁 静态文件位置: $OUT_DIR/"
        ls -la $OUT_DIR | head -10
        ;;

    *)
        echo "❌ 未知平台: $PLATFORM"
        echo ""
        echo "支持的平台:"
        echo "  local       - 本地服务器"
        echo "  vercel      - Vercel"
        echo "  netlify     - Netlify"
        echo "  surge       - Surge.sh"
        echo "  firebase    - Firebase Hosting"
        echo "  github-pages - GitHub Pages (手动)"
        echo ""
        echo "用法: $0 [platform]"
        exit 1
        ;;
esac

echo ""
echo "✅ 部署完成！"
echo "📖 详细说明请查看 STATIC_DEPLOYMENT.md"
