'use client';

import React, { useState, useEffect } from 'react';
import { MasonryImageGrid } from '../images/components/MasonryImageGrid';
import { ImageDetailModal } from '../images/components/ImageDetailModal';
import { MediaItem } from '@/services/media.service';

// 模拟数据
const mockImages: MediaItem[] = [
  {
    id: '1',
    title: '美丽的日落风景',
    description: '在海滩拍摄的绚烂日落，色彩丰富令人陶醉',
    url: '/assets/zjy.jpeg',
    thumbnail_url: '/assets/zjy.jpeg',
    size: 2048000,
    media_type: 'IMAGE',
    width: 1920,
    height: 1280,
    status: 'APPROVED',
    views: 1520,
    likes_count: 89,
    source: 'USER_UPLOAD',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user: {
      uuid: 'user1',
      username: '张婧仪',
      avatar_url: '/assets/zjy3.png'
    },
    category: {
      id: 'cat1',
      name: '自然风景'
    },
    tags: [
      { id: 'tag1', name: '日落' },
      { id: 'tag2', name: '海滩' },
      { id: 'tag3', name: '风景' }
    ]
  },
  {
    id: '2',
    title: '城市夜景',
    description: '现代都市的璀璨夜景',
    url: '/assets/zjy2.jpg',
    thumbnail_url: '/assets/zjy2.jpg',
    size: 1536000,
    media_type: 'IMAGE',
    width: 1600,
    height: 900,
    status: 'APPROVED',
    views: 980,
    likes_count: 67,
    source: 'USER_UPLOAD',
    created_at: '2024-01-14T18:45:00Z',
    updated_at: '2024-01-14T18:45:00Z',
    user: {
      uuid: 'user2',
      username: '摄影师小王',
      avatar_url: '/assets/zjy4.JPG'
    },
    category: {
      id: 'cat2',
      name: '城市建筑'
    },
    tags: [
      { id: 'tag4', name: '夜景' },
      { id: 'tag5', name: '城市' },
      { id: 'tag6', name: '建筑' }
    ]
  },
  {
    id: '3',
    title: '花卉特写',
    description: '春天盛开的樱花，粉嫩可人',
    url: '/assets/zjy3.png',
    thumbnail_url: '/assets/zjy3.png',
    size: 3072000,
    media_type: 'IMAGE',
    width: 1080,
    height: 1620,
    status: 'APPROVED',
    views: 756,
    likes_count: 124,
    source: 'USER_UPLOAD',
    created_at: '2024-01-13T14:20:00Z',
    updated_at: '2024-01-13T14:20:00Z',
    user: {
      uuid: 'user3',
      username: '花花世界',
      avatar_url: '/assets/zjy.jpeg'
    },
    category: {
      id: 'cat3',
      name: '植物花卉'
    },
    tags: [
      { id: 'tag7', name: '樱花' },
      { id: 'tag8', name: '春天' },
      { id: 'tag9', name: '花卉' }
    ]
  },
  {
    id: '4',
    title: '山川湖泊',
    description: '壮美的自然山水画卷',
    url: '/assets/zjy4.JPG',
    thumbnail_url: '/assets/zjy4.JPG',
    size: 4096000,
    media_type: 'IMAGE',
    width: 2048,
    height: 1365,
    status: 'APPROVED',
    views: 2340,
    likes_count: 198,
    source: 'USER_UPLOAD',
    created_at: '2024-01-12T09:15:00Z',
    updated_at: '2024-01-12T09:15:00Z',
    user: {
      uuid: 'user4',
      username: '山水行者',
      avatar_url: '/assets/zjy2.jpg'
    },
    category: {
      id: 'cat1',
      name: '自然风景'
    },
    tags: [
      { id: 'tag10', name: '山川' },
      { id: 'tag11', name: '湖泊' },
      { id: 'tag12', name: '自然' }
    ]
  }
];

export default function TestImagesPage() {
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

  // 图片点击处理
  const handleImageClick = (image: MediaItem) => {
    const index = mockImages.findIndex(img => img.id === image.id);
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  // 模态框导航
  const handleNextImage = () => {
    if (selectedImageIndex < mockImages.length - 1) {
      const nextIndex = selectedImageIndex + 1;
      setSelectedImage(mockImages[nextIndex]);
      setSelectedImageIndex(nextIndex);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0) {
      const prevIndex = selectedImageIndex - 1;
      setSelectedImage(mockImages[prevIndex]);
      setSelectedImageIndex(prevIndex);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedImageIndex(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-gradient">
            🎨 现代化图片展示系统
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            体验响应式瀑布流布局、优雅的悬浮效果和丰富的交互功能
          </p>

          {/* 功能特点 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-3xl mb-3">🌊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                响应式瀑布流
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                自适应图片比例，完美展示各种尺寸的图片，无失真显示
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                优雅交互效果
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                平滑的悬浮动画、渐变背景和精心设计的视觉反馈
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                高性能优化
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                懒加载、硬件加速、智能布局计算，流畅体验
              </p>
            </div>
          </div>
        </div>

        {/* 图片展示区域 */}
        <MasonryImageGrid
          images={mockImages}
          onImageClick={handleImageClick}
          gap={16}
        />

        {/* 图片详情模态框 */}
        <ImageDetailModal
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
          onNext={selectedImageIndex < mockImages.length - 1 ? handleNextImage : undefined}
          onPrevious={selectedImageIndex > 0 ? handlePreviousImage : undefined}
        />
      </div>
    </div>
  );
} 