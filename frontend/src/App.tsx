/**
 * 主应用组件
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppState } from './hooks/useAppState';
import SettingsModal from './components/SettingsModal';
import ProposalPage from './pages/proposal/index';
import TaskList from './pages/task/index';
import KnowledgeBase from './pages/knowledge/index';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import { authApi } from './services';
import { Toaster } from 'react-hot-toast';
import { GlobalConfirmDialog } from './components/GlobalConfirmDialog';
import { useConfirmDialog } from './hooks/useGlobalConfirm';

function AppContent() {
  const {
    state,
    updateConfig,
    handleLogin,
    handleLogout,
    updateMenu,
    toggleSettingsModal,
  } = useAppState();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useConfirmDialog(setConfirmDialog);

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      handleLogin(savedUsername);
    }
    setIsCheckingAuth(false);
  }, [handleLogin]);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/proposal')) {
      updateMenu('proposal');
    } else if (path.startsWith('/knowledge')) {
      updateMenu('knowledge');
    }
  }, [location.pathname, updateMenu]);

  const handleLogoutClick = async () => {
    try {
      await authApi.logout();
    } catch {
    }
    handleLogout();
    navigate('/login');
  };

  const onLoginSuccess = (token: string, username: string) => {
    handleLogin(username);
    navigate('/proposal');
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
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const isProposalDetail = location.pathname.startsWith('/proposal/');

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {!isProposalDetail && (
        <Sidebar
          onSettingsClick={() => toggleSettingsModal(true)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {!isProposalDetail && (
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
        )}

        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/proposal" element={<TaskList />} />
            <Route path="/proposal/:taskId" element={<ProposalPage />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/knowledge/:companyId" element={<KnowledgeBase />} />
            <Route path="/" element={<Navigate to="/proposal" />} />
            <Route path="*" element={<Navigate to="/proposal" />} />
          </Routes>
        </div>
      </div>

      <SettingsModal
        isOpen={state.settingsModalOpen}
        onClose={() => toggleSettingsModal(false)}
        config={state.config}
        onConfigChange={updateConfig}
      />

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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
