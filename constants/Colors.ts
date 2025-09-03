/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { ProfileColorEnum } from "@/types/api";

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
    cardBorder: '#fff',
    inputBorder: '#ccc',
    avatarBorder: 'transparent',
    divider: '#f8f8f8ff',
    tint: tintColorLight,        // active tint
    icon: '#687076',             // default icon color
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: primaryColor,       // primary action color
    error: error,
    destructive: '#D92D20',            // strong red for text/icons
    destructiveBackground: '#FEE4E2',  // soft red-tint background
    buttonText: '#fff',
    buttonDisabled: '#666',

    // Pastel accents
    pastels: {
      pink: '#ffb6c1',
      blue: '#a3d8ff',
      green: '#b6ffcf',
      yellow: '#fff1a8',
      purple: '#d1b6ff',
    },

    // Feed-specific accents
    accent: '#3B82F6',        // pastel blue highlight
    likeButton: '#EF4444',    // soft red
    witnessButton: '#10B981', // soft green
    border: '#f5f5f5ff',
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#aaa',        // lighter text in dark mode
    background: '#0d1114',
    cardBackground: '#1e1f1f',    // activity cards or sections
    cardBorder: '#fff',
    inputBorder: '#ccc',
    avatarBorder: '#2d2d2dff',
    divider: '#1d1d1dff',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: primaryColor,
    error: error,
    destructive: '#F97066',            // brighter red for dark theme
    destructiveBackground: '#3B1210',  // deep muted red background
    buttonText: '#fff',
    buttonDisabled: '#666',

    // Pastel accents
    pastels: {
      pink: '#ffb6c1',
      blue: '#a3d8ff',
      green: '#b6ffcf',
      yellow: '#fff1a8',
      purple: '#d1b6ff',
    },

    // Feed-specific accents
    accent: '#60A5FA',        // lighter pastel blue
    likeButton: '#F87171',    // soft coral red
    witnessButton: '#34D399', // soft teal green
    border: '#272727ff',
  },
};

export const ProfileColorHexMap: Record<ProfileColorEnum, string> = {
  RED: "#FF0000",
  BLUE: "#0000FF",
  GREEN: "#008000",
  YELLOW: "#FFFF00",
  ORANGE: "#FFA500",
  PURPLE: "#800080",
  PINK: "#FFC0CB",
  BROWN: "#A52A2A",
  BLACK: "#000000",
  WHITE: "#FFFFFF",
  GREY: "#808080",
  CYAN: "#00FFFF",
  MAGENTA: "#FF00FF",
};
