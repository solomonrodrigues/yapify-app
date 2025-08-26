import FontAwesome7 from '@expo/vector-icons/FontAwesome6'; // FontAwesome 7 is part of the v6 package in Expo
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Mapping entry type
type IconMappingEntry = {
  name: string;
};

// We'll infer the type from our actual mapping instead of requiring all SF Symbols
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapping SF Symbols to FontAwesome 7 icon names.
 * FontAwesome 7 icons can be found here:
 * https://fontawesome.com/search
 */
const MAPPING = {
  // Home icons
  'house.fill': { name: 'house' },
  // People icons
  'person.2.fill': { name: 'users' },
  'person.circle.fill': { name: 'circle-user' },
  // UI icons
  'plus.square.fill': { name: 'square-plus' },
  'bell.fill': { name: 'bell' },
  'message.fill': { name: 'comment' },
  'magnifyingglass': { name: 'magnifying-glass' },
  'close': { name: 'circle-xmark' },
  'gear': { name: 'gear' },
  'xmark': { name: 'xmark' },
  'plus': { name: 'plus' },
  'chevron.left': { name: 'chevron-left' },
  'person': { name: 'person' },
  'checkmark': { name: 'checkmark' },
  'quote.bubble.fill': { name: 'comment-dots' },
  'envelope.badge': { name: 'envelope' },
  'line.horizontal.3': { name: 'bars' },
  // Eye icons (for password peek)
  'eye': { name: 'eye' },
  'eye.slash': { name: 'eye-slash' },
} as const satisfies Record<string, IconMappingEntry>;

// Component props for FontAwesome 7
type IconComponentProps = ComponentProps<typeof FontAwesome7>;

/**
 * Render a FontAwesome 7 icon
 */
function renderIcon(
  name: string,
  color: string | OpaqueColorValue,
  size: number,
  style?: StyleProp<TextStyle>
) {
  return <FontAwesome7 color={color} size={size} style={style} name={name as IconComponentProps['name']} />;
}

/**
 * IconSymbol for Android & web using FontAwesome 7 only
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapping = MAPPING[name];
  
  if (!mapping) {
    console.warn(`IconSymbol: No mapping found for "${name}". Using fallback icon.`);
    return <FontAwesome7 color={color} size={size} name="circle-question" style={style} />;
  }

  return renderIcon(mapping.name, color, size, style);
}

// Export the mapping for external use (e.g., for getting available icon names)
export { MAPPING as ICON_MAPPING };
export type { IconSymbolName };

