import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UploadTask, Tag, Category } from '@/types/upload';

export interface FileWithMetadata {
  file: File;
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: Category;
  tagInput: string;
  showTagDropdown: boolean;
  filteredTags: Tag[];
  isExpanded: boolean;
  taskId?: string;
}

export interface BatchTemplate {
  description: string;
  tags: string[];
  category?: Category;
}

export interface UploadResults {
  completed: number;
  failed: number;
  total: number;
}

interface UploadState {
  // 文件和任务管理
  files: FileWithMetadata[];
  uploadTasks: UploadTask[];

  // 上传状态
  isUploading: boolean;
  uploadResults: UploadResults;

  // UI状态
  viewMode: 'compact' | 'detailed';
  showBatchPanel: boolean;
  batchTemplate: BatchTemplate;

  // 数据状态
  tags: Tag[];
  categories: Category[];

  // Actions
  setFiles: (files: FileWithMetadata[]) => void;
  addFiles: (files: FileWithMetadata[]) => void;
  removeFile: (fileId: string) => void;
  updateFileMetadata: (fileId: string, updates: Partial<FileWithMetadata>) => void;

  setUploadTasks: (tasks: UploadTask[]) => void;
  updateUploadTask: (taskId: string, updates: Partial<UploadTask>) => void;

  setIsUploading: (isUploading: boolean) => void;
  setUploadResults: (results: UploadResults) => void;

  setViewMode: (mode: 'compact' | 'detailed') => void;
  setShowBatchPanel: (show: boolean) => void;
  setBatchTemplate: (template: BatchTemplate) => void;
  applyBatchTemplate: () => void;

  setTags: (tags: Tag[]) => void;
  setCategories: (categories: Category[]) => void;

  // Utility actions
  clearAllData: () => void;
  toggleFileExpanded: (fileId: string) => void;

  // Upload management
  startUpload: () => void;
  cancelUpload: () => void;
  retryFailedTasks: () => void;

  // Statistics
  getUploadStatistics: () => {
    totalFiles: number;
    completedTasks: number;
    failedTasks: number;
    activeUploads: number;
    overallProgress: number;
  };
}

