'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './RobustVideoPlayer.module.css';
import { getVideoMimeType } from '@/lib/utils/media-url';

// 确保videojs在全局可用
if (typeof window !== 'undefined' && !(window as any).videojs) {
  (window as any).videojs = videojs;
}

const isDev = process.env.NODE_ENV !== 'production';


export interface VideoSource {
  src: string;
  type: string;
  label?: string;
  res?: string;
  width?: number;
  height?: number;
  quality?: string;
  requiresAuth?: boolean;
  displayLabel?: string;
  isDefault?: boolean;
}

export interface RobustVideoPlayerProps {
  /** 视频源 - 支持单个URL或多个源 */
  src: string | VideoSource[];
  /** 视频封面图 */
  poster?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否显示控制栏 */
  controls?: boolean;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 视频比例 - auto为自动检测 */
  aspectRatio?: 'landscape' | 'portrait' | 'square' | 'auto';
  /** 是否启用质量选择器 */
  enableQualitySelector?: boolean;
  /** 播放器准备就绪回调 */
  onReady?: (player: videojs.Player) => void;
  /** 播放状态变化回调 */
  onPlayStateChange?: (isPlaying: boolean) => void;
  /** 播放进度回调 */
  onProgress?: (currentTime: number, duration: number) => void;
  /** 错误回调 */
  onError?: (error: any) => void;
  /** 登录提示 */
  onRequireAuth?: (source: VideoSource) => void;
}

/**
 * 健壮的视频播放器组件
 * 
 * 特性：
 * - 完全的样式隔离，不受全局CSS影响
 * - 自动适应不同视频比例
 * - 支持多种视频源和质量选择
 * - 完善的错误处理和加载状态
 * - 响应式设计
 * - 中文本地化
 */
