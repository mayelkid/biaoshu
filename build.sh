#!/bin/bash

# 设置终端颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 切换到脚本所在目录
cd "$(dirname "$0")"

clear
echo -e "${YELLOW}===============================================${NC}"
echo -e "AI写标书助手 - 构建脚本"
echo -e "${YELLOW}===============================================${NC}"
echo

echo "检查Python环境..."
python3 --version
if [ $? -ne 0 ]; then
    echo -e "${RED}Python未安装或不在PATH中${NC}"
    exit 1
fi
echo

echo "检查Node.js环境..."
node --version
if [ $? -ne 0 ]; then
    echo -e "${RED}Node.js未安装或不在PATH中${NC}"
    exit 1
fi
echo

echo -e "${YELLOW}开始构建...${NC}"
echo "构建前将自动清理以下目录和文件:"
echo "  - dist/"
echo "  - build/"
echo "  - frontend/build/"
echo "  - backend/static/"
echo "  - __pycache__/"
echo "  - *.spec"
echo

python3 -X utf8 build.py
if [ $? -ne 0 ]; then
    echo
    echo -e "${RED}===============================================${NC}"
    echo -e "${RED}构建失败！请检查上方的错误信息${NC}"
    echo -e "${RED}===============================================${NC}"
    exit 1
else
    echo
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${GREEN}构建成功！${NC}"
    echo -e "${GREEN}输出文件位于: dist/${NC}"
    echo -e "${GREEN}===============================================${NC}"
fi
echo