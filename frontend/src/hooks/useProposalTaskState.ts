/**
 * 标书任务状态管理Hook - 使用后端API
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { ProposalTask, OutlineData } from '../services';
import { taskApi, getErrorMessage } from '../services';

export const useProposalTaskState = () => {
  const [tasks, setTasks] = useState<ProposalTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const currentTask = tasks.find(t => t.id === currentTaskId) || null;

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskApi.listTasks();
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (err) {
      setError(getErrorMessage(err, '加载任务列表失败'));
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载任务列表（防止 StrictMode 双重调用）
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadTasks();
    }
  }, [loadTasks]);

  // 刷新任务列表
  const refreshTasks = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  // 添加任务
  const createTask = useCallback(async (name?: string, description?: string, companyId?: string) => {
    setError(null);
    try {
      const payload: { name: string; description: string; company_id?: string } = {
        name: name || '未命名标书',
        description: description || '',
      };
      if (companyId) {
        payload.company_id = companyId;
      }
      const response = await taskApi.createTask(payload);
      if (response.data.success) {
        await loadTasks();
        return response.data.task;
      }
      return null;
    } catch (err) {
      setError(getErrorMessage(err, '创建任务失败'));
      console.error('创建任务失败:', err);
      return null;
    }
  }, [loadTasks]);

  // 更新任务
  const updateTask = useCallback(async (taskId: string, updates: Partial<ProposalTask>) => {
    setError(null);
    try {
      // 转换属性名（后端使用下划线）
      const payload: Record<string, unknown> = {};
      if (updates.fileContent !== undefined) payload.fileContent = updates.fileContent;
      if (updates.projectOverview !== undefined) payload.projectOverview = updates.projectOverview;
      if (updates.techRequirements !== undefined) payload.techRequirements = updates.techRequirements;
      if (updates.outlineData !== undefined) payload.outlineData = updates.outlineData;
      if (updates.currentStep !== undefined) payload.currentStep = updates.currentStep;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.companyId !== undefined) payload.companyId = updates.companyId;
      if (updates.minPages !== undefined) payload.minPages = updates.minPages;
      if (updates.maxPages !== undefined) payload.maxPages = updates.maxPages;
      if (updates.tablePreference !== undefined) payload.tablePreference = updates.tablePreference;

      const response = await taskApi.updateTask(taskId, payload);
      if (response.data.success) {
        await loadTasks();
        return response.data.task;
      }
      return null;
    } catch (err) {
      setError(getErrorMessage(err, '更新任务失败'));
      console.error('更新任务失败:', err);
      return null;
    }
  }, [loadTasks]);

  // 删除任务
  const deleteTask = useCallback(async (taskId: string) => {
    setError(null);
    try {
      const response = await taskApi.deleteTask(taskId);
      if (response.data.success) {
        await loadTasks();
        if (currentTaskId === taskId) {
          setCurrentTaskId(null);
        }
        return true;
      }
      return false;
    } catch (err) {
      setError(getErrorMessage(err, '删除任务失败'));
      console.error('删除任务失败:', err);
      return false;
    }
  }, [currentTaskId, loadTasks]);

  // 选择任务
  const selectTask = useCallback((taskId: string | null) => {
    setCurrentTaskId(taskId);
  }, []);

  // 更新文件内容
  const updateFileContent = useCallback(async (content: string) => {
    if (!currentTaskId) return;
    await updateTask(currentTaskId, { 
      fileContent: content,
      status: content ? 'analyzing' : 'draft',
      progress: content ? 10 : 0
    });
  }, [currentTaskId, updateTask]);

  // 更新分析结果（完成步骤1后进入步骤2）
  const updateAnalysisResults = useCallback(async (overview: string, requirements: string) => {
    if (!currentTaskId) return;
    await updateTask(currentTaskId, {
      projectOverview: overview,
      techRequirements: requirements,
      status: 'outline',
      progress: 33,
      currentStep: 2,
    });
  }, [currentTaskId, updateTask]);

  // 更新目录（完成步骤2后进入步骤3）
  const updateOutline = useCallback(async (outlineData: OutlineData) => {
    if (!currentTaskId) return;
    await updateTask(currentTaskId, {
      outlineData,
      status: 'content',
      progress: 66,
      currentStep: 3,
    });
  }, [currentTaskId, updateTask]);

  // 更新步骤
  const updateStep = useCallback(async (step: number) => {
    if (!currentTaskId) return;
    const progressMap: Record<number, number> = { 1: 33, 2: 66, 3: 100 };
    const statusMap: Record<number, 'draft' | 'analyzing' | 'outline' | 'content' | 'completed'> = { 
      1: 'analyzing', 
      2: 'outline', 
      3: 'content' 
    };
    await updateTask(currentTaskId, { 
      currentStep: step,
      progress: progressMap[step] || 0,
      status: statusMap[step] || 'draft'
    });
  }, [currentTaskId, updateTask]);

  // 下一步
  const nextStep = useCallback(async () => {
    if (!currentTask || currentTask.currentStep >= 3) return;
    await updateStep(currentTask.currentStep + 1);
  }, [currentTask, updateStep]);

  // 上一步
  const prevStep = useCallback(async () => {
    if (!currentTask || currentTask.currentStep <= 1) return;
    await updateStep(currentTask.currentStep - 1);
  }, [currentTask, updateStep]);

  // 重置任务（重置到步骤1）
  const resetTask = useCallback(async (taskId: string) => {
    await updateTask(taskId, {
      fileContent: '',
      projectOverview: '',
      techRequirements: '',
      outlineData: null,
      currentStep: 1,
      status: 'draft',
      progress: 0,
    });
  }, [updateTask]);

  // 根据ID获取任务
  const getTaskById = useCallback((taskId: string): ProposalTask | null => {
    return tasks.find(t => t.id === taskId) || null;
  }, [tasks]);

  return {
    tasks,
    currentTask,
    currentTaskId,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    getTaskById,
    updateFileContent,
    updateAnalysisResults,
    updateOutline,
    updateStep,
    nextStep,
    prevStep,
    resetTask,
    refreshTasks,
  };
};