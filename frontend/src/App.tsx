/**
 * 主应用组件
 */
import React, { useEffect, useState } from 'react';
import { useAppState } from './hooks/useAppState';
import SettingsModal from './components/SettingsModal';
import ProposalPage from './pages/proposal/index';
import TaskList from './pages/task/index';
import KnowledgeBase from './pages/knowledge/index';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import { authApi } from './services';
import { ProposalTask } from './services';
import { Toaster } from 'react-hot-toast';
import { GlobalConfirmDialog } from './components/GlobalConfirmDialog';
import { useConfirmDialog, showConfirm } from './hooks/useGlobalConfirm';

function App() {
  const {
    state,
    updateConfig,
    handleLogin,
    handleLogout,
    updateMenu,
    toggleSettingsModal,
  } = useAppState();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ProposalTask | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // 使用全局确认对话框 Hook
  useConfirmDialog(setConfirmDialog);

  useEffect(() => {
    const checkAuth = async () => {
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        try {
          const response = await authApi.verify();
          if (response.data.success) {
            handleLogin(response.data.user.username);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('username');
          }
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [handleLogin]);

  const handleLogoutClick = async () => {
    try {
      await authApi.logout();
    } catch {
    }
    handleLogout();
    setSelectedTask(null);
  };

  const onLoginSuccess = (token: string, username: string) => {
    handleLogin(username);
  };

  const handleSelectTask = (task: ProposalTask) => {
    setSelectedTask(task);
  };

  const handleBackFromProposal = () => {
    setSelectedTask(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!state.isLoggedIn) {
    return <Login onLoginSuccess={onLoginSuccess} />;
  }

  // 如果选中了任务，显示标书制作页面（独立页面，无侧边栏和设置按钮）
  if (selectedTask) {
    return <ProposalPage task={selectedTask} onBack={handleBackFromProposal} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* 左侧菜单栏 */}
      <Sidebar
        currentMenu={state.currentMenu}
        onMenuChange={updateMenu}
        onSettingsClick={() => toggleSettingsModal(true)}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部标题栏 */}
        <div className="sticky top-0 z-50 bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {state.currentMenu === 'proposal' ? '标书制作' : '知识库'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{state.username}</span>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="退出登录"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出
            </button>
          </div>
        </div>

        {/* 页面内容 */}
        {state.currentMenu === 'proposal' ? (
          <div className="flex-1 overflow-y-auto">
            <TaskList onSelectTask={handleSelectTask} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <KnowledgeBase />
          </div>
        )}
      </div>

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={state.settingsModalOpen}
        onClose={() => toggleSettingsModal(false)}
        config={state.config}
        onConfigChange={updateConfig}
      />

      {/* Toast 提示 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />

      {/* 确认对话框 */}
      {confirmDialog && (
        <GlobalConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}

export default App;