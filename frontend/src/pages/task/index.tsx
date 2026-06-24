/**
 * 任务列表页面
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusIcon, DocumentIcon, TrashIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon, PencilIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon} from '@heroicons/react/24/solid';
import { useProposalTaskState } from '../../hooks/useProposalTaskState';
import { ProposalTask } from '../../services';
import { showConfirm } from '../../hooks/useGlobalConfirm';
import { knowledgeApi, Company } from '../../services/knowledgeApi';

const TaskList: React.FC = () => {
  const { tasks, loading, error, createTask, deleteTask, updateTask, refreshTasks } = useProposalTaskState();

  const navigate = useNavigate();
  const [showModal, setShowModal] = React.useState<'create' | 'edit' | null>(null);
  const [newTaskName, setNewTaskName] = React.useState('');
  const [newTaskDescription, setNewTaskDescription] = React.useState('');
  const [selectedCompanyId, setSelectedCompanyId] = React.useState('');
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [editingTask, setEditingTask] = React.useState<ProposalTask | null>(null);
  const companiesLoadedRef = React.useRef(false);

  React.useEffect(() => {
    const loadCompanies = async () => {
      if (companiesLoadedRef.current) return;
      companiesLoadedRef.current = true;
      try {
        const response = await knowledgeApi.listCompanies();
        if (response.success) {
          setCompanies(response.companies);
        }
      } catch (error) {
        console.error('加载企业列表失败:', error);
      }
    };
    loadCompanies();
  }, []);

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    await createTask(newTaskName.trim(), newTaskDescription.trim(), selectedCompanyId || undefined);
    setNewTaskName('');
    setNewTaskDescription('');
    setSelectedCompanyId('');
    setShowModal(null);
  };

  const handleEdit = (task: ProposalTask) => {
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description || '');
    setSelectedCompanyId(task.companyId || '');
    setShowModal('edit');
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !newTaskName.trim()) return;
    await updateTask(editingTask.id, { 
      name: newTaskName.trim(), 
      description: newTaskDescription.trim(),
      companyId: selectedCompanyId || undefined,
    });
    setEditingTask(null);
    setNewTaskName('');
    setNewTaskDescription('');
    setSelectedCompanyId('');
    setShowModal(null);
  };

  const handleDelete = (taskId: string) => {
    showConfirm({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除吗？',
      onConfirm: async () => {
        await deleteTask(taskId);
        toast.success('删除成功');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: '待处理', className: 'bg-yellow-100 text-yellow-700' },
      analyzing: { text: '解析中', className: 'bg-blue-100 text-blue-700' },
      outlining: { text: '大纲编辑', className: 'bg-purple-100 text-purple-700' },
      writing: { text: '写作中', className: 'bg-indigo-100 text-indigo-700' },
      completed: { text: '已完成', className: 'bg-green-100 text-green-700' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-300 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-300 bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">加载失败: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">我的标书</h2>
              <span className="text-sm text-gray-500">管理您的标书制作任务</span>
            </div>
            <button
              onClick={() => setShowModal('create')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              新建标书
            </button>
          </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-auto p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-lg font-medium text-gray-600 mt-4">暂无标书任务</h3>
            <p className="text-gray-400 mt-2">点击右上角按钮创建第一个标书</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/proposal/${task.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.name}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                          {task.companyId && (
                            <div className="flex items-center gap-1 mt-1">
                              <BuildingOfficeIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {companies.find(c => c.id === task.companyId)?.name || '未知企业'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        {getStatusIcon(task.status)}
                        {getStatusBadge(task.status)}
                        <span className="text-sm text-gray-400">
                          进度: {task.progress}%
                        </span>
                        <span className="text-sm text-gray-400">
                          更新于: {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(task);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑任务弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {showModal === 'create' ? '新建标书任务' : '编辑标书任务'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标书名称</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入标书名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标书描述</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="请输入标书描述"
                />
              </div>
              {(showModal === 'create' || showModal === 'edit') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联企业（可选）</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">不关联企业</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.document_count} 份资料)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">关联企业后，AI生成标书时将参考该企业的资料</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(null);
                  setEditingTask(null);
                  setNewTaskName('');
                  setNewTaskDescription('');
                  setSelectedCompanyId('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={showModal === 'create' ? handleCreateTask : handleUpdateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showModal === 'create' ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
