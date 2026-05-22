#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在停止服务...${NC}"

# 从 PID 文件读取并停止
if [ -f /tmp/backend.pid ]; then
    BACKEND_PID=$(cat /tmp/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}后端服务已停止 (PID: $BACKEND_PID)${NC}"
    fi
    rm -f /tmp/backend.pid
fi

if [ -f /tmp/frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}前端服务已停止 (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f /tmp/frontend.pid
fi

# 如果 PID 文件不存在，尝试通过端口查找进程
BACKEND_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    echo -e "${GREEN}后端服务已停止 (PID: $BACKEND_PID)${NC}"
fi

FRONTEND_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo -e "${GREEN}前端服务已停止 (PID: $FRONTEND_PID)${NC}"
fi

# 等待进程完全停止
sleep 2

# 检查是否还有残留进程
if lsof -ti:8000 > /dev/null 2>&1 || lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}发现残留进程，强制停止...${NC}"
    lsof -ti:8000 2>/dev/null | xargs -r kill -9
    lsof -ti:3000 2>/dev/null | xargs -r kill -9
fi

echo -e "${GREEN}所有服务已停止${NC}"