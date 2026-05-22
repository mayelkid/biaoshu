/**
 * API 服务统一导出
 */

// 基础服务
export { default as api } from './axios';

// 工具函数
export { getErrorMessage, readSseStream, collectSseText } from './utils';

// 认证相关类型和API
export { authApi } from './authApi';
export type { UserInfo, LoginResponse, RegisterResponse } from './authApi';

// 配置相关类型和API
export { configApi } from './configApi';
export type { ConfigData } from './configApi';

// 任务相关类型和API
export { taskApi } from './taskApi';
export type { ProposalTask, CreateTaskRequest, UpdateTaskRequest } from './taskApi';

// 标书制作相关类型和API
export { proposalApi } from './proposalApi';
export { documentApi } from './proposalApi';
export { outlineApi } from './proposalApi';
export { contentApi } from './proposalApi';
export { expandApi } from './proposalApi';
export type {
  OutlineItem,
  OutlineMode,
  OutlineData,
  FileUploadResponse,
  AnalysisRequest,
  OutlineRequest,
  ChapterContentRequest,
  WordExportRequest,
  StreamEvent,
} from './proposalApi';