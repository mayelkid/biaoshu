"""标书任务模型定义"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """任务状态"""
    
    DRAFT = "draft"
    ANALYZING = "analyzing"
    OUTLINE = "outline"
    CONTENT = "content"
    COMPLETED = "completed"


class OutlineItem(BaseModel):
    """目录项"""
    
    id: str
    title: str
    description: str
    source_requirement_id: Optional[str] = None
    source_requirement_title: Optional[str] = None
    children: Optional[List["OutlineItem"]] = None
    content: Optional[str] = None


OutlineItem.model_rebuild()


class OutlineData(BaseModel):
    """目录数据"""
    
    outline: List[OutlineItem]
    project_name: Optional[str] = None
    project_overview: Optional[str] = None


class ProposalTask(BaseModel):
    """标书任务"""
    
    model_config = {"validate_by_name": True}
    
    id: str = Field(..., description="任务ID")
    name: str = Field(..., description="任务名称")
    description: Optional[str] = Field("", description="任务描述")
    status: TaskStatus = Field(TaskStatus.DRAFT, description="任务状态")
    progress: int = Field(0, description="进度(0-100)")
    file_content: str = Field("", alias="fileContent", description="上传的文件内容")
    project_overview: str = Field("", alias="projectOverview", description="项目概述")
    tech_requirements: str = Field("", alias="techRequirements", description="技术要求")
    outline_data: Optional[OutlineData] = Field(None, alias="outlineData", description="目录数据")
    current_step: int = Field(1, alias="currentStep", description="当前步骤")
    created_at: str = Field(..., alias="createdAt", description="创建时间")
    updated_at: str = Field(..., alias="updatedAt", description="更新时间")
    user_id: str = Field(..., alias="userId", description="用户ID")
    company_id: Optional[str] = Field(None, alias="companyId", description="关联的企业ID")
    # 生成偏好
    min_pages: int = Field(20, alias="minPages", ge=5, le=500, description="生成标书最小页数")
    max_pages: int = Field(100, alias="maxPages", ge=5, le=500, description="生成标书最大页数")
    table_preference: str = Field("medium", alias="tablePreference", description="表格偏好: none/medium/heavy")


class CreateTaskRequest(BaseModel):
    """创建任务请求"""
    
    name: str = Field(..., description="任务名称")
    description: Optional[str] = Field("", description="任务描述")
    company_id: Optional[str] = Field(None, description="关联的企业ID")


class UpdateTaskRequest(BaseModel):
    """更新任务请求"""
    
    model_config = {"validate_by_name": True}
    
    name: Optional[str] = None
    description: Optional[str] = None
    file_content: Optional[str] = Field(None, alias="fileContent")
    project_overview: Optional[str] = Field(None, alias="projectOverview")
    tech_requirements: Optional[str] = Field(None, alias="techRequirements")
    outline_data: Optional[OutlineData] = Field(None, alias="outlineData")
    current_step: Optional[int] = Field(None, alias="currentStep")
    status: Optional[TaskStatus] = None
    progress: Optional[int] = None
    min_pages: Optional[int] = Field(None, alias="minPages")
    max_pages: Optional[int] = Field(None, alias="maxPages")
    table_preference: Optional[str] = Field(None, alias="tablePreference")


class TaskListResponse(BaseModel):
    """任务列表响应"""
    
    tasks: List[ProposalTask]
    success: bool = True


class TaskResponse(BaseModel):
    """单个任务响应"""
    
    task: ProposalTask
    success: bool = True


class DeleteResponse(BaseModel):
    """删除响应"""
    
    success: bool = True
    message: str = "删除成功"