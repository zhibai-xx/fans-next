'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ImageCard } from './ImageCard';
import { ImageGridProps, ImageItem } from '@/types/image';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Spinner } from '@/components/Spinner';

type ImageWithAspectRatio = ImageItem & { aspectRatio: number };

export const ImageGrid: React.FC<ImageGridProps> = ({ images, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);
  const [columns, setColumns] = useState<ImageWithAspectRatio[][]>([]);
  const loadingRef = useRef<HTMLDivElement>(null);
  const isCalculating = useRef(false);

  // 优化列数计算
  const calculateLayout = useCallback(() => {
    if (!containerRef.current || isCalculating.current) return;
    isCalculating.current = true;

    const containerWidth = containerRef.current.offsetWidth;
    const newColumnCount = Math.min(Math.max(1, Math.floor(containerWidth / 300)), 4);

    if (newColumnCount !== columnCount) {
      setColumnCount(newColumnCount);
    }

    isCalculating.current = false;
  }, [columnCount]);

  // 优化图片分配算法
  const distributeImages = useCallback(() => {
    if (columnCount <= 0) return;
    const newColumns: ImageWithAspectRatio[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array.from({ length: columnCount }, () => 0);

    images.forEach((image) => {
      const aspectRatio = image.width > 0 ? image.height / image.width : 1;
      const imageWithRatio: ImageWithAspectRatio = {
        ...image,
        aspectRatio,
      };
      const shortestHeight = Math.min(...columnHeights);
      const targetIndex = columnHeights.findIndex((height) => height === shortestHeight);
      const columnIndex = targetIndex >= 0 ? targetIndex : 0;
      columnHeights[columnIndex] += aspectRatio;
      newColumns[columnIndex].push(imageWithRatio);
    });

    setColumns(newColumns);
  }, [columnCount, images]);

  // 节流处理窗口resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        calculateLayout();
        distributeImages();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [calculateLayout, distributeImages]);

  // 使用Intersection Observer实现懒加载
  useIntersectionObserver({
    target: loadingRef,
    onIntersect: () => distributeImages(),
    rootMargin: '200px',
  });

  // 缓存列结构
  const renderedColumns = useMemo(() => (
    columns.map((column, colIndex) => (
      <div
        key={colIndex}
        className="flex-1 min-w-0"
      >
        {column.map((image, index) => (
          <LazyImageCard
            key={`${image.id}-${index}`}
            image={image}
            priority={index < 2}
            className="mb-6"
          />
        ))}
      </div>
    ))
  ), [columns]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-6 px-6 ${className}`}
      style={{ alignItems: 'flex-start' }}
    >
      {renderedColumns}
      <div ref={loadingRef} className="w-full flex justify-center py-4">
        <Spinner size="lg" />
      </div>
    </div>
  );
};

// 懒加载图片卡片
interface LazyImageCardProps {
  image: ImageWithAspectRatio;
  className?: string;
  priority?: boolean;
}

const LazyImageCardComponent: React.FC<LazyImageCardProps> = ({ image, className, priority }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useIntersectionObserver({
    target: ref, // 现在类型匹配 RefObject<HTMLDivElement | null>
    onIntersect: () => setIsVisible(true),
    once: true,
    rootMargin: '200px'
  });

  return (
    <div ref={ref} className={className}>
      {isVisible && <ImageCard image={image} className={className} priority={priority} />}
      {!isVisible && (
        <div
          className="relative rounded-lg bg-gray-100"
          style={{ paddingTop: `${image.aspectRatio * 100}%` }}
        />
      )}
    </div>
  );
};

const LazyImageCard = React.memo(LazyImageCardComponent);
LazyImageCard.displayName = 'LazyImageCard';
