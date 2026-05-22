"""知识库路由"""

import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
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
)
from app.services.knowledge_service import get_knowledge_service, KnowledgeService
from app.services.auth_service import get_auth_service, AuthService
from app.config import settings

router = APIRouter(prefix="/api/knowledge", tags=["知识库"])


@router.get("/list", response_model=DocumentListResponse)
async def list_documents(
    keyword: str = Query("", description="搜索关键词"),
    category: str = Query("", description="文档分类"),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """获取文档列表"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    documents = knowledge_service.search_documents(user_id, keyword, category)
    return DocumentListResponse(documents=documents)


@router.get("/detail/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """获取文档详情"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    document = knowledge_service.get_document_by_id(user_id, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DocumentResponse(document=document)


@router.post("/create", response_model=DocumentResponse)
async def create_document(
    request: CreateDocumentRequest = Depends(),
    file: UploadFile = File(None),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """创建文档"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    file_info = None
    if file:
        # 保存上传的文件
        user_dir = os.path.join(settings.upload_dir, user_id, "knowledge")
        os.makedirs(user_dir, exist_ok=True)
        
        file_path = os.path.join(user_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # 根据文件类型判断文档类型
        if file.content_type.startswith("image/"):
            request.document_type = DocumentType.IMAGE
        else:
            request.document_type = DocumentType.FILE
        
        file_info = {"file_path": file_path, "file_name": file.filename}
    
    document = knowledge_service.create_document(user_id, request, file_info)
    return DocumentResponse(document=document)


@router.put("/update/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    request: UpdateDocumentRequest,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """更新文档"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    document = knowledge_service.update_document(user_id, doc_id, request)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DocumentResponse(document=document)


@router.delete("/delete/{doc_id}", response_model=DeleteResponse)
async def delete_document(
    doc_id: str,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """删除文档"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    success = knowledge_service.delete_document(user_id, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="文档不存在")
    
    return DeleteResponse(success=True, message="删除成功")


@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    auth_service: AuthService = Depends(get_auth_service),
):
    """下载文档文件"""
    user_id = auth_service.get_current_user_id()
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    
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