// Video.js TypeScript declarations
declare module 'video.js' {
  namespace videojs {
    interface PlayerOptions {
      autoplay?: boolean | string;
      muted?: boolean;
      controls?: boolean;
      responsive?: boolean;
      fluid?: boolean;
      preload?: 'auto' | 'metadata' | 'none';
      poster?: string;
      width?: number;
      height?: number;
      html5?: {
        hls?: {
          enableLowInitialPlaylist?: boolean;
          smoothQualityChange?: boolean;
        };
        vhs?: {
          overrideNative?: boolean;
        };
      };
      plugins?: Record<string, unknown>;
    }

    interface Player {
      ready(fn: () => void): void;
      on(event: string, callback: (event?: unknown) => void): void;
      off(event: string, callback?: (event?: unknown) => void): void;
      src(): Tech.SourceObject[];
      src(sources: Tech.SourceObject[] | Tech.SourceObject): void;
      play(): Promise<void>;
      pause(): void;
      paused(): boolean;
      currentTime(): number;
      currentTime(time: number): void;
      duration(): number;
      volume(): number;
      volume(level: number): void;
      muted(): boolean;
      muted(muted: boolean): void;
      dispose(): void;
      error(): MediaError | null;
      qualityLevels?(): QualityLevelList;
    }

    namespace Tech {
      interface SourceObject {
        src: string;
        type: string;
        label?: string;
        res?: string;
      }
    }

    interface Browser {
      IS_SAFARI: boolean;
    }

    interface QualityLevel {
      id: string;
      label: string;
      width: number;
      height: number;
      bandwidth: number;
      enabled: boolean;
    }

    interface QualityLevelList {
      length: number;
      selectedIndex?: number;
      [index: number]: QualityLevel;
      on(event: string, callback: (event?: unknown) => void): void;
      off(event: string, callback?: (event?: unknown) => void): void;
    }

    const browser: Browser;
  }

  function videojs(
    element: HTMLVideoElement,
    options?: videojs.PlayerOptions
  ): videojs.Player;

  export = videojs;
}

declare module 'videojs-contrib-quality-levels' {
  import type videojs from 'video.js';

  export type QualityLevel = videojs.QualityLevel;
  export type QualityLevelList = videojs.QualityLevelList;
}

declare module 'videojs-hls-quality-selector' {
  // HLS quality selector plugin types
}
