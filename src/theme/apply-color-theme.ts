import type { ColorThemeConfig } from '@/theme/color-themes';
import { getThemeCssVars } from '@/theme/theme-css-vars';

export const applyColorTheme = (theme: ColorThemeConfig) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const vars = getThemeCssVars(theme);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.style.setProperty('color-scheme', 'light');
};
