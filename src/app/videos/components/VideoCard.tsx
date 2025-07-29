import Image from 'next/image'
import Link from 'next/link'
import { VideoItem } from '@/types/video'
import { Badge } from '@/components/ui/badge'

interface VideoCardProps {
  video: VideoItem
  className?: string
}

export function VideoCard({ video, className }: VideoCardProps) {
  return (
    <Link href={`/videos/${video.id}`} className={`group ${className}`}>
      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          {video.duration}
        </div>
        {/* 来源标签 */}
        {(video as any).source && (video as any).source === 'WEIBO_CRAWL' && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              微博
            </Badge>
          </div>
        )}
      </div>

      <h3 className="font-medium text-base line-clamp-2 group-hover:text-blue-500 transition-colors">
        {video.title}
      </h3>

      <div className="flex items-center mt-2">
        <Image
          src={video.author.avatar}
          alt={video.author.name}
          width={24}
          height={24}
          className="rounded-full mr-2"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {video.author.name}
          </p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{video.views}次观看</span>
            <span className="mx-1">•</span>
            <span>{video.publishedAt}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}