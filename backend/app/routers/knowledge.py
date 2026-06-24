"""知识库路由"""

import json
import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Cookie, Form
from fastapi.responses import FileResponse

from app.services.evaluation_service import get_evaluation_service, EvaluationService
from app.models.knowledge_schema import (
    KnowledgeDocument,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    DocumentListResponse,
    DocumentResponse,
    DeleteResponse,
    DocumentType,
    DocumentCategory,
    Company,
    CreateCompanyRequest,
    UpdateCompanyRequest,
    CompanyListResponse,
    CompanyResponse,
    Folder,
    CreateFolderRequest,
    UpdateFolderRequest,
    FolderListResponse,
    CompanyEvaluationResponse,
    CompanyEvaluationResult,
)
from app.services.knowledge_service import get_knowledge_service, KnowledgeService
from app.services.auth_service import get_auth_service, AuthService
from app.services.document_parser_service import document_parser_service
from app.config import settings

router = APIRouter(prefix="/api/knowledge", tags=["知识库"])


async def get_current_user_id(token: str = Cookie(None)) -> str:
    """从cookie中获取用户ID"""
    auth_service = get_auth_service()
    
    if token is None:
        return "8c6976e5b5410415"
    
    user_info = auth_service.verify_token(token)
    if user_info is None:
        return "8c6976e5b5410415"
    
    return user_info.user_id


# ========== 企业管理 ==========

@router.get("/companies", response_model=CompanyListResponse)
async def list_companies(
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取企业列表"""
    companies = knowledge_service.get_all_companies(user_id)
    return CompanyListResponse(companies=companies)


@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取企业详情"""
    company = knowledge_service.get_company_by_id(user_id, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="企业不存在")
    
    return CompanyResponse(company=company)


@router.post("/companies", response_model=CompanyResponse)
async def create_company(
    request: CreateCompanyRequest,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """创建企业"""
    company = knowledge_service.create_company(user_id, request)
    return CompanyResponse(company=company)


@router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    request: UpdateCompanyRequest,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """更新企业"""
    company = knowledge_service.update_company(user_id, company_id, request)
    if not company:
        raise HTTPException(status_code=404, detail="企业不存在")
    
    return CompanyResponse(company=company)


@router.delete("/companies/{company_id}", response_model=DeleteResponse)
async def delete_company(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """删除企业"""
    success = knowledge_service.delete_company(user_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="企业不存在")
    
    return DeleteResponse(success=True, message="删除成功")


# ========== 文档管理 ==========

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    keyword: str = Query("", description="搜索关键词"),
    category: str = Query("", description="文档分类"),
    company_id: str = Query("", description="企业ID"),
    folder_id: str = Query("", description="文件夹ID"),
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取文档列表"""
    documents = knowledge_service.search_documents(user_id, keyword, category, company_id, folder_id)
    return DocumentListResponse(documents=documents)


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取文档详情"""
    document = knowledge_service.get_document_by_id(user_id, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DocumentResponse(document=document)


@router.post("/documents", response_model=DocumentListResponse)
async def create_document(
    title: Optional[str] = Form(None),
    category: Optional[DocumentCategory] = Form(None),
    document_type: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None),
    folder_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """批量创建文档（支持多文件上传）"""
    created_documents = []
    
    for file in files:
        # 使用文件名作为标题
        doc_title = title if title else file.filename
        
        # 构建请求对象
        request = CreateDocumentRequest(
            title=doc_title,
            category=category,
            document_type=DocumentType(document_type) if document_type else DocumentType.FILE,
            company_id=company_id,
            folder_id=folder_id if folder_id else None,
            description=description,
            tags=json.loads(tags) if tags else [],
        )
        
        file_info = None
        if file and file.filename:
            # 保存上传的文件到 企业/目录 结构
            user_dir = os.path.join(settings.upload_dir, user_id, "knowledge")
            if company_id:
                user_dir = os.path.join(user_dir, company_id)
            if folder_id:
                user_dir = os.path.join(user_dir, folder_id)
            os.makedirs(user_dir, exist_ok=True)
            
            file_path = os.path.join(user_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            
            # 根据文件类型自动识别文档类型
            content_type = file.content_type.lower() if file.content_type else ""
            filename_lower = file.filename.lower()
            
            # 图片类型
            if content_type.startswith("image/") or any(filename_lower.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp']):
                request.document_type = DocumentType.IMAGE
            # 文本类型
            elif content_type.startswith("text/") or any(filename_lower.endswith(ext) for ext in ['.txt', '.md', '.csv']):
                request.document_type = DocumentType.TEXT
            # 其他文件类型（PDF、Word、Excel等）
            else:
                request.document_type = DocumentType.FILE
            
            file_info = {"file_path": file_path, "file_name": file.filename}
        
        document = knowledge_service.create_document(user_id, request, file_info)
        created_documents.append(document)
    
    return DocumentListResponse(documents=created_documents, total=len(created_documents))


@router.put("/documents/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    request: UpdateDocumentRequest,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """更新文档"""
    document = knowledge_service.update_document(user_id, doc_id, request)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DocumentResponse(document=document)


@router.delete("/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """删除文档"""
    success = knowledge_service.delete_document(user_id, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DeleteResponse(success=True, message="删除成功")


@router.get("/documents/{doc_id}/download")
async def download_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """下载文档文件"""
    document = knowledge_service.get_document_by_id(user_id, doc_id)
    if not document or not document.file_path:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="文件已删除")
    
    return FileResponse(
        document.file_path,
        filename=document.title,
        media_type="application/octet-stream",
    )


# ========== 文件夹管理 ==========

@router.get("/folders", response_model=FolderListResponse)
async def list_folders(
    company_id: str = Query("", description="企业ID"),
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取文件夹列表"""
    folders = knowledge_service.get_folders_by_company(user_id, company_id)
    return FolderListResponse(folders=folders)


@router.post("/folders", response_model=FolderListResponse)
async def create_folder(
    request: CreateFolderRequest,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """创建文件夹"""
    folder = knowledge_service.create_folder(user_id, request)
    folders = knowledge_service.get_folders_by_company(user_id, request.company_id or "")
    return FolderListResponse(folders=folders)


@router.put("/folders/{folder_id}", response_model=FolderListResponse)
async def update_folder(
    folder_id: str,
    request: UpdateFolderRequest,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """更新文件夹"""
    folder = knowledge_service.update_folder(user_id, folder_id, request)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    folders = knowledge_service.get_folders_by_company(user_id, folder.company_id or "")
    return FolderListResponse(folders=folders)


@router.delete("/folders/{folder_id}", response_model=DeleteResponse)
async def delete_folder(
    folder_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """删除文件夹"""
    success = knowledge_service.delete_folder(user_id, folder_id)
    if not success:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    return DeleteResponse(success=True, message="删除成功")


# 文档解析相关 API
from app.services.document_parser_service import DocumentParserService, get_document_parser_service
from app.models.document_summary import DocumentSummaryResponse

@router.post("/documents/{document_id}/parse", response_model=DocumentSummaryResponse)
async def parse_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    parser_service: DocumentParserService = Depends(get_document_parser_service),
):
    """解析文档内容，提取摘要和关键信息"""
    # 获取文档信息
    doc = knowledge_service.get_document_by_id(user_id, document_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    # 提取文件的实际扩展名
    actual_file_extension = ""
    if doc.file_name:
        _, ext = os.path.splitext(doc.file_name)
        if ext:
            actual_file_extension = ext.lower().lstrip('.') # 例如 "pdf", "docx", "png"

    # 构建文件的绝对路径
    # doc.file_path is like "uploads/8c6976e5b5410415/knowledge/..."
    # settings.upload_dir is now an absolute path like "d:/WSL/Share/biaoshu/uploads"

    # 移除 doc.file_path 中重复的 "uploads/" 前缀
    # 这里我们只移除一次，以防万一路径中有多个 "uploads/"
    # 确保路径分隔符的兼容性
    path_without_redundant_uploads = doc.file_path
    if path_without_redundant_uploads.startswith("uploads/") or \
       path_without_redundant_uploads.startswith("uploads\\"): # 兼容Windows路径分隔符
        # 移除第一个 "uploads/" 或 "uploads\\"
        path_without_redundant_uploads = path_without_redundant_uploads[len("uploads" + os.sep):]

    absolute_file_path = os.path.join(settings.upload_dir, path_without_redundant_uploads) # 修改此处

    # 解析文档
    summary_data = await parser_service.parse_document(
        doc.id,
        doc.company_id,
        absolute_file_path, # 修改此处，传递绝对路径
        actual_file_extension, # 现在传递的是实际的文件扩展名
        doc.title,
        user_id
    )

    if summary_data["status"] == "failed":
        raise HTTPException(
            status_code=500, detail=summary_data.get("error_message", "文档解析失败")
        )

    # 成功解析，构建 DocumentSummaryResponse 对象
    return DocumentSummaryResponse(
        id=document_id,
        document_id=document_id,
        company_id=doc.company_id,
        summary=summary_data.get("summary", ""),
        key_points=summary_data.get("key_points", []),
        category_hint=summary_data.get("category_hint"),
        keywords=summary_data.get("keywords", []),
        content_preview=summary_data.get("content_preview"),
        status=summary_data.get("status", "completed"),
        processed_at=datetime.now(),  # 使用当前时间作为处理时间
        error_message=None,
    )


@router.get("/documents/{document_id}/summary", response_model=DocumentSummaryResponse)
async def get_document_summary(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    parser_service: DocumentParserService = Depends(get_document_parser_service),
):
    """获取文档摘要"""
    summary = parser_service.get_summary(document_id)
    if not summary:
        raise HTTPException(status_code=404, detail="文档摘要不存在")
    
    return summary


# ========== 企业资料完善度评估 ==========

@router.get("/companies/{company_id}/evaluation", response_model=CompanyEvaluationResponse)
async def get_company_evaluation(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
):
    """获取企业资料完善度评估结果"""
    result = evaluation_service.load_evaluation(user_id, company_id)
    if not result:
        return CompanyEvaluationResponse(
            success=False,
            message="暂无评估结果，请先发起评估",
            result=None,
        )
    return CompanyEvaluationResponse(
        success=True,
        message="评估结果获取成功",
        result=result,
    )


@router.post("/companies/{company_id}/evaluate", response_model=CompanyEvaluationResponse)
async def evaluate_company(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
):
    """发起企业资料完善度评估"""
    # 检查企业是否存在
    company = knowledge_service.get_company_by_id(user_id, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="企业不存在")

    try:
        result = await evaluation_service.evaluate_company(user_id, company_id)
        return CompanyEvaluationResponse(
            success=True,
            message="评估完成",
            result=result,
        )
    except Exception as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("企业评估失败")
        raise HTTPException(status_code=500, detail=f"评估失败: {exc}") from exc


@router.delete("/companies/{company_id}/evaluation", response_model=DeleteResponse)
async def delete_company_evaluation(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    evaluation_service: EvaluationService = Depends(get_evaluation_service),
):
    """删除企业评估结果"""
    eval_file = evaluation_service._get_evaluation_file(user_id, company_id)
    if os.path.exists(eval_file):
        os.remove(eval_file)
        return DeleteResponse(success=True, message="评估结果已清除")
    return DeleteResponse(success=False, message="评估结果不存在")