'use client';

import React, { useState } from 'react';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { VideoUploadButton } from '@/components/VideoUploadButton';
import AdvancedUploadModal from '@/components/upload/AdvancedUploadModal';
import { Button } from '@/components/ui/button';

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
            <Button
              onClick={() => setShowImageModal(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              图片上传模态框
            </Button>
            <Button
              onClick={() => setShowVideoModal(true)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              视频上传模态框
            </Button>
            <Button
              onClick={() => setShowMixedModal(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              混合上传模态框
            </Button>
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
            <Button
              onClick={() => setUploadResults([])}
              variant="secondary"
              size="sm"
            >
              清空结果
            </Button>
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