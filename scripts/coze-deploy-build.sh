#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 清理构建产物
rm -rf frontend/build
rm -rf backend/static

# 构建前端
pnpm --dir frontend run build

# 复制构建文件到后端 static 目录
cp -r frontend/build backend/static

# 修复 CRA 构建产物的路径结构（移动 static/* 到根目录）
if [ -d "backend/static/static" ]; then
    mv backend/static/static/* backend/static/
    rmdir backend/static/static
fi
