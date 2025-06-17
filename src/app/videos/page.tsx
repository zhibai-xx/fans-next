'use client';

import React, { useEffect, useState } from 'react';
import { VideoGrid } from './components/VideoGrid'
import { SearchBar } from './components/SearchBar'
import { CategoryTabs } from './components/CategoryTabs'
import { getVideos, getVideosByCategory } from '@/lib/video'
import { VideoUploadButton } from '@/components/VideoUploadButton'
import { useSearchParams } from 'next/navigation';
import { VideoItem } from '@/types/video';

// 模拟标签数据
const mockTags = [
  { id: '1', name: '教程' },
  { id: '2', name: '娱乐' },
  { id: '3', name: '游戏' },
  { id: '4', name: '音乐' },
];

// 模拟分类数据
const mockCategories = [
  { id: '1', name: '游戏' },
  { id: '2', name: '音乐' },
  { id: '3', name: '教育' },
  { id: '4', name: '生活' },
];

export default function VideosPage() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const category = searchParams.get('category') || 'all';
        const data = await getVideosByCategory(category);
        setVideos(data);
      } catch (error) {
        console.error('获取视频列表失败:', error);
      } finally {
        // setLoading(false);
      }
    };

    fetchVideos();
  }, [searchParams]);

  const handleUpload = async (data: {
    name: string;
    description: string;
    tags: { id: string; name: string }[];
    category?: { id: string; name: string };
    file: File;
  }) => {
    try {
      // TODO: 实现视频上传逻辑
      console.log('上传视频:', data);
      
      // 这里可以调用您的上传 API
      // const formData = new FormData();
      // formData.append('file', data.file);
      // formData.append('name', data.name);
      // formData.append('description', data.description);
      // formData.append('tags', JSON.stringify(data.tags));
      // if (data.category) {
      //   formData.append('category', JSON.stringify(data.category));
      // }
      
      // const response = await fetch('/api/videos/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // if (!response.ok) {
      //   throw new Error('上传失败');
      // }
      
      // const result = await response.json();
      // console.log('上传成功:', result);
    } catch (error) {
      console.error('上传出错:', error);
      // TODO: 显示错误提示
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">视频中心</h1>
        <SearchBar />
      </div>
      
      <CategoryTabs 
        categories={[
          { id: 'all', name: '婧仪' },
          { id: 'latest', name: '最新发布' },
          { id: 'popular', name: '热门播放' },
          { id: 'favorites', name: '我的收藏' },
        ]} 
      />
      
      <div className="flex justify-end">
        <VideoUploadButton
          onUpload={handleUpload}
          existingTags={mockTags}
          categories={mockCategories}
        />
      </div>
      
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">当前分类下暂无视频</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
} 