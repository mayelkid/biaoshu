/**
 * 任务列表页面
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, DocumentIcon, TrashIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon} from '@heroicons/react/24/solid';
import { useProposalTaskState } from '../../hooks/useProposalTaskState';
import { ProposalTask } from '../../services';
import { showConfirm } from '../../hooks/useGlobalConfirm';

interface TaskListProps {
  onSelectTask: (task: ProposalTask) => void;
}

const TaskList: React.FC<TaskListProps> = ({ onSelectTask }) => {
  const { tasks, loading, error, createTask, deleteTask, updateTask, refreshTasks } = useProposalTaskState();

  const [showModal, setShowModal] = React.useState<'create' | 'edit' | null>(null);
  const [newTaskName, setNewTaskName] = React.useState('');
  const [newTaskDescription, setNewTaskDescription] = React.useState('');
  const [editingTask, setEditingTask] = React.useState<ProposalTask | null>(null);

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    await createTask(newTaskName.trim(), newTaskDescription.trim());
    setNewTaskName('');
    setNewTaskDescription('');
    setShowModal(null);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !newTaskName.trim()) return;
    await updateTask(editingTask.id, {
      name: newTaskName.trim(),
      description: newTaskDescription.trim(),
    });
    setNewTaskName('');
    setNewTaskDescription('');
    setEditingTask(null);
    setShowModal(null);
  };

  const handleDelete = async (taskId: string) => {
    await showConfirm({
      title: '确认删除',
      message: '确定要删除这个任务吗？',
      onConfirm: async () => {
        await deleteTask(taskId);
        toast.success('删除成功');
      },
    });
  };

  const handleEdit = (task: ProposalTask) => {
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description);
    setShowModal('edit');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      analyzing: { label: '分析中', className: 'bg-yellow-100 text-yellow-600' },
      outline: { label: '目录编辑', className: 'bg-blue-100 text-blue-600' },
      content: { label: '内容编辑', className: 'bg-green-100 text-green-600' },
      completed: { label: '已完成', className: 'bg-purple-100 text-purple-600' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return <ClockIcon className="w-5 h-5 text-gray-400" />;
  };

  React.useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

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
                onClick={() => onSelectTask(task)}
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
                  {/* 进度条 */}
                  <div className="mt-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      ></div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">任务名称</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入标书名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务描述（可选）</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入标书描述"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(null);
                  setEditingTask(null);
                  setNewTaskName('');
                  setNewTaskDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={showModal === 'create' ? handleCreateTask : handleUpdateTask}
                disabled={!newTaskName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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