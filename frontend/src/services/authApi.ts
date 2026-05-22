/**
 * 认证 API
 */
import api from './axios';

// 用户信息
export interface UserInfo {
  user_id: string;
  username: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
}

// 注册响应
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: UserInfo;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { username, password }),
  
  register: (username: string, password: string) =>
    api.post<RegisterResponse>('/api/auth/register', { username, password }),
  
  verify: () => api.get<{ success: boolean; user: UserInfo }>('/api/auth/verify'),
  
  logout: () => api.post('/api/auth/logout', {}),
};