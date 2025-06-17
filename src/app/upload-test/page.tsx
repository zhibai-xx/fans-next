'use client';

import React, { useState } from 'react';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { VideoUploadButton } from '@/components/VideoUploadButton';
import { AdvancedUploadModal } from '@/components/upload/AdvancedUploadModal';

export default function UploadTestPage() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMixedModal, setShowMixedModal] = useState(false);
  const [uploadResults, setUploadResults] = useState<string[]>([]);

  const handleUploadComplete = (mediaIds: string[]) => {
    console.log('上传完成:', mediaIds);
    setUploadResults(prev => [...prev, ...mediaIds]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">上传功能测试</h1>

        {/* 按钮组件测试 */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">按钮组件测试</h2>
          <div className="flex gap-4">
            <ImageUploadButton onUploadComplete={handleUploadComplete} />
            <VideoUploadButton onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {/* 高级上传模态框测试 */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">高级上传模态框测试</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowImageModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              图片上传模态框
            </button>
            <button
              onClick={() => setShowVideoModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              视频上传模态框
            </button>
            <button
              onClick={() => setShowMixedModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              混合上传模态框
            </button>
          </div>
        </div>

        {/* 功能特性说明 */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">新上传功能特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">✅ 已实现功能</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 切片上传（默认5MB分片）</li>
                <li>• 断点续传</li>
                <li>• 并发上传（默认3个并发）</li>
                <li>• 秒传功能（MD5检查）</li>
                <li>• 批量上传</li>
                <li>• 实时进度监控</li>
                <li>• 错误重试机制</li>
                <li>• 标签管理（创建/选择）</li>
                <li>• 分类选择（视频）</li>
                <li>• 拖拽上传</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600">🔧 技术特点</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• TypeScript 类型安全</li>
                <li>• React Hooks 状态管理</li>
                <li>• 模块化设计</li>
                <li>• 错误边界处理</li>
                <li>• 响应式UI设计</li>
                <li>• 可取消上传</li>
                <li>• 内存优化</li>
                <li>• 网络异常处理</li>
                <li>• 文件类型验证</li>
                <li>• 进度回调支持</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 上传结果 */}
        {uploadResults.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">上传结果</h2>
            <div className="space-y-2">
              {uploadResults.map((mediaId, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">媒体ID:</span>
                  <span className="font-mono text-blue-600">{mediaId}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setUploadResults([])}
              className="mt-4 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清空结果
            </button>
          </div>
        )}

        {/* 模态框 */}
        <AdvancedUploadModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          type="image"
          onUploadComplete={handleUploadComplete}
        />

        <AdvancedUploadModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          type="video"
          onUploadComplete={handleUploadComplete}
        />

        <AdvancedUploadModal
          isOpen={showMixedModal}
          onClose={() => setShowMixedModal(false)}
          type="both"
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </div>
  );
} 