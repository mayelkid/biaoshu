from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentSummaryBase(BaseModel):
    """文档摘要基础模型"""
    document_id: str
    summary: str
    key_points: List[str] = []
    category_hint: Optional[str] = None
    keywords: List[str] = []
    content_preview: Optional[str] = None  # 内容预览片段


class DocumentSummaryCreate(DocumentSummaryBase):
    """创建文档摘要"""
    company_id: str
    status: str = "processing"  # processing/completed/failed


class DocumentSummaryResponse(DocumentSummaryBase):
    """文档摘要响应"""
    id: str
    company_id: str
    status: str
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentSummaryUpdate(BaseModel):
    """更新文档摘要"""
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    category_hint: Optional[str] = None
    keywords: Optional[List[str]] = None
    content_preview: Optional[str] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
