import { VideoItem } from '@/types/video'

// 生成随机推荐视频的函数需要先定义
const getRandomRecommendations = (
    videos: VideoItem[],
    excludeId: string,
    count: number
): VideoItem[] => {
    return videos
        .filter(v => v.id !== excludeId)
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
}

// 初始化推荐数据的函数
const populateRecommendations = (videos: VideoItem[]) => {
    return videos.map(video => ({
        ...video,
        recommendations: getRandomRecommendations(videos, video.id, 3)
    }))
}

// 格式化视图数量
const formatViews = (count: string | number): string => {
    // 确保count是数字
    const numCount = typeof count === 'string' ? parseFloat(count) : count
    
    if (numCount >= 10000) {
        return `${(numCount / 10000).toFixed(1)}万`
    }
    return numCount.toString()
}

// 格式化发布日期
const formatPublishedDate = (date: string): string => {
    const now = new Date()
    const published = new Date(date)
    const diffInDays = Math.floor((now.getTime() - published.getTime()) / (1000 * 3600 * 24))
    
    if (diffInDays < 1) return '今天'
    if (diffInDays < 7) return `${diffInDays}天前`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`
    return `${Math.floor(diffInDays / 365)}年前`
}

// 模拟视频数据
const mockVideos: VideoItem[] = [
    {
        id: '1',
        title: '张婧仪最新专访：关于新剧的幕后故事',
        thumbnail: '/assets/zjy3.png',
        duration: '12:35',
        views: 128000,
        publishedAt: '2024-03-15T09:00:00Z',
        author: {
            id: '1',
            name: '官方频道',
            avatar: '/assets/zjy3.png',
            followers: 1200000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 25600,
        commentsCount: 1245,
        isLiked: false,
        isBookmarked: false
    },
    {
        id: '2',
        title: '张婧仪《与凤行》花絮：难忘的拍摄瞬间',
        thumbnail: '/assets/zjy2.jpg',
        duration: '08:22',
        views: 956000,
        publishedAt: '2024-02-20T15:30:00Z',
        author: {
            id: '1',
            name: '官方频道',
            avatar: '/assets/zjy3.png',
            followers: 1200000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 86400,
        commentsCount: 3560,
        isLiked: true,
        isBookmarked: true
    },
    {
        id: '3',
        title: '张婧仪谈角色塑造：如何演绎复杂人物',
        thumbnail: '/assets/zjy2.jpg',
        duration: '15:47',
        views: 532000,
        publishedAt: '2024-01-10T12:00:00Z',
        author: {
            id: '2',
            name: '影视圈',
            avatar: '/assets/zjy2.jpg',
            followers: 850000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 42300,
        commentsCount: 1823,
        isLiked: false,
        isBookmarked: false
    },
    {
        id: '4',
        title: '张婧仪&杨幂：《与凤行》主演访谈合集',
        thumbnail: '/assets/zjy2.jpg',
        duration: '22:15',
        views: 1450000,
        publishedAt: '2023-12-05T18:45:00Z',
        author: {
            id: '3',
            name: '电视剧频道',
            avatar: '/assets/zjy2.jpg',
            followers: 2300000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 132500,
        commentsCount: 8960,
        isLiked: false,
        isBookmarked: true
    },
    {
        id: '5',
        title: '张婧仪演技分析：从《觉醒年代》到《与凤行》',
        thumbnail: '/assets/zjy2.jpg',
        duration: '18:36',
        views: 762000,
        publishedAt: '2023-11-18T10:15:00Z',
        author: {
            id: '4',
            name: '影视评论家',
            avatar: '/assets/zjy2.jpg',
            followers: 560000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 68500,
        commentsCount: 4210,
        isLiked: true,
        isBookmarked: false
    },
    {
        id: '6',
        title: '张婧仪：从模特到演员的蜕变之路',
        thumbnail: '/assets/zjy2.jpg',
        duration: '25:10',
        views: 495000,
        publishedAt: '2023-10-22T14:30:00Z',
        author: {
            id: '5',
            name: '明星故事',
            avatar: '/assets/zjy2.jpg',
            followers: 720000
        },
        videoUrl: '/assets/张婧仪.mp4',
        recommendations: [],
        likes: 45800,
        commentsCount: 2850,
        isLiked: false,
        isBookmarked: false
    }
]

const initializedVideos = populateRecommendations(mockVideos)

// 获取视频列表
export const getVideos = async (): Promise<VideoItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 格式化日期和浏览量
    return initializedVideos.map(video => ({
        ...video,
        views: formatViews(video.views),
        publishedAt: formatPublishedDate(video.publishedAt)
    }))
}

// 根据分类获取视频
export const getVideosByCategory = async (category: string): Promise<VideoItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredVideos = initializedVideos
    
    // 根据分类过滤视频
    if (category !== 'all') {
        // 这里可以根据实际情况实现不同的过滤逻辑
        switch (category) {
            case 'popular':
                filteredVideos = initializedVideos.sort((a, b) => 
                    typeof b.views === 'number' && typeof a.views === 'number' 
                        ? b.views - a.views 
                        : 0
                )
                break
            case 'latest':
                filteredVideos = initializedVideos.sort((a, b) => 
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                )
                break
            case 'favorites':
                filteredVideos = initializedVideos.filter(v => v.isBookmarked)
                break
            default:
                // 可以添加其他分类的过滤逻辑
                break
        }
    }
    
    // 格式化日期和浏览量
    return filteredVideos.map(video => ({
        ...video,
        views: typeof video.views === 'number' ? formatViews(video.views) : video.views,
        publishedAt: typeof video.publishedAt === 'string' && video.publishedAt.includes('T') 
            ? formatPublishedDate(video.publishedAt) 
            : video.publishedAt
    }))
}

// 获取单个视频
export const getVideoById = async (
    id: string
): Promise<VideoItem | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const video = initializedVideos.find(video => video.id === id)
    
    if (!video) return undefined
    
    return {
        ...video,
        views: typeof video.views === 'number' ? formatViews(video.views) : video.views,
        publishedAt: typeof video.publishedAt === 'string' && video.publishedAt.includes('T') 
            ? formatPublishedDate(video.publishedAt) 
            : video.publishedAt,
        // 确保推荐视频也格式化
        recommendations: video.recommendations.map(rec => ({
            ...rec,
            views: typeof rec.views === 'number' ? formatViews(rec.views) : rec.views,
            publishedAt: typeof rec.publishedAt === 'string' && rec.publishedAt.includes('T') 
                ? formatPublishedDate(rec.publishedAt) 
                : rec.publishedAt
        }))
    }
}

// 搜索视频
export const searchVideos = async (query: string): Promise<VideoItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (!query.trim()) return []
    
    const normalizedQuery = query.toLowerCase().trim()
    const results = initializedVideos.filter(video => 
        video.title.toLowerCase().includes(normalizedQuery) || 
        video.author.name.toLowerCase().includes(normalizedQuery)
    )
    
    return results.map(video => ({
        ...video,
        views: typeof video.views === 'number' ? formatViews(video.views) : video.views,
        publishedAt: typeof video.publishedAt === 'string' && video.publishedAt.includes('T') 
            ? formatPublishedDate(video.publishedAt) 
            : video.publishedAt
    }))
}