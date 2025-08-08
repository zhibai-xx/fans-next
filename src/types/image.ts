export interface ImageItem {
    id: string;
    url: string;
    title?: string;
    description?: string;
    width: number;
    height: number;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    likes: number;
    favorites: number; // 收藏数
    isLiked?: boolean;  // 当前用户是否已点赞
    isBookmarked: boolean; // 当前用户是否已收藏
    tags: string[];
    views?: number; // 观看次数
}

export interface ImageGridProps {
    images: ImageItem[];
    className?: string;
}