export const useUploadStore = create<UploadState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    files: [],
    uploadTasks: [],
    isUploading: false,
    uploadResults: { completed: 0, failed: 0, total: 0 },

    viewMode: 'compact',
    showBatchPanel: false,
    batchTemplate: {
      description: '',
      tags: [],
      category: undefined,
    },

    tags: [],
    categories: [],

    // File management actions
    setFiles: (files) => set({ files }),

    addFiles: (newFiles) => set((state) => ({
      files: [...state.files, ...newFiles],
      // Auto-expand if single file
      viewMode: newFiles.length === 1 ? 'detailed' : state.viewMode,
      // Show batch panel if multiple files
      showBatchPanel: newFiles.length > 1 || state.showBatchPanel,
    })),

    removeFile: (fileId) => set((state) => ({
      files: state.files.filter(f => f.id !== fileId),
    })),

    updateFileMetadata: (fileId, updates) => set((state) => ({
      files: state.files.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      ),
    })),

    // Upload task management
    setUploadTasks: (tasks) => set({ uploadTasks: tasks }),

    updateUploadTask: (taskId, updates) => set((state) => ({
      uploadTasks: state.uploadTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),

    // Upload state management
    setIsUploading: (isUploading) => set({ isUploading }),

    setUploadResults: (results) => set({ uploadResults: results }),

    // UI state management
    setViewMode: (mode) => set({ viewMode: mode }),

    setShowBatchPanel: (show) => set({ showBatchPanel: show }),

    setBatchTemplate: (template) => set({ batchTemplate: template }),

    applyBatchTemplate: () => {
      const { files, batchTemplate } = get();
      const updatedFiles = files.map(file => ({
        ...file,
        description: batchTemplate.description || file.description,
        tags: [...new Set([...file.tags, ...batchTemplate.tags])],
        category: batchTemplate.category || file.category,
      }));
      set({ files: updatedFiles });
    },

    // Data management
    setTags: (tags) => set({ tags }),
    setCategories: (categories) => set({ categories }),

    // Utility actions
    clearAllData: () => set({
      files: [],
      uploadTasks: [],
      isUploading: false,
      uploadResults: { completed: 0, failed: 0, total: 0 },
      viewMode: 'compact',
      showBatchPanel: false,
      batchTemplate: {
        description: '',
        tags: [],
        category: undefined,
      },
    }),

    toggleFileExpanded: (fileId) => {
      const { files, updateFileMetadata } = get();
      const file = files.find(f => f.id === fileId);
      if (file) {
        updateFileMetadata(fileId, { isExpanded: !file.isExpanded });
      }
    },

    // Upload management
    startUpload: () => set({ isUploading: true }),

    cancelUpload: () => set({
      isUploading: false,
      uploadTasks: [],
    }),

    retryFailedTasks: () => {
      // This would be implemented to retry failed upload tasks
      // For now, just a placeholder
      console.log('Retrying failed tasks...');
    },

    // Statistics
    getUploadStatistics: () => {
      const { files, uploadTasks } = get();
      const completedTasks = uploadTasks.filter(task => task.status === 'completed').length;
      const failedTasks = uploadTasks.filter(task => task.status === 'failed').length;
      const activeUploads = uploadTasks.filter(task =>
        ['calculating', 'uploading', 'merging'].includes(task.status)
      ).length;

      const totalProgress = uploadTasks.length > 0
        ? uploadTasks.reduce((sum, task) => sum + task.progress, 0) / uploadTasks.length
        : 0;

      return {
        totalFiles: files.length,
        completedTasks,
        failedTasks,
        activeUploads,
        overallProgress: Math.round(totalProgress),
      };
    },
  }))
);

// Selector hooks for common data access patterns
export const useUploadFiles = () => useUploadStore(state => state.files);
export const useUploadTasks = () => useUploadStore(state => state.uploadTasks);
export const useIsUploading = () => useUploadStore(state => state.isUploading);
export const useUploadResults = () => useUploadStore(state => state.uploadResults);
export const useUploadViewMode = () => useUploadStore(state => state.viewMode);
export const useBatchPanel = () => useUploadStore(state => ({
  show: state.showBatchPanel,
  template: state.batchTemplate,
}));
export const useUploadTags = () => useUploadStore(state => state.tags);
export const useUploadCategories = () => useUploadStore(state => state.categories);

// Action hooks
export const useUploadActions = () => useUploadStore(state => ({
  setFiles: state.setFiles,
  addFiles: state.addFiles,
  removeFile: state.removeFile,
  updateFileMetadata: state.updateFileMetadata,
  setUploadTasks: state.setUploadTasks,
  updateUploadTask: state.updateUploadTask,
  setIsUploading: state.setIsUploading,
  setUploadResults: state.setUploadResults,
  setViewMode: state.setViewMode,
  setShowBatchPanel: state.setShowBatchPanel,
  setBatchTemplate: state.setBatchTemplate,
  applyBatchTemplate: state.applyBatchTemplate,
  setTags: state.setTags,
  setCategories: state.setCategories,
  clearAllData: state.clearAllData,
  toggleFileExpanded: state.toggleFileExpanded,
  startUpload: state.startUpload,
  cancelUpload: state.cancelUpload,
  retryFailedTasks: state.retryFailedTasks,
  getUploadStatistics: state.getUploadStatistics,
}));

// Subscribe to upload progress changes for external components
export const subscribeToUploadProgress = (callback: (progress: number) => void) => {
  return useUploadStore.subscribe(
    (state) => state.uploadTasks,
    (tasks) => {
      const totalProgress = tasks.length > 0
        ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
        : 0;
      callback(Math.round(totalProgress));
    }
  );
};