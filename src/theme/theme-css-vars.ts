import type { ColorThemeConfig } from '@/theme/color-themes';

type Rgba = { r: number; g: number; b: number; a: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseHexToRgba = (hex: string): Rgba | null => {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b, a: 1 };
};

const parseRgbToRgba = (input: string): Rgba | null => {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3) return null;
  return {
    r: clamp(parts[0], 0, 255),
    g: clamp(parts[1], 0, 255),
    b: clamp(parts[2], 0, 255),
    a: clamp(parts[3] ?? 1, 0, 1),
  };
};

const parseColorToRgba = (color: string): Rgba | null => {
  if (color.startsWith('#')) {
    return parseHexToRgba(color);
  }
  if (color.startsWith('rgb')) {
    return parseRgbToRgba(color);
  }
  return null;
};

const rgbToHslValue = ({ r, g, b }: Pick<Rgba, 'r' | 'g' | 'b'>): string => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const blendWithBase = (color: Rgba, base: Rgba) => {
  const alpha = clamp(color.a, 0, 1);
  return {
    r: Math.round(color.r * alpha + base.r * (1 - alpha)),
    g: Math.round(color.g * alpha + base.g * (1 - alpha)),
    b: Math.round(color.b * alpha + base.b * (1 - alpha)),
  };
};

const toHslValue = (color: string, fallback: string, baseColor: string): string => {
  const rgba = parseColorToRgba(color);
  if (!rgba) return fallback;
  if (rgba.a < 1) {
    const base = parseColorToRgba(baseColor) ?? { r: 255, g: 255, b: 255, a: 1 };
    return rgbToHslValue(blendWithBase(rgba, base));
  }
  return rgbToHslValue(rgba);
};

export const getThemeCssVars = (theme: ColorThemeConfig): Record<string, string> => {
  const vars: Record<string, string> = {};
  const setVar = (name: string, value: string) => {
    vars[name] = value;
  };
  const setHslVar = (name: string, value: string, fallback: string, baseColor: string) => {
    vars[name] = toHslValue(value, fallback, baseColor);
  };

  const base = theme.tokens.background;
  setHslVar('--background', theme.tokens.background, '0 0% 100%', base);
  setHslVar('--foreground', theme.tokens.text, '0 0% 9%', base);
  setHslVar('--card', theme.tokens.surface, '0 0% 100%', base);
  setHslVar('--card-foreground', theme.tokens.text, '0 0% 9%', base);
  setHslVar('--popover', theme.tokens.surface, '0 0% 100%', base);
  setHslVar('--popover-foreground', theme.tokens.text, '0 0% 9%', base);
  setHslVar('--primary', theme.tokens.accent, '0 0% 9%', base);
  setHslVar('--primary-foreground', theme.tokens.text, '0 0% 98%', base);
  setHslVar('--secondary', theme.tokens.surfaceAlt, '0 0% 96%', base);
  setHslVar('--secondary-foreground', theme.tokens.text, '0 0% 9%', base);
  setHslVar('--muted', theme.tokens.surfaceAlt, '0 0% 96%', base);
  setHslVar('--muted-foreground', theme.tokens.textMuted, '0 0% 45%', base);
  setHslVar('--accent', theme.tokens.surfaceAlt, '0 0% 96%', base);
  setHslVar('--accent-foreground', theme.tokens.text, '0 0% 9%', base);
  setHslVar('--border', theme.tokens.border, '0 0% 89%', base);
  setHslVar('--input', theme.tokens.border, '0 0% 89%', base);
  setHslVar('--ring', theme.tokens.accentSoft, '0 0% 45%', base);

  setVar('--theme-background', theme.tokens.background);
  setVar('--theme-surface', theme.tokens.surface);
  setVar('--theme-surface-alt', theme.tokens.surfaceAlt);
  setVar('--theme-text', theme.tokens.text);
  setVar('--theme-text-muted', theme.tokens.textMuted);
  setVar('--theme-accent', theme.tokens.accent);
  setVar('--theme-accent-soft', theme.tokens.accentSoft);
  setVar('--theme-cool', theme.tokens.cool);
  setVar('--theme-cool-soft', theme.tokens.coolSoft);
  setVar('--theme-border', theme.tokens.border);
  setVar('--theme-shadow-main', theme.tokens.shadowMain);
  setVar('--theme-shadow-block', theme.tokens.shadowBlock);
  setVar('--theme-shadow-card', theme.tokens.shadowCard);

  return vars;
};
