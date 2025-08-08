'use client';

import React from 'react';
import { MyFavorites } from '@/components/interaction/MyFavorites';

/**
 * 个人中心收藏列表页面
 * 使用新的MyFavorites组件
 */
export default function FavoritesList() {
  return (
    <div className="w-full">
      <MyFavorites
        className="p-0" // 移除默认padding，因为外层已有容器
        itemsPerPage={12} // 每页显示12个项目
      />
    </div>
  );
} 