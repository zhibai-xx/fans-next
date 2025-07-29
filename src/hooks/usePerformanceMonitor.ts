import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 性能指标接口
 * 
 * 用于记录前端应用的各种性能数据
 */
interface PerformanceMetric {
  name: string;        // 指标名称（如组件名、API名称等）
  startTime: number;   // 开始时间戳
  endTime: number;     // 结束时间戳
  duration: number;    // 持续时间（毫秒）
  type: 'render' | 'interaction' | 'api' | 'navigation'; // 指标类型
}

/**
 * 性能数据汇总接口
 * 
 * 包含所有性能指标的统计信息
 */
interface PerformanceData {
  metrics: PerformanceMetric[];  // 所有性能指标
  averageRenderTime: number;     // 平均渲染时间
  slowComponents: string[];      // 慢组件列表
  totalInteractions: number;     // 总交互次数
}

/**
 * 性能监控 Hook
 * 
 * 提供前端性能监控功能，包括：
 * - 组件渲染时间监控
 * - 用户交互性能跟踪
 * - API 调用性能分析
 * - 页面导航性能监控
 * 
 * @returns 性能监控相关的方法和数据
 */
export const usePerformanceMonitor = () => {
  // 性能数据状态
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    metrics: [],
    averageRenderTime: 0,
    slowComponents: [],
    totalInteractions: 0,
  });

  // 性能指标引用，避免重复渲染
  const metricsRef = useRef<PerformanceMetric[]>([]);

  // 渲染开始时间映射表
  const renderStartTimes = useRef<Map<string, number>>(new Map());

  /**
   * 记录性能指标
   * 
   * @param metric 性能指标对象
   */
  const recordMetric = useCallback((metric: PerformanceMetric) => {
    metricsRef.current.push(metric);

    // 保持最近1000条记录
    if (metricsRef.current.length > 1000) {
      metricsRef.current = metricsRef.current.slice(-1000);
    }

    // 更新性能数据
    updatePerformanceData();
  }, []);

  // 开始测量渲染时间
  const startRenderMeasure = useCallback((componentName: string) => {
    renderStartTimes.current.set(componentName, performance.now());
  }, []);

  // 结束测量渲染时间
  const endRenderMeasure = useCallback((componentName: string) => {
    const startTime = renderStartTimes.current.get(componentName);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      recordMetric({
        name: componentName,
        startTime,
        endTime,
        duration,
        type: 'render',
      });

      renderStartTimes.current.delete(componentName);
    }
  }, [recordMetric]);

  // 测量用户交互
  const measureInteraction = useCallback((interactionName: string, callback: () => void) => {
    const startTime = performance.now();

    callback();

    const endTime = performance.now();
    const duration = endTime - startTime;

    recordMetric({
      name: interactionName,
      startTime,
      endTime,
      duration,
      type: 'interaction',
    });
  }, [recordMetric]);

  // 测量API调用
  const measureApiCall = useCallback(async (apiName: string, apiCall: () => Promise<any>) => {
    const startTime = performance.now();

    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      recordMetric({
        name: apiName,
        startTime,
        endTime,
        duration,
        type: 'api',
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      recordMetric({
        name: `${apiName}_error`,
        startTime,
        endTime,
        duration,
        type: 'api',
      });

      throw error;
    }
  }, [recordMetric]);

  // 更新性能数据
  const updatePerformanceData = useCallback(() => {
    const metrics = metricsRef.current;
    const renderMetrics = metrics.filter(m => m.type === 'render');
    const interactionMetrics = metrics.filter(m => m.type === 'interaction');

    // 计算平均渲染时间
    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length
      : 0;

    // 找出慢组件（渲染时间超过100ms）
    const slowComponents = renderMetrics
      .filter(m => m.duration > 100)
      .map(m => m.name)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    setPerformanceData({
      metrics: metrics.slice(-100), // 只显示最近100条
      averageRenderTime,
      slowComponents,
      totalInteractions: interactionMetrics.length,
    });
  }, []);

  // 获取性能报告
  const getPerformanceReport = useCallback(() => {
    const metrics = metricsRef.current;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentMetrics = metrics.filter(m => m.startTime > oneMinuteAgo);

    const report = {
      totalMetrics: metrics.length,
      recentMetrics: recentMetrics.length,
      byType: {
        render: recentMetrics.filter(m => m.type === 'render').length,
        interaction: recentMetrics.filter(m => m.type === 'interaction').length,
        api: recentMetrics.filter(m => m.type === 'api').length,
        navigation: recentMetrics.filter(m => m.type === 'navigation').length,
      },
      slowestOperations: metrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      averageDurations: {
        render: calculateAverageDuration(recentMetrics, 'render'),
        interaction: calculateAverageDuration(recentMetrics, 'interaction'),
        api: calculateAverageDuration(recentMetrics, 'api'),
      },
    };

    return report;
  }, []);

  // 计算平均持续时间
  const calculateAverageDuration = (metrics: PerformanceMetric[], type: string) => {
    const typeMetrics = metrics.filter(m => m.type === type);
    return typeMetrics.length > 0
      ? typeMetrics.reduce((sum, m) => sum + m.duration, 0) / typeMetrics.length
      : 0;
  };

  // 清空性能数据
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    setPerformanceData({
      metrics: [],
      averageRenderTime: 0,
      slowComponents: [],
      totalInteractions: 0,
    });
  }, []);

  // 监听页面性能
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          recordMetric({
            name: 'page_navigation',
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            type: 'navigation',
          });
        } else if (entry.entryType === 'measure') {
          recordMetric({
            name: entry.name,
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            type: 'render',
          });
        }
      });
    });

    // 观察导航和测量条目
    observer.observe({ entryTypes: ['navigation', 'measure'] });

    return () => {
      observer.disconnect();
    };
  }, [recordMetric]);

  return {
    performanceData,
    startRenderMeasure,
    endRenderMeasure,
    measureInteraction,
    measureApiCall,
    getPerformanceReport,
    clearMetrics,
  };
}; 