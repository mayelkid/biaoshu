#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/log"
cd "$PROJECT_DIR"

# 显式声明关键环境变量
export PORT=5000
export BROWSER=none

# 清理 5000 端口
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

# 启动 vite 开发服务器（5000端口），前端通过 /api 代理访问后端
cd frontend
exec pnpm run vite
