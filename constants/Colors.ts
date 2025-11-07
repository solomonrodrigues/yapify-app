/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { ProfileColorEnum } from "@/types/api";

const tintColorLight = '#11181C';
const tintColorDark = '#fff';
const primaryColor = '#4F46E5';
const error = '#ec9185ff';

export const Colors = {
  light: {
    text: '#11181C',             // main text
    secondaryText: '#888',       // subtitles, lighter text
    tertiaryText: '#666',
    background: '#fff',          // page background
    cardBackground: '#f8f9fa',   // activity cards or sections
    cardBorder: '#fff',
    inputBorder: '#ccc',
    avatarBorder: 'transparent',
    divider: '#e5e5e5',
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

    inputText: '#000',
    inputBackground: '#f1f1f1',
    inputShadowColor: '#aaa',

    modalBackground: '#fff',

    // Pastel accents
    pastels: {
      pink: '#f35fc4', // brilliant rose
      blue: '#5395ec', // cornflower blue
      green: '#63b045', // apple
      yellow: '#fba617', // sun
      purple: '#a135d2',  // purple heart
    },

    // Feed-specific accents
    accent: '#2da7ff',        // lighter pastel blue
    likeButton: '#FF0066',    // neon magenta-red
    witnessButton: '#00FF9F', // synthwave mint
    border: '#e5e5e5',
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#aaa',        // lighter text in dark mode
    tertiaryText: '#666',
    background: '#0e1113',
    cardBackground: '#181c1f',    // activity cards or sections
    cardBorder: '#26292a',
    inputBorder: '#ccc',
    avatarBorder: '#2d2d2dff',
    divider: '#1e1e1e',
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

    inputText: '#fff',
    inputBackground: '#1e1e1e',
    inputShadowColor: '#000',

    modalBackground: '#0e1113',

    // Pastel accents
    pastels: {
      pink: '#f35fc4', // brilliant rose
      blue: '#5395ec', // cornflower blue
      green: '#63b045', // apple
      yellow: '#fba617', // sun
      purple: '#a135d2',  // purple heart
    },

    // Feed-specific accents
    accent: '#2da7ff',        // lighter pastel blue
    likeButton: '#FF0066',    // neon magenta-red
    witnessButton: '#00FF9F', // synthwave mint
    border: '#272727ff',
  },
};

export const ProfileColorHexMap: Record<ProfileColorEnum, string> = {
  RED:    "#D32F2F", // vivid red (AA with white text)
  BLUE:   "#1976D2", // vivid blue
  GREEN:  "#2E7D32", // vivid green
  YELLOW: "#996515", // deep yellow/goldenrod (keeps contrast)
  ORANGE: "#BF360C", // bold orange-red
  PURPLE: "#6A1B9A", // strong purple
  PINK:   "#D81B60", // hot pink/rose
  BROWN:  "#6D4C41", // rich brown
  BLACK:  "#424242", // dark grey (comfortable with white text)
  WHITE:  "#6E6E6E", // mid grey so white text is legible
  GREY:   "#757575", // medium-dark grey
  CYAN:   "#00838F", // deep cyan/teal
  MAGENTA:"#AD1457", // deep magenta
};

export const ProfileColorHexMapPastel: Record<ProfileColorEnum, string> = {
  RED: "#E88C8C",      // pastel red, darker for contrast
  BLUE: "#6FA8DC",     // pastel blue
  GREEN: "#77DD77",    // pastel green
  YELLOW: "#FFD966",   // pastel yellow (warm but not too light)
  ORANGE: "#FFB347",   // pastel orange
  PURPLE: "#B39EB5",   // pastel purple
  PINK: "#FF99CC",     // pastel pink
  BROWN: "#C49E78",    // pastel brown / tan
  BLACK: "#7D7D7D",    // softened dark grey (enough contrast for white text)
  WHITE: "#CCCCCC",    // light grey to allow white text (otherwise pure white would clash)
  GREY: "#A9A9A9",     // medium pastel grey
  CYAN: "#66CCCC",     // pastel cyan
  MAGENTA: "#E066FF",  // pastel magenta
};
