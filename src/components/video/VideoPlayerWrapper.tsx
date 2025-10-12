'use client';

import dynamic from 'next/dynamic';
import { RobustVideoPlayerProps } from './RobustVideoPlayer';

// 动态导入RobustVideoPlayer，禁用SSR
const RobustVideoPlayer = dynamic(
  () => import('./RobustVideoPlayer'),
  {
    ssr: false,
    loading: () => null // 移除动态导入的加载状态
  }
);

export interface VideoPlayerWrapperProps extends RobustVideoPlayerProps { }

/**
 * 视频播放器包装器 - 解决SSR水合问题
 */
export function VideoPlayerWrapper(props: VideoPlayerWrapperProps) {
  return <RobustVideoPlayer {...props} />;
}

export default VideoPlayerWrapper;
