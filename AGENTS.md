# AI 写标书助手 - 项目规范

## 项目概述

AI 写标书助手是一个前后端集成的 Web 应用，用于辅助用户撰写投标文件。前端使用 React + TypeScript 构建，后端使用 FastAPI (Python) 提供 API 服务。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19.2.7 | Create React App (react-scripts) |
| UI 框架 | Tailwind CSS 3.4.19 | 含 @headlessui/react, @heroicons/react |
| 后端框架 | FastAPI 0.116.1 | Python Web 框架 |
| 运行时 | Uvicorn 0.35.0 | ASGI 服务器 |
| 包管理器 | pnpm | Node.js 依赖管理 |
| Python | 3.12 | 后端运行环境 |

## 目录结构

```
/workspace/projects/          # 工作区根目录 (= 技术项目根目录)
├── .coze                     # 根 .coze (平台入口)
├── frontend/                 # 前端子项目
│   ├── .coze                 # 前端子项目配置
│   ├── src/                  # React 源码
│   ├── public/               # 静态资源
│   └── package.json          # 前端依赖
├── backend/                  # 后端子项目
│   ├── .coze                 # 后端子项目配置
│   ├── app/                  # FastAPI 应用
│   │   ├── main.py          # 主入口
│   │   ├── config.py         # 配置
│   │   ├── routers/          # 路由
│   │   ├── models/           # 数据模型
│   │   ├── services/        # 服务层
│   │   └── utils/           # 工具函数
│   ├── static/               # 静态文件 (前端构建产物)
│   └── requirements.txt      # Python 依赖
│   └── run.py                # Uvicorn 启动脚本
└── scripts/                  # Coze 脚本
    ├── coze-preview-build.sh  # 预览构建
    ├── coze-preview-run.sh    # 预览运行
    ├── coze-deploy-build.sh    # 部署构建
    └── coze-deploy-run.sh      # 部署运行
```

## 业务功能模块

### 1. 用户认证 (auth)
- 登录 / 注册 / 登出
- Token 认证，支持 HttpOnly Cookie

### 2. 标书制作 (proposal) - 核心业务
三步流程：
1. **标书解析** - 上传标书文件，提取项目概述和技术要求
2. **目录编辑** - AI 生成标书目录结构，支持流式生成
3. **正文编辑** - AI 生成各章节内容，支持流式生成

### 3. 任务管理 (task)
- 创建、编辑、删除标书任务
- 任务状态跟踪

### 4. 知识库 (knowledge)
- 管理投标知识库
- 支持扩展材料上传

## 后端 API 路由

| 路由前缀 | 功能 |
|----------|------|
| `/api/auth/*` | 用户认证 |
| `/api/outline/*` | 目录生成（支持流式 SSE） |
| `/api/content/*` | 内容生成（支持流式 SSE） |
| `/api/task/*` | 任务管理 |
| `/api/knowledge/*` | 知识库 |
| `/api/document/*` | 文档处理 |
| `/api/config/*` | 配置管理 |

## 关键入口

### 前端入口
- `frontend/src/index.tsx` - React 应用入口
- `frontend/src/App.tsx` - 主应用组件
- `package.json scripts.dev` - 开发服务器 (`react-scripts start`)

### 后端入口
- `backend/app/main.py` - FastAPI 应用入口
- `backend/run.py` - Uvicorn 启动脚本
- `backend/config.py` - 应用配置

### Coze 脚本
- `scripts/coze-preview-build.sh` - 预览构建 (安装前端依赖)
- `scripts/coze-preview-run.sh` - 预览运行 (前后端集成模式，后端服务在 5000 端口)
- `scripts/coze-deploy-build.sh` - 部署构建 (构建前端 + 复制到 static)
- `scripts/coze-deploy-run.sh` - 部署运行 (启动后端服务在 5000 端口)

## 运行与预览

### 本地开发
```bash
# 启动前后端（开发模式）
bash startup.sh

# 单端口集成模式（前端构建 + 后端服务）
bash single_port.sh
```

### Coze 预览
```bash
# 构建预览环境
bash scripts/coze-preview-build.sh

# 启动预览服务 (端口 5000)
bash scripts/coze-preview-run.sh
```

### Coze 部署
```bash
# 构建部署产物
bash scripts/coze-deploy-build.sh

# 启动部署服务 (端口 5000)
bash scripts/coze-deploy-run.sh
```

## 部署架构

项目采用前后端集成部署模式：
1. 前端构建产物 (`frontend/build/`) 复制到 `backend/static/`
2. FastAPI 后端服务 (`uvicorn`) 统一在 **5000 端口** 提供服务
3. 后端同时服务前端页面和 API 接口，前端通过相对路径 `/api/...` 调用后端 API
4. 后端 CORS 配置支持 `localhost:5000` 和 `127.0.0.1:5000`

### 预览模式说明
- 预览采用与部署相同的架构，前后端都在 5000 端口
- 前端打包后由后端服务，支持完整功能测试（包括登录等需要后端 API 的功能）

## 用户偏好与长期约束

1. **端口约束**: 
   - 预览端口: 5000
   - 部署端口: 5000

2. **包管理器约束**:
   - Node.js 项目只使用 `pnpm`
   - Python 项目使用 `requirements.txt`

3. **环境变量**:
   - `REACT_APP_API_URL=http://127.0.0.1:8000` (前端开发)
   - `PORT=5000` (Coze 部署)
   - `BROWSER=none` (禁止浏览器自动打开)

4. **API 代理配置**:
   - `frontend/src/setupProxy.js` 配置 `/api` 代理到 `localhost:8000`

## 常见问题和预防

1. **端口冲突**: 
   - 启动前检查端口占用，使用 `fuser -k <port>/tcp` 清理

2. **前端依赖安装**:
   - 使用 `pnpm install --dir frontend`，不要用 npm 或 yarn

3. **后端 API 不可用**:
   - 预览模式下前端独立运行，部分需要后端的功能会失败
   - 完整功能需要同时运行后端服务

4. **CORS 问题**:
   - 后端配置了允许的 CORS 源（见 `backend/app/config.py`）
   - 单端口模式下无 CORS 问题

## Coze 配置摘要

| 文件 | 用途 | 关键配置 |
|------|------|----------|
| `/workspace/projects/.coze` | 根配置 | `project_type=web`, `entrypoint=backend/app/main.py`, deploy 入口 |
| `/workspace/projects/frontend/.coze` | 前端配置 | `requires=nodejs-24`, preview enabled |
| `/workspace/projects/backend/.coze` | 后端配置 | `requires=python-3.12`, preview disabled |
