'use client';

import { useState } from 'react';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';

export default function TestRobustVideoPage() {
  const [error, setError] = useState<string | null>(null);

  const testVideoUrl = '/api/upload/file/video/addc35814a082680503c81b99f236055.mp4';

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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          RobustVideoPlayer 测试页面
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* 测试1: 基础视频播放器 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试1: 基础视频播放器</h2>
            <div className="max-w-2xl">
              <RobustVideoPlayer
                src={testVideoUrl}
                controls={true}
                autoplay={false}
                aspectRatio="auto"
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>

          {/* 测试2: 横屏视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试2: 强制横屏比例</h2>
            <div className="max-w-2xl">
              <RobustVideoPlayer
                src={testVideoUrl}
                controls={true}
                autoplay={false}
                aspectRatio="landscape"
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>

          {/* 测试3: 竖屏视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试3: 强制竖屏比例</h2>
            <div className="max-w-lg mx-auto">
              <RobustVideoPlayer
                src={testVideoUrl}
                controls={true}
                autoplay={false}
                aspectRatio="portrait"
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>

          {/* 测试4: 方形视频 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试4: 强制方形比例</h2>
            <div className="max-w-lg mx-auto">
              <RobustVideoPlayer
                src={testVideoUrl}
                controls={true}
                autoplay={false}
                aspectRatio="square"
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>

          {/* 测试5: 多质量源 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">测试5: 多质量源（质量选择器）</h2>
            <div className="max-w-2xl">
              <RobustVideoPlayer
                src={[
                  { src: testVideoUrl, type: 'video/mp4', label: '原画', res: '1080p' },
                  { src: testVideoUrl, type: 'video/mp4', label: '720p', res: '720p' }
                ]}
                controls={true}
                autoplay={false}
                aspectRatio="auto"
                enableQualitySelector={true}
                onError={handleVideoError}
                onReady={handleVideoReady}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            检查控制台日志以查看详细的初始化和错误信息
          </p>
        </div>
      </div>
    </div>
  );
}