export default function RobustVideoPlayer({
  src,
  poster,
  className = '',
  controls = true,
  autoplay = false,
  aspectRatio = 'auto',
  enableQualitySelector = true,
  onReady,
  onPlayStateChange,
  onProgress,
  onError,
  onRequireAuth,
}: RobustVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true); // 恢复内部加载状态
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // 移除客户端检测 - 现在通过动态导入处理SSR

  // 准备视频源
  const videoSources = React.useMemo(() => {
    if (Array.isArray(src)) {
      return src;
    }
    return [{ src: src as string, type: getVideoMimeType(src as string) }];
  }, [src]);

  // 创建质量选择器按钮 - 返回按钮元素
  const createQualityButton = useCallback((player: videojs.Player) => {
    if (!enableQualitySelector || videoSources.length <= 1) return;

    if (isDev) {
      console.log('Creating quality selector with sources:', videoSources);
    }

    // 创建质量选择器按钮
    const qualityButton = document.createElement('div');
    qualityButton.className = 'vjs-control vjs-button vjs-quality-selector-button';
    qualityButton.setAttribute('title', '画质选择');

    // 获取默认清晰度标签
    const defaultIndex = videoSources.findIndex(
      (source) => source.isDefault && !source.requiresAuth,
    );
    const initialIndex =
      defaultIndex >= 0
        ? defaultIndex
        : videoSources.findIndex((source) => !source.requiresAuth) >= 0
        ? videoSources.findIndex((source) => !source.requiresAuth)
        : 0;
    const defaultSource = videoSources[initialIndex];
    const defaultLabel =
      defaultSource.displayLabel ||
      defaultSource.label ||
      defaultSource.res ||
      `${defaultSource.width || ''}p` ||
      'HD';

    qualityButton.innerHTML = `
      <span class="vjs-icon-placeholder quality-label" aria-hidden="true">${defaultLabel}</span>
      <span class="vjs-control-text">画质选择</span>
    `;

    // 创建质量菜单
    const qualityMenu = document.createElement('div');
    qualityMenu.className = 'vjs-quality-menu vjs-menu';
    qualityMenu.style.display = 'none';

    const menuContent = document.createElement('div');
    menuContent.className = 'vjs-menu-content';

    // 添加质量选项
    videoSources.forEach((source, index) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'vjs-menu-item';
      if (index === initialIndex) menuItem.classList.add('vjs-selected');

      const baseLabel =
        source.label || source.res || `${source.width || ''}p` || `质量${index + 1}`;
      const displayLabel = source.displayLabel || baseLabel;
      menuItem.textContent = displayLabel;
      menuItem.setAttribute('data-index', index.toString());

      if (source.requiresAuth) {
        menuItem.classList.add('vjs-disabled');
      }

      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();

        if (source.requiresAuth) {
          onRequireAuth?.(source);
          qualityMenu.style.display = 'none';
          return;
        }

        // 更新选中状态
        menuContent.querySelectorAll('.vjs-menu-item').forEach((item) => {
          item.classList.remove('vjs-selected');
        });
        menuItem.classList.add('vjs-selected');

        // 更新按钮显示
        const qualityLabel = qualityButton.querySelector('.quality-label');
        if (qualityLabel) {
          qualityLabel.textContent = displayLabel;
        }

        // 切换视频源
        const newSource = {
          src: source.src,
          type: source.type || 'video/mp4'
        };

        const currentTime = player.currentTime();
        const wasPaused = player.paused();

        player.src([newSource]);

        player.ready(() => {
          player.currentTime(currentTime);
          if (!wasPaused) {
            player.play();
          }
        });

        // 隐藏菜单
        qualityMenu.style.display = 'none';
      });

      menuContent.appendChild(menuItem);
    });

    qualityMenu.appendChild(menuContent);
    qualityButton.appendChild(qualityMenu);

    // 点击按钮显示/隐藏菜单
    qualityButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = qualityMenu.style.display !== 'none';
      qualityMenu.style.display = isVisible ? 'none' : 'block';
    });

    // 返回按钮元素，不直接插入
    if (isDev) {
      console.log('质量选择器按钮创建完成');
    }
    return qualityButton;
  }, [videoSources, enableQualitySelector, onRequireAuth]);

  // 初始化播放器 - 使用更好的方法
  useEffect(() => {
    if (!videoRef.current) return;

    let player: videojs.Player | null = null;
    let isInitialized = false;

    const initializePlayer = () => {
      if (isInitialized || !videoRef.current) return;
      isInitialized = true;

      // 清理现有播放器实例
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (error) {
          console.warn('清理播放器实例时出错:', error);
        }
      }

      // 清理可能存在的data-vjs-player属性
      videoRef.current.removeAttribute('data-vjs-player');
      // 确保元素ID唯一性
      const uniqueId = `vjs_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      videoRef.current.id = uniqueId;

      if (isDev) {
        console.log('🎬 RobustVideoPlayer 开始初始化...');
      }
      setHasError(false);

      try {
        // Video.js配置
        const options: any = {
          controls,
          responsive: true,
          fluid: true,
          preload: 'metadata',
          poster,
          autoplay: autoplay ? 'muted' : false,
          language: 'zh-CN',
          languages: {
            'zh-CN': {
              'Play': '播放',
              'Pause': '暂停',
              'Mute': '静音',
              'Unmute': '取消静音',
              'Fullscreen': '全屏',
              'Exit Fullscreen': '退出全屏',
              'Remaining Time': '剩余时间',
              'Current Time': '当前时间',
              'Duration': '总时长',
              'Volume Level': '音量',
              'Progress': '进度',
              'Loaded': '已加载'
            }
          },
          liveui: false,
          // 禁用不需要的控件
          playbackRates: [],
          chapters: false,
          textTrackDisplay: false,
          html5: {
            vhs: {
              overrideNative: true
            }
          },
          // 激进的控制栏配置 - 明确禁用所有不需要的控件
          controlBar: {
            // 使用children数组精确控制显示的控件
            children: [
              'playToggle',           // 播放/暂停按钮
              'volumePanel',          // 音量控制
              'currentTimeDisplay',   // 当前时间显示
              'timeDivider',          // 时间分隔符
              'durationDisplay',      // 总时长显示
              'progressControl',      // 进度条
              'fullscreenToggle'      // 全屏按钮
            ],
            // 明确禁用所有不需要的控件
            skipButtons: false,
            chaptersButton: false,
            descriptionsButton: false,
            subsCapsButton: false,
            audioTrackButton: false,
            playbackRateMenuButton: false,
            liveDisplay: false,
            seekToLive: false,
            customControlSpacer: false,
            remainingTimeDisplay: false,
            pictureInPictureToggle: false,

            // 进度条配置
            progressControl: {
              keepTooltipsInside: true
            },
            // 音量面板配置
            volumePanel: {
              inline: false,
              vertical: false
            }
          }
        };

        // 初始化播放器
        player = videojs(videoRef.current, options);
        playerRef.current = player;

        // 设置视频源
        player.src(videoSources);

        // 播放器准备就绪
        player.ready(() => {
          if (isDev) {
            console.log('✅ RobustVideoPlayer 初始化完成');
          }
          setIsLoading(false);

          // 🎯 强制移除Video.js可能设置的固定尺寸
          const playerEl = (player as any).el();
          if (playerEl) {
            playerEl.style.width = '';
            playerEl.style.height = '';
            playerEl.style.maxWidth = '';
            playerEl.style.maxHeight = '';
            playerEl.style.minWidth = '';
            playerEl.style.minHeight = '';
            if (isDev) {
              console.log('🎯 已移除Video.js的固定尺寸设置');
            }
          }

          // 双重保险：API移除 + DOM移除
          const controlBar = (player as any).controlBar;

          // 1. 尝试通过API移除控件
          const unwantedControls = [
            'skipButtons',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'playbackRateMenuButton',
            'liveDisplay',
            'seekToLive',
            'customControlSpacer',
            'remainingTimeDisplay',
            'pictureInPictureToggle'
          ];

          unwantedControls.forEach(controlName => {
            try {
              const control = controlBar.getChild(controlName);
              if (control) {
                controlBar.removeChild(control);
                if (isDev) {
                  console.log(`🗑️ API移除了控件: ${controlName}`);
                }
              }
            } catch (e) {
              // 控件不存在，忽略错误
            }
          });

          // Skip按钮已通过配置正确禁用，无需额外DOM操作

          // 简化的布局确保 - 只设置必要的CSS类
          const controlBarEl = (player as any).controlBar?.el();
          if (controlBarEl) {
            controlBarEl.classList.add('vjs-control-bar-ready');
          }

          // 延迟重新组织控制栏布局 - 确保Video.js完全初始化
          setTimeout(() => {
            const controlBarElement = (player as any).controlBar?.el();
            if (controlBarElement && !controlBarElement.querySelector('.vjs-left-controls')) {
              if (isDev) {
                console.log('🔧 开始重新组织控制栏布局...');
              }

              // 创建左右两个组
              const leftGroup = document.createElement('div');
              leftGroup.className = 'vjs-left-controls';

              const rightGroup = document.createElement('div');
              rightGroup.className = 'vjs-right-controls';

              // 获取所有现有控件
              const playButton = controlBarElement.querySelector('.vjs-play-control');
              const volumePanel = controlBarElement.querySelector('.vjs-volume-panel');
              const currentTime = controlBarElement.querySelector('.vjs-current-time');
              const timeDivider = controlBarElement.querySelector('.vjs-time-divider');
              const duration = controlBarElement.querySelector('.vjs-duration');
              const fullscreenButton = controlBarElement.querySelector('.vjs-fullscreen-control');
              const progressControl = controlBarElement.querySelector('.vjs-progress-control');

              if (isDev) {
                console.log('📍 找到的控件:', {
                  playButton: !!playButton,
                  volumePanel: !!volumePanel,
                  currentTime: !!currentTime,
                  timeDivider: !!timeDivider,
                  duration: !!duration,
                  fullscreenButton: !!fullscreenButton,
                  progressControl: !!progressControl
                });
              }

              // 移动到左侧组
              if (playButton) leftGroup.appendChild(playButton);
              if (volumePanel) leftGroup.appendChild(volumePanel);
              if (currentTime) leftGroup.appendChild(currentTime);
              if (timeDivider) leftGroup.appendChild(timeDivider);
              if (duration) leftGroup.appendChild(duration);

              // 创建质量选择器并添加到右侧组
              if (enableQualitySelector && videoSources.length > 1 && player) {
                try {
                  const qualityButton = createQualityButton(player);
                  if (qualityButton) rightGroup.appendChild(qualityButton);
                } catch (error) {
                  console.warn('创建质量选择器失败:', error);
                }
              }

              // 移动全屏按钮到右侧组
              if (fullscreenButton) rightGroup.appendChild(fullscreenButton);

              // 清空控制栏并添加两个组
              controlBarElement.innerHTML = '';

              // 先添加进度条（保持在顶部）
              if (progressControl) controlBarElement.appendChild(progressControl);

              // 再添加左右控件组
              controlBarElement.appendChild(leftGroup);
              controlBarElement.appendChild(rightGroup);

              // 布局完成，显示控制栏
              controlBarElement.classList.add('vjs-layout-ready');

              if (isDev) {
                console.log('✅ 控制栏布局重组完成，现在显示');
              }
            }
          }, 100); // 减少延迟提升体验

          // 后备方案：如果3秒后还没有布局完成，强制显示
          setTimeout(() => {
            const controlBarElement = (player as any).controlBar?.el();
            if (controlBarElement && !controlBarElement.classList.contains('vjs-layout-ready')) {
              controlBarElement.classList.add('vjs-layout-ready');
              if (isDev) {
                console.log('⚠️ 后备方案：强制显示控制栏');
              }
            }
          }, 3000);

          if (player) onReady?.(player);
        });

        // 播放状态监听
        player.on('play', () => {
          onPlayStateChange?.(true);
          // 确保播放时隐藏大播放按钮
          if (player) {
            const bigPlayButton = (player as any).el().querySelector('.vjs-big-play-button');
            if (bigPlayButton) {
              (bigPlayButton as HTMLElement).style.display = 'none';
            }
          }
        });

        player.on('pause', () => {
          onPlayStateChange?.(false);
          // 确保暂停时显示大播放按钮
          if (player) {
            const bigPlayButton = (player as any).el().querySelector('.vjs-big-play-button');
            if (bigPlayButton) {
              (bigPlayButton as HTMLElement).style.display = 'flex';
            }
          }
        });

        // 播放进度监听
        player.on('timeupdate', () => {
          if (player) {
            const currentTime = player.currentTime();
            const duration = player.duration();
            if (duration && !isNaN(duration)) {
              onProgress?.(currentTime, duration);
            }
          }
        });

        // 错误处理
        player.on('error', (error) => {
          console.error('❌ RobustVideoPlayer 播放错误:', error);
          setHasError(true);
          setErrorMessage('视频加载失败，请检查网络连接或视频源');
          setIsLoading(false);
          onError?.(error);
        });

      } catch (error) {
        console.error('❌ RobustVideoPlayer 初始化错误:', error);
        setHasError(true);
        setErrorMessage('播放器初始化失败');
        setIsLoading(false);
        onError?.(error);
      }
    };

    // 方法1：使用requestAnimationFrame确保DOM准备好
    const rafId = requestAnimationFrame(() => {
      initializePlayer();
    });

    return () => {
      cancelAnimationFrame(rafId);
      isInitialized = true; // 防止延迟初始化
      if (player || playerRef.current) {
        try {
          (player || playerRef.current)?.dispose();
          playerRef.current = null;
        } catch (error) {
          console.error('播放器清理错误:', error);
        }
      }
    };
  }, [videoSources, controls, autoplay, poster]);

  // 获取容器样式类名 - 简化版本，所有比例都使用相同的响应式规则
  const getContainerClass = () => {
    // 不再区分不同比例，统一使用响应式容器
    return styles.aspectAuto;
  };

  // 不再需要SSR检查 - 通过动态导入处理

  return (
    <div
      ref={containerRef}
      className={`${styles.videoContainer} ${getContainerClass()} ${className}`}
    >
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        data-setup="{}"
        controls={controls}
        poster={poster}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p className="text-white text-sm mt-4">加载播放器中...</p>
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMessage}>{errorMessage}</div>
          <div className={styles.errorDetails}>请刷新页面重试</div>
        </div>
      )}
    </div>
  );
}
