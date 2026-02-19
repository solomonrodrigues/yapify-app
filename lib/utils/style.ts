import { Colors } from '@/constants/Colors';

export function hexToRgba(hex: string, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashId(id: number): number {
  let hash = 5381;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getPastelFromId(id: number, theme: typeof Colors.light | typeof Colors.dark) {
  const pastelKeys = Object.keys(theme.pastels) as (keyof typeof theme.pastels)[];
  const index = hashId(id) % pastelKeys.length;
  return theme.pastels[pastelKeys[index]];
}
