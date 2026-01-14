export type ColorThemeId = 'clay-a' | 'clay-b';

export interface ColorThemeTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  cool: string;
  coolSoft: string;
  border: string;
  shadowMain: string;
  shadowBlock: string;
  shadowCard: string;
}

export interface ColorThemeSwatch {
  name: string;
  value: string;
  desc: string;
}

export interface ColorThemeConfig {
  id: ColorThemeId;
  name: string;
  description: string;
  tokens: ColorThemeTokens;
  swatches: ColorThemeSwatch[];
}

export const colorThemes: Record<ColorThemeId, ColorThemeConfig> = {
  'clay-a': {
    id: 'clay-a',
    name: '方案 A',
    description: '应援粉主导，薄荷冷平衡',
    tokens: {
      background: '#F9F2EE',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF7F9',
      text: '#3A3F53',
      textMuted: 'rgba(58, 63, 83, 0.6)',
      accent: '#FF8FA6',
      accentSoft: 'rgba(255, 143, 166, 0.35)',
      cool: '#33C6AE',
      coolSoft: 'rgba(51, 198, 174, 0.28)',
      border: 'rgba(58, 63, 83, 0.1)',
      shadowMain: '0 22px 56px -40px rgba(255, 143, 166, 0.7)',
      shadowBlock: '8px 8px 0 rgba(58, 63, 83, 0.07)',
      shadowCard: '0 20px 48px -40px rgba(58, 63, 83, 0.22)',
    },
    swatches: [
      { name: '应援粉', value: '#FF8FA6', desc: '主色、按钮强调' },
      { name: '花瓣雾', value: '#FFDDE3', desc: '柔层底色' },
      { name: '奶雾白', value: '#FFF7F9', desc: 'Clay内衬' },
      { name: '海盐青', value: '#33C6AE', desc: '冷平衡' },
      { name: '石墨蓝', value: '#3A3F53', desc: '深色文字' },
      { name: '杏桃砂', value: '#F9F2EE', desc: '背景暖调' },
    ],
  },
  'clay-b': {
    id: 'clay-b',
    name: '方案 B',
    description: '蓝灰主调，粉色点题',
    tokens: {
      background: '#F9F3EF',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF6F2',
      text: '#3F5066',
      textMuted: 'rgba(63, 80, 102, 0.6)',
      accent: '#FF8FA6',
      accentSoft: 'rgba(255, 143, 166, 0.25)',
      cool: '#7FD3C1',
      coolSoft: 'rgba(127, 211, 193, 0.24)',
      border: 'rgba(63, 80, 102, 0.1)',
      shadowMain: '0 18px 46px -40px rgba(63, 80, 102, 0.4)',
      shadowBlock: '10px 10px 0 rgba(63, 80, 102, 0.07)',
      shadowCard: '8px 8px 0 rgba(63, 80, 102, 0.07)',
    },
    swatches: [
      { name: '应援粉', value: '#FF8FA6', desc: '强调与按钮' },
      { name: '雾粉灰', value: '#F3DADF', desc: '背景柔雾' },
      { name: '浅米白', value: '#FFF6F2', desc: '卡片内衬' },
      { name: '雾蓝灰', value: '#3F5066', desc: '文字与边框' },
      { name: '清氧绿', value: '#7FD3C1', desc: '冷色平衡' },
    ],
  },
};

export const colorThemeList: ColorThemeConfig[] = Object.values(colorThemes);
