import { RefObject, useEffect, useRef } from 'react';

// 修改返回类型允许null
export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  threshold = '0px'
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  threshold?: string;
}): RefObject<HTMLDivElement | null> => { // 允许返回null的RefObject
  const containerRef = useRef<HTMLDivElement | null>(null); // 明确允许null类型

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore) { // 添加可选链操作符
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: threshold,
        threshold: 0.1
      }
    );

    const currentContainer = containerRef.current;

    if (currentContainer) { // 严格的null检查
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) { // 严格的null检查
        observer.unobserve(currentContainer);
      }
    };
  }, [hasMore, onLoadMore, threshold]);

  return containerRef;
};