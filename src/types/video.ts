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
    source?: 'USER_UPLOAD' | 'WEIBO_CRAWL' | 'API_IMPORT' | 'BATCH_IMPORT'
    originalCreatedAt?: string
    sourceMetadata?: {
        weiboUserId?: string
        originalPath?: string
        crawlSource?: string
        importedAt?: string
        [key: string]: any
    }
}