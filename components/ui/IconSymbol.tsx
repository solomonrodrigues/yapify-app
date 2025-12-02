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
  'chevron.right': { name: 'chevron.right' },
  'person': { name: 'person' },
  'checkmark': { name: 'check' },
  'quote.bubble.fill': { name: 'comment-dots' },  // Or quote-right
  'envelope.badge': { name: 'envelope' },
  'line.horizontal.3': { name: 'bars' },
  'heart': { name: 'heart' },
  'heart.fill': { name: 'heart' },
  'lock.open': { name: 'lock-open' },
  'calendar': { name: 'calendar' },
  'person.crop.circle.badge.xmark': { name: 'circle-user-circle-xmark' },
  'quote.bubble': { name: 'comment' },
  'forward.fill': { name: 'forward' },
  'checkmark.circle.fill': { name: 'circle-check' },
  'xmark.circle.fill': { name: 'circle-xmark' },
  // Eye icons (for password peek)
  'eye': { name: 'eye' },
  'eye.slash': { name: 'eye-slash' },
  // Options for quote guess button
  'questionmark.circle.fill':       { name: 'cirlce-question' },
  'square.fill.questionmark':       { name: 'square-question' },
  'person.fill.questionmark':       { name: 'user-question' },
  'person.crop.circle.badge.questionmark': { name: 'user-circle-question' },
  'person.fill.viewfinder':         { name: 'user-secret' },
  'brain.head.profile':             { name: 'brain' },
  'text.quote':                     { name: 'quote-left' },
  'bubble.left.and.bubble.right.fill': { name: 'comments' },
  'eye.fill':                       { name: 'eye' },
  'sparkles':                       { name: 'sparkles' },
  'magnifyingglass.circle.fill':    { name: 'magnifying-glass' },
  'target':                         { name: 'bullseye' },
  'trophy.fill':                    { name: 'trophy' },
  'gamecontroller.fill':            { name: 'gamepad' },
  'person.wave.2.fill':             { name: 'user-voice' }, // closest match; FA doesn't have an exact equivalent
  'text.insert':                    { name: 'file-lines' },
  'sparkle.magnifyingglass':        { name: 'wand-magic-sparkles' },
  'person.crop.circle':             { name: 'user-circle' },
  'ellipsis':                       { name: 'ellipsis' },
  'bookmark':                       { name: 'bookmark' },
  'doc.on.doc':                     { name: 'copy' },
  // Required icons for GuessGameModal
  'quote.opening':           { name: 'quote-left' },       // decorative quote start
  'quote.closing':           { name: 'quote-right' },      // decorative quote end
  'checkmark.seal.fill':     { name: 'circle-check' },     // correct result
  'xmark.octagon':           { name: 'circle-xmark' },     // wrong result
  // Required icons for Search / Explore screen
  'line.3.horizontal.decrease.circle': { name: 'sliders' },           // filter/sort
  'flame.fill':                        { name: 'fire' },              // streaks / hot
  'clock.arrow.circlepath':            { name: 'clock-rotate-left' }, // "on this day" / history
  'bolt.fill':                         { name: 'bolt' },              // energy / streaks
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

