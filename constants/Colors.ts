/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { ProfileColorEnum } from "@/types/api";

const tintColorLight = '#0a1628';
const tintColorDark = '#fff';
const error = '#ec9185ff';

export const Colors = {
  light: {
    text: '#0a1628',             // main text — dark navy
    secondaryText: '#4a6a88',    // subtitles, lighter text
    tertiaryText: '#6680a0',
    background: '#f0f4f9',       // cool off-white
    cardBackground: '#e6ecf4',   // cool-tinted card surface
    elevatedBackground: '#dae3ef', // elevated above card
    cardBorder: '#d0dbe8',
    inputBorder: '#b8c8da',
    avatarBorder: 'transparent',
    divider: '#d0dbe8',
    tint: tintColorLight,        // active tint
    icon: '#5a7898',             // default icon color
    tabIconDefault: '#5a7898',
    tabIconSelected: tintColorLight,
    error: error,
    destructive: '#D92D20',            // strong red for text/icons
    destructiveBackground: '#FEE4E2',  // soft red-tint background
    buttonText: '#fff',
    buttonDisabled: '#8899aa',

    inputText: '#0a1628',
    inputBackground: '#e6ecf4',
    inputShadowColor: '#b8c8da',

    modalBackground: '#f0f4f9',

    // Pastel accents
    pastels: {
      pink: '#f35fc4', // brilliant rose
      blue: '#5395ec', // cornflower blue
      green: '#63b045', // apple
      yellow: '#fba617', // sun
      purple: '#a135d2',  // purple heart
      teal: '#2db5a0',   // persian green
      coral: '#e8615a',  // terra cotta
      amber: '#e09520',  // harvest gold
      indigo: '#5c6bc0', // indigo
      lime: '#8bc34a',   // yellow-green
    },

    // Feed-specific accents
    accent: '#2aada3',        // teal — brand color (deeper for light mode contrast)
    likeButton: '#FF0066',    // neon magenta-red
    witnessButton: '#00cc88', // synthwave mint (slightly muted for light)
    friendColor: '#2aada3',   // teal for friend-related actions
    border: '#d0dbe8',
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#aaa',        // lighter text in dark mode
    tertiaryText: '#666',
    background: '#0e1113',
    cardBackground: '#181c1f',    // activity cards or sections
    elevatedBackground: '#252b2f', // surface elevated above cardBackground (e.g. buttons on card surfaces)
    cardBorder: '#26292a',
    inputBorder: '#ccc',
    avatarBorder: '#2d2d2dff',
    divider: '#1e1e1e',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
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
      teal: '#2db5a0',   // persian green
      coral: '#e8615a',  // terra cotta
      amber: '#e09520',  // harvest gold
      indigo: '#5c6bc0', // indigo
      lime: '#8bc34a',   // yellow-green
    },

    // Feed-specific accents
    accent: '#39C5BB',        // Miku teal — brand color
    likeButton: '#FF0066',    // neon magenta-red
    witnessButton: '#00FF9F', // synthwave mint
    friendColor: '#39C5BB',   // teal for friend-related actions
    border: '#272727ff',
  },
};

export const ProfileColorHexMap: Record<ProfileColorEnum, string> = {
  RED:    "#EF5350", // bright red
  BLUE:   "#42A5F5", // bright blue
  GREEN:  "#66BB6A", // bright green
  YELLOW: "#FFCA28", // bright yellow
  ORANGE: "#FF7043", // bright orange
  PURPLE: "#AB47BC", // bright purple
  PINK:   "#EC407A", // bright pink
  BROWN:  "#8D6E63", // warm brown
  BLACK:  "#424242", // dark grey
  WHITE:  "#E0E0E0", // light grey
  GREY:   "#9E9E9E", // medium grey
  CYAN:   "#26C6DA", // bright cyan
  MAGENTA:"#D81B60", // bright magenta
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
