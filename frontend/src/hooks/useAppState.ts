/**
 * 应用状态管理Hook
 */
import { useState, useCallback } from 'react';
import { AppState } from '../types';
import { ConfigData } from '../services';

const initialState: AppState = {
  config: {} as ConfigData,
  isLoggedIn: false,
  username: '',
  currentMenu: 'proposal',
  settingsModalOpen: false,
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>(initialState);

  const updateConfig = useCallback((config: ConfigData) => {
    setState(prev => ({ ...prev, config }));
  }, []);

  const handleLogin = useCallback((username: string) => {
    setState(prev => ({ ...prev, isLoggedIn: true, username }));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    setState({ ...initialState });
  }, []);

  const updateMenu = useCallback((menu: 'proposal' | 'knowledge') => {
    setState(prev => ({ ...prev, currentMenu: menu }));
  }, []);

  const toggleSettingsModal = useCallback((open?: boolean) => {
    setState(prev => ({ ...prev, settingsModalOpen: open !== undefined ? open : !prev.settingsModalOpen }));
  }, []);

  return {
    state,
    updateConfig,
    handleLogin,
    handleLogout,
    updateMenu,
    toggleSettingsModal,
  };
};