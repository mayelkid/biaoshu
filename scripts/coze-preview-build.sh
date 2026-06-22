#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/log"
cd "$PROJECT_DIR"

# 安装前端依赖（如果 node_modules 不存在）
if [ ! -d "frontend/node_modules" ]; then
    pnpm install --dir frontend
fi
