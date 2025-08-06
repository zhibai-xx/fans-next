'use client';

import React, { useState } from 'react';
import AdvancedUploadModal from '@/components/upload/AdvancedUploadModal';
import { Upload, Image, Video } from 'lucide-react';

export default function TestUploadPage() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBothModal, setShowBothModal] = useState(false);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);

  const handleUploadComplete = (mediaIds: string[]) => {
    console.log('上传完成，媒体ID:', mediaIds);
    setUploadedMediaIds(prev => [...prev, ...mediaIds]);
    // 关闭模态框
    setShowImageModal(false);
    setShowVideoModal(false);
    setShowBothModal(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">文件上传测试</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 图片上传 */}
        <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
          <Image className="mx-auto mb-4 text-green-500" size={48} />
          <h2 className="text-xl font-semibold mb-2">图片上传</h2>
          <p className="text-gray-600 mb-4">支持批量上传图片文件</p>
          <button
            onClick={() => setShowImageModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            上传图片
          </button>
        </div>

        {/* 视频上传 */}
        <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
          <Video className="mx-auto mb-4 text-blue-500" size={48} />
          <h2 className="text-xl font-semibold mb-2">视频上传</h2>
          <p className="text-gray-600 mb-4">支持批量上传视频文件</p>
          <button
            onClick={() => setShowVideoModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            上传视频
          </button>
        </div>

        {/* 混合上传 */}
        <div className="border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
          <Upload className="mx-auto mb-4 text-purple-500" size={48} />
          <h2 className="text-xl font-semibold mb-2">混合上传</h2>
          <p className="text-gray-600 mb-4">同时上传图片和视频</p>
          <button
            onClick={() => setShowBothModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            混合上传
          </button>
        </div>
      </div>

      {/* 功能特性 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">功能特性</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✅ 支持批量上传多个文件</li>
          <li>✅ 大文件自动切片上传（默认5MB/片）</li>
          <li>✅ 支持断点续传（刷新页面后可继续）</li>
          <li>✅ 并发上传控制（默认3个并发）</li>
          <li>✅ 实时上传进度显示</li>
          <li>✅ 文件秒传（相同文件直接返回）</li>
          <li>✅ 失败自动重试</li>
          <li>✅ 支持取消上传</li>
          <li>✅ 拖拽上传支持</li>
        </ul>
      </div>

      {/* 已上传的媒体ID */}
      {uploadedMediaIds.length > 0 && (
        <div className="bg-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">已上传的媒体</h2>
          <div className="space-y-2">
            {uploadedMediaIds.map((id, index) => (
              <div key={id} className="flex items-center gap-2">
                <span className="text-gray-600">#{index + 1}</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{id}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传模态框 */}
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
        isOpen={showBothModal}
        onClose={() => setShowBothModal(false)}
        type="both"
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
} 