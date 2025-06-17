// hooks/useIntersectionObserver.ts
import { useEffect, RefObject } from 'react';

// 修改类型定义，允许null并明确指定HTMLDivElement
export const useIntersectionObserver = ({
  target,
  onIntersect,
  threshold = 0,
  rootMargin = '0px',
  once = false
}: {
  target: RefObject<HTMLDivElement | null>; // 修改为HTMLDivElement并允许null
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) { // 添加可选链操作符
          onIntersect();
          if (once && target.current) {
            observer.unobserve(target.current);
          }
        }
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    if (target.current) { // 添加null检查
      observer.observe(target.current);
    }

    return () => {
      if (target.current) { // 添加null检查
        observer.unobserve(target.current);
      }
    };
  }, [target, onIntersect, rootMargin, threshold, once]);
};