/**
 * 知识库页面
 */
import React, { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import {
  knowledgeApi,
  KnowledgeDocument,
  DocumentCategory,
  DocumentType,
  categoryLabels,
  typeLabels,
} from '../../services/knowledgeApi';

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'company_info' as DocumentCategory,
    documentType: 'text' as DocumentType,
    tags: '',
    description: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // 加载文档列表
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await knowledgeApi.listDocuments(keyword || undefined, selectedCategory || undefined);
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
    loadDocuments();
  }, [keyword, selectedCategory]);

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

  // 打开创建/编辑弹窗
  const openModal = (doc?: KnowledgeDocument) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title,
        content: doc.content || '',
        category: doc.category,
        documentType: doc.document_type,
        tags: doc.tags.join(','),
        description: doc.description || '',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        title: '',
        content: '',
        category: 'company_info',
        documentType: 'text',
        tags: '',
        description: '',
      });
      setUploadFile(null);
    }
    setShowModal(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setUploadFile(null);
  };

  // 保存文档
  const handleSave = async () => {
    if (!formData.title.trim()) {
        toast.error('请输入文档标题');
        return;
      }

    try {
      if (editingDoc) {
        // 更新文档
        await knowledgeApi.updateDocument(editingDoc.id, {
          title: formData.title,
          content: formData.documentType === 'text' ? formData.content : undefined,
          category: formData.category,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
          description: formData.description,
        });
      } else {
        // 创建文档
        if (formData.documentType === 'text') {
          await knowledgeApi.createDocument({
            title: formData.title,
            content: formData.content,
            document_type: 'text',
            category: formData.category,
            tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
            description: formData.description,
          });
        } else if (uploadFile) {
          await knowledgeApi.uploadFile(
            formData.title,
            formData.category,
            uploadFile,
            formData.description,
            formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          );
        }
      }

      closeModal();
      loadDocuments();
      toast.success(editingDoc ? '更新成功' : '创建成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  };

  // 删除文档
  const handleDelete = async (doc: KnowledgeDocument) => {
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
      {/* 顶部搜索栏 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">知识库管理</h2>
            <span className="text-sm text-gray-500">共 {documents.length} 条文档</span>
          </div>
          <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
            <PlusIcon className="w-5 h-5" />
            新建文档
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4 mt-2">
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
            <p className="text-sm mt-2">点击右上角按钮创建第一篇文档</p>
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
                      onClick={() => openModal(doc)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="编辑"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
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

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDoc ? '编辑文档' : '新建文档'}
              </h3>
              <button
                onClick={closeModal}
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
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入文档标题"
                  />
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 类型 */}
                {!editingDoc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="documentType"
                          value="text"
                          checked={formData.documentType === 'text'}
                          onChange={(e) => setFormData({ ...formData, documentType: 'text' })}
                          className="text-blue-600"
                        />
                        <span>文本内容</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="documentType"
                          value="image"
                          checked={formData.documentType === 'image'}
                          onChange={(e) => setFormData({ ...formData, documentType: 'image' })}
                          className="text-blue-600"
                        />
                        <span>图片</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="documentType"
                          value="file"
                          checked={formData.documentType === 'file'}
                          onChange={(e) => setFormData({ ...formData, documentType: 'file' })}
                          className="text-blue-600"
                        />
                        <span>文件</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 文本内容 */}
                {(formData.documentType === 'text' || (editingDoc && editingDoc.document_type === 'text')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={6}
                      placeholder="请输入文档内容..."
                    />
                  </div>
                )}

                {/* 文件上传 */}
                {(formData.documentType !== 'text' && !editingDoc) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">文件</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <DocumentIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">点击或拖拽文件到此处</p>
                        {uploadFile && (
                          <p className="text-blue-600 mt-2">{uploadFile.name}</p>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="多个标签用逗号分隔"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
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