import { useEffect } from 'react';

interface UseIntersectionObserverOptions {
  target?: React.RefObject<Element>;
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Intersection Observer Hook
 * 用于检测元素是否进入视口，常用于无限滚动
 */
export function useIntersectionObserver(
  target: React.RefObject<Element>,
  { onIntersect, threshold = 0, rootMargin = '0px', enabled = true }: UseIntersectionObserverOptions
) {
  useEffect(() => {
    if (!enabled || !target.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target.current);

    return () => {
      observer.disconnect();
    };
  }, [target, onIntersect, threshold, rootMargin, enabled]);
}

/**
 * Legacy version that accepts options object with target included
 * 保持向后兼容性的版本
 */
export function useIntersectionObserverLegacy(options: UseIntersectionObserverOptions) {
  const { target, onIntersect, threshold = 0, rootMargin = '0px', enabled = true } = options || {};

  useEffect(() => {
    if (!enabled || !target?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target.current);

    return () => {
      observer.disconnect();
    };
  }, [target, onIntersect, threshold, rootMargin, enabled]);
}