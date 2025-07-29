'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Tag, Grid3X3, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Separator } from '@/components/ui/separator';
import { MediaCategory, MediaTag, MediaFilters } from '@/services/media.service';

interface ImageSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: MediaFilters) => void;
  categories: MediaCategory[];
  tags: MediaTag[];
  currentFilters: MediaFilters;
  isLoading?: boolean;
  resultCount?: number;
  layoutMode?: 'masonry' | 'grid';
  onLayoutChange?: (layout: 'masonry' | 'grid') => void;
}

export const ImageSearchBar: React.FC<ImageSearchBarProps> = ({
  onSearch,
  onFilterChange,
  categories,
  tags,
  currentFilters,
  isLoading,
  resultCount = 0,
  layoutMode = 'masonry',
  onLayoutChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 搜索防抖
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: keyof MediaFilters, value: any) => {
    // 处理特殊的"所有"选项值
    let processedValue = value;
    if (value === 'ALL' || value === 'ALL_CATEGORIES' || value === 'ALL_STATUS') {
      processedValue = undefined;
    }

    const newFilters = { ...currentFilters, [key]: processedValue };
    onFilterChange(newFilters);
  };

  const handleTagSelect = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newTags);
    handleFilterChange('tagId', newTags.length > 0 ? newTags[0] : undefined);
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    onFilterChange({});
  };

  // 活跃筛选器数量
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentFilters.type) count++;
    if (currentFilters.status) count++;
    if (currentFilters.categoryId) count++;
    if (selectedTags.length > 0) count++;
    return count;
  }, [currentFilters, selectedTags]);

  const selectedCategory = categories.find(cat => cat.id === currentFilters.categoryId);
  const selectedTagsData = tags.filter(tag => selectedTags.includes(tag.id));

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* 主搜索栏 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="搜索图片、标签..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 筛选按钮 */}
          <div className="relative">
            <Button
              variant="outline"
              className="relative px-4 py-3 rounded-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base">筛选条件</h3>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        清除全部
                      </Button>
                    )}
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-600" />

                  {/* 媒体类型 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">媒体类型</label>
                    <Select
                      value={currentFilters.type || 'ALL'}
                      onValueChange={(value) => handleFilterChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所有类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">所有类型</SelectItem>
                        <SelectItem value="IMAGE">图片</SelectItem>
                        <SelectItem value="VIDEO">视频</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 分类选择 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">分类</label>
                    <Select
                      value={currentFilters.categoryId || 'ALL_CATEGORIES'}
                      onValueChange={(value) => handleFilterChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所有分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CATEGORIES">所有分类</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 状态筛选 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">状态</label>
                    <Select
                      value={currentFilters.status || 'ALL_STATUS'}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="所有状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_STATUS">所有状态</SelectItem>
                        <SelectItem value="APPROVED">已发布</SelectItem>
                        <SelectItem value="PENDING">待审核</SelectItem>
                        <SelectItem value="PRIVATE">私有</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 标签选择 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">标签</label>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1">
                        {tags.slice(0, 10).map(tag => (
                          <Button
                            key={tag.id}
                            variant={selectedTags.includes(tag.id) ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handleTagSelect(tag.id)}
                            className="justify-start text-left text-xs"
                          >
                            <Tag className="h-3 w-3 mr-2" />
                            {tag.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 排序选择 */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">排序方式</label>
                    <Select
                      value={`${currentFilters.sortBy || 'created_at'}_${currentFilters.sortOrder || 'desc'}`}
                      onValueChange={(value) => {
                        const [sortBy, sortOrder] = value.split('_');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择排序方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at_desc">最新发布</SelectItem>
                        <SelectItem value="created_at_asc">最早发布</SelectItem>
                        <SelectItem value="views_desc">浏览量最多</SelectItem>
                        <SelectItem value="likes_count_desc">点赞最多</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 布局切换 */}
          {onLayoutChange && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              <Button
                variant={layoutMode === 'masonry' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLayoutChange('masonry')}
                className="h-8 w-8 p-0 rounded-full"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLayoutChange('grid')}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 活跃筛选器显示 */}
        {(searchQuery || activeFiltersCount > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full">
                搜索: "{searchQuery}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch('');
                  }}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {selectedCategory && (
              <Badge variant="outline" className="rounded-full">
                分类: {selectedCategory.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('categoryId', undefined)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {selectedTagsData.map(tag => (
              <Badge key={tag.id} variant="outline" className="rounded-full">
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTagSelect(tag.id)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {currentFilters.type && (
              <Badge variant="outline" className="rounded-full">
                类型: {currentFilters.type === 'IMAGE' ? '图片' : '视频'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('type', undefined)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            <div className="text-sm text-gray-500 ml-2">
              {isLoading ? '搜索中...' : `找到 ${resultCount} 个结果`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 防抖函数
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
} 