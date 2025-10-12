'use client';

import { useState } from 'react';
import VideoPlayerWrapper from '@/components/video/VideoPlayerWrapper';

export default function TestVideoSizesPage() {
  const [error, setError] = useState<string | null>(null);

  // 测试视频源 - 包含多个质量选项
  const testVideoSources = [
    {
      src: '/api/upload/file/video/addc35814a082680503c81b99f236055.mp4',
      type: 'video/mp4',
      label: '高清 1080p',
      res: '1080p',
      width: 1920,
      height: 1080
    },
    {
      src: '/api/upload/file/video/addc35814a082680503c81b99f236055.mp4', // 同一个文件作为示例
      type: 'video/mp4',
      label: '标清 720p',
      res: '720p',
      width: 1280,
      height: 720
    },
    {
      src: '/api/upload/file/video/addc35814a082680503c81b99f236055.mp4',
      type: 'video/mp4',
      label: '流畅 480p',
      res: '480p',
      width: 854,
      height: 480
    }
  ];

  const handleVideoError = (error: any) => {
    console.error('视频播放错误:', error);
    setError(`视频播放错误: ${error?.message || '未知错误'}`);
  };

  const handleVideoReady = (player: any) => {
    console.log('视频播放器准备就绪:', player);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          视频播放器尺寸适配测试
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 横屏视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">
              横屏视频 (16:9) - 类似1280×720
            </h2>
            <div className="border-2 border-dashed border-blue-300 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                容器尺寸约束: min-height: 300px, max-height: 70vh
              </p>
              <VideoPlayerWrapper
                src={testVideoSources}
                controls={true}
                autoplay={false}
                aspectRatio="landscape"
                enableQualitySelector={true}
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>

          {/* 竖屏视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">
              竖屏视频 (9:16) - 类似720×960
            </h2>
            <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                容器尺寸约束: min-height: 400px, max-height: 60vh
              </p>
              <div className="max-w-sm mx-auto">
                <VideoPlayerWrapper
                  src={testVideoSources}
                  enableQualitySelector={true}
                  controls={true}
                  autoplay={false}
                  aspectRatio="portrait"
                  onError={handleVideoError}
                  onReady={handleVideoReady}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 方形视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">
              方形视频 (1:1)
            </h2>
            <div className="border-2 border-dashed border-purple-300 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                容器尺寸约束: min-height: 350px, max-height: 450px
              </p>
              <div className="max-w-md mx-auto">
                <VideoPlayerWrapper
                  src={testVideoSources}
                  enableQualitySelector={true}
                  controls={true}
                  autoplay={false}
                  aspectRatio="square"
                  onError={handleVideoError}
                  onReady={handleVideoReady}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 自动检测 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">
              自动检测比例
            </h2>
            <div className="border-2 border-dashed border-orange-300 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                容器尺寸约束: min-height: 300px, max-height: 80vh
              </p>
              <VideoPlayerWrapper
                src={testVideoSources}
                enableQualitySelector={true}
                controls={true}
                autoplay={false}
                aspectRatio="auto"
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 模拟对话框环境 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">模拟对话框环境测试</h2>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* 模拟对话框头部 */}
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  媒体详情预览 - 模拟对话框
                </h3>
              </div>

              {/* 模拟对话框内容 */}
              <div className="p-6">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/60 shadow-sm">
                  <div className="relative bg-white rounded-xl shadow-sm ring-1 ring-gray-200" style={{ overflow: 'visible' }}>
                    <div className="w-full" style={{ overflow: 'visible' }}>
                      <VideoPlayerWrapper
                        src={testVideoSources}
                        enableQualitySelector={true}
                        controls={true}
                        autoplay={false}
                        aspectRatio="auto"
                        onError={handleVideoError}
                        onReady={handleVideoReady}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">测试说明:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 这个容器结构与实际媒体管理页面的对话框完全相同</li>
                    <li>• 视频播放器应该能够根据视频比例自动调整尺寸</li>
                    <li>• 控制栏应该完整显示，不被裁剪</li>
                    <li>• 进度条应该具有正确的宽度</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            请检查各个视频播放器的尺寸是否合适，控制栏是否完整显示
          </p>
        </div>
      </div>
    </div>
  );
}
