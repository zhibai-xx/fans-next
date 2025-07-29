import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScrollEnd?: () => void;
  loadMoreThreshold?: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScrollEnd,
  loadMoreThreshold = 10,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 可见项目
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
      });
    }
    return result;
  }, [items, visibleRange]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // 检查是否接近底部
    if (onScrollEnd) {
      const { scrollHeight, clientHeight } = e.currentTarget;
      const remainingItems = items.length - visibleRange.end;

      if (remainingItems <= loadMoreThreshold && scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd, items.length, visibleRange.end, loadMoreThreshold]);

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1);
  }, [scrollToIndex, items.length]);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 上偏移量
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div className={`virtual-scroll-container ${className}`}>
      <div
        ref={scrollElementRef}
        className="virtual-scroll-viewport"
        style={{
          height: containerHeight,
          overflow: 'auto',
          position: 'relative',
        }}
        onScroll={handleScroll}
      >
        <div
          className="virtual-scroll-content"
          style={{
            height: totalHeight,
            position: 'relative',
          }}
        >
          <div
            className="virtual-scroll-items"
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map(({ item, index }) => (
              <div
                key={index}
                className="virtual-scroll-item"
                style={{
                  height: itemHeight,
                  overflow: 'hidden',
                }}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 滚动控制按钮 */}
      <div className="virtual-scroll-controls absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          onClick={scrollToTop}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg p-2"
          title="滚动到顶部"
        >
          ↑
        </Button>
        <Button
          onClick={scrollToBottom}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg p-2"
          title="滚动到底部"
        >
          ↓
        </Button>
      </div>
    </div>
  );
}

// 使用示例的类型定义
export interface VirtualScrollHandle {
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

// 带有 ref 的虚拟滚动组件
export const VirtualScrollWithRef = React.forwardRef<VirtualScrollHandle, VirtualScrollProps<any>>(
  (props, ref) => {
    const scrollToIndex = useCallback((index: number) => {
      // 实现滚动到指定索引的逻辑
    }, []);

    const scrollToTop = useCallback(() => {
      scrollToIndex(0);
    }, [scrollToIndex]);

    const scrollToBottom = useCallback(() => {
      scrollToIndex(props.items.length - 1);
    }, [scrollToIndex, props.items.length]);

    React.useImperativeHandle(ref, () => ({
      scrollToIndex,
      scrollToTop,
      scrollToBottom,
    }));

    return <VirtualScroll {...props} />;
  }
); 