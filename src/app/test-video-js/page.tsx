'use client';

import { useEffect, useRef } from 'react';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';

export default function TestVideoJSPage() {
  const testVideoUrl = 'http://localhost:3000/api/upload/file/video/addc35814a082680503c81b99f236055.mp4';

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Video.js 测试页面</h1>

      <div className="space-y-8">
        {/* 测试1: 基础Video.js播放器 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">测试1: 基础Video.js播放器</h2>
          <div className="max-w-4xl">
            <RobustVideoPlayer
              src={testVideoUrl}
              controls={true}
              autoplay={false}
              aspectRatio="auto"
              onError={(error: any) => console.error('❌ Video.js 播放错误:', error)}
            />
          </div>
        </div>

        {/* 测试2: 多质量源 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">测试2: 多质量源</h2>
          <div className="max-w-4xl">
            <RobustVideoPlayer
              src={[
                { src: testVideoUrl, type: 'video/mp4', label: '原画' },
                { src: testVideoUrl, type: 'video/mp4', label: '720p' }
              ]}
              controls={true}
              autoplay={false}
              aspectRatio="auto"
              enableQualitySelector={true}
              onError={(error: any) => console.error('❌ 多质量播放错误:', error)}
            />
          </div>
        </div>

        {/* 测试3: 原生HTML5视频（对比） */}
        <div>
          <h2 className="text-xl font-semibold mb-4">测试3: 原生HTML5视频（对比）</h2>
          <div className="max-w-4xl">
            <video
              src={testVideoUrl}
              controls
              className="w-full aspect-video bg-black rounded-lg"
              crossOrigin="anonymous"
              onPlay={() => console.log('✅ 原生HTML5 播放开始')}
              onError={(e) => console.error('❌ 原生HTML5 播放错误:', e)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">调试信息:</h3>
        <p>测试视频URL: <code className="bg-white px-2 py-1 rounded text-sm">{testVideoUrl}</code></p>
        <p className="mt-2 text-sm text-gray-600">
          请打开浏览器开发者工具查看控制台输出和网络请求
        </p>
      </div>
    </div>
  );
}
