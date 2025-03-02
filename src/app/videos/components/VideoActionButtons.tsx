'use client'

import { useState } from 'react'

interface VideoActionButtonsProps {
  videoId: string
  likes: number
  isLiked?: boolean
  isBookmarked?: boolean
}

export function VideoActionButtons({ 
  videoId, 
  likes, 
  isLiked = false, 
  isBookmarked = false 
}: VideoActionButtonsProps) {
  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [bookmarked, setBookmarked] = useState(isBookmarked)

  const handleLike = () => {
    // 实际项目中这里应该调用API
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  const handleBookmark = () => {
    // 实际项目中这里应该调用API
    setBookmarked(!bookmarked)
  }

  const handleShare = () => {
    // 分享逻辑
    if (navigator.share) {
      navigator.share({
        title: '分享视频',
        url: window.location.href
      })
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <button 
        onClick={handleLike}
        className={`flex items-center space-x-1 text-sm ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
      >
        <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={liked ? 0 : 2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span>{likeCount}</span>
      </button>

      <button 
        onClick={handleBookmark}
        className={`flex items-center space-x-1 text-sm ${bookmarked ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'}`}
      >
        <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={bookmarked ? 0 : 2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>收藏</span>
      </button>

      <button 
        onClick={handleShare}
        className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>分享</span>
      </button>

      <button className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span>评论</span>
      </button>
    </div>
  )
}