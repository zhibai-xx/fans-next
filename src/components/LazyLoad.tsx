import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Button } from '@/components/ui/button';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  rootMargin = '50px',
  threshold = 0.1,
  once = true,
  className = '',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(targetRef, {
    rootMargin,
    threshold,
    once,
  });

  useEffect(() => {
    if (isIntersecting && !isLoaded && !hasError) {
      try {
        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        setHasError(true);
        onError?.();
      }
    }
  }, [isIntersecting, isLoaded, hasError, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`lazy-load-error ${className}`} ref={targetRef}>
        <div className="text-center text-gray-500 p-4">
          <p>加载失败</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoaded(false);
            }}
            className="mt-2 text-blue-500 hover:text-blue-700"
          >
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`lazy-load-container ${className}`} ref={targetRef}>
      {isLoaded ? children : fallback}
    </div>
  );
};

// 懒加载图片组件
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  const { isIntersecting } = useIntersectionObserver(imgRef, {
    rootMargin: '50px',
    threshold: 0.1,
    once: true,
  });

  useEffect(() => {
    if (isIntersecting && !isLoaded && !hasError) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [isIntersecting, src, isLoaded, hasError, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        transition: 'opacity 0.3s ease',
        opacity: hasError ? 0.5 : 1,
      }}
    />
  );
};

// 懒加载组件包装器
export const withLazyLoad = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
  }
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const componentProps = { ...props, ref } as P & { ref: any };
    return (
      <LazyLoad {...options}>
        <Component {...componentProps} />
      </LazyLoad>
    );
  });
};

// 懒加载列表组件
interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  batchSize?: number;
  className?: string;
  onLoadMore?: () => void;
}

export function LazyList<T>({
  items,
  renderItem,
  itemHeight = 100,
  batchSize = 10,
  className = '',
  onLoadMore,
}: LazyListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    rootMargin: '100px',
    threshold: 0.1,
  });

  useEffect(() => {
    if (isIntersecting && visibleCount < items.length) {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length));
    }
  }, [isIntersecting, visibleCount, items.length, batchSize]);

  useEffect(() => {
    if (visibleCount >= items.length && onLoadMore) {
      onLoadMore();
    }
  }, [visibleCount, items.length, onLoadMore]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className={`lazy-list ${className}`}>
      {visibleItems.map((item, index) => (
        <div
          key={index}
          className="lazy-list-item"
          style={{ minHeight: itemHeight }}
        >
          {renderItem(item, index)}
        </div>
      ))}

      {visibleCount < items.length && (
        <div
          ref={loadMoreRef}
          className="lazy-list-loader flex justify-center items-center p-4"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">加载更多...</span>
        </div>
      )}
    </div>
  );
} 