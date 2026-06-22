/**
 * 知识库页面 - 企业列表 + 企业详情
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { showConfirm } from '../../hooks/useGlobalConfirm';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentTextIcon,
  PhotoIcon,
  DocumentIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  XMarkIcon,
  TagIcon,
  FolderIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import {
  knowledgeApi,
  KnowledgeDocument,
  DocumentCategory,
  DocumentType,
  categoryLabels,
  typeLabels,
  Company,
} from '../../services/knowledgeApi';

type ViewMode = 'company-list' | 'company-detail';

const KnowledgeBase: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('company-list');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | ''>('');

  // 企业弹窗
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    description: '',
  });

  // 文档弹窗
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    content: '',
    category: 'company_info' as DocumentCategory,
    documentType: 'text' as DocumentType,
    tags: '',
    description: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const companiesLoadedRef = useRef(false);

  // 加载企业列表
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await knowledgeApi.listCompanies();
      if (response.success) {
        setCompanies(response.companies);
        
        // 如果路由中有 companyId，自动查找并进入企业详情
        if (companyId) {
          const foundCompany = response.companies.find(c => c.id === companyId);
          if (foundCompany) {
            setSelectedCompany(foundCompany);
            setViewMode('company-detail');
          }
        }
      }
    } catch (error) {
      console.error('加载企业列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载文档列表
  const loadDocuments = async () => {
    if (!selectedCompany) return;
    
    setLoading(true);
    try {
      const response = await knowledgeApi.listDocuments(
        keyword || undefined,
        selectedCategory || undefined,
        selectedCompany.id
      );
      if (response.success) {
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('加载文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companiesLoadedRef.current) {
      companiesLoadedRef.current = true;
      loadCompanies();
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadDocuments();
    }
  }, [keyword, selectedCategory, selectedCompany]);

  useEffect(() => {
    if (companyId && companies.length > 0) {
      const foundCompany = companies.find(c => c.id === companyId);
      if (foundCompany && selectedCompany?.id !== companyId) {
        setSelectedCompany(foundCompany);
        setViewMode('company-detail');
      }
    }
  }, [companyId, companies]);

  // 打开企业创建/编辑弹窗
  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyFormData({
        name: company.name,
        description: company.description || '',
      });
    } else {
      setEditingCompany(null);
      setCompanyFormData({
        name: '',
        description: '',
      });
    }
    setShowCompanyModal(true);
  };

  // 关闭企业弹窗
  const closeCompanyModal = () => {
    setShowCompanyModal(false);
    setEditingCompany(null);
  };

  // 保存企业
  const handleSaveCompany = async () => {
    if (!companyFormData.name.trim()) {
      toast.error('请输入企业名称');
      return;
    }

    try {
      if (editingCompany) {
        await knowledgeApi.updateCompany(editingCompany.id, {
          name: companyFormData.name,
          description: companyFormData.description,
        });
      } else {
        await knowledgeApi.createCompany({
          name: companyFormData.name,
          description: companyFormData.description,
        });
      }

      closeCompanyModal();
      loadCompanies();
      toast.success(editingCompany ? '更新成功' : '创建成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  // 删除企业
  const handleDeleteCompany = async (company: Company) => {
    await showConfirm({
      title: '确认删除',
      message: `确定要删除企业"${company.name}"吗？这将同时删除该企业下的所有文档。`,
      onConfirm: async () => {
        try {
          await knowledgeApi.deleteCompany(company.id);
          loadCompanies();
          toast.success('删除成功');
        } catch (error) {
          console.error('删除失败:', error);
          toast.error('删除失败');
        }
      },
    });
  };

  // 进入企业详情
  const enterCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewMode('company-detail');
    setKeyword('');
    setSelectedCategory('');
    navigate(`/knowledge/${company.id}`);
  };

  // 返回企业列表
  const backToCompanyList = () => {
    setSelectedCompany(null);
    setViewMode('company-list');
    navigate('/knowledge');
  };

  // 获取文档图标
  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'text':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5 text-green-500" />;
      case 'file':
        return <DocumentIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // 打开文档创建/编辑弹窗
  const openDocumentModal = (doc?: KnowledgeDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setDocumentFormData({
        title: doc.title,
        content: doc.content || '',
        category: doc.category,
        documentType: doc.document_type,
        tags: doc.tags.join(','),
        description: doc.description || '',
      });
    } else {
      setEditingDoc(null);
      setDocumentFormData({
        title: '',
        content: '',
        category: 'company_info',
        documentType: 'text',
        tags: '',
        description: '',
      });
      setUploadFile(null);
    }
    setShowDocumentModal(true);
  };

  // 关闭文档弹窗
  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setEditingDoc(null);
    setUploadFile(null);
  };

  // 保存文档
  const handleSaveDocument = async () => {
    if (!documentFormData.title.trim()) {
      toast.error('请输入文档标题');
      return;
    }

    try {
      if (editingDoc) {
        await knowledgeApi.updateDocument(editingDoc.id, {
          title: documentFormData.title,
          content: documentFormData.documentType === 'text' ? documentFormData.content : undefined,
          category: documentFormData.category,
          tags: documentFormData.tags.split(',').map((t) => t.trim()).filter(Boolean),
          description: documentFormData.description,
        });
      } else {
        if (documentFormData.documentType === 'text') {
          await knowledgeApi.createDocument({
            title: documentFormData.title,
            content: documentFormData.content,
            document_type: 'text',
            category: documentFormData.category,
            tags: documentFormData.tags.split(',').map((t) => t.trim()).filter(Boolean),
            description: documentFormData.description,
            company_id: selectedCompany?.id,
          });
        } else if (uploadFile) {
          await knowledgeApi.uploadFile(
            documentFormData.title,
            documentFormData.category,
            uploadFile,
            selectedCompany?.id,
            documentFormData.description,
            documentFormData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          );
        }
      }

      closeDocumentModal();
      loadDocuments();
      toast.success(editingDoc ? '更新成功' : '创建成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  // 删除文档
  const handleDeleteDocument = async (doc: KnowledgeDocument) => {
    await showConfirm({
      title: '确认删除',
      message: `确定要删除"${doc.title}"吗？`,
      onConfirm: async () => {
        try {
          await knowledgeApi.deleteDocument(doc.id);
          loadDocuments();
          toast.success('删除成功');
        } catch (error) {
          console.error('删除失败:', error);
          toast.error('删除失败');
        }
      },
    });
  };

  // 下载文件
  const handleDownload = async (doc: KnowledgeDocument) => {
    try {
      const blob = await knowledgeApi.downloadFile(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败');
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 企业列表视图 */}
      {viewMode === 'company-list' && (
        <>
          {/* 顶部栏 */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">企业知识库</h2>
                <span className="text-sm text-gray-500">共 {companies.length} 个企业</span>
              </div>
              <button
                onClick={() => openCompanyModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                新建企业
              </button>
            </div>
          </div>

          {/* 企业列表 */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BuildingOfficeIcon className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg">暂无企业</p>
                <p className="text-sm mt-2">点击右上角按钮创建第一个企业</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => enterCompany(company)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{company.name}</h3>
                          <p className="text-sm text-gray-500">{company.document_count} 个文档</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCompanyModal(company);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompany(company);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {company.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{company.description}</p>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      更新于 {formatTime(company.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 企业详情视图 */}
      {viewMode === 'company-detail' && selectedCompany && (
        <>
          {/* 顶部栏 */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={backToCompanyList}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  返回
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCompany.name}</h2>
                </div>
                <span className="text-sm text-gray-500">共 {documents.length} 个文档</span>
              </div>
              <button
                onClick={() => openDocumentModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
                上传资料
              </button>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文档标题、内容或标签..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | '')}
                  className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部分类</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 文档列表 */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <DocumentIcon className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg">暂无文档</p>
                <p className="text-sm mt-2">点击右上角按钮上传资料</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(doc.document_type)}
                        <h3 className="font-medium text-gray-900 truncate max-w-[200px]" title={doc.title}>
                          {doc.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDocumentModal(doc)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-2">
                        {categoryLabels[doc.category]}
                      </span>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {typeLabels[doc.document_type]}
                      </span>
                    </div>

                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.description}</p>
                    )}

                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {doc.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{doc.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {doc.document_type !== 'text' && doc.file_name && (
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        下载文件
                      </button>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      更新于 {formatTime(doc.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 企业创建/编辑弹窗 */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCompany ? '编辑企业' : '新建企业'}
              </h3>
              <button
                onClick={closeCompanyModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">企业名称 *</label>
                <input
                  type="text"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入企业名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">企业描述</label>
                <textarea
                  value={companyFormData.description}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="简短描述此企业..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={closeCompanyModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCompany}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BuildingOfficeIcon className="w-4 h-4" />
                {editingCompany ? '保存修改' : '创建企业'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文档创建/编辑弹窗 */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDoc ? '编辑资料' : '上传资料'}
              </h3>
              <button
                onClick={closeDocumentModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                  <input
                    type="text"
                    value={documentFormData.title}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入文档标题"
                  />
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={documentFormData.category}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, category: e.target.value as DocumentCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 文件上传 */}
                {!editingDoc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">文件</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setUploadFile(file);
                          if (file) {
                            // 根据文件类型自动识别文档类型
                            let autoType: DocumentType = 'file';
                            if (file.type.startsWith('image/')) {
                              autoType = 'image';
                            } else if (file.type.includes('pdf') || file.type.includes('word') || 
                                       file.type.includes('document') || file.type.includes('excel') ||
                                       file.type.includes('spreadsheet') || file.type.includes('presentation')) {
                              autoType = 'file';
                            } else if (file.type.startsWith('text/')) {
                              autoType = 'text';
                            }
                            setDocumentFormData({ ...documentFormData, documentType: autoType });
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.gif,.bmp,.svg"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <DocumentIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">点击或拖拽文件到此处</p>
                        <p className="text-xs text-gray-400 mt-1">支持 PDF、Word、Excel、图片等格式</p>
                        {uploadFile && (
                          <p className="text-blue-600 mt-2">{uploadFile.name}</p>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* 文本内容（仅在编辑模式或未上传文件时显示） */}
                {(editingDoc && editingDoc.document_type === 'text') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                    <textarea
                      value={documentFormData.content}
                      onChange={(e) => setDocumentFormData({ ...documentFormData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={6}
                      placeholder="请输入文档内容..."
                    />
                  </div>
                )}

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={documentFormData.description}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={2}
                    placeholder="简短描述此文档..."
                  />
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <input
                    type="text"
                    value={documentFormData.tags}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="多个标签用逗号分隔"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={closeDocumentModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveDocument}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FolderIcon className="w-4 h-4" />
                {editingDoc ? '保存修改' : '创建文档'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;