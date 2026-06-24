/**
 * 知识库API服务
 */
import axios from './axios';
import { getErrorMessage } from './utils';

export type DocumentType = 'text' | 'image' | 'file';

export type DocumentCategory = 'company_info' | 'qualification' | 'project' | 'standard' | 'other';

export interface Company {
  id: string;
  name: string;
  description?: string;
  summary?: string;  // AI 解析摘要
  user_id: string;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  description?: string;
}

export interface CompanyListResponse {
  success: boolean;
  companies: Company[];
}

export interface CompanyResponse {
  success: boolean;
  company?: Company;
}

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
  company_id?: string;
  folder_id?: string;
  summary?: string;  // AI 解析的文档摘要
  parse_status?: 'processing' | 'completed' | 'failed';  // 解析状态
  key_points?: string[];  // 关键要点
  keywords?: string[];  // 关键词
  category_hint?: string;  // 分类建议
  processed_at?: string;  // 处理时间
  created_at: string;
  updated_at: string;
}

export interface DocumentSummary {
  id: string;
  document_id: string;
  company_id?: string;
  summary: string;
  key_points: string[];
  keywords: string[];
  processed_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  document_type: DocumentType;
  category: DocumentCategory;
  tags?: string[];
  description?: string;
  company_id?: string;
  folder_id?: string;
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

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  company_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

export interface UpdateFolderRequest {
  name?: string;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: string;
  company_id?: string;
}

export interface FolderListResponse {
  success: boolean;
  folders: Folder[];
}

// ========== 企业评估类型 ==========

export type EvaluationStatus = 'completed' | 'missing' | 'incomplete' | 'unable_to_determine';

export interface EvaluationItem {
  name: string;
  status: EvaluationStatus;
  detail?: string;
  document_ids: string[];
}

export interface EvaluationCategory {
  name: string;
  items: EvaluationItem[];
  completed_count: number;
  total_count: number;
}

export interface CompanyEvaluationResult {
  company_id: string;
  user_id: string;
  completeness_percentage: number;
  evaluation_time: string;
  categories: EvaluationCategory[];
}

export interface CompanyEvaluationResponse {
  success: boolean;
  message?: string;
  result?: CompanyEvaluationResult;
}

export const evaluationStatusLabels: Record<EvaluationStatus, string> = {
  completed: '已完善',
  missing: '缺失',
  incomplete: '不完整',
  unable_to_determine: '无法判断',
};

export const evaluationStatusColors: Record<EvaluationStatus, string> = {
  completed: 'bg-green-100 text-green-700',
  missing: 'bg-red-100 text-red-700',
  incomplete: 'bg-yellow-100 text-yellow-700',
  unable_to_determine: 'bg-gray-100 text-gray-600',
};

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
  // ========== 企业管理 ==========

  // 获取企业列表
  async listCompanies(): Promise<CompanyListResponse> {
    try {
      const response = await axios.get('/api/knowledge/companies');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取企业列表失败'));
    }
  },

  // 获取企业详情
  async getCompany(companyId: string): Promise<CompanyResponse> {
    try {
      const response = await axios.get(`/api/knowledge/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取企业详情失败'));
    }
  },

  // 创建企业
  async createCompany(request: CreateCompanyRequest): Promise<CompanyResponse> {
    try {
      const response = await axios.post('/api/knowledge/companies', request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '创建企业失败'));
    }
  },

  // 更新企业
  async updateCompany(companyId: string, request: UpdateCompanyRequest): Promise<CompanyResponse> {
    try {
      const response = await axios.put(`/api/knowledge/companies/${companyId}`, request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '更新企业失败'));
    }
  },

  // 删除企业
  async deleteCompany(companyId: string): Promise<DeleteResponse> {
    try {
      const response = await axios.delete(`/api/knowledge/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '删除企业失败'));
    }
  },

  // ========== 文档管理 ==========

  // 获取文档列表
  async listDocuments(keyword?: string, category?: string, companyId?: string, folderId?: string): Promise<DocumentListResponse> {
    try {
      const params: Record<string, string> = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (companyId) params.company_id = companyId;
      if (folderId) params.folder_id = folderId;
      
      const response = await axios.get('/api/knowledge/documents', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取文档列表失败'));
    }
  },

  // 获取文档详情
  async getDocument(docId: string): Promise<DocumentResponse> {
    try {
      const response = await axios.get(`/api/knowledge/documents/${docId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取文档详情失败'));
    }
  },

  // 创建文档（文本）
  async createDocument(request: CreateDocumentRequest): Promise<DocumentResponse> {
    try {
      const response = await axios.post('/api/knowledge/documents', request);
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
    companyId?: string,
    description?: string,
    tags?: string[],
    folderId?: string
  ): Promise<DocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('document_type', file.type.startsWith('image/') ? 'image' : 'file');
      if (companyId) formData.append('company_id', companyId);
      if (description) formData.append('description', description);
      if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (folderId) formData.append('folder_id', folderId);
      formData.append('file', file);

      const response = await axios.post('/api/knowledge/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '上传文件失败'));
    }
  },

  // 批量上传文件（支持多文件）
  async uploadFiles(
    category: DocumentCategory,
    files: File[],
    companyId?: string,
    description?: string,
    tags?: string[],
    folderId?: string
  ): Promise<DocumentListResponse> {
    try {
      const formData = new FormData();
      formData.append('category', category);
      if (companyId) formData.append('company_id', companyId);
      if (description) formData.append('description', description);
      if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (folderId) formData.append('folder_id', folderId);
      
      // 添加多个文件
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/knowledge/documents', formData, {
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
      const response = await axios.put(`/api/knowledge/documents/${docId}`, request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '更新文档失败'));
    }
  },

  // 删除文档
  async deleteDocument(docId: string): Promise<DeleteResponse> {
    try {
      const response = await axios.delete(`/api/knowledge/documents/${docId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '删除文档失败'));
    }
  },

  // 下载文件
  async downloadFile(docId: string): Promise<Blob> {
    try {
      const response = await axios.get(`/api/knowledge/documents/${docId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '下载文件失败'));
    }
  },

  // ========== 文件夹管理 ==========

  // 获取文件夹列表
  async listFolders(companyId?: string): Promise<FolderListResponse> {
    try {
      const params: Record<string, string> = {};
      if (companyId) params.company_id = companyId;
      
      const response = await axios.get('/api/knowledge/folders', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取文件夹列表失败'));
    }
  },

  // 创建文件夹
  async createFolder(request: CreateFolderRequest): Promise<FolderListResponse> {
    try {
      const response = await axios.post('/api/knowledge/folders', request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '创建文件夹失败'));
    }
  },

  // 更新文件夹
  async updateFolder(folderId: string, request: UpdateFolderRequest): Promise<FolderListResponse> {
    try {
      const response = await axios.put(`/api/knowledge/folders/${folderId}`, request);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '更新文件夹失败'));
    }
  },

  // 删除文件夹
  async deleteFolder(folderId: string): Promise<DeleteResponse> {
    try {
      const response = await axios.delete(`/api/knowledge/folders/${folderId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '删除文件夹失败'));
    }
  },

  // 解析文档（触发 AI 解析）
  async parseDocument(documentId: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`/api/knowledge/documents/${documentId}/parse`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '解析文档失败'));
    }
  },

  // 获取文档摘要
  async getDocumentSummary(documentId: string): Promise<DocumentSummary | null> {
    try {
      const response = await axios.get(`/api/knowledge/documents/${documentId}/summary`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // 批量获取文档摘要
  async getDocumentSummaries(documentIds: string[]): Promise<DocumentSummary[]> {
    try {
      const response = await axios.post('/api/knowledge/documents/summaries/batch', {
        document_ids: documentIds
      });
      return response.data.summaries || [];
    } catch (error) {
      return [];
    }
  },

  // ========== 企业评估 ==========

  // 获取企业评估结果
  async getCompanyEvaluation(companyId: string): Promise<CompanyEvaluationResponse> {
    try {
      const response = await axios.get(`/api/knowledge/companies/${companyId}/evaluation`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '获取评估结果失败'));
    }
  },

  // 发起企业评估
  async evaluateCompany(companyId: string): Promise<CompanyEvaluationResponse> {
    try {
      const response = await axios.post(`/api/knowledge/companies/${companyId}/evaluate`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '发起评估失败'));
    }
  },

  // 删除企业评估结果
  async deleteCompanyEvaluation(companyId: string): Promise<DeleteResponse> {
    try {
      const response = await axios.delete(`/api/knowledge/companies/${companyId}/evaluation`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, '删除评估结果失败'));
    }
  },
};