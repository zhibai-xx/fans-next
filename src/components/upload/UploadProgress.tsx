import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadTask } from '@/types/upload';

interface UploadProgressProps {
  task: UploadTask;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
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