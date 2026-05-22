#!/bin/bash

# 设置终端颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${YELLOW}===============================================${NC}"
echo -e "      AI写标书助手 - 单端口集成启动"
echo -e "${YELLOW}===============================================${NC}"
echo

echo "检查前端构建文件..."
if [ ! -f "backend/static/index.html" ]; then
    echo -e "${RED}❌ 前端构建文件不存在，正在构建...${NC}"
    echo
    
    echo "[1/2] 构建前端..."
    cd frontend || exit 1
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端构建失败${NC}"
        exit 1
    fi
    cd ..
    
    echo "[2/2] 复制构建文件..."
    python3 -c "import shutil; shutil.copytree('frontend/build', 'backend/static', dirs_exist_ok=True)"
    echo -e "${GREEN}✅ 构建完成${NC}"
    echo
else
    echo -e "${GREEN}✅ 前端构建文件已存在${NC}"
    echo
fi

echo -e "${YELLOW}🚀 启动集成服务...${NC}"
echo -e "${YELLOW}📡 服务地址: http://localhost:8000${NC}"
echo -e "${YELLOW}📚 API文档: http://localhost:8000/docs${NC}"
echo
echo -e "${GREEN}✨ 前后端已集成，无CORS问题！${NC}"
echo -e "${YELLOW}===============================================${NC}"
echo

cd backend || exit 1
python3 run.py

echo
echo "👋 服务已关闭"