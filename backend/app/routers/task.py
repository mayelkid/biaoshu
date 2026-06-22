"""标书任务路由"""

from fastapi import APIRouter, Depends, HTTPException, Cookie

from ..models.task_schema import (
    CreateTaskRequest,
    DeleteResponse,
    TaskListResponse,
    TaskResponse,
    UpdateTaskRequest,
)
from ..services.task_service import (
    complete_task,
    create_task,
    delete_task,
    get_task,
    get_tasks,
    update_task,
)
from ..services.auth_service import get_auth_service

router = APIRouter(prefix="/api/tasks", tags=["标书任务"])


async def get_current_user_id(token: str = Cookie(None)) -> str:
    """从cookie中获取用户ID"""
    auth_service = get_auth_service()
    
    if token is None:
        return "8c6976e5b5410415"
    
    user_info = auth_service.verify_token(token)
    if user_info is None:
        return "8c6976e5b5410415"
    
    return user_info.user_id


@router.get("/list", response_model=TaskListResponse, summary="获取用户任务列表")
async def list_tasks(user_id: str = Depends(get_current_user_id)):
    """获取当前用户的所有标书任务"""
    tasks = get_tasks(user_id)
    return {"tasks": tasks, "success": True}


@router.get("/detail/{task_id}", response_model=TaskResponse, summary="获取单个任务")
async def get_task_detail(task_id: str, user_id: str = Depends(get_current_user_id)):
    """获取指定任务的详细信息"""
    task = get_task(user_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"task": task, "success": True}


@router.post("/create", response_model=TaskResponse, summary="创建新任务")
async def create_new_task(
    request: CreateTaskRequest,
    user_id: str = Depends(get_current_user_id),
):
    """创建一个新的标书任务"""
    task = create_task(user_id, request.name, request.description or "", request.company_id)
    return {"task": task, "success": True}


@router.put("/update/{task_id}", response_model=TaskResponse, summary="更新任务")
async def update_task_detail(
    task_id: str,
    request: UpdateTaskRequest,
    user_id: str = Depends(get_current_user_id),
):
    """更新任务信息"""
    task = update_task(user_id, task_id, request)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"task": task, "success": True}


@router.delete("/delete/{task_id}", response_model=DeleteResponse, summary="删除任务")
async def delete_task_detail(task_id: str, user_id: str = Depends(get_current_user_id)):
    """删除指定任务"""
    success = delete_task(user_id, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"success": True, "message": "删除成功"}


@router.post("/complete/{task_id}", response_model=TaskResponse, summary="完成任务")
async def mark_task_complete(task_id: str, user_id: str = Depends(get_current_user_id)):
    """标记任务为完成状态"""
    task = complete_task(user_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"task": task, "success": True}