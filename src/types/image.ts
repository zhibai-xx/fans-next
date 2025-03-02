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
    isBookmarked: boolean;
    tags: string[];
}

export interface ImageGridProps {
    images: ImageItem[];
    className?: string;
}