#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="/www/biaoshu"
LOG_DIR="$PROJECT_DIR/log"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 端口
BACKEND_PORT=8000
FRONTEND_PORT=3000

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AI 写标书助手 - 开发模式启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查端口占用
check_port() {
    local port=$1
    if ss -tlnp | grep -q ":$port "; then
        echo -e "${YELLOW}警告: 端口 $port 已被占用${NC}"
        read -p "是否停止占用该端口的进程? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            lsof -ti:$port | xargs -r kill -9
            sleep 2
            echo -e "${GREEN}端口 $port 已释放${NC}"
        else
            echo -e "${RED}启动失败: 端口 $port 被占用${NC}"
            exit 1
        fi
    fi
}

# 检查并释放端口
echo -e "${YELLOW}检查端口占用...${NC}"
check_port $BACKEND_PORT
check_port $FRONTEND_PORT
echo ""

# 启动后端
echo -e "${GREEN}启动后端服务...${NC}"
cd $BACKEND_DIR
source venv/bin/activate
#python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > $LOG_DIR/backend.log 2>&1 &
python run.py > $LOG_DIR/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}后端地址: http://127.0.0.1:$BACKEND_PORT${NC}"
echo ""

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}后端服务启动失败！查看日志:${NC}"
    cat $LOG_DIR/backend.log
    exit 1
fi

# 启动前端
echo -e "${GREEN}启动前端开发服务器...${NC}"
cd $FRONTEND_DIR
npm run start > $LOG_DIR/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}前端地址: http://127.0.0.1:$FRONTEND_PORT${NC}"
echo ""

# 等待前端启动
sleep 5

# 检查前端是否启动成功
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}前端服务启动失败！查看日志:${NC}"
    cat $LOG_DIR/frontend.log
    kill $FRONTEND_PID
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 所有服务启动成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}服务信息:${NC}"
echo -e "  后端: http://127.0.0.1:$BACKEND_PORT"
echo -e "  前端: http://127.0.0.1:$FRONTEND_PORT"
echo -e "  API 文档: http://127.0.0.1:$BACKEND_PORT/docs"
echo ""
echo -e "${YELLOW}进程信息:${NC}"
echo -e "  后端 PID: $BACKEND_PID"
echo -e "  前端 PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo -e "  后端: $LOG_DIR/backend.log"
echo -e "  前端: $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo -e "  按 Ctrl+C 停止所有服务"
echo ""

# 保存 PID 到文件
echo "$BACKEND_PID" > /tmp/backend.pid
echo "$FRONTEND_PID" > /tmp/frontend.pid

# 等待用户中断
trap "echo -e '${YELLOW}正在停止服务...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f /tmp/backend.pid /tmp/frontend.pid; echo -e '${GREEN}服务已停止${NC}'; exit 0" INT TERM

# 保持脚本运行
wait