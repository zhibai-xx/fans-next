import { notFound } from 'next/navigation'
import { getVideoById } from '@/lib/video'
import { VideoPlayer } from '../components/VideoPlayer'
import { VideoCard } from '../components/VideoCard'
import Image from 'next/image'
import { VideoComments } from '../components/VideoComments'
import { VideoActionButtons } from '../components/VideoActionButtons'

export default async function VideoDetailPage({
  params,
}: {
  params: { videoId: string }
}) {
  // 先 await params，然后再使用其属性
  const videoId = (await params).videoId
  const video = await getVideoById(videoId)
  if (!video) return notFound()

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8">
      {/* 视频播放器 */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <VideoPlayer 
          url={video.videoUrl} 
          thumbnail={video.thumbnail}
        />
      </div>

      {/* 视频信息 */}
      <div className="grid lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 space-y-6">
          {/* 标题和统计信息 */}
          <div>
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{video.views} 次观看</span>
                <span className="mx-2">•</span>
                <span>{video.publishedAt}</span>
              </div>
              
              {/* 操作按钮 */}
              <VideoActionButtons 
                videoId={video.id} 
                likes={video.likes || 0} 
                isLiked={video.isLiked || false}
                isBookmarked={video.isBookmarked || false}
              />
            </div>
          </div>

          {/* 作者信息 */}
          <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <Image
                src={video.author.avatar}
                alt={video.author.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="ml-3">
                <h2 className="font-medium">{video.author.name}</h2>
                <p className="text-gray-500 text-sm">
                  {video.author.followers} 粉丝
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors">
              + 关注
            </button>
          </div>

          {/* 视频评论 */}
          <VideoComments videoId={video.id} commentsCount={video.commentsCount || 0} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-lg font-medium">相关推荐</h3>
          <div className="space-y-4">
            {/* 推荐视频列表 */}
            {video.recommendations && video.recommendations.map((recommended) => (
              <VideoCard key={recommended.id} video={recommended} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 