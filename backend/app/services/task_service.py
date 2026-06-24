"""标书任务服务"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from ..models.task_schema import (
    ProposalTask,
    TaskStatus,
    UpdateTaskRequest,
    CreateTaskRequest,
)

# 任务数据存储目录
TASKS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "tasks")


def ensure_tasks_dir():
    """确保任务数据目录存在"""
    os.makedirs(TASKS_DIR, exist_ok=True)


def generate_task_id() -> str:
    """生成任务ID"""
    return str(uuid4())


def get_task_file_path(user_id: str, task_id: str) -> str:
    """获取任务文件路径"""
    user_dir = os.path.join(TASKS_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, f"{task_id}.json")


def create_task(user_id: str, name: str, description: str = "", company_id: str = None) -> ProposalTask:
    """创建新任务"""
    ensure_tasks_dir()
    
    now = datetime.now().isoformat()
    task = ProposalTask(
        id=generate_task_id(),
        name=name,
        description=description,
        status=TaskStatus.DRAFT,
        progress=0,
        file_content="",
        project_overview="",
        tech_requirements="",
        outline_data=None,
        current_step=1,
        created_at=now,
        updated_at=now,
        user_id=user_id,
        company_id=company_id,
    )
    
    # 保存任务（使用model_dump(by_alias=True)确保输出camelCase格式）
    task_file = get_task_file_path(user_id, task.id)
    with open(task_file, "w", encoding="utf-8") as f:
        json.dump(task.model_dump(by_alias=True), f, ensure_ascii=False, indent=2)
    
    return task


def get_task(user_id: str, task_id: str) -> Optional[ProposalTask]:
    """获取单个任务"""
    task_file = get_task_file_path(user_id, task_id)
    if not os.path.exists(task_file):
        return None
    
    with open(task_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        # 使用by_alias=True支持camelCase字段
        return ProposalTask(**data)


def get_tasks(user_id: str) -> List[ProposalTask]:
    """获取用户的所有任务"""
    ensure_tasks_dir()
    
    user_dir = os.path.join(TASKS_DIR, user_id)
    if not os.path.exists(user_dir):
        return []
    
    tasks = []
    for filename in os.listdir(user_dir):
        if filename.endswith(".json"):
            task_id = filename[:-5]
            task = get_task(user_id, task_id)
            if task:
                tasks.append(task)
    
    # 按更新时间倒序排序
    tasks.sort(key=lambda t: t.updated_at, reverse=True)
    return tasks


def update_task(user_id: str, task_id: str, updates: UpdateTaskRequest) -> Optional[ProposalTask]:
    """更新任务"""
    task = get_task(user_id, task_id)
    if not task:
        return None
    
    # 获取更新数据（支持alias和field_name两种方式）
    update_data = updates.model_dump(by_alias=True, exclude_none=True)
    
    # 应用更新
    for key, value in update_data.items():
        # 处理别名到字段名的映射
        if key == "fileContent":
            task.file_content = value
        elif key == "projectOverview":
            task.project_overview = value
        elif key == "techRequirements":
            task.tech_requirements = value
        elif key == "outlineData":
            task.outline_data = value
        elif key == "currentStep":
            task.current_step = value
        elif key == "status":
            task.status = value
        elif key == "progress":
            task.progress = value
        elif key == "name":
            task.name = value
        elif key == "description":
            task.description = value
        elif key == "minPages":
            task.min_pages = value
        elif key == "maxPages":
            task.max_pages = value
        elif key == "tablePreference":
            task.table_preference = value
        elif key == "companyId":
            task.company_id = value
        else:
            # 尝试直接设置属性
            setattr(task, key, value)
    
    # 更新时间戳
    task.updated_at = datetime.now().isoformat()
    
    # 保存任务
    task_file = get_task_file_path(user_id, task.id)
    with open(task_file, "w", encoding="utf-8") as f:
        json.dump(task.model_dump(by_alias=True), f, ensure_ascii=False, indent=2)
    
    return task


def delete_task(user_id: str, task_id: str) -> bool:
    """删除任务"""
    task_file = get_task_file_path(user_id, task_id)
    if not os.path.exists(task_file):
        return False
    
    os.remove(task_file)
    return True


def complete_task(user_id: str, task_id: str) -> Optional[ProposalTask]:
    """完成任务"""
    task = get_task(user_id, task_id)
    if not task:
        return None
    
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.updated_at = datetime.now().isoformat()
    
    task_file = get_task_file_path(user_id, task_id)
    with open(task_file, "w", encoding="utf-8") as f:
        json.dump(task.model_dump(by_alias=True), f, ensure_ascii=False, indent=2)
    
    return task