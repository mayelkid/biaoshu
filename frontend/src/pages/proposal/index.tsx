/**
 * 标书制作页面（独立页面）
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import StepBar from '../../components/StepBar';
import DocumentAnalysis from './DocumentAnalysis';
import OutlineEdit from './OutlineEdit';
import ContentEdit from './ContentEdit';
import { useProposalTaskState } from '../../hooks/useProposalTaskState';

const stepLabels = ['标书解析', '目录编辑', '正文编辑'];

const ProposalPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { updateTask, getTaskById, loading } = useProposalTaskState();

  const [task, setTask] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [fileContent, setFileContent] = useState('');
  const [projectOverview, setProjectOverview] = useState('');
  const [techRequirements, setTechRequirements] = useState('');
  const [outlineData, setOutlineData] = useState<any>(null);
  const [status, setStatus] = useState<'draft' | 'analyzing' | 'outline' | 'content' | 'completed'>('draft');
  const [progress, setProgress] = useState(0);
  // 生成偏好（任务级）
  const [minPages, setMinPages] = useState(20);
  const [maxPages, setMaxPages] = useState(100);
  const [tablePreference, setTablePreference] = useState<'none' | 'medium' | 'heavy'>('medium');

  // 使用 ref 跟踪最新数据，避免闭包问题
  const dataRef = useRef({
    fileContent: '',
    projectOverview: '',
    techRequirements: '',
    outlineData: null as any,
    currentStep: 1,
    status: 'draft' as 'draft' | 'analyzing' | 'outline' | 'content' | 'completed',
    progress: 0,
    minPages: 20,
    maxPages: 100,
    tablePreference: 'medium' as 'none' | 'medium' | 'heavy',
  });

  useEffect(() => {
    dataRef.current = { fileContent, projectOverview, techRequirements, outlineData, currentStep, status, progress, minPages, maxPages, tablePreference };
  }, [fileContent, projectOverview, techRequirements, outlineData, currentStep, status, progress, minPages, maxPages, tablePreference]);

  useEffect(() => {
    if (!taskId || loading) return;
    const foundTask = getTaskById(taskId);
    if (foundTask) {
      setTask(foundTask);
      setCurrentStep(foundTask.currentStep || 1);
      setFileContent(foundTask.fileContent || '');
      setProjectOverview(foundTask.projectOverview || '');
      setTechRequirements(foundTask.techRequirements || '');
      setOutlineData(foundTask.outlineData || null);
      setStatus(foundTask.status || 'draft');
      setProgress(foundTask.progress || 0);
      // 加载任务级偏好
      setMinPages(foundTask.minPages ?? 20);
      setMaxPages(foundTask.maxPages ?? 100);
      setTablePreference(foundTask.tablePreference ?? 'medium');
    }
  }, [taskId, getTaskById, loading]);

  // 当 task 从外部更新时（如列表页刷新），同步到本地 state
  // 但避免覆盖用户正在编辑的未保存内容——通过比较 updatedAt 判断
  useEffect(() => {
    if (!task) return;
    const serverStep = task.currentStep || 1;
    const serverStatus = task.status || 'draft';
    // 只在服务器数据比本地新时同步（避免覆盖用户正在编辑的内容）
    // 但由于页面加载时已经通过上面的 useEffect 同步过了，
    // 这里只需要处理 task 从外部更新的情况
    // 简单方案：只在页面首次加载时从 task 同步，后续 task 变化不覆盖本地 state
  }, [task]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">任务不存在或已被删除</p>
          <button
            onClick={() => navigate('/proposal')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回任务列表
          </button>
        </div>
      </div>
    );
  }

  const handlePrev = async () => {
    const data = dataRef.current;
    if (data.currentStep > 1) {
      const prevStep = data.currentStep - 1;
      const newProgress = Math.round((prevStep / 3) * 100);
      const statusMap: Record<number, 'draft' | 'analyzing' | 'outline' | 'content' | 'completed'> = {
        1: 'analyzing',
        2: 'outline',
        3: 'content',
      };

      setCurrentStep(prevStep);
      setProgress(newProgress);
      setStatus(statusMap[prevStep]);

      await updateTask(task.id, {
        fileContent: data.fileContent,
        projectOverview: data.projectOverview,
        techRequirements: data.techRequirements,
        outlineData: data.outlineData,
        currentStep: prevStep,
        progress: newProgress,
        status: statusMap[prevStep],
        minPages: data.minPages,
        maxPages: data.maxPages,
        tablePreference: data.tablePreference,
      });
    }
  };

  const handleNext = async () => {
    const data = dataRef.current;
    if (data.currentStep < 3) {
      if (data.currentStep === 1) {
        if (!data.projectOverview.trim() || !data.techRequirements.trim()) {
          toast.error('请先完成标书解析，生成项目概况和技术要求后再进行下一步');
          return;
        }
      } else if (data.currentStep === 2) {
        if (!data.outlineData || !data.outlineData.outline || data.outlineData.outline.length === 0) {
          toast.error('请先生成目录后再进行下一步');
          return;
        }
      }

      const nextStep = data.currentStep + 1;
      const newProgress = Math.round((nextStep / 3) * 100);
      const statusMap: Record<number, 'draft' | 'analyzing' | 'outline' | 'content' | 'completed'> = {
        1: 'analyzing',
        2: 'outline',
        3: 'content',
      };

      setCurrentStep(nextStep);
      setProgress(newProgress);
      setStatus(statusMap[nextStep]);

      await updateTask(task.id, {
        fileContent: data.fileContent,
        projectOverview: data.projectOverview,
        techRequirements: data.techRequirements,
        outlineData: data.outlineData,
        currentStep: nextStep,
        progress: newProgress,
        status: statusMap[nextStep],
        minPages: data.minPages,
        maxPages: data.maxPages,
        tablePreference: data.tablePreference,
      });
    }
  };

  const handleSave = async () => {
    await updateTask(task.id, {
      fileContent,
      projectOverview,
      techRequirements,
      outlineData,
      currentStep,
      status,
      progress,
      minPages,
      maxPages,
      tablePreference,
    });
    toast.success('保存成功');
  };

  // 解析完成：自动保存到后端
  const handleFileAnalyzed = async (fc: string, overview: string, requirements: string) => {
    setFileContent(fc);
    setProjectOverview(overview);
    setTechRequirements(requirements);
    setStatus('analyzing');

    await updateTask(task.id, {
      fileContent: fc,
      projectOverview: overview,
      techRequirements: requirements,
      status: 'analyzing',
      progress: 33,
    });
  };

  // 目录生成/编辑完成：自动保存到后端
  const handleOutlineGenerated = async (outline: typeof outlineData) => {
    setOutlineData(outline);
    setStatus('outline');

    await updateTask(task.id, {
      outlineData: outline,
      status: 'outline',
      progress: 66,
    });
  };

  // 正文生成完成：自动保存到后端
  const handleContentUpdated = async (outline: typeof outlineData) => {
    setOutlineData(outline);
    setStatus('content');

    await updateTask(task.id, {
      outlineData: outline,
      status: 'content',
      progress: 100,
    });
  };

  // 偏好变更：只更新本地状态，不立即请求接口，等点击下一步/保存时统一保存
  const handlePreferenceChange = (updates: { minPages?: number; maxPages?: number; tablePreference?: 'none' | 'medium' | 'heavy' }) => {
    if (updates.minPages !== undefined) setMinPages(updates.minPages);
    if (updates.maxPages !== undefined) setMaxPages(updates.maxPages);
    if (updates.tablePreference !== undefined) setTablePreference(updates.tablePreference);
    // 不立即调用 updateTask，由 handleNext / handlePrev / handleSave 统一保存
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentAnalysis
            fileContent={fileContent}
            projectOverview={projectOverview}
            techRequirements={techRequirements}
            minPages={minPages}
            maxPages={maxPages}
            tablePreference={tablePreference}
            onFileUpload={setFileContent}
            onAnalysisComplete={handleFileAnalyzed}
            onPreferenceChange={handlePreferenceChange}
          />
        );
      case 2:
        return (
          <OutlineEdit
            projectOverview={projectOverview}
            techRequirements={techRequirements}
            outlineData={outlineData}
            onOutlineGenerated={handleOutlineGenerated}
            minPages={minPages}
            maxPages={maxPages}
            tablePreference={tablePreference}
          />
        );
      case 3:
        return (
          <ContentEdit
            outlineData={outlineData}
            onContentUpdated={handleContentUpdated}
            minPages={minPages}
            maxPages={maxPages}
            tablePreference={tablePreference}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/proposal')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                返回
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-xl font-bold text-gray-800">{task.name}</h1>
              <p className="text-sm text-gray-500">{task.description || '标书制作'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DocumentCheckIcon className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <StepBar
            steps={stepLabels}
            currentStep={currentStep - 1}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {renderStepContent()}
      </div>

      {/* 底部导航按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              上一步
            </button>
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                下一步
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            )}
            {currentStep === 3 && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <DocumentCheckIcon className="w-5 h-5" />
                完成制作
              </button>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ProposalPage;
