'use client';

import React from 'react';
import { Eye, Heart, Bookmark, MessageCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InteractionStatsProps } from '@/types/interaction';
import { cn } from '@/lib/utils';

/**
 * 媒体互动统计显示组件
 * 显示观看数、点赞数、收藏数、评论数等统计信息
 */
export const InteractionStats: React.FC<InteractionStatsProps> = ({
  mediaId,
  views = 0,
  likesCount,
  favoritesCount,
  commentsCount = 0,
  className,
  showEngagementRate = false,
}) => {
  // 计算互动率
  const totalInteractions = likesCount + favoritesCount + commentsCount;
  const engagementRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : '0.0';

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // 统计项配置
  const stats = [
    {
      icon: Eye,
      value: views,
      label: '观看',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      icon: Heart,
      value: likesCount,
      label: '点赞',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Bookmark,
      value: favoritesCount,
      label: '收藏',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: MessageCircle,
      value: commentsCount,
      label: '评论',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* 统计数据 */}
      {stats.map(({ icon: Icon, value, label, color, bgColor }) => (
        <Badge
          key={label}
          variant="secondary"
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors',
            bgColor,
            color
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{formatNumber(value)}</span>
          <span className="hidden sm:inline">{label}</span>
        </Badge>
      ))}

      {/* 互动率 */}
      {showEngagementRate && totalInteractions > 0 && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-700"
        >
          <TrendingUp className="h-3 w-3" />
          <span>{engagementRate}%</span>
          <span className="hidden sm:inline">互动率</span>
        </Badge>
      )}
    </div>
  );
};

/**
 * 简化版互动统计组件
 * 只显示核心数据（点赞、收藏）
 */
export const SimpleInteractionStats: React.FC<{
  likesCount: number;
  favoritesCount: number;
  className?: string;
  size?: 'sm' | 'md';
}> = ({ likesCount, favoritesCount, className, size = 'md' }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const sizeStyles = {
    sm: 'text-xs gap-2',
    md: 'text-sm gap-3',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <div className={cn('flex items-center', sizeStyles[size], className)}>
      <div className="flex items-center gap-1 text-red-600">
        <Heart className={cn(iconSizes[size], 'fill-current')} />
        <span>{formatNumber(likesCount)}</span>
      </div>
      <div className="flex items-center gap-1 text-amber-600">
        <Bookmark className={cn(iconSizes[size], 'fill-current')} />
        <span>{formatNumber(favoritesCount)}</span>
      </div>
    </div>
  );
};

/**
 * 详细互动统计组件
 * 带有标题和更多详细信息
 */
export const DetailedInteractionStats: React.FC<{
  mediaId: string;
  title?: string;
  views: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  createdAt?: string;
  className?: string;
}> = ({
  mediaId,
  title,
  views,
  likesCount,
  favoritesCount,
  commentsCount,
  createdAt,
  className,
}) => {
    const totalInteractions = likesCount + favoritesCount + commentsCount;
    const engagementRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : '0.0';

    const formatNumber = (num: number): string => {
      return num.toLocaleString();
    };

    return (
      <div className={cn('rounded-lg border bg-card p-4', className)}>
        {title && (
          <h3 className="text-lg font-semibold mb-3 truncate">{title}</h3>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Eye className="h-5 w-5 text-gray-600 mr-1" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(views)}</div>
            <div className="text-sm text-gray-500">观看次数</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Heart className="h-5 w-5 text-red-600 mr-1" />
            </div>
            <div className="text-2xl font-bold text-red-600">{formatNumber(likesCount)}</div>
            <div className="text-sm text-gray-500">点赞数</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Bookmark className="h-5 w-5 text-amber-600 mr-1" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{formatNumber(favoritesCount)}</div>
            <div className="text-sm text-gray-500">收藏数</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-1" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(commentsCount)}</div>
            <div className="text-sm text-gray-500">评论数</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
            <span>互动率: {engagementRate}%</span>
          </div>
          {createdAt && (
            <div>
              发布于: {new Date(createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    );
  };

export default InteractionStats;
