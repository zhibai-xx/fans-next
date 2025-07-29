import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualizedGrid<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  gap = 16,
  renderItem,
  className = ''
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const itemsPerRow = columns;
    const totalRows = Math.ceil(items.length / itemsPerRow);

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
    const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + 1);

    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length, endRow * itemsPerRow);

    return { startIndex, endIndex, startRow, totalRows, rowHeight };
  }, [scrollTop, containerHeight, itemHeight, gap, columns, items.length]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 计算可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // 计算总高度
  const totalHeight = visibleRange.totalRows * visibleRange.rowHeight;

  // 计算偏移量
  const offsetY = visibleRange.startRow * visibleRange.rowHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
            padding: `0 ${gap}px`
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={visibleRange.startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 专用的媒体网格虚拟化组件
interface MediaVirtualizedGridProps<T> {
  items: T[];
  selectedItems: Set<string>;
  getItemId: (item: T) => string;
  onToggleSelection: (id: string) => void;
  renderItem: (item: T, isSelected: boolean, onToggle: () => void) => React.ReactNode;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  columns?: number;
}

export function MediaVirtualizedGrid<T>({
  items,
  selectedItems,
  getItemId,
  onToggleSelection,
  renderItem,
  className = '',
  itemHeight = 300,
  containerHeight = 600,
  columns = 4
}: MediaVirtualizedGridProps<T>) {
  const renderMediaItem = useCallback(
    (item: T, index: number) => {
      const itemId = getItemId(item);
      const isSelected = selectedItems.has(itemId);
      const handleToggle = () => onToggleSelection(itemId);

      return renderItem(item, isSelected, handleToggle);
    },
    [selectedItems, getItemId, onToggleSelection, renderItem]
  );

  return (
    <VirtualizedGrid
      items={items}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      columns={columns}
      renderItem={renderMediaItem}
      className={className}
    />
  );
} 