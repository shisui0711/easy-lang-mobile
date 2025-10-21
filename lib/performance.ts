import { useCallback, useMemo, useRef } from 'react';

// Memoization utility for expensive functions
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return function (...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
};

// Debounce utility to limit function calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay) as unknown as NodeJS.Timeout;
    },
    [callback, delay]
  ) as T;
};

// Throttle utility to limit function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (now - lastCallTimeRef.current >= delay) {
        lastCallTimeRef.current = now;
        callback(...args);
      } else {
        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          callback(...args);
        }, delay - (now - lastCallTimeRef.current)) as unknown as NodeJS.Timeout;
      }
    },
    [callback, delay]
  ) as T;
};

// Utility to measure component render time
export const useRenderTimer = (componentName: string) => {
  const startRenderTimeRef = useRef<number>(0);
  
  const startRenderTimer = useCallback(() => {
    startRenderTimeRef.current = performance.now();
  }, []);
  
  const endRenderTimer = useCallback(() => {
    const endRenderTime = performance.now();
    const renderTime = endRenderTime - startRenderTimeRef.current;
    
    if (renderTime > 16) { // More than 1 frame (60fps)
      console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);
  
  return { startRenderTimer, endRenderTimer };
};

// Utility to prevent unnecessary re-renders
export const useDeepCompareMemoize = <T>(value: T): T => {
  const ref = useRef<T>(value);
  
  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
};

// Utility to optimize list rendering
export const useOptimizedList = <T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number
) => {
  return useMemo(() => {
    return items.map((item, index) => ({
      item,
      key: keyExtractor(item, index),
      index
    }));
  }, [items, keyExtractor]);
};

// Utility to track memory usage
export const useMemoryTracker = (componentName: string) => {
  const trackMemory = useCallback(() => {
    // @ts-ignore
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore
      const memoryInfo: any = performance.memory;
      console.log(`${componentName} memory usage:`, {
        used: Math.round(memoryInfo.usedJSHeapSize / 1048576 * 100) / 100 + ' MB',
        total: Math.round(memoryInfo.totalJSHeapSize / 1048576 * 100) / 100 + ' MB',
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576 * 100) / 100 + ' MB'
      });
    }
  }, [componentName]);
  
  return trackMemory;
};

// Utility to optimize image loading
export const useOptimizedImage = (uri: string, maxWidth: number = 500) => {
  // In a real app, this would use a service to resize images
  // For now, we'll just return the original URI
  return useMemo(() => {
    return {
      uri,
      // Add cache busting and optimization parameters
      optimizedUri: `${uri}${uri.includes('?') ? '&' : '?'}w=${maxWidth}&q=80&fmt=webp`
    };
  }, [uri, maxWidth]);
};