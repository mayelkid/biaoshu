/**
 * 标书制作页面（独立页面）
 */
import React, { useState, useEffect } from 'react';
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
    }
  }, [taskId, getTaskById, loading]);

  useEffect(() => {
    if (!task) return;
    setCurrentStep(task.currentStep || 1);
    setFileContent(task.fileContent || '');
    setProjectOverview(task.projectOverview || '');
    setTechRequirements(task.techRequirements || '');
    setOutlineData(task.outlineData || null);
    setStatus(task.status || 'draft');
    setProgress(task.progress || 0);
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
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
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
        currentStep: prevStep,
        progress: newProgress,
        status: statusMap[prevStep],
      });
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      if (currentStep === 1) {
        if (!projectOverview.trim() || !techRequirements.trim()) {
          toast.error('请先完成标书解析，生成项目概况和技术要求后再进行下一步');
          return;
        }
      } else if (currentStep === 2) {
        if (!outlineData || !outlineData.outline || outlineData.outline.length === 0) {
          toast.error('请先生成目录后再进行下一步');
          return;
        }
      }

      const nextStep = currentStep + 1;
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
        currentStep: nextStep,
        progress: newProgress,
        status: statusMap[nextStep],
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
    });
    toast.success('保存成功');
  };

  const handleFileAnalyzed = (overview: string, requirements: string) => {
    setProjectOverview(overview);
    setTechRequirements(requirements);
    setStatus('analyzing');
  };

  const handleOutlineGenerated = (outline: typeof outlineData) => {
    setOutlineData(outline);
    setStatus('outline');
  };

  const handleContentUpdated = (outline: typeof outlineData) => {
    setStatus('content');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentAnalysis
            fileContent={fileContent}
            projectOverview={projectOverview}
            techRequirements={techRequirements}
            onFileUpload={setFileContent}
            onAnalysisComplete={handleFileAnalyzed}
          />
        );
      case 2:
        return (
          <OutlineEdit
            projectOverview={projectOverview}
            techRequirements={techRequirements}
            outlineData={outlineData}
            onOutlineGenerated={handleOutlineGenerated}
          />
        );
      case 3:
        return (
          <ContentEdit
            outlineData={outlineData}
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
