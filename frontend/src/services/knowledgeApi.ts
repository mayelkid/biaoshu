/**
 * 知识库API服务
 */
import axios from './axios';
import { getErrorMessage } from './utils';

export type DocumentType = 'text' | 'image' | 'file';

export type DocumentCategory = 'company_info' | 'qualification' | 'project' | 'standard' | 'other';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content?: string;
  file_path?: string;
  file_name?: string;
  document_type: DocumentType;
  category: DocumentCategory;
  tags: string[];
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  document_type: DocumentType;
  category: DocumentCategory;
  tags?: string[];
  description?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  category?: DocumentCategory;
  tags?: string[];
  description?: string;
}

export interface DocumentListResponse {
  success: boolean;
  documents: KnowledgeDocument[];
}

export interface DocumentResponse {
  success: boolean;
  document?: KnowledgeDocument;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export const categoryLabels: Record<DocumentCategory, string> = {
  company_info: '企业信息',
  qualification: '资质资料',
  project: '项目经验',
  standard: '标准规范',
  other: '其他',
};

export const typeLabels: Record<DocumentType, string> = {
  text: '文本',
  image: '图片',
  file: '文件',
};

export const knowledgeApi = {
  // 获取文档列表
  async listDocuments(keyword?: string, category?: string): Promise<DocumentListResponse> {
    try {
      const params: Record<string, string> = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      
      const response = await axios.get('/api/knowledge/list', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取文档列表失败'));
    }
  },

  // 获取文档详情
  async getDocument(docId: string): Promise<DocumentResponse> {
    try {
      const response = await axios.get(`/api/knowledge/detail/${docId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取文档详情失败'));
    }
  },

  // 创建文档（文本）
  async createDocument(request: CreateDocumentRequest): Promise<DocumentResponse> {
    try {
      const response = await axios.post('/api/knowledge/create', request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '创建文档失败'));
    }
  },

  // 上传文件
  async uploadFile(
    title: string,
    category: DocumentCategory,
    file: File,
    description?: string,
    tags?: string[]
  ): Promise<DocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('document_type', file.type.startsWith('image/') ? 'image' : 'file');
      if (description) formData.append('description', description);
      if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
      formData.append('file', file);

      const response = await axios.post('/api/knowledge/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '上传文件失败'));
    }
  },

  // 更新文档
  async updateDocument(docId: string, request: UpdateDocumentRequest): Promise<DocumentResponse> {
    try {
      const response = await axios.put(`/api/knowledge/update/${docId}`, request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '更新文档失败'));
    }
  },

  // 删除文档
  async deleteDocument(docId: string): Promise<DeleteResponse> {
    try {
      const response = await axios.delete(`/api/knowledge/delete/${docId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '删除文档失败'));
    }
  },

  // 下载文件
  async downloadFile(docId: string): Promise<Blob> {
    try {
      const response = await axios.get(`/api/knowledge/download/${docId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '下载文件失败'));
    }
  },
};