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

# 清理端口
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

# 启动后端服务（8000端口）
cd backend
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > $LOG_DIR/backend.log 2>&1 &
cd ..

# 等待后端启动
sleep 3

# 启动 CRA 开发服务器（5000端口），通过 setupProxy.js 代理 /api 到后端
cd frontend
exec pnpm run start > $LOG_DIR/frontend.log 2>&1 &
