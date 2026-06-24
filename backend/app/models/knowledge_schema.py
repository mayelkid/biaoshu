"""知识库数据模型"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class EvaluationStatus(str, Enum):
    """评估项状态"""
    COMPLETED = "completed"             # 已完善
    MISSING = "missing"                 # 缺失
    INCOMPLETE = "incomplete"           # 不完整
    UNABLE_TO_DETERMINE = "unable_to_determine" # 无法判断


class EvaluationItem(BaseModel):
    """单个评估项"""
    name: str = Field(..., description="评估项名称")
    status: EvaluationStatus = Field(..., description="评估项状态")
    detail: Optional[str] = Field(None, description="详细说明")
    document_ids: List[str] = Field([], description="发现相关信息的文档ID列表")


class EvaluationCategory(BaseModel):
    """评估类别"""
    name: str = Field(..., description="评估类别名称")
    items: List[EvaluationItem] = Field([], description="评估项列表")
    
    # 增加一个属性来追踪该类别下已完善的项数
    completed_count: int = Field(0, description="该类别下已完善的项数")
    # 增加一个属性来追踪该类别下总的评估项数
    total_count: int = Field(0, description="该类别下总的评估项数")


class CompanyEvaluationResult(BaseModel):
    """企业资料完善度评估结果"""
    company_id: str = Field(..., description="企业ID")
    user_id: str = Field(..., description="用户ID")
    completeness_percentage: float = Field(0.0, description="资料完善度百分比 (0-100)")
    evaluation_time: datetime = Field(..., description="评估时间")
    categories: List[EvaluationCategory] = Field([], description="详细评估类别列表")
    
    model_config = {"validate_by_name": True}


class CompanyEvaluationResponse(BaseModel):
    """企业资料完善度评估响应"""
    success: bool = Field(True, description="是否成功")
    message: Optional[str] = Field(None, description="消息")
    result: Optional[CompanyEvaluationResult] = Field(None, description="评估结果")


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


class Company(BaseModel):
    """企业模型"""
    id: str = Field(..., description="企业ID")
    name: str = Field(..., description="企业名称")
    description: Optional[str] = Field(None, description="企业描述")
    user_id: str = Field(..., description="用户ID")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")
    document_count: int = Field(0, description="文档数量")

    model_config = {"validate_by_name": True}


class CreateCompanyRequest(BaseModel):
    """创建企业请求"""
    name: str = Field(..., min_length=1, description="企业名称")
    description: Optional[str] = Field(None, description="企业描述")


class UpdateCompanyRequest(BaseModel):
    """更新企业请求"""
    name: Optional[str] = Field(None, min_length=1, description="企业名称")
    description: Optional[str] = Field(None, description="企业描述")


class CompanyListResponse(BaseModel):
    """企业列表响应"""
    success: bool = Field(True, description="是否成功")
    companies: List[Company] = Field([], description="企业列表")


class CompanyResponse(BaseModel):
    """企业响应"""
    success: bool = Field(True, description="是否成功")
    company: Optional[Company] = Field(None, description="企业信息")


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
    company_id: Optional[str] = Field(None, description="企业ID")
    folder_id: Optional[str] = Field(None, description="文件夹ID")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")

    # AI 解析相关字段
    summary: Optional[str] = Field(None, description="AI 提取的摘要")
    key_points: Optional[List[str]] = Field(None, description="AI 提取的关键要点")
    category_hint: Optional[str] = Field(None, description="AI 建议的分类标签")
    keywords: Optional[List[str]] = Field(None, description="AI 提取的关键词")
    content_preview: Optional[str] = Field(None, description="文档内容预览")
    status: Optional[str] = Field(None, description="文档解析状态") # 例如：pending, completed, failed
    processed_at: Optional[str] = Field(None, description="文档处理时间")

    model_config = {"validate_by_name": True}


class CreateDocumentRequest(BaseModel):
    """创建文档请求"""
    title: str = Field(..., description="文档标题")
    content: Optional[str] = Field(None, description="文档内容")
    document_type: DocumentType = Field(..., description="文档类型")
    category: DocumentCategory = Field(..., description="文档分类")
    tags: Optional[List[str]] = Field([], description="标签列表")
    description: Optional[str] = Field(None, description="文档描述")
    company_id: Optional[str] = Field(None, description="企业ID")
    folder_id: Optional[str] = Field(None, description="文件夹ID")


class UpdateDocumentRequest(BaseModel):
    """更新文档请求"""
    title: Optional[str] = Field(None, description="文档标题")
    file_name: Optional[str] = Field(None, description="文件名")
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


class Folder(BaseModel):
    """文件夹模型"""
    id: str = Field(..., description="文件夹ID")
    name: str = Field(..., description="文件夹名称")
    parent_id: Optional[str] = Field(None, description="父文件夹ID，None表示根目录")
    company_id: Optional[str] = Field(None, description="所属企业ID")
    user_id: str = Field(..., description="用户ID")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")
    document_count: int = Field(0, description="文件夹内资料数量")

    model_config = {"validate_by_name": True}


class UpdateFolderRequest(BaseModel):
    """更新文件夹请求"""
    name: Optional[str] = Field(None, description="文件夹名称")


class CreateFolderRequest(BaseModel):
    """创建文件夹请求"""
    name: str = Field(..., min_length=1, description="文件夹名称")
    parent_id: Optional[str] = Field(None, description="父文件夹ID")
    company_id: Optional[str] = Field(None, description="企业ID")


class FolderListResponse(BaseModel):
    """文件夹列表响应"""
    success: bool = Field(True, description="是否成功")
    folders: List[Folder] = Field([], description="文件夹列表")