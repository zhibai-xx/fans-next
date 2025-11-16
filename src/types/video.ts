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
    source?: 'USER_UPLOAD' | 'SYSTEM_INGEST' | 'ADMIN_UPLOAD' | 'EXTERNAL_FEED'
    originalCreatedAt?: string
    sourceMetadata?: {
        ingestUserId?: string
        originalPath?: string
        sourcePipeline?: string
        importedAt?: string
        [key: string]: any
    }
}
