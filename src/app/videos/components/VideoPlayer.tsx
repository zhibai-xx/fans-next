'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface VideoPlayerProps {
  url: string
  className?: string
  controls?: boolean
  light?: boolean | string
  thumbnail?: string
}

export const VideoPlayer = ({
  url,
  className,
  controls = true,
  light = true,
  thumbnail
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isLightMode, setIsLightMode] = useState(!!light)
  const playerRef = useRef<HTMLDivElement>(null)
  const [loadRetries, setLoadRetries] = useState(0)
  const maxRetries = 3
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // 控制超时隐藏控件
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && showControls) {
      timer = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(timer)
  }, [isPlaying, showControls])

  // 处理视频加载和错误处理
  useEffect(() => {
    setError(null)
    setIsReady(false)
    setLoadRetries(0)

    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setIsReady(true)
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const handleError = () => {
      if (loadRetries < maxRetries) {
        // 自动重试加载
        setLoadRetries(prev => prev + 1)
        const timer = setTimeout(() => {
          video.load()
        }, 1000)
        return () => clearTimeout(timer)
      }
      setError(`视频加载失败 (已尝试 ${loadRetries + 1} 次)`)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setProgress(0)
    }

    // 监听视频事件
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('error', handleError)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('error', handleError)
      video.removeEventListener('ended', handleEnded)
    }
  }, [url, loadRetries, maxRetries])

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      // 只有当播放器处于聚焦状态或全屏状态时才处理键盘事件
      if (document.activeElement !== playerRef.current && !isFullscreen) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': // YouTube风格
          e.preventDefault()
          togglePlay()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'arrowright':
          e.preventDefault()
          seekForward()
          break
        case 'arrowleft':
          e.preventDefault()
          seekBackward()
          break
        case 'arrowup':
          e.preventDefault()
          changeVolume(0.1)
          break
        case 'arrowdown':
          e.preventDefault()
          changeVolume(-0.1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // 播放控制
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isLightMode) {
      setIsLightMode(false)
      video.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        setError(`播放失败: ${err.message}`)
      })
      return
    }

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().then(() => {
        setIsPlaying(true)
      }).catch(err => {
        setError(`播放失败: ${err.message}`)
      })
    }
  }

  // 全屏控制
  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      playerRef.current.requestFullscreen()
    }
  }

  // 静音控制
  const toggleMute = () => {
    if (!videoRef.current) return

    const newMutedState = !isMuted
    videoRef.current.muted = newMutedState
    setIsMuted(newMutedState)

    if (newMutedState) {
      // 保存当前音量并设置为0
      setVolume(0)
    } else {
      // 恢复到之前的音量
      setVolume(0.75)
      videoRef.current.volume = 0.75
    }
  }

  // 前进/后退
  const seekForward = () => {
    if (!videoRef.current) return
    const newTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration)
    videoRef.current.currentTime = newTime
  }

  const seekBackward = () => {
    if (!videoRef.current) return
    const newTime = Math.max(videoRef.current.currentTime - 10, 0)
    videoRef.current.currentTime = newTime
  }

  // 改变音量
  const changeVolume = (delta: number) => {
    if (!videoRef.current) return
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  // 进度条控制
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newProgress = parseFloat(e.target.value)
    video.currentTime = (newProgress / 100) * video.duration
    setProgress(newProgress)
  }

  // 音量控制
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  // 切换播放速度
  const changePlaybackRate = () => {
    if (!videoRef.current) return

    // 循环切换播放速度：0.5, 1.0, 1.5, 2.0
    const rates = [0.5, 1.0, 1.5, 2.0]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]

    setPlaybackRate(newRate)
    videoRef.current.playbackRate = newRate
  }

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // 重试加载
  const retryLoading = () => {
    setError(null)
    setLoadRetries(0)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  return (
    <div
      ref={playerRef}
      className={cn(
        'relative aspect-video bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={isLightMode ? togglePlay : undefined}
      tabIndex={0} // 使组件可聚焦以接收键盘事件
    >
      {/* Light 模式下显示缩略图 */}
      {isLightMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt="视频封面"
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="bg-gray-800 w-full h-full"></div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <PlayButton />
          </div>
        </div>
      )}

      {/* 视频播放器 */}
      <video
        ref={videoRef}
        src={url}
        className={cn("w-full h-full", isLightMode && "hidden")}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
        playsInline
        preload="metadata"
      />

      {/* 加载中状态 */}
      {!isReady && !isLightMode && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-white">
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-white text-red-900 rounded-md hover:bg-gray-200"
              onClick={retryLoading}
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 播放暂停大按钮 */}
      {!isPlaying && !isLightMode && isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div onClick={togglePlay}>
            <PlayButton />
          </div>
        </div>
      )}

      {/* 速率指示器 - 当改变速率时短暂显示 */}
      {playbackRate !== 1 && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {playbackRate}x
        </div>
      )}

      {/* 10秒快进/快退指示器 - 需要在相应函数中添加显示控制 */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-16 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            seekBackward();
          }}
          className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/30 pointer-events-auto"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            seekForward();
          }}
          className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/30 pointer-events-auto"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 18l8.5-6L4 6v12zm9.5-12v12l8.5-6-8.5-6z" />
          </svg>
        </button>
      </div>

      {/* 控制条 */}
      {controls && !isLightMode && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 transition-opacity duration-300",
            (showControls || !isPlaying) ? "opacity-100" : "opacity-0"
          )}
        >
          {/* 进度条 */}
          <div className="relative w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer group">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            ></div>
          </div>

          {/* 控制按钮行 */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              {/* 播放/暂停按钮 */}
              <button onClick={togglePlay} className="focus:outline-none">
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* 音量控制 */}
              <div className="flex items-center space-x-1">
                <button onClick={toggleMute} className="focus:outline-none">
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>

              {/* 时间显示 */}
              <div className="text-sm">
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 右侧控制按钮 */}
            <div className="flex items-center space-x-3">
              {/* 播放速度控制 */}
              <button onClick={changePlaybackRate} className="text-xs bg-black/30 px-2 py-1 rounded hover:bg-black/50">
                {playbackRate}x
              </button>

              {/* 键盘快捷键 */}
              <KeyboardShortcuts />

              {/* 全屏按钮 */}
              <button onClick={toggleFullscreen} className="focus:outline-none">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 自定义播放按钮
const PlayButton = () => (
  <Button
    variant="ghost"
    size="icon"
    className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm transition-all hover:bg-white/30 text-white"
  >
    <svg
      className="w-8 h-8"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  </Button>
)