import { VideoGrid } from './components/VideoGrid'
import { SearchBar } from './components/SearchBar'
import { CategoryTabs } from './components/CategoryTabs'
import { getVideos, getVideosByCategory } from '@/lib/video'

export default async function VideosPage({
  searchParams
}: {
  searchParams: { category?: string }
}) {
  // 在使用 searchParams 之前先 await
  const category = (await searchParams).category || 'all'
  const videos = await getVideosByCategory(category)

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">视频中心</h1>
        <SearchBar />
      </div>
      
      <CategoryTabs 
        categories={[
          { id: 'all', name: '婧仪' },
          { id: 'latest', name: '最新发布' },
          { id: 'popular', name: '热门播放' },
          { id: 'favorites', name: '我的收藏' },
        ]} 
      />
      
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">当前分类下暂无视频</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  )
} 