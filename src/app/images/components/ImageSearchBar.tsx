'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [filterButtonRect, setFilterButtonRect] = useState<DOMRect | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // 同步标签状态
  useEffect(() => {
    if (currentFilters.tagId && !selectedTags.includes(currentFilters.tagId)) {
      setSelectedTags([currentFilters.tagId]);
    } else if (!currentFilters.tagId && selectedTags.length > 0) {
      setSelectedTags([]);
    }
  }, [currentFilters.tagId, selectedTags]);

  // 更新筛选按钮位置
  useEffect(() => {
    if (showFilters && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterButtonRect(rect);
    }
  }, [showFilters]);

  // 点击外部关闭筛选器
  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 检查点击是否在筛选按钮或筛选面板内
      if (
        filterButtonRef.current?.contains(target) ||
        target.closest('[data-filter-panel]') ||
        // 排除Select下拉菜单的点击
        target.closest('[data-radix-select-content]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-radix-select-item]') ||
        // 排除DropdownMenu的点击
        target.closest('[data-radix-dropdown-menu-content]') ||
        target.closest('[data-radix-dropdown-menu-item]')
      ) {
        return;
      }
      setShowFilters(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
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
    // 目前只支持单标签筛选
    if (selectedTags.includes(tagId)) {
      // 取消选择
      setSelectedTags([]);
      handleFilterChange('tagId', undefined);
    } else {
      // 选择新标签（替换之前的选择）
      setSelectedTags([tagId]);
      handleFilterChange('tagId', tagId);
    }
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    onFilterChange({
      type: 'IMAGE', // 保持图片类型
      status: 'APPROVED' // 保持已发布状态
    });
  };

  // 活跃筛选器数量（不计算默认的type和status筛选器）
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentFilters.categoryId) count++;
    if (selectedTags.length > 0) count++;
    if (currentFilters.sortBy && currentFilters.sortBy !== 'created_at') count++;
    if (currentFilters.sortOrder && currentFilters.sortOrder !== 'desc') count++;
    return count;
  }, [currentFilters, selectedTags]);

  const selectedCategory = categories.find(cat => cat.id === currentFilters.categoryId);
  const selectedTagsData = tags.filter(tag => selectedTags.includes(tag.id));

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl backdrop-blur-md shadow-sm">
      <div className="px-6 py-4">
        {/* 主搜索栏 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="搜索图片、标签..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-3 text-base border-gray-200/60 focus:border-blue-400/60 focus:ring-blue-400/30 rounded-full bg-white/60 backdrop-blur-sm transition-all duration-200"
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
              ref={filterButtonRef}
              variant="outline"
              className="relative px-4 py-3 rounded-full border-gray-200/60 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200"
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

            {/* 筛选器面板使用Portal渲染到body */}
            {showFilters && filterButtonRect && typeof window !== 'undefined' && createPortal(
              <div
                data-filter-panel
                className="fixed w-80 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md z-[9999] p-5"
                style={{
                  left: Math.max(8, filterButtonRect.right - 320), // 确保不超出左边界
                  top: filterButtonRect.bottom + 8, // 在按钮下方8px
                }}
              >
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

                  {/* 隐藏媒体类型筛选，因为这是图片页面 */}

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

                  {/* 隐藏状态筛选，用户不应该看到审核状态 */}

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
                            className="justify-start text-left text-xs hover:bg-gray-100 transition-colors"
                          >
                            <Tag className="h-3 w-3 mr-2" />
                            {tag.name}
                            {selectedTags.includes(tag.id) && (
                              <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
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
                        const parts = value.split('_');
                        const sortOrder = parts.pop(); // 取最后一个作为排序方向
                        const sortBy = parts.join('_'); // 其余部分作为字段名
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
              </div>,
              document.body
            )}
          </div>

          {/* 布局切换 */}
          {onLayoutChange && (
            <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full p-1 border border-gray-200/50">
              <Button
                variant={layoutMode === 'masonry' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLayoutChange('masonry')}
                className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
                title="瀑布流布局"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLayoutChange('grid')}
                className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
                title="网格布局"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 活跃筛选器显示 */}
        {(searchQuery || activeFiltersCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700 border-blue-200">
                搜索: "{searchQuery}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch('');
                  }}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {selectedCategory && (
              <Badge variant="outline" className="rounded-full bg-purple-50 text-purple-700 border-purple-200">
                分类: {selectedCategory.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('categoryId', undefined)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {selectedTagsData.map(tag => (
              <Badge key={tag.id} variant="outline" className="rounded-full bg-green-50 text-green-700 border-green-200">
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTagSelect(tag.id)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* 隐藏类型筛选器，因为这是图片页面 */}

            <div className="text-sm text-gray-400 ml-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  <span>搜索中</span>
                </div>
              ) : (
                `${resultCount} 个结果`
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 防抖函数（当前未使用，但保留以备后用）
// function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
//   let timeoutId: NodeJS.Timeout;
//   return ((...args: any[]) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   }) as T;
// } 