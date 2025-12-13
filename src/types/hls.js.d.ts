declare module 'hls.js' {
  export interface HlsConfig {
    enableWorker?: boolean
    lowLatencyMode?: boolean
    backBufferLength?: number
    [key: string]: unknown
  }

  export interface Level {
    height: number
    width?: number
    bitrate: number
    name?: string
    [key: string]: unknown
  }

  export default class Hls {
    static isSupported(): boolean
    static Events: {
      MANIFEST_PARSED: string
      ERROR: string
      LEVEL_SWITCHED: string
      [key: string]: string
    }

    constructor(config?: HlsConfig)

    levels: Level[]
    currentLevel: number

    loadSource(url: string): void
    attachMedia(media: HTMLVideoElement): void
    destroy(): void
    on(event: string, callback: (event: string, data: unknown) => void): void
  }
}
