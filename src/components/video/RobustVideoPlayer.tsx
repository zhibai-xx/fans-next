'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './RobustVideoPlayer.module.css';
import { getVideoMimeType } from '@/lib/utils/media-url';

declare global {
  interface Window {
    videojs?: typeof videojs;
  }
}

// 确保videojs在全局可用
if (typeof window !== 'undefined' && !window.videojs) {
  window.videojs = videojs;
}

const isDev = process.env.NODE_ENV !== 'production';

type PlayerWithControlBar = videojs.Player & {
  controlBar?: videojs.ControlBar;
};

type ExtendedPlayerOptions = videojs.PlayerOptions & Record<string, unknown>;


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

const getSourceSignature = (sources: VideoSource[]): string => {
  if (!sources.length) {
    return '[]';
  }
  return JSON.stringify(
    sources.map((source) => `${source.src}|${source.type || ''}`)
  );
};

type PlayerError = videojs.PlayerError | Error | { message?: string } | null;

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
  onError?: (error: PlayerError) => void;
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
  const lastSourceSignatureRef = useRef<string>('');
  // 准备视频源
  const videoSources = React.useMemo(() => {
    if (Array.isArray(src)) {
      return src;
    }
    return [{ src: src as string, type: getVideoMimeType(src as string) }];
  }, [src]);
  const sourcesSignature = React.useMemo(() => getSourceSignature(videoSources), [videoSources]);
  const latestSourcesRef = useRef<VideoSource[]>(videoSources);
  const latestOnRequireAuthRef = useRef(onRequireAuth);
  const onReadyRef = useRef(onReady);
  const onPlayStateChangeRef = useRef(onPlayStateChange);
  const onProgressRef = useRef(onProgress);
  const onErrorRef = useRef<RobustVideoPlayerProps['onError']>(onError);
  const qualityButtonRef = useRef<HTMLDivElement | null>(null);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);
  const qualityMenuContentRef = useRef<HTMLDivElement | null>(null);
  const qualityLabelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    latestSourcesRef.current = videoSources;
  }, [videoSources]);

  useEffect(() => {
    latestOnRequireAuthRef.current = onRequireAuth;
  }, [onRequireAuth]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onPlayStateChangeRef.current = onPlayStateChange;
  }, [onPlayStateChange]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const normalizePlayerError = useCallback((error: unknown): PlayerError => {
    if (error instanceof Error) {
      return error;
    }
    if (error && typeof error === 'object') {
      return error as PlayerError;
    }
    return { message: typeof error === 'string' ? error : '未知错误' };
  }, []);
  // 移除客户端检测 - 现在通过动态导入处理SSR

  const populateQualityMenu = useCallback(
    (player: videojs.Player) => {
      const sources = latestSourcesRef.current;
      const qualityButton = qualityButtonRef.current;
      const qualityMenu = qualityMenuRef.current;
      const menuContent = qualityMenuContentRef.current;
      const qualityLabel = qualityLabelRef.current;

      if (!qualityButton || !qualityMenu || !menuContent) {
        return;
      }

      menuContent.innerHTML = '';

      if (!enableQualitySelector || sources.length <= 1) {
        qualityButton.style.display = 'none';
        qualityMenu.style.display = 'none';
        return;
      }

      qualityButton.style.display = '';
      qualityMenu.style.display = 'none';

      const defaultIndex = sources.findIndex(
        (source) => source.isDefault && !source.requiresAuth,
      );
      const firstAccessible = sources.findIndex(
        (source) => !source.requiresAuth,
      );
      const initialIndex =
        defaultIndex >= 0
          ? defaultIndex
          : firstAccessible >= 0
          ? firstAccessible
          : 0;
      const defaultSource = sources[initialIndex];
      const defaultLabel =
        defaultSource.displayLabel ||
        defaultSource.label ||
        defaultSource.res ||
        `${defaultSource.width || ''}p` ||
        'HD';

      if (qualityLabel) {
        qualityLabel.textContent = defaultLabel;
      }

      sources.forEach((source, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'vjs-menu-item';
        if (index === initialIndex) {
          menuItem.classList.add('vjs-selected');
        }

        const baseLabel =
          source.label || source.res || `${source.width || ''}p` || `质量${index + 1}`;
        const displayLabel = source.displayLabel || baseLabel;
        menuItem.textContent = displayLabel;
        menuItem.setAttribute('data-index', index.toString());

        if (source.requiresAuth) {
          menuItem.classList.add('vjs-disabled');
        }

        menuItem.addEventListener('click', (event) => {
          event.stopPropagation();

          if (source.requiresAuth) {
            latestOnRequireAuthRef.current?.(source);
            qualityMenu.style.display = 'none';
            return;
          }

          menuContent.querySelectorAll('.vjs-menu-item').forEach((item) => {
            item.classList.remove('vjs-selected');
          });
          menuItem.classList.add('vjs-selected');

          if (qualityLabel) {
            qualityLabel.textContent = displayLabel;
          }

          const newSource = {
            src: source.src,
            type: source.type || 'video/mp4',
          };

          const currentTime = player.currentTime();
          const wasPaused = player.paused();

          player.src([newSource]);

          player.ready(() => {
            try {
              player.currentTime(currentTime);
              if (!wasPaused) {
                player.play();
              }
            } catch (error) {
              console.warn('切换清晰度失败:', error);
            }
          });

          qualityMenu.style.display = 'none';
        });

        menuContent.appendChild(menuItem);
      });
    },
    [enableQualitySelector],
  );

  // 创建质量选择器按钮 - 返回按钮元素
  const createQualityButton = useCallback(
    (player: videojs.Player) => {
      if (!enableQualitySelector) return;

      const qualityButton = document.createElement('div');
      qualityButton.className = 'vjs-control vjs-button vjs-quality-selector-button';
      qualityButton.setAttribute('title', '画质选择');
      qualityButton.innerHTML = `
        <span class="vjs-icon-placeholder quality-label" aria-hidden="true">HD</span>
        <span class="vjs-control-text">画质选择</span>
      `;

      const qualityMenu = document.createElement('div');
      qualityMenu.className = 'vjs-quality-menu vjs-menu';
      qualityMenu.style.display = 'none';

      const menuContent = document.createElement('div');
      menuContent.className = 'vjs-menu-content';
      qualityMenu.appendChild(menuContent);
      qualityButton.appendChild(qualityMenu);

      qualityButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isVisible = qualityMenu.style.display !== 'none';
        qualityMenu.style.display = isVisible ? 'none' : 'block';
      });

      qualityButtonRef.current = qualityButton;
      qualityMenuRef.current = qualityMenu;
      qualityMenuContentRef.current = menuContent;
      qualityLabelRef.current = qualityButton.querySelector('.quality-label');

      populateQualityMenu(player);

      if (isDev) {
        console.log('质量选择器按钮创建完成');
      }
      return qualityButton;
    },
    [enableQualitySelector, populateQualityMenu],
  );

  // 初始化播放器 - 仅在配置变化时重建
  useEffect(() => {
    if (!videoRef.current) return;

    let player: videojs.Player | null = null;
    let rafId = 0;

    const initializePlayer = () => {
      if (!videoRef.current || !videoRef.current.isConnected) return;

      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (error) {
          console.warn('清理播放器实例时出错:', error);
        }
      }

      videoRef.current.removeAttribute('data-vjs-player');
      const uniqueId = `vjs_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      videoRef.current.id = uniqueId;

      setHasError(false);
      setIsLoading(true);

      try {
        const options: ExtendedPlayerOptions = {
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
          playbackRates: [],
          chapters: false,
          textTrackDisplay: false,
          html5: {
            vhs: {
              overrideNative: true
            }
          },
          controlBar: {
            children: [
              'playToggle',
              'volumePanel',
              'currentTimeDisplay',
              'timeDivider',
              'durationDisplay',
              'progressControl',
              'fullscreenToggle'
            ],
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
            progressControl: {
              keepTooltipsInside: true
            },
            volumePanel: {
              inline: false,
              vertical: false
            }
          }
        };

        player = videojs(videoRef.current, options);
        playerRef.current = player;

        const sources = latestSourcesRef.current;
        if (sources.length > 0) {
          player.src(sources);
          lastSourceSignatureRef.current = getSourceSignature(sources);
        } else {
          lastSourceSignatureRef.current = '';
        }

        player.ready(() => {
          setIsLoading(false);

          const playerInstance = player as PlayerWithControlBar;
          const playerElement = playerInstance.el();
          if (playerElement instanceof HTMLElement) {
            playerElement.style.width = '';
            playerElement.style.height = '';
            playerElement.style.maxWidth = '';
            playerElement.style.maxHeight = '';
            playerElement.style.minWidth = '';
            playerElement.style.minHeight = '';
          }

          const controlBar = playerInstance.controlBar;
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
              const control = controlBar?.getChild(controlName);
              if (control && controlBar) {
                controlBar.removeChild(control);
              }
            } catch {
              // ignore
            }
          });

          const controlBarEl = controlBar?.el();
          if (controlBarEl instanceof HTMLElement) {
            controlBarEl.classList.add('vjs-control-bar-ready');
          }

          setTimeout(() => {
            const controlBarElement = playerInstance.controlBar?.el();
            if (controlBarElement instanceof HTMLElement && !controlBarElement.querySelector('.vjs-left-controls')) {
              const leftGroup = document.createElement('div');
              leftGroup.className = 'vjs-left-controls';

              const rightGroup = document.createElement('div');
              rightGroup.className = 'vjs-right-controls';

              const playButton = controlBarElement.querySelector('.vjs-play-control');
              const volumePanel = controlBarElement.querySelector('.vjs-volume-panel');
              const currentTime = controlBarElement.querySelector('.vjs-current-time');
              const timeDivider = controlBarElement.querySelector('.vjs-time-divider');
              const duration = controlBarElement.querySelector('.vjs-duration');
              const fullscreenButton = controlBarElement.querySelector('.vjs-fullscreen-control');
              const progressControl = controlBarElement.querySelector('.vjs-progress-control');

              if (playButton) leftGroup.appendChild(playButton);
              if (volumePanel) leftGroup.appendChild(volumePanel);
              if (currentTime) leftGroup.appendChild(currentTime);
              if (timeDivider) leftGroup.appendChild(timeDivider);
              if (duration) leftGroup.appendChild(duration);

              if (enableQualitySelector && latestSourcesRef.current.length > 1 && player) {
                try {
                  const qualityButton = createQualityButton(player);
                  if (qualityButton) rightGroup.appendChild(qualityButton);
                } catch (error) {
                  console.warn('创建质量选择器失败:', error);
                }
              }

              if (fullscreenButton) rightGroup.appendChild(fullscreenButton);

              controlBarElement.innerHTML = '';
              if (progressControl) controlBarElement.appendChild(progressControl);
              controlBarElement.appendChild(leftGroup);
              controlBarElement.appendChild(rightGroup);
              controlBarElement.classList.add('vjs-layout-ready');
            }
          }, 100);

          setTimeout(() => {
            const controlBarElement = playerInstance.controlBar?.el();
            if (controlBarElement instanceof HTMLElement && !controlBarElement.classList.contains('vjs-layout-ready')) {
              controlBarElement.classList.add('vjs-layout-ready');
            }
          }, 3000);

          populateQualityMenu(player);

          onReadyRef.current?.(player);
        });

        player.on('play', () => {
          onPlayStateChangeRef.current?.(true);
          const element = player.el();
          if (element instanceof HTMLElement) {
            const bigPlayButton = element.querySelector<HTMLElement>('.vjs-big-play-button');
            if (bigPlayButton) {
              bigPlayButton.style.display = 'none';
            }
          }
        });

        player.on('pause', () => {
          onPlayStateChangeRef.current?.(false);
          const element = player.el();
          if (element instanceof HTMLElement) {
            const bigPlayButton = element.querySelector<HTMLElement>('.vjs-big-play-button');
            if (bigPlayButton) {
              bigPlayButton.style.display = 'flex';
            }
          }
        });

        player.on('timeupdate', () => {
          const currentTime = player.currentTime();
          const duration = player.duration();
          if (duration && !isNaN(duration)) {
            onProgressRef.current?.(currentTime, duration);
          }
        });

        player.on('error', () => {
          const playerError = player.error();
          console.error('❌ RobustVideoPlayer 播放错误:', playerError);
          setHasError(true);
          setErrorMessage('视频加载失败，请检查网络连接或视频源');
          setIsLoading(false);
          onErrorRef.current?.(playerError ?? { message: '未知的播放器错误' });
        });
      } catch (error) {
        console.error('❌ RobustVideoPlayer 初始化错误:', error);
        setHasError(true);
        setErrorMessage('播放器初始化失败');
        setIsLoading(false);
        onErrorRef.current?.(normalizePlayerError(error));
      }
    };

    rafId = requestAnimationFrame(initializePlayer);

    return () => {
      cancelAnimationFrame(rafId);
      if (player || playerRef.current) {
        try {
          (player || playerRef.current)?.dispose();
          playerRef.current = null;
        } catch (error) {
          console.error('播放器清理错误:', error);
        }
      }
      qualityButtonRef.current = null;
      qualityMenuRef.current = null;
      qualityMenuContentRef.current = null;
      qualityLabelRef.current = null;
      lastSourceSignatureRef.current = '';
    };
  }, [controls, autoplay, poster, enableQualitySelector, createQualityButton, populateQualityMenu, normalizePlayerError]);

  // 更新播放器视频源
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const sources = latestSourcesRef.current;
    if (sources.length === 0) {
      lastSourceSignatureRef.current = '';
      populateQualityMenu(player);
      return;
    }

    if (lastSourceSignatureRef.current === sourcesSignature) {
      populateQualityMenu(player);
      return;
    }

    const currentTime = player.currentTime();
    const wasPaused = player.paused();

    player.src(sources);

    player.ready(() => {
      try {
        if (currentTime > 0) {
          player.currentTime(currentTime);
        }
        if (!wasPaused) {
          player.play();
        }
      } catch (error) {
        console.warn('恢复播放状态失败:', error);
      }
    });

    lastSourceSignatureRef.current = sourcesSignature;
    populateQualityMenu(player);
  }, [sourcesSignature, populateQualityMenu]);

  // 获取容器样式类名 - 简化版本，所有比例都使用相同的响应式规则
  const getContainerClass = () => {
    switch (aspectRatio) {
      case 'landscape':
        return styles.aspectLandscape;
      case 'portrait':
        return styles.aspectPortrait;
      case 'square':
        return styles.aspectSquare;
      default:
        return styles.aspectAuto;
    }
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
