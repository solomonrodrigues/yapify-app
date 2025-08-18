/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const primaryColor = '#4F46E5';
const error = '#ec9185ff';

export const Colors = {
  light: {
    text: '#11181C',             // main text
    secondaryText: '#888',       // subtitles, lighter text
    background: '#fff',          // page background
    cardBackground: '#f8f9fa',   // activity cards or sections
    border: '#fff',              // avatar border
    divider: '#f8f8f8ff',
    tint: tintColorLight,        // active tint
    icon: '#687076',             // default icon color
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: primaryColor,       // primary action color
    error: error,
    buttonText: '#fff',
    buttonDisabled: '#666',
    pastels: {
      pink: '#ffb6c1',
      blue: '#a3d8ff',
      green: '#b6ffcf',
      yellow: '#fff1a8',
      purple: '#d1b6ff',
    },
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#aaa',        // lighter text in dark mode
    background: '#151718',
    cardBackground: '#1e1f1f',    // activity cards or sections
    border: '#fff',               // avatar border
    divider: '#1d1d1dff',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: primaryColor,
    error: error,
    buttonText: '#fff',
    buttonDisabled: '#666',
    pastels: {
      pink: '#ffb6c1',
      blue: '#a3d8ff',
      green: '#b6ffcf',
      yellow: '#fff1a8',
      purple: '#d1b6ff',
    },
  },
};
