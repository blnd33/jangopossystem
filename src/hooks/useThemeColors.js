import { useTheme } from '../contexts/ThemeContext';
import { getColors, getDarkColors } from '../data/store';

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? getDarkColors() : getColors();
}