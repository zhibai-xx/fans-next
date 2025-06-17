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

export class FileUploader {
  private tasks: Map<string, UploadTask> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private taskOptions: Map<string, ExtendedUploadOptions> = new Map();
  private readonly defaultChunkSize = 5 * 1024 * 1024; // 5MB
  private readonly maxConcurrent = 3;

  /**
   * 计算文件MD5
   */
  private async calculateFileMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks for MD5
      const chunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
        }
        currentChunk++;

        if (currentChunk < chunks) {
          loadNext();
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
   * 计算分片MD5
   */
  private async calculateChunkMD5(chunk: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
          resolve(spark.end());
        } else {
          reject(new Error('分片读取失败'));
        }
      };

      fileReader.onerror = () => {
        reject(new Error('分片读取失败'));
      };

      fileReader.readAsArrayBuffer(chunk);
    });
  }

  /**
   * 创建上传任务
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

    // 开始上传流程
    this.startUpload(taskId, options).catch((error) => {
      console.error('上传失败:', error);
      this.updateTaskStatus(taskId, 'failed', error.message);
      options.onError?.(error.message);
    });

    return taskId;
  }

  /**
   * 开始上传
   */
  private async startUpload(taskId: string, options: ExtendedUploadOptions) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // 1. 计算文件MD5
      this.updateTaskStatus(taskId, 'calculating');
      const fileMd5 = await this.calculateFileMD5(options.file);

      // 2. 初始化上传
      const fileType = options.file.type.startsWith('image/') ? FileType.IMAGE : FileType.VIDEO;
      const initRequest: InitUploadRequest = {
        filename: options.file.name,
        fileSize: options.file.size,
        fileType,
        fileMd5,
        chunkSize: options.chunkSize || this.defaultChunkSize,
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

      const chunkSize = options.chunkSize || this.defaultChunkSize;
      const totalChunks = Math.ceil(options.file.size / chunkSize);
      task.totalChunks = totalChunks;

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

    } catch (error) {
      throw error;
    }
  }

  /**
   * 上传分片
   */
  private async uploadChunks(taskId: string, options: ExtendedUploadOptions, _fileMd5: string) {
    const task = this.tasks.get(taskId);
    if (!task || !task.uploadId || !task.totalChunks) return;

    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const maxConcurrent = options.concurrency || this.maxConcurrent;

    // 创建中止控制器
    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    // 需要上传的分片索引
    const chunksToUpload: number[] = [];
    for (let i = 0; i < task.totalChunks; i++) {
      if (!task.uploadedChunks.includes(i)) {
        chunksToUpload.push(i);
      }
    }

    // 并发上传分片 - 使用更简单可靠的方法
    const uploadPromises: Promise<void>[] = [];

    for (const chunkIndex of chunksToUpload) {
      const uploadPromise = this.uploadChunk(
        taskId,
        options.file,
        chunkIndex,
        chunkSize,
        task.totalChunks,
        abortController.signal
      );
      uploadPromises.push(uploadPromise);

      // 控制并发数量
      if (uploadPromises.length >= maxConcurrent) {
        await Promise.all(uploadPromises);
        uploadPromises.length = 0; // 清空数组
      }
    }

    // 等待剩余的上传完成
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
  }

  /**
   * 上传单个分片
   */
  private async uploadChunk(
    taskId: string,
    file: File,
    chunkIndex: number,
    chunkSize: number,
    totalChunks: number,
    _signal: AbortSignal
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.uploadId) return;

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const chunkRequest: UploadChunkRequest = {
      uploadId: task.uploadId,
      chunkIndex,
      totalChunks,
    };

    await uploadService.uploadChunk(chunkRequest, chunk);

    // 更新进度
    task.uploadedChunks.push(chunkIndex);
    task.progress = Math.round((task.uploadedChunks.length / totalChunks) * 90); // 90% for upload, 10% for merge

    // 触发进度回调
    const options = this.getTaskOptions(taskId);
    options?.onProgress?.(task.progress);
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

    // 重新开始上传
    await this.startUpload(taskId, options);
  }

  /**
   * 清除任务
   */
  clearTask(taskId: string) {
    this.tasks.delete(taskId);
    this.abortControllers.delete(taskId);
    this.taskOptions.delete(taskId);
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
}

// 创建全局实例
export const fileUploader = new FileUploader(); 