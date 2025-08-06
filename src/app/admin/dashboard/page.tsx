'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Image,
  FileCheck,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  Upload,
  Database,
  Server,
  HardDrive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/queries/useDashboard';
import { AdminDashboardService } from '@/services/admin-dashboard.service';

export default function AdminDashboard() {
  const { toast } = useToast();

  // 使用TanStack Query获取管理面板数据
  const {
    stats,
    activities,
    isLoading,
    error,
    hasError,
    queries: { activities: activitiesQuery }
  } = useDashboardData();

  // 处理错误
  React.useEffect(() => {
    if (hasError && error) {
      console.error('加载管理面板数据失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '加载统计数据失败',
        variant: 'destructive'
      });
    }
  }, [hasError, error, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载统计数据失败</p>
      </div>
    );
  }

  const quickActions = [
    { title: '审核内容', href: '/admin/review', icon: FileCheck, count: stats.media.pending },
    { title: '用户管理', href: '/admin/users', icon: Users, count: stats.users.new_this_week },
    { title: '媒体管理', href: '/admin/media', icon: Image, count: 0 },
    { title: '系统监控', href: '/admin/performance', icon: Activity, count: 0 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full">
      {/* 页面标题 */}
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">管理面板</h1>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>最后更新: 刚刚</span>
        </div>
      </div>

      {/* 关键指标卡片 - 根据侧边栏状态动态调整 */}
      <div className="admin-dashboard-grid-4 grid gap-4 sm:gap-6 min-w-0">
        {/* 用户统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              用户总数
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span className="text-green-600">+{stats.users.new_today} 今日新增</span>
              <span>•</span>
              <span>{stats.users.active.toLocaleString()} 活跃</span>
            </div>
          </CardContent>
        </Card>

        {/* 媒体统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              媒体内容
            </CardTitle>
            <Image className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.media.total.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>{stats.media.images.toLocaleString()} 图片</span>
              <span>•</span>
              <span>{stats.media.videos.toLocaleString()} 视频</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              总大小: {AdminDashboardService.formatFileSize(stats.media.total_size)}
            </div>
          </CardContent>
        </Card>

        {/* 待审核内容 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              待审核
            </CardTitle>
            <FileCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.media.pending.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span className="text-green-600">{stats.media.approved.toLocaleString()} 已通过</span>
              <span>•</span>
              <span className="text-red-600">{stats.media.rejected.toLocaleString()} 已拒绝</span>
            </div>
          </CardContent>
        </Card>

        {/* 系统活动 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              今日操作
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.operations.today.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>{stats.operations.this_week.toLocaleString()} 本周总计</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              审核: {stats.operations.reviews_today} | 登录: {stats.operations.login_attempts_today}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系统状态和快捷操作 - 根据侧边栏状态动态调整 */}
      <div className="admin-dashboard-grid-3 grid gap-4 sm:gap-6 min-w-0">
        {/* 系统状态 */}
        <Card className="admin-dashboard-card-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span>系统状态</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 min-w-0">
            {/* 存储使用情况 */}
            <div className="min-w-0">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  存储使用率
                </span>
                <span className="font-medium whitespace-nowrap">{stats.system.storage_used.toFixed(1)}% / {stats.system.storage_total}GB</span>
              </div>
              <Progress value={stats.system.storage_used} className="h-2" />
            </div>

            {/* 系统性能 */}
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    CPU使用率
                  </span>
                  <span className="font-medium">{stats.system.cpu_usage.toFixed(1)}%</span>
                </div>
                <Progress value={stats.system.cpu_usage} className="h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    内存使用率
                  </span>
                  <span className="font-medium">{stats.system.memory_usage}%</span>
                </div>
                <Progress value={stats.system.memory_usage} className="h-1" />
              </div>
            </div>

            {/* 系统信息 */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm min-w-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">系统运行时间</span>
                  <Badge variant="secondary">{stats.system.uptime}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">最后备份</span>
                  <Badge variant="outline">{stats.system.last_backup}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">今日登录</span>
                  <span className="font-medium">{stats.operations.login_attempts_today.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">失败登录</span>
                  <span className="font-medium text-red-600">{stats.operations.failed_logins_today}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 min-w-0">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => window.location.href = action.href}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{action.title}</div>
                    </div>
                    {action.count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 近期活动预览 */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>近期活动</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {activitiesQuery.isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3 py-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${AdminDashboardService.getStatusColor(activity.status)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 break-words">{activity.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{AdminDashboardService.formatTimeAgo(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无近期活动</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}