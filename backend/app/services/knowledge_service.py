"""知识库服务"""

import os
import json
import uuid
from datetime import datetime
from typing import List, Optional

from app.models.knowledge_schema import (
    KnowledgeDocument,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    DocumentType,
    Company,
    CreateCompanyRequest,
    UpdateCompanyRequest,
)


class KnowledgeService:
    """知识库服务类"""

    def __init__(self, data_dir: str = "app/data/knowledge"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

    def _get_user_dir(self, user_id: str) -> str:
        """获取用户数据目录"""
        user_dir = os.path.join(self.data_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        return user_dir

    def _get_companies_file(self, user_id: str) -> str:
        """获取用户企业数据文件路径"""
        return os.path.join(self._get_user_dir(user_id), "companies.json")

    def _get_documents_file(self, user_id: str) -> str:
        """获取用户文档数据文件路径"""
        return os.path.join(self._get_user_dir(user_id), "documents.json")

    def _load_companies(self, user_id: str) -> List[Company]:
        """加载用户企业列表"""
        file_path = self._get_companies_file(user_id)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [Company(**comp) for comp in data]
        return []

    def _save_companies(self, user_id: str, companies: List[Company]) -> None:
        """保存用户企业列表"""
        file_path = self._get_companies_file(user_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([comp.model_dump() for comp in companies], f, ensure_ascii=False, indent=2)

    def _load_documents(self, user_id: str) -> List[KnowledgeDocument]:
        """加载用户文档列表"""
        file_path = self._get_documents_file(user_id)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [KnowledgeDocument(**doc) for doc in data]
        return []

    def _save_documents(self, user_id: str, documents: List[KnowledgeDocument]) -> None:
        """保存用户文档列表"""
        file_path = self._get_documents_file(user_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([doc.model_dump() for doc in documents], f, ensure_ascii=False, indent=2)

    # ========== 企业管理 ==========

    def get_all_companies(self, user_id: str) -> List[Company]:
        """获取用户所有企业"""
        return self._load_companies(user_id)

    def get_company_by_id(self, user_id: str, company_id: str) -> Optional[Company]:
        """根据ID获取企业"""
        companies = self._load_companies(user_id)
        return next((comp for comp in companies if comp.id == company_id), None)

    def create_company(self, user_id: str, request: CreateCompanyRequest) -> Company:
        """创建企业"""
        companies = self._load_companies(user_id)
        
        now = datetime.now().isoformat()
        company = Company(
            id=str(uuid.uuid4()),
            name=request.name,
            description=request.description,
            user_id=user_id,
            created_at=now,
            updated_at=now,
            document_count=0,
        )
        
        companies.append(company)
        self._save_companies(user_id, companies)
        return company

    def update_company(
        self, user_id: str, company_id: str, request: UpdateCompanyRequest
    ) -> Optional[Company]:
        """更新企业"""
        companies = self._load_companies(user_id)
        for comp in companies:
            if comp.id == company_id:
                if request.name is not None:
                    comp.name = request.name
                if request.description is not None:
                    comp.description = request.description
                comp.updated_at = datetime.now().isoformat()
                
                self._save_companies(user_id, companies)
                return comp
        return None

    def delete_company(self, user_id: str, company_id: str) -> bool:
        """删除企业"""
        companies = self._load_companies(user_id)
        original_count = len(companies)
        companies = [comp for comp in companies if comp.id != company_id]
        
        if len(companies) < original_count:
            self._save_companies(user_id, companies)
            # 删除该企业下的所有文档
            documents = self._load_documents(user_id)
            documents = [doc for doc in documents if doc.company_id != company_id]
            self._save_documents(user_id, documents)
            return True
        return False

    # ========== 文档管理 ==========

    def get_all_documents(self, user_id: str) -> List[KnowledgeDocument]:
        """获取用户所有文档"""
        return self._load_documents(user_id)

    def get_documents_by_company(self, user_id: str, company_id: str) -> List[KnowledgeDocument]:
        """获取指定企业的文档"""
        documents = self._load_documents(user_id)
        return [doc for doc in documents if doc.company_id == company_id]

    def get_document_by_id(self, user_id: str, doc_id: str) -> Optional[KnowledgeDocument]:
        """根据ID获取文档"""
        documents = self._load_documents(user_id)
        return next((doc for doc in documents if doc.id == doc_id), None)

    def create_document(
        self, user_id: str, request: CreateDocumentRequest, file_info: dict = None
    ) -> KnowledgeDocument:
        """创建文档"""
        documents = self._load_documents(user_id)
        
        now = datetime.now().isoformat()
        doc = KnowledgeDocument(
            id=str(uuid.uuid4()),
            title=request.title,
            content=request.content,
            document_type=request.document_type,
            category=request.category,
            tags=request.tags or [],
            description=request.description,
            company_id=request.company_id,
            file_path=file_info.get("file_path") if file_info else None,
            file_name=file_info.get("file_name") if file_info else None,
            user_id=user_id,
            created_at=now,
            updated_at=now,
        )
        
        documents.append(doc)
        self._save_documents(user_id, documents)
        
        # 更新企业文档计数
        if doc.company_id:
            self._update_company_document_count(user_id, doc.company_id)
        
        return doc

    def _update_company_document_count(self, user_id: str, company_id: str) -> None:
        """更新企业文档计数"""
        companies = self._load_companies(user_id)
        for comp in companies:
            if comp.id == company_id:
                documents = self._load_documents(user_id)
                comp.document_count = len([doc for doc in documents if doc.company_id == company_id])
                comp.updated_at = datetime.now().isoformat()
                self._save_companies(user_id, companies)
                break

    def update_document(
        self, user_id: str, doc_id: str, request: UpdateDocumentRequest
    ) -> Optional[KnowledgeDocument]:
        """更新文档"""
        documents = self._load_documents(user_id)
        for i, doc in enumerate(documents):
            if doc.id == doc_id:
                if request.title is not None:
                    doc.title = request.title
                if request.content is not None:
                    doc.content = request.content
                if request.category is not None:
                    doc.category = request.category
                if request.tags is not None:
                    doc.tags = request.tags
                if request.description is not None:
                    doc.description = request.description
                doc.updated_at = datetime.now().isoformat()
                
                self._save_documents(user_id, documents)
                return doc
        return None

    def delete_document(self, user_id: str, doc_id: str) -> bool:
        """删除文档"""
        documents = self._load_documents(user_id)
        original_count = len(documents)
        deleted_doc = next((doc for doc in documents if doc.id == doc_id), None)
        documents = [doc for doc in documents if doc.id != doc_id]
        
        if len(documents) < original_count:
            self._save_documents(user_id, documents)
            # 删除关联的文件
            if deleted_doc and deleted_doc.file_path and os.path.exists(deleted_doc.file_path):
                os.remove(deleted_doc.file_path)
            # 更新企业文档计数
            if deleted_doc and deleted_doc.company_id:
                self._update_company_document_count(user_id, deleted_doc.company_id)
            return True
        return False

    def search_documents(
        self, user_id: str, keyword: str = "", category: str = "", company_id: str = ""
    ) -> List[KnowledgeDocument]:
        """搜索文档"""
        documents = self._load_documents(user_id)
        
        if company_id:
            documents = [doc for doc in documents if doc.company_id == company_id]
        
        if keyword:
            keyword = keyword.lower()
            documents = [
                doc for doc in documents
                if keyword in doc.title.lower()
                or (doc.description and keyword in doc.description.lower())
                or (doc.content and keyword in doc.content.lower())
                or any(keyword in tag.lower() for tag in doc.tags)
            ]
        
        if category:
            documents = [doc for doc in documents if doc.category == category]
        
        return documents


# 全局服务实例
_knowledge_service = None


def get_knowledge_service() -> KnowledgeService:
    """获取知识库服务实例"""
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service