import React, { memo, useCallback, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { MediaItem } from '@/services/media.service';
import { Button } from '@/components/ui/button';

// 高度优化的单个媒体项组件
const OptimizedMediaItem = memo(({
  media,
  isSelected,
  viewMode,
  onToggle
}: {
  media: MediaItem;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onToggle: () => void;
}) => {
  // 避免内联样式和字符串拼接
  const cardClassName = isSelected
    ? "border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-blue-500 bg-blue-50"
    : "border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300";

  if (viewMode === 'grid') {
    return (
      <div className={cardClassName} onClick={onToggle}>
        <div className="aspect-square bg-gray-100 relative rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={media.thumbnail_url || media.url}
            alt={media.title}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
          {isSelected && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="h-6 w-6 text-blue-500 bg-white rounded-full" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm truncate">{media.title}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {media.user.username} • {media.media_type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClassName} onClick={onToggle}>
      <div className="flex items-center p-3 space-x-3">
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={media.thumbnail_url || media.url}
            alt={media.title}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{media.title}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {media.user.username} • {media.media_type} • {media.status}
          </p>
        </div>
        {isSelected && (
          <CheckCircle className="h-5 w-5 text-blue-500" />
        )}
      </div>
    </div>
  );
});

OptimizedMediaItem.displayName = 'OptimizedMediaItem';

// 使用React.memo和useCallback优化的网格组件
interface PerformanceOptimizedGridProps {
  mediaList: MediaItem[];
  selectedItems: Set<string>;
  viewMode: 'grid' | 'list';
  onToggleSelection: (mediaId: string) => void;
  onSelectAll: () => void;
  selectionState: {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    hasSelection: boolean;
  };
}

export const PerformanceOptimizedGrid = memo(({
  mediaList,
  selectedItems,
  viewMode,
  onToggleSelection,
  onSelectAll,
  selectionState
}: PerformanceOptimizedGridProps) => {
  // 使用useMemo缓存网格项目，避免每次重新渲染所有项目
  const gridItems = useMemo(() => {
    return mediaList.map((media) => {
      const isSelected = selectedItems.has(media.id);
      const handleToggle = () => onToggleSelection(media.id);

      return (
        <OptimizedMediaItem
          key={media.id}
          media={media}
          isSelected={isSelected}
          viewMode={viewMode}
          onToggle={handleToggle}
        />
      );
    });
  }, [mediaList, selectedItems, viewMode, onToggleSelection]);

  // 优化网格样式
  const gridClassName = viewMode === 'grid'
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    : "space-y-2";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={selectionState.isAllSelected}
        >
          全选
        </Button>
        <p className="text-sm text-gray-600">
          显示 {mediaList.length} 项
        </p>
      </div>

      <div className={gridClassName}>
        {gridItems}
      </div>
    </div>
  );
});

PerformanceOptimizedGrid.displayName = 'PerformanceOptimizedGrid'; 