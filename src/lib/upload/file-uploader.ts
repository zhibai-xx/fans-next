import { uploadService } from '@/services/upload.service';
import {
  UploadTask,
  UploadOptions,
  FileType,
  InitUploadRequest,
  UploadChunkRequest,
  MergeChunksRequest
} from '@/types/upload';
import SparkMD5 from 'spark-md5';

export interface ExtendedUploadOptions extends UploadOptions {
  chunkSize?: number;
  concurrency?: number;
}

// 性能优化配置
const PERFORMANCE_CONFIG = {
  DEFAULT_CHUNK_SIZE: 2 * 1024 * 1024, // 减少到2MB提高响应性
  MAX_CONCURRENT_UPLOADS: 2, // 减少并发数避免网络拥塞
  MD5_CHUNK_SIZE: 1024 * 1024, // 1MB chunks for MD5 calculation
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1秒
  MEMORY_CLEANUP_INTERVAL: 30000, // 30秒清理一次内存
};

export class FileUploader {
  private tasks: Map<string, UploadTask> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private taskOptions: Map<string, ExtendedUploadOptions> = new Map();
  private chunkCache: Map<string, Blob> = new Map(); // 分片缓存
  private memoryCleanupTimer: NodeJS.Timeout | null = null;
  private uploadQueue: string[] = []; // 上传队列
  private activeUploads: Set<string> = new Set(); // 活跃上传

  constructor() {
    // 启动内存清理定时器
    this.startMemoryCleanup();
  }

  /**
   * 启动内存清理
   */
  private startMemoryCleanup() {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
    }

