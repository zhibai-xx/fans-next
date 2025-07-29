// hooks/useIntersectionObserver.ts
import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

interface UseIntersectionObserverResult {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

export const useIntersectionObserver = (
  target: RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverResult => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const { root = null, rootMargin = '0px', threshold = 0, once = false } = options;

  useEffect(() => {
    if (!target.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);

        if (once && entry.isIntersecting) {
          observer.unobserve(target.current!);
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(target.current);

    return () => {
      if (target.current) {
        observer.unobserve(target.current);
      }
    };
  }, [target, root, rootMargin, threshold, once]);

  return { isIntersecting, entry };
};

// 保持向后兼容的旧版本
export const useIntersectionObserverLegacy = ({
  target,
  onIntersect,
  threshold = 0,
  rootMargin = '0px',
  once = false
}: {
  target: RefObject<HTMLDivElement | null>;
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
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

    if (target.current) {
      observer.observe(target.current);
    }

    return () => {
      if (target.current) {
        observer.unobserve(target.current);
      }
    };
  }, [target, onIntersect, rootMargin, threshold, once]);
};