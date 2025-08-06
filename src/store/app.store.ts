import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 应用配置接口
interface AppConfig {
  // API 配置
  apiBaseUrl: string;
  apiTimeout: number;

  // 分页配置
  defaultPageSize: number;
  maxPageSize: number;

  // 上传配置
  maxFileSize: {
    image: number; // MB
    video: number; // MB
  };
  allowedFileTypes: {
    image: string[];
    video: string[];
  };

  // 缓存配置
  cacheExpiry: {
    short: number;  // 5分钟
    medium: number; // 30分钟
    long: number;   // 24小时
  };

  // 性能配置
  virtualScrollThreshold: number;
  imageOptimization: boolean;
  lazyLoading: boolean;

  // 功能开关
  features: {
    weiboImport: boolean;
    videoUpload: boolean;
    adminPanel: boolean;
    performanceMonitor: boolean;
    notifications: boolean;
  };
}

// 应用状态接口
interface AppState {
  // 配置
  config: AppConfig;

  // 应用信息
  version: string;
  buildTime: string;

  // 系统状态
  isOnline: boolean;
  lastSyncTime: Date | null;

  // 错误追踪
  errors: Array<{
    id: string;
    message: string;
    stack?: string;
    timestamp: Date;
    context?: any;
  }>;

  // 操作
  updateConfig: (config: Partial<AppConfig>) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSyncTime: () => void;
  addError: (error: { message: string; stack?: string; context?: any }) => void;
  clearErrors: () => void;
  toggleFeature: (feature: keyof AppConfig['features']) => void;

  // 辅助方法
  isFeatureEnabled: (feature: keyof AppConfig['features']) => boolean;
  getMaxFileSize: (type: 'image' | 'video') => number;
  isValidFileType: (file: File, type: 'image' | 'video') => boolean;
}

// 默认配置
const defaultConfig: AppConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  apiTimeout: 30000, // 30秒

  defaultPageSize: 24,
  maxPageSize: 100,

  maxFileSize: {
    image: 50,  // 50MB
    video: 500, // 500MB
  },

  allowedFileTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  },

  cacheExpiry: {
    short: 5 * 60 * 1000,      // 5分钟
    medium: 30 * 60 * 1000,    // 30分钟
    long: 24 * 60 * 60 * 1000, // 24小时
  },

  virtualScrollThreshold: 100,
  imageOptimization: true,
  lazyLoading: true,

  features: {
    weiboImport: true,
    videoUpload: true,
    adminPanel: true,
    performanceMonitor: process.env.NODE_ENV === 'development',
    notifications: true,
  },
};

// 创建应用 store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      config: defaultConfig,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      isOnline: true,
      lastSyncTime: null,
      errors: [],

      // 更新配置
      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),

      // 设置在线状态
      setOnlineStatus: (isOnline) => set({ isOnline }),

      // 更新最后同步时间
      updateLastSyncTime: () => set({ lastSyncTime: new Date() }),

      // 添加错误
      addError: (error) => set((state) => ({
        errors: [
          ...state.errors.slice(-9), // 只保留最近10个错误
          {
            id: Math.random().toString(36).substring(7),
            ...error,
            timestamp: new Date(),
          }
        ]
      })),

      // 清除错误
      clearErrors: () => set({ errors: [] }),

      // 切换功能开关
      toggleFeature: (feature) => set((state) => ({
        config: {
          ...state.config,
          features: {
            ...state.config.features,
            [feature]: !state.config.features[feature]
          }
        }
      })),

      // 检查功能是否启用
      isFeatureEnabled: (feature) => {
        const { config } = get();
        return config.features[feature];
      },

      // 获取最大文件大小
      getMaxFileSize: (type) => {
        const { config } = get();
        return config.maxFileSize[type] * 1024 * 1024; // 转换为字节
      },

      // 验证文件类型
      isValidFileType: (file, type) => {
        const { config } = get();
        return config.allowedFileTypes[type].includes(file.type);
      },
    }),
    {
      name: 'app-storage',
      skipHydration: true, // 跳过 SSR hydration，避免服务端和客户端状态不一致
      partialize: (state) => ({
        config: state.config,
        // 不持久化运行时状态
      }),
    }
  )
);

// 选择器 hooks
export const useAppConfig = () => useAppStore((state) => state.config);
export const useAppVersion = () => useAppStore((state) => state.version);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
export const useAppErrors = () => useAppStore((state) => state.errors);

// 功能相关 hooks
export const useFeature = (feature: keyof AppConfig['features']) =>
  useAppStore((state) => state.config.features[feature]);

export const useFileValidation = () => {
  const { getMaxFileSize, isValidFileType } = useAppStore();

  return {
    validateFile: (file: File, type: 'image' | 'video') => {
      const maxSize = getMaxFileSize(type);
      const isValidType = isValidFileType(file, type);

      if (!isValidType) {
        return { valid: false, error: `不支持的文件类型: ${file.type}` };
      }

      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return { valid: false, error: `文件大小超过限制: ${maxSizeMB}MB` };
      }

      return { valid: true };
    },
    getMaxFileSize,
    isValidFileType,
  };
};

// 错误处理 hook
export const useErrorHandler = () => {
  const { addError, clearErrors } = useAppStore();

  return {
    logError: (error: Error, context?: any) => {
      addError({
        message: error.message,
        stack: error.stack,
        context,
      });

      // 在开发环境打印到控制台
      if (process.env.NODE_ENV === 'development') {
        console.error('App Error:', error, context);
      }
    },
    clearErrors,
  };
};