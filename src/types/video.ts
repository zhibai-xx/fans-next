export interface VideoItem {
    id: string
    title: string
    thumbnail: string
    duration: string
    views: string | number
    publishedAt: string
    author: {
        id: string
        name: string
        avatar: string
        followers: number
    }
    videoUrl: string
    recommendations: VideoItem[],
    // 可扩展更多字段
    likes?: number
    commentsCount?: number
    isLiked?: boolean
    isBookmarked?: boolean
}