/**
 * 视频播放器组件统一导出
 * 
 * 这是项目中唯一应该使用的视频播放器组件
 * 其他所有视频播放器组件都应该被弃用
 */

export { default as RobustVideoPlayer } from './RobustVideoPlayer';
export type { RobustVideoPlayerProps, VideoSource } from './RobustVideoPlayer';

// 默认导出，方便直接使用
export { default } from './RobustVideoPlayer';
