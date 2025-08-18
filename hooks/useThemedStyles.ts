import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export function useThemedStyles<T>(getStyles: (theme: typeof Colors.light | typeof Colors.dark) => T): T {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  return getStyles(theme);
}
