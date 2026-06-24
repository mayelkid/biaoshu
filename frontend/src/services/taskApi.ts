/**
 * 任务 API
 */
import api from './axios';

// 标书任务
export interface ProposalTask {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'analyzing' | 'outline' | 'content' | 'completed';
  progress: number;
  fileContent: string;
  projectOverview: string;
  techRequirements: string;
  outlineData: OutlineData | null;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  companyId?: string;
  // 生成偏好
  minPages?: number;
  maxPages?: number;
  tablePreference?: 'none' | 'medium' | 'heavy';
}

// 创建任务请求
export interface CreateTaskRequest {
  name: string;
  description?: string;
  company_id?: string;
}

// 更新任务请求
export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  fileContent?: string;
  projectOverview?: string;
  techRequirements?: string;
  outlineData?: OutlineData;
  currentStep?: number;
  status?: string;
  progress?: number;
  companyId?: string;
  // 生成偏好
  minPages?: number;
  maxPages?: number;
  tablePreference?: 'none' | 'medium' | 'heavy';
}

export interface OutlineItem {
  id: string;
  title: string;
  description: string;
  source_requirement_id?: string;
  source_requirement_title?: string;
  children?: OutlineItem[];
  content?: string;
}

export interface OutlineData {
  outline: OutlineItem[];
  project_name?: string;
  project_overview?: string;
}


export const taskApi = {
  listTasks: () => api.get<{ tasks: ProposalTask[]; success: boolean }>('/api/tasks/list'),
  
  getTask: (taskId: string) => api.get<{ task: ProposalTask; success: boolean }>(`/api/tasks/detail/${taskId}`),
  
  createTask: (data: CreateTaskRequest) => 
    api.post<{ task: ProposalTask; success: boolean }>('/api/tasks/create', data),
  
  updateTask: (taskId: string, data: UpdateTaskRequest) => 
    api.put<{ task: ProposalTask; success: boolean }>(`/api/tasks/update/${taskId}`, data),
  
  deleteTask: (taskId: string) => 
    api.delete<{ success: boolean; message: string }>(`/api/tasks/delete/${taskId}`),
  
  completeTask: (taskId: string) => 
    api.post<{ task: ProposalTask; success: boolean }>(`/api/tasks/complete/${taskId}`),
};