    this.memoryCleanupTimer = setInterval(() => {
      this.cleanupMemory();
    }, PERFORMANCE_CONFIG.MEMORY_CLEANUP_INTERVAL);
  }

  /**
   * 清理内存
   */
  private cleanupMemory() {
    // 清理已完成任务的分片缓存
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.clearTaskCache(taskId);
      }
    }

    // 清理超过大小限制的缓存
    const cacheSize = this.chunkCache.size;
    if (cacheSize > 100) { // 最多缓存100个分片
      const keys = Array.from(this.chunkCache.keys());
      const toDelete = keys.slice(0, cacheSize - 50); // 删除一半
      toDelete.forEach(key => this.chunkCache.delete(key));
    }
  }

  /**
   * 清理任务缓存
   */
  private clearTaskCache(taskId: string) {
    const keys = Array.from(this.chunkCache.keys());
    keys.forEach(key => {
      if (key.startsWith(taskId)) {
        this.chunkCache.delete(key);
      }
    });
  }

  /**
   * 计算文件MD5 - 优化版本
   */
  private async calculateFileMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const chunkSize = PERFORMANCE_CONFIG.MD5_CHUNK_SIZE;
      const chunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
        }
        currentChunk++;

        if (currentChunk < chunks) {
          // 使用 setTimeout 避免阻塞主线程
          setTimeout(() => loadNext(), 0);
        } else {
          resolve(spark.end());
        }
      };

      fileReader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      const loadNext = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        fileReader.readAsArrayBuffer(file.slice(start, end));
      };

      loadNext();
    });
  }

  /**
   * 创建上传任务 - 优化版本
   */
  async createUploadTask(options: ExtendedUploadOptions): Promise<string> {
    const taskId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: UploadTask = {
      id: taskId,
      file: options.file,
      progress: 0,
      status: 'pending',
      uploadedChunks: [],
      title: options.title,
      description: options.description,
      tags: options.tags,
      category: options.category,
    };

    this.tasks.set(taskId, task);
    this.taskOptions.set(taskId, options);

    // 添加到上传队列
    this.uploadQueue.push(taskId);
    this.processUploadQueue();

    return taskId;
  }

  /**
   * 处理上传队列
   */
  private async processUploadQueue() {
    while (this.uploadQueue.length > 0 && this.activeUploads.size < PERFORMANCE_CONFIG.MAX_CONCURRENT_UPLOADS) {
      const taskId = this.uploadQueue.shift();
      if (!taskId) continue;

      const options = this.taskOptions.get(taskId);
      if (!options) continue;

      this.activeUploads.add(taskId);

      this.startUpload(taskId, options)
        .catch((error) => {
          console.error('上传失败:', error);
          this.updateTaskStatus(taskId, 'failed', error.message);
          options.onError?.(error.message);
        })
        .finally(() => {
          this.activeUploads.delete(taskId);
          // 继续处理队列
          setTimeout(() => this.processUploadQueue(), 100);
        });
    }
  }

  /**
   * 开始上传 - 优化版本
   */
  private async startUpload(taskId: string, options: ExtendedUploadOptions) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    let retryCount = 0;
    const maxRetries = PERFORMANCE_CONFIG.RETRY_COUNT;

    while (retryCount <= maxRetries) {
      try {
        // 1. 计算文件MD5
        this.updateTaskStatus(taskId, 'calculating');
        const fileMd5 = await this.calculateFileMD5(options.file);

        // 2. 初始化上传
        const fileType = options.file.type.startsWith('image/') ? FileType.IMAGE : FileType.VIDEO;
        const chunkSize = options.chunkSize || PERFORMANCE_CONFIG.DEFAULT_CHUNK_SIZE;

        const initRequest: InitUploadRequest = {
          filename: options.file.name,
          fileSize: options.file.size,
          fileType,
          fileMd5,
          chunkSize,
          title: options.title,
          description: options.description,
          tagIds: options.tags,
          categoryId: options.category?.id,
        };

        const initResponse = await uploadService.initUpload(initRequest);

        // 3. 检查是否需要上传（秒传）
        if (!initResponse.needUpload && initResponse.mediaId) {
          this.updateTaskStatus(taskId, 'skipped');
          task.mediaId = initResponse.mediaId;
          task.progress = 100;
          options.onProgress?.(100);
          options.onComplete?.(initResponse.mediaId);
          return;
        }

        // 4. 准备分片上传
        task.uploadId = initResponse.uploadId;
        task.uploadedChunks = initResponse.uploadedChunks || [];
        task.totalChunks = Math.ceil(options.file.size / chunkSize);

        // 5. 开始上传分片
        this.updateTaskStatus(taskId, 'uploading');
        await this.uploadChunks(taskId, options, fileMd5);

        // 6. 合并分片
        this.updateTaskStatus(taskId, 'merging');
        const mergeRequest: MergeChunksRequest = {
          uploadId: task.uploadId!,
          fileMd5,
        };
        const mergeResponse = await uploadService.mergeChunks(mergeRequest);

        // 7. 完成上传
        this.updateTaskStatus(taskId, 'completed');
        task.mediaId = mergeResponse.mediaId;
        task.progress = 100;
        options.onProgress?.(100);
        options.onComplete?.(mergeResponse.mediaId);

        return; // 成功完成，退出重试循环

      } catch (error) {
        retryCount++;
        console.error(`上传失败 (重试 ${retryCount}/${maxRetries}):`, error);

        if (retryCount <= maxRetries) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.RETRY_DELAY * retryCount));
          continue;
        } else {
          // 达到最大重试次数，抛出错误
          throw error;
        }
      }
    }
  }

  /**
   * 上传分片 - 优化版本
   */
  private async uploadChunks(taskId: string, options: ExtendedUploadOptions, _fileMd5: string) {
    const task = this.tasks.get(taskId);
    if (!task || !task.uploadId || !task.totalChunks) return;

    const chunkSize = options.chunkSize || PERFORMANCE_CONFIG.DEFAULT_CHUNK_SIZE;
    const maxConcurrent = Math.min(options.concurrency || 2, PERFORMANCE_CONFIG.MAX_CONCURRENT_UPLOADS);
    const totalChunks = task.totalChunks; // 确保类型为number

    // 创建中止控制器
    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    // 需要上传的分片索引
    const chunksToUpload: number[] = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!task.uploadedChunks.includes(i)) {
        chunksToUpload.push(i);
      }
    }

    // 使用信号量控制并发
    const semaphore = new Semaphore(maxConcurrent);
    const uploadPromises = chunksToUpload.map(async (chunkIndex) => {
      await semaphore.acquire();
      try {
        await this.uploadChunk(
          taskId,
          options.file,
          chunkIndex,
          chunkSize,
          totalChunks,
          abortController.signal
        );
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(uploadPromises);
  }

  /**
   * 上传单个分片 - 优化版本
   */
  private async uploadChunk(
    taskId: string,
    file: File,
    chunkIndex: number,
    chunkSize: number,
    totalChunks: number,
    signal: AbortSignal
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.uploadId) return;

    // 检查是否已取消
    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);

    // 检查缓存
    const cacheKey = `${taskId}-${chunkIndex}`;
    let chunk = this.chunkCache.get(cacheKey);

    if (!chunk) {
      chunk = file.slice(start, end);
      this.chunkCache.set(cacheKey, chunk);
    }

    const chunkRequest: UploadChunkRequest = {
      uploadId: task.uploadId,
      chunkIndex,
      totalChunks,
    };

    // 重试机制
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        await uploadService.uploadChunk(chunkRequest, chunk);
        break; // 成功，退出重试循环
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          throw error;
        }
      }
    }

    // 更新进度
    task.uploadedChunks.push(chunkIndex);
    task.progress = Math.round((task.uploadedChunks.length / totalChunks) * 90);

    // 触发进度回调
    const options = this.getTaskOptions(taskId);
    options?.onProgress?.(task.progress);

    // 清理已上传的分片缓存
    this.chunkCache.delete(cacheKey);
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 取消上传
   */
  async cancelUpload(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // 从队列中移除
    const queueIndex = this.uploadQueue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.uploadQueue.splice(queueIndex, 1);
    }

    // 中止网络请求
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(taskId);
    }

    // 取消后端上传
    if (task.uploadId) {
      try {
        await uploadService.cancelUpload(task.uploadId);
      } catch (error) {
        console.error('取消上传失败:', error);
      }
    }

    // 清理缓存
    this.clearTaskCache(taskId);
    this.activeUploads.delete(taskId);
    this.updateTaskStatus(taskId, 'cancelled');
  }

  /**
   * 重试上传
   */
  async retryUpload(taskId: string, options: ExtendedUploadOptions) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // 重置任务状态
    task.status = 'pending';
    task.progress = 0;
    task.error = undefined;
    task.uploadedChunks = [];

    // 清理缓存
    this.clearTaskCache(taskId);

    // 重新添加到队列
    this.uploadQueue.push(taskId);
    this.processUploadQueue();
  }

  /**
   * 清除任务
   */
  clearTask(taskId: string) {
    this.tasks.delete(taskId);
    this.abortControllers.delete(taskId);
    this.taskOptions.delete(taskId);
    this.clearTaskCache(taskId);
    this.activeUploads.delete(taskId);
  }

  /**
   * 清除已完成的任务
   */
  clearCompletedTasks() {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'skipped' || task.status === 'failed' || task.status === 'cancelled') {
        this.clearTask(taskId);
      }
    }
  }

  /**
   * 更新任务状态
   */
  private updateTaskStatus(taskId: string, status: UploadTask['status'], error?: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (error) {
        task.error = error;
      }

      // 触发状态变化回调
      const options = this.getTaskOptions(taskId);
      options?.onStatusChange?.(status);
    }
  }

  /**
   * 获取任务选项
   */
  private getTaskOptions(taskId: string): ExtendedUploadOptions | undefined {
    return this.taskOptions.get(taskId);
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
      this.memoryCleanupTimer = null;
    }

    // 取消所有活跃上传
    for (const taskId of this.activeUploads) {
      this.cancelUpload(taskId);
    }

    // 清理所有缓存
    this.chunkCache.clear();
    this.tasks.clear();
    this.abortControllers.clear();
    this.taskOptions.clear();
  }
}

/**
 * 信号量类 - 用于控制并发
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    const resolve = this.waitQueue.shift();
    if (resolve) {
      this.permits--;
      resolve();
    }
  }
}

// 创建全局实例
export const fileUploader = new FileUploader();

// 在页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    fileUploader.destroy();
  });
} 