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