import React, { useState, useEffect, useRef } from 'react';
import { configApi, getErrorMessage, ConfigData } from '../services';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigData;
  onConfigChange: (config: ConfigData) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<ConfigData>(config);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isOpen && isInitialLoad.current) {
      isInitialLoad.current = false;
      const loadConfigFromServer = async () => {
        try {
          const response = await configApi.loadConfig();
          if (response.data) {
            setLocalConfig(response.data);
          }
        } catch (error) {
          console.warn('加载配置失败:', error);
          setLocalConfig(config);
        }
      };
      loadConfigFromServer();
    }

    if (!isOpen) {
      isInitialLoad.current = true;
    }
  }, [isOpen, config]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await configApi.saveConfig(localConfig);

      if (response.data.success) {
        onConfigChange(localConfig);
        setMessage({ type: 'success', text: '配置保存成功！' });
        setTimeout(() => {
          setMessage(null);
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.data.message || '配置保存失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, '配置保存失败') });
    } finally {
      setLoading(false);
    }
  };

  const handleGetModels = async () => {
    if (!localConfig.api_key) {
      setMessage({ type: 'error', text: '请先输入API Key' });
      return;
    }

    try {
      setLoading(true);
      const response = await configApi.getModels(localConfig);
      
      if (response.data.success) {
        setModels(response.data.models);
        if (response.data.models.length > 0 && !response.data.models.includes(localConfig.model_name)) {
          setLocalConfig({ ...localConfig, model_name: response.data.models[0] });
        }
        setMessage({ type: 'success', text: `获取到 ${response.data.models.length} 个模型` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, '获取模型列表失败') });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>

        <div className="relative inline-block w-full max-w-lg overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  ⚙️ 系统配置
                </h3>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      id="api_key"
                      value={localConfig.api_key}
                      onChange={(e) => setLocalConfig({ ...localConfig, api_key: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="输入你的OpenAI API密钥"
                    />
                  </div>

                  <div>
                    <label htmlFor="base_url" className="block text-sm font-medium text-gray-700">
                      Base URL (可选)
                    </label>
                    <input
                      type="text"
                      id="base_url"
                      value={localConfig.base_url || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, base_url: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="如果使用代理或其他服务，请输入base URL"
                    />
                  </div>

                  <div>
                    <label htmlFor="model_name" className="block text-sm font-medium text-gray-700">
                      模型名称
                    </label>
                    <button
                      onClick={handleGetModels}
                      disabled={loading}
                      className="w-full mb-3 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                      {loading ? '获取中...' : '🔄 获取可用模型'}
                    </button>

                    {models.length > 0 ? (
                      <select
                        id="model_name"
                        value={localConfig.model_name}
                        onChange={(e) => setLocalConfig({ ...localConfig, model_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="model_name"
                        value={localConfig.model_name}
                        onChange={(e) => setLocalConfig({ ...localConfig, model_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="输入要使用的模型名称"
                      />
                    )}
                  </div>

                  {message && (
                    <div className={`p-3 rounded-md text-sm ${
                      message.type === 'success' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;