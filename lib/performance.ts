import { useCallback, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// パフォーマンス計測用ユーティリティ
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private readonly STORAGE_KEY = '@ai_chat_performance_metrics';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 計測開始
  startTiming(label: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.recordMetric(label, duration);
    };
  }

  // メトリクスを記録
  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift();
    }
  }

  // 統計を取得
  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      count: values.length,
      avg: Math.round(avg),
      median: Math.round(median),
      p95: Math.round(p95),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  // 全メトリクス取得
  getAllStats() {
    const result: Record<string, any> = {};
    for (const [label] of this.metrics) {
      result[label] = this.getStats(label);
    }
    return result;
  }

  // メトリクスをリセット
  reset() {
    this.metrics.clear();
  }

  // メトリクスを保存
  async saveMetrics() {
    try {
      const data = Object.fromEntries(this.metrics);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save performance metrics:', e);
    }
  }

  // メトリクスを読み込み
  async loadMetrics() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        this.metrics = new Map(Object.entries(data));
      }
    } catch (e) {
      console.error('Failed to load performance metrics:', e);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React Hook for measuring component performance
export function usePerformanceMeasure(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>();

  useEffect(() => {
    mountTimeRef.current = Date.now();
    renderCountRef.current = 0;

    return () => {
      if (mountTimeRef.current) {
        const mountDuration = Date.now() - mountTimeRef.current;
        performanceMonitor.recordMetric(`${componentName}_mount_time`, mountDuration);
        performanceMonitor.recordMetric(`${componentName}_render_count`, renderCountRef.current);
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCountRef.current++;
  });

  const measureAsyncOperation = useCallback((operationName: string) => {
    return performanceMonitor.startTiming(`${componentName}_${operationName}`);
  }, [componentName]);

  return { measureAsyncOperation };
}

// キャッシュユーティリティ
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // キャッシュに設定
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  // キャッシュから取得
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // キャッシュを削除
  delete(key: string) {
    this.cache.delete(key);
  }

  // 期限切れキャッシュをクリア
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache) {
      if (now > cached.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 全キャッシュをクリア
  clear() {
    this.cache.clear();
  }

  // キャッシュサイズを取得
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = CacheManager.getInstance();

// メモ化Hook for expensive computations
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  label?: string
): T {
  return useMemo(() => {
    const stopTiming = label ? performanceMonitor.startTiming(label) : null;
    const result = factory();
    stopTiming?.();
    return result;
  }, deps);
}

// デバウンス Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// スロットル Hook
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime.current >= delay) {
      lastCallTime.current = now;
      return func(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now();
        func(...args);
      }, delay - (now - lastCallTime.current));
    }
  }, [func, delay]) as T;
}

// メモリ使用量監視
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private measurements: Array<{ timestamp: number; jsHeapSizeUsed?: number }> = [];

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  // メモリ使用量を記録
  recordUsage() {
    const measurement = { timestamp: Date.now() };
    
    // Web環境でのみ利用可能
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      (measurement as any).jsHeapSizeUsed = (window as any).performance.memory.usedJSHeapSize;
    }
    
    this.measurements.push(measurement);
    
    // 最新100件のみ保持
    if (this.measurements.length > 100) {
      this.measurements.shift();
    }
  }

  // メモリ統計を取得
  getStats() {
    if (this.measurements.length === 0) return null;

    const withMemory = this.measurements.filter(m => (m as any).jsHeapSizeUsed !== undefined);
    if (withMemory.length === 0) return null;

    const sizes = withMemory.map(m => (m as any).jsHeapSizeUsed);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);

    return {
      avgMB: Math.round(avg / 1024 / 1024 * 100) / 100,
      maxMB: Math.round(max / 1024 / 1024 * 100) / 100,
      minMB: Math.round(min / 1024 / 1024 * 100) / 100,
      measurements: this.measurements.length,
    };
  }

  // 定期監視を開始
  startMonitoring(intervalMs: number = 30000) {
    return setInterval(() => {
      this.recordUsage();
    }, intervalMs);
  }
}

export const memoryMonitor = MemoryMonitor.getInstance();

// React navigation performance optimization
export const navigationOptimizations = {
  // Screen options for better performance
  defaultScreenOptions: {
    headerShown: false,
    gestureEnabled: true,
    animationEnabled: true,
  },
  
  // Lazy loading helper
  lazy: (importFunc: () => Promise<any>) => {
    return React.lazy(importFunc);
  },
};

// Image optimization utilities
export const imageOptimizations = {
  // Placeholder while loading
  placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  
  // Resize image URL
  getResizedImageUrl: (url: string, width: number, height?: number) => {
    // In production, use a CDN service like Cloudinary or ImageKit
    return url; // Fallback to original URL
  },
};

// Bundle size analyzer (development only)
export const bundleAnalyzer = {
  logComponentSize: (componentName: string, props: any) => {
    if (__DEV__) {
      const propsSize = JSON.stringify(props).length;
      console.log(`[Bundle] ${componentName}: ${propsSize} bytes in props`);
    }
  },
  
  // Measure async import size
  measureAsyncImport: async (importFunc: () => Promise<any>, label: string) => {
    const start = Date.now();
    const module = await importFunc();
    const end = Date.now();
    
    if (__DEV__) {
      console.log(`[Bundle] ${label}: loaded in ${end - start}ms`);
    }
    
    return module;
  },
};