export interface Video {
    id: string;
    title: string;
    url: string;
    likes: number;
}

// 导出所有类型定义
export * from './api';
export * from './image';
export * from './video';
export * from './upload';
export * from './upload-record';
export * from './review';
export * from './interaction';