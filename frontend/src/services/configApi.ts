/**
 * 配置 API
 */
import api from './axios';

export interface ConfigData {
  api_key: string;
  base_url?: string;
  model_name: string;
}

export const configApi = {
  saveConfig: (config: ConfigData) => api.post('/api/config/save', config),
  
  loadConfig: () => api.get<ConfigData>('/api/config/load'),
  
  getModels: (config: ConfigData) => api.post<{ models: string[]; success: boolean; message: string }>('/api/config/models', config),
};