import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主题类型
export type Theme = 'light' | 'dark' | 'system';

// 侧边栏状态
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

// 布局模式
export type LayoutMode = 'grid' | 'list' | 'card';

// 上传模态框状态
interface UploadModalState {
  isOpen: boolean;
  type: 'image' | 'video' | 'mixed' | null;
  initialFiles?: File[];
}

// 确认对话框状态
interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Toast 消息状态
interface ToastState {
  toasts: Array<{
    id: string;
    title?: string;
    description: string;
    variant?: 'default' | 'destructive' | 'success';
    duration?: number;
  }>;
}

// UI 状态接口
interface UIState {
  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // 侧边栏
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;

  // 布局模式
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  // 上传模态框
  uploadModal: UploadModalState;
  openUploadModal: (type: 'image' | 'video' | 'mixed', initialFiles?: File[]) => void;
  closeUploadModal: () => void;

  // 确认对话框
  confirmDialog: ConfirmDialogState;
  openConfirmDialog: (options: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirmDialog: () => void;

  // 加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // 页面级别的加载状态
  pageLoading: Record<string, boolean>;
  setPageLoading: (page: string, loading: boolean) => void;

  // 搜索状态
  searchState: {
    isOpen: boolean;
    query: string;
    results: any[];
    loading: boolean;
  };
  setSearchState: (state: Partial<UIState['searchState']>) => void;

  // 通知设置
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  setNotifications: (settings: Partial<UIState['notifications']>) => void;
}

// 创建 UI store
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // 主题
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // 侧边栏
      sidebarState: 'expanded',
      setSidebarState: (sidebarState) => set({ sidebarState }),
      toggleSidebar: () => set((state) => ({
        sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'
      })),

      // 布局模式
      layoutMode: 'grid',
      setLayoutMode: (layoutMode) => set({ layoutMode }),

      // 上传模态框
      uploadModal: {
        isOpen: false,
        type: null,
      },
      openUploadModal: (type, initialFiles) => set({
        uploadModal: { isOpen: true, type, initialFiles }
      }),
      closeUploadModal: () => set({
        uploadModal: { isOpen: false, type: null, initialFiles: undefined }
      }),

      // 确认对话框
      confirmDialog: {
        isOpen: false,
        title: '',
        message: '',
      },
      openConfirmDialog: (options) => set({
        confirmDialog: { ...options, isOpen: true }
      }),
      closeConfirmDialog: () => set((state) => ({
        confirmDialog: { ...state.confirmDialog, isOpen: false }
      })),

      // 全局加载状态
      globalLoading: false,
      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      // 页面加载状态
      pageLoading: {},
      setPageLoading: (page, loading) => set((state) => ({
        pageLoading: { ...state.pageLoading, [page]: loading }
      })),

      // 搜索状态
      searchState: {
        isOpen: false,
        query: '',
        results: [],
        loading: false,
      },
      setSearchState: (newState) => set((state) => ({
        searchState: { ...state.searchState, ...newState }
      })),

      // 通知设置
      notifications: {
        enabled: true,
        sound: true,
        desktop: false,
      },
      setNotifications: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings }
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarState: state.sidebarState,
        layoutMode: state.layoutMode,
        notifications: state.notifications,
        // 不持久化模态框和对话框状态
      }),
    }
  )
);

// 选择器 hooks
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarState = () => useUIStore((state) => state.sidebarState);
export const useLayoutMode = () => useUIStore((state) => state.layoutMode);
export const useUploadModal = () => useUIStore((state) => state.uploadModal);
export const useConfirmDialog = () => useUIStore((state) => state.confirmDialog);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useSearchState = () => useUIStore((state) => state.searchState);
export const useNotifications = () => useUIStore((state) => state.notifications);

// 页面加载状态 hook
export const usePageLoading = (page: string) =>
  useUIStore((state) => state.pageLoading[page] || false);