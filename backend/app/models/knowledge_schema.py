"""知识库数据模型"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """文档类型"""
    TEXT = "text"      # 文本文档
    IMAGE = "image"    # 图片
    FILE = "file"      # 其他文件


class DocumentCategory(str, Enum):
    """文档分类"""
    COMPANY_INFO = "company_info"       # 企业信息
    QUALIFICATION = "qualification"     # 资质资料
    PROJECT_EXPERIENCE = "project"      # 项目经验
    STANDARD = "standard"               # 标准规范
    OTHER = "other"                     # 其他


class KnowledgeDocument(BaseModel):
    """知识库文档模型"""
    id: str = Field(..., description="文档ID")
    title: str = Field(..., description="文档标题")
    content: Optional[str] = Field(None, description="文档内容（文本类型）")
    file_path: Optional[str] = Field(None, description="文件路径（图片/文件类型）")
    file_name: Optional[str] = Field(None, description="原始文件名")
    document_type: DocumentType = Field(..., description="文档类型")
    category: DocumentCategory = Field(..., description="文档分类")
    tags: Optional[List[str]] = Field([], description="标签列表")
    description: Optional[str] = Field(None, description="文档描述")
    user_id: str = Field(..., description="用户ID")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")

    model_config = {"validate_by_name": True}


class CreateDocumentRequest(BaseModel):
    """创建文档请求"""
    title: str = Field(..., description="文档标题")
    content: Optional[str] = Field(None, description="文档内容")
    document_type: DocumentType = Field(..., description="文档类型")
    category: DocumentCategory = Field(..., description="文档分类")
    tags: Optional[List[str]] = Field([], description="标签列表")
    description: Optional[str] = Field(None, description="文档描述")


class UpdateDocumentRequest(BaseModel):
    """更新文档请求"""
    title: Optional[str] = Field(None, description="文档标题")
    content: Optional[str] = Field(None, description="文档内容")
    category: Optional[DocumentCategory] = Field(None, description="文档分类")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    description: Optional[str] = Field(None, description="文档描述")


class DocumentListResponse(BaseModel):
    """文档列表响应"""
    success: bool = Field(True, description="是否成功")
    documents: List[KnowledgeDocument] = Field([], description="文档列表")


class DocumentResponse(BaseModel):
    """单文档响应"""
    success: bool = Field(True, description="是否成功")
    document: Optional[KnowledgeDocument] = Field(None, description="文档信息")


class DeleteResponse(BaseModel):
    """删除响应"""
    success: bool = Field(True, description="是否成功")
    message: str = Field("", description="消息")