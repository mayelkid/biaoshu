/**
 * 标书制作 API - 合并文档、目录、内容、扩展库相关接口
 */
import api from './axios';
import { postJson } from './utils';

// ============ 类型定义 ============

export interface OutlineItem {
  id: string;
  title: string;
  description: string;
  source_requirement_id?: string;
  source_requirement_title?: string;
  children?: OutlineItem[];
  content?: string;
}

export type OutlineMode = 'free' | 'aligned';

export interface OutlineData {
  outline: OutlineItem[];
  project_name?: string;
  project_overview?: string;
}

// 文件上传响应
export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_content?: string;
  old_outline?: string;
}

// 分析请求
export interface AnalysisRequest {
  file_content: string;
  analysis_type: 'overview' | 'requirements';
}

// 目录生成请求
export interface OutlineRequest {
  overview: string;
  requirements: string;
  mode?: OutlineMode;
  uploaded_expand?: boolean;
  old_outline?: string;
  old_document?: string;
  min_pages?: number;
  max_pages?: number;
  table_preference?: string;
}

// 章节内容生成请求
export interface ChapterContentRequest {
  chapter: OutlineItem;
  parent_chapters?: OutlineItem[];
  sibling_chapters?: OutlineItem[];
  project_overview: string;
  min_pages?: number;
  max_pages?: number;
  table_preference?: string;
}

// Word 导出请求
export interface WordExportRequest {
  project_name?: string;
  outline: OutlineItem[];
}

// 流式事件
export interface StreamEvent {
  type?: 'progress' | 'result';
  chunk?: string;
  outline?: OutlineData;
  error?: boolean;
  message?: string;
}

// ============ API 接口 ============

// 文档相关接口
export const documentApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FileUploadResponse>('/api/document/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  analyzeDocumentStream: (data: AnalysisRequest) => postJson('/api/document/analyze-stream', data),
  
  exportWord: async (data: WordExportRequest) => {
    const response = await postJson('/api/document/export-word', data);
    if (!response.ok) {
      throw new Error('导出失败');
    }
    return response;
  },
};

// 目录相关接口
export const outlineApi = {
  generateOutline: (data: OutlineRequest) => api.post<OutlineData>('/api/outline/generate', data),
  
  generateOutlineStream: (data: OutlineRequest) => postJson('/api/outline/generate-stream', data),
};

// 内容相关接口
export const contentApi = {
  generateChapterContent: (data: ChapterContentRequest) => 
    api.post<{ success: boolean; content: string }>('/api/content/generate-chapter', data),
  
  generateChapterContentStream: (data: ChapterContentRequest) => 
    postJson('/api/content/generate-chapter-stream', data),
};

// 扩展库相关接口
export const expandApi = {
  uploadExpandFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<FileUploadResponse>('/api/expand/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
    });
  },
};

// 统一导出标书制作相关API
export const proposalApi = {
  document: documentApi,
  outline: outlineApi,
  content: contentApi,
  expand: expandApi,
};