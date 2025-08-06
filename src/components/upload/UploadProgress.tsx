import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadTask } from '@/types/upload';

interface SingleUploadProgressProps {
  task: UploadTask;
  onRetry?: () => void;
  onCancel?: () => void;
}

interface BatchUploadProgressProps {
  tasks: UploadTask[];
  results: {
    completed: number;
    failed: number;
    total: number;
  };
  onRetryAll?: () => void;
  onCancelAll?: () => void;
}

type UploadProgressProps = SingleUploadProgressProps | BatchUploadProgressProps;

export const UploadProgress: React.FC<UploadProgressProps> = (props) => {
  // 检查是否为批量上传
  const isBatchUpload = 'tasks' in props;

  if (isBatchUpload) {
    return <BatchUploadProgress {...props} />;
  } else {
    return <SingleUploadProgress {...props} />;
  }
};

// 单个文件上传进度组件
const SingleUploadProgress: React.FC<SingleUploadProgressProps> = ({
  task,
  onRetry,
  onCancel,
}) => {
  const getStatusConfig = () => {
    switch (task.status) {
      case 'pending':
        return {
          color: 'bg-gray-200',
          textColor: 'text-gray-600',
          text: '等待中',
          icon: <Loader2 className="animate-spin" size={16} />,
        };
      case 'calculating':
        return {
          color: 'bg-yellow-200',
          textColor: 'text-yellow-700',
          text: '计算MD5',
          icon: <Loader2 className="animate-spin" size={16} />,
        };
      case 'uploading':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          text: '上传中',
          icon: <Loader2 className="animate-spin" size={16} />,
        };
      case 'merging':
        return {
          color: 'bg-purple-500',
          textColor: 'text-purple-700',
          text: '合并文件',
          icon: <Loader2 className="animate-spin" size={16} />,
        };
      case 'completed':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          text: '完成',
          icon: <CheckCircle size={16} />,
        };
      case 'skipped':
        return {
          color: 'bg-orange-400',
          textColor: 'text-orange-700',
          text: '文件已存在',
          icon: <CheckCircle size={16} />,
        };
      case 'failed':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          text: '失败',
          icon: <AlertCircle size={16} />,
        };
      case 'cancelled':
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          text: '已取消',
          icon: <Pause size={16} />,
        };
      default:
        return {
          color: 'bg-gray-200',
          textColor: 'text-gray-600',
          text: '未知',
          icon: <AlertCircle size={16} />,
        };
    }
  };

  const config = getStatusConfig();
  const isActive = ['calculating', 'uploading', 'merging'].includes(task.status);
  const canRetry = task.status === 'failed';
  const canCancel = isActive;

  return (
    <div className="mt-3 space-y-2">
      {/* 状态和进度 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={config.textColor}>{config.icon}</span>
          <span className={config.textColor}>{config.text}</span>
          {task.totalChunks && task.uploadedChunks.length > 0 && (
            <span className="text-gray-500">
              ({task.uploadedChunks.length}/{task.totalChunks} 分片)
            </span>
          )}
        </div>
        <span className="text-gray-600 font-medium">{task.progress}%</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${config.color}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* 错误信息 */}
      {task.error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
          {task.error}
        </div>
      )}

      {/* 操作按钮 */}
      {(canRetry || canCancel) && (
        <div className="flex gap-2 mt-2">
          {canRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              size="sm"
              className="text-xs"
            >
              重试
            </Button>
          )}
          {canCancel && onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
              className="text-xs"
            >
              取消
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// 批量上传进度组件
const BatchUploadProgress: React.FC<BatchUploadProgressProps> = ({
  tasks,
  results,
  onRetryAll,
  onCancelAll,
}) => {
  const { completed, failed, total } = results;
  const pending = total - completed - failed;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isCompleted = completed === total;
  const hasFailures = failed > 0;
  const isActive = pending > 0 || tasks.some(task =>
    task && ['calculating', 'uploading', 'merging'].includes(task.status)
  );

  return (
    <div className="space-y-4">
      {/* 总体进度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            批量上传进度
          </span>
          <span className="text-gray-500">
            {completed}/{total} 完成
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${isCompleted
                ? hasFailures
                  ? 'bg-orange-500'
                  : 'bg-green-500'
                : 'bg-blue-500'
              }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* 状态统计 */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {completed > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle size={12} className="text-green-500" />
              <span>{completed} 成功</span>
            </div>
          )}
          {failed > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle size={12} className="text-red-500" />
              <span>{failed} 失败</span>
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-1">
              <Loader2 size={12} className="animate-spin text-blue-500" />
              <span>{pending} 进行中</span>
            </div>
          )}
        </div>
      </div>

      {/* 个别任务进度 */}
      {tasks.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {tasks.filter(task => task).map((task) => (
            <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
              <div className="flex-shrink-0">
                {task.status === 'completed' && (
                  <CheckCircle size={14} className="text-green-500" />
                )}
                {task.status === 'failed' && (
                  <AlertCircle size={14} className="text-red-500" />
                )}
                {['calculating', 'uploading', 'merging'].includes(task.status) && (
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                )}
                {task.status === 'pending' && (
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{task.title || task.file.name}</div>
                <div className="text-xs text-gray-500">
                  {task.status === 'uploading' && `${Math.round(task.progress)}%`}
                  {task.status === 'completed' && '上传完成'}
                  {task.status === 'failed' && '上传失败'}
                  {task.status === 'pending' && '等待中'}
                  {task.status === 'calculating' && '计算MD5'}
                  {task.status === 'merging' && '合并分片'}
                </div>
              </div>

              {task.status === 'uploading' && (
                <div className="flex-shrink-0 w-16">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      {(hasFailures || isActive) && (
        <div className="flex gap-2 justify-end">
          {hasFailures && onRetryAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryAll}
            >
              重试失败项
            </Button>
          )}
          {isActive && onCancelAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelAll}
            >
              取消全部
            </Button>
          )}
        </div>
      )}
    </div>
  );
}; 