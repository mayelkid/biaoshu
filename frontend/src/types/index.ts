/**
 * 应用状态类型定义
 */

// 全局应用状态
export interface AppState {
  config: {
    api_key: string;
    base_url?: string;
    model_name: string;
  },
  isLoggedIn: boolean;
  username: string;
  currentMenu: 'proposal' | 'knowledge';
  settingsModalOpen: boolean;
}

// 企业相关类型
export interface Company {
  id: string;
  name: string;
  description?: string;
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

// 文档相关类型
export interface KnowledgeDocument {
  id: string;
  title: string;
  content?: string;
  file_path?: string;
  file_name?: string;
  document_type: 'text' | 'image' | 'file';
  category: 'company_info' | 'qualification' | 'project' | 'standard' | 'other';
  tags?: string[];
  description?: string;
  user_id: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  document_type: 'text' | 'image' | 'file';
  category: 'company_info' | 'qualification' | 'project' | 'standard' | 'other';
  tags?: string[];
  description?: string;
  company_id?: string;
}