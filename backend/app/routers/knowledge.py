"""知识库路由"""

import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Cookie
from fastapi.responses import FileResponse

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
    FolderListResponse,
)
from app.services.knowledge_service import get_knowledge_service, KnowledgeService
from app.services.auth_service import get_auth_service, AuthService
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
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取文档列表"""
    documents = knowledge_service.search_documents(user_id, keyword, category, company_id)
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


@router.post("/documents", response_model=DocumentResponse)
async def create_document(
    request: CreateDocumentRequest = Depends(),
    file: UploadFile = File(None),
    user_id: str = Depends(get_current_user_id),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """创建文档"""
    file_info = None
    if file:
        # 保存上传的文件
        user_dir = os.path.join(settings.upload_dir, user_id, "knowledge")
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
    return DocumentResponse(document=document)


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
        filename=document.file_name,
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