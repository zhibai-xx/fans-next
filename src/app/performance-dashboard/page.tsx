'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import {
  Activity,
  Database,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Trash2,
  Server,
  BarChart3
} from 'lucide-react';

interface PerformanceData {
  performanceScore: number;
  database: {
    averageQueryTime: number;
    slowQueriesCount: number;
    totalQueries: number;
    recommendations: string[];
  };
  cache: {
    hitRate: number;
    size: number;
    maxSize: number;
  };
  queries: {
    totalQueries: number;
    slowestQuery: number;
    modelStats: Record<string, { count: number; totalDuration: number; avgDuration: number }>;
  };
}

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { performanceData: frontendPerformance } = usePerformanceMonitor();

  // 获取性能数据
  const fetchPerformanceData = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient.get('/performance/overview') as { data: PerformanceData };
      setPerformanceData(response.data);
    } catch (error) {
      toast({
        title: '获取性能数据失败',
        description: '请检查网络连接或稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 清空缓存
  const clearCache = async () => {
    try {
      await apiClient.post('/performance/cache/clear');
      toast({
        title: '缓存清空成功',
        description: '所有缓存数据已清空',
      });
      await fetchPerformanceData();
    } catch (error) {
      toast({
        title: '清空缓存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 清空性能指标
  const clearMetrics = async () => {
    try {
      await apiClient.post('/performance/database/clear-metrics');
      toast({
        title: '性能指标清空成功',
        description: '所有性能指标历史已清空',
      });
      await fetchPerformanceData();
    } catch (error) {
      toast({
        title: '清空性能指标失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 获取性能评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取性能评分描述
  const getScoreDescription = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 50) return '一般';
    return '需要优化';
  };

  useEffect(() => {
    fetchPerformanceData();

    // 定期刷新数据
    const interval = setInterval(fetchPerformanceData, 30000); // 30秒刷新一次

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">加载性能数据...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">性能监控仪表板</h1>
        <div className="flex space-x-2">
          <Button
            onClick={fetchPerformanceData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
          <Button
            onClick={clearCache}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空缓存
          </Button>
          <Button
            onClick={clearMetrics}
            variant="outline"
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            清空指标
          </Button>
        </div>
      </div>

      {/* 性能概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 性能评分 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">性能评分</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(performanceData?.performanceScore || 0)}`}>
              {performanceData?.performanceScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {getScoreDescription(performanceData?.performanceScore || 0)}
            </p>
          </CardContent>
        </Card>

        {/* 数据库性能 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均查询时间</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.database.averageQueryTime?.toFixed(1) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceData?.database.totalQueries || 0} 次查询
            </p>
          </CardContent>
        </Card>

        {/* 缓存命中率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.cache.hitRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceData?.cache.size || 0}/{performanceData?.cache.maxSize || 0} 缓存条目
            </p>
          </CardContent>
        </Card>

        {/* 慢查询数量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">慢查询</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {performanceData?.database.slowQueriesCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              需要优化的查询
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据标签页 */}
      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database">数据库性能</TabsTrigger>
          <TabsTrigger value="frontend">前端性能</TabsTrigger>
          <TabsTrigger value="recommendations">优化建议</TabsTrigger>
        </TabsList>

        {/* 数据库性能 */}
        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>查询统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>总查询数:</span>
                    <span className="font-medium">{performanceData?.queries.totalQueries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>最慢查询:</span>
                    <span className="font-medium">{performanceData?.queries.slowestQuery || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平均查询时间:</span>
                    <span className="font-medium">{performanceData?.database.averageQueryTime?.toFixed(1) || 0}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>模型查询统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {performanceData?.queries.modelStats && Object.entries(performanceData.queries.modelStats).map(([model, stats]) => (
                    <div key={model} className="flex justify-between items-center">
                      <span className="text-sm">{model}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{stats.count}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {stats.avgDuration.toFixed(1)}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 前端性能 */}
        <TabsContent value="frontend" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>渲染性能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>平均渲染时间:</span>
                    <span className="font-medium">{frontendPerformance.averageRenderTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总交互次数:</span>
                    <span className="font-medium">{frontendPerformance.totalInteractions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>慢组件数量:</span>
                    <span className="font-medium">{frontendPerformance.slowComponents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>慢组件列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {frontendPerformance.slowComponents.length > 0 ? (
                    frontendPerformance.slowComponents.map((component, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{component}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">没有发现慢组件</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 优化建议 */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能优化建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData?.database.recommendations && performanceData.database.recommendations.length > 0 ? (
                  performanceData.database.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{recommendation}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-sm font-medium text-green-900">
                      系统性能良好，暂无需要优化的项目
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 