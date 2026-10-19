import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'plus' | 'check' | 'tick' | 'repeat' | 'moon' | 'star' | 'heart' | 'book' | 'bolt' | 'leaf'
  | 'bell' | 'calendar' | 'drop' | 'tag' | 'close' | 'trash' | 'clock' | 'chevron' | 'edit';

export const CATEGORY_ICONS: IconName[] = [
  'check', 'repeat', 'moon', 'star', 'heart', 'book', 'bolt', 'leaf',
];

type Def = {
  p?: string[];
  c?: [number, number, number][];
  r?: [number, number, number, number, number][];
};

// 24x24 線條 icon，全部手繪路徑
const DEFS: Record<IconName, Def> = {
  plus: { p: ['M12 5v14', 'M5 12h14'] },
  tick: { p: ['M5 12.5l4.5 4.5L19 7.5'] },
  check: { c: [[12, 12, 9]], p: ['M8 12.5l2.7 2.7L16 9.5'] },
  repeat: { p: ['M17 2.5l3.5 3.5L17 9.5', 'M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5', 'M7 21.5L3.5 18 7 14.5', 'M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5'] },
  moon: { p: ['M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.7 6.7 0 0 0 10 10z'] },
  star: { p: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'] },
  heart: { p: ['M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z'] },
  book: { p: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11'] },
  bolt: { p: ['M13 2.5L4.5 13.5h6.5l-1 8 8.5-11H12z'] },
  leaf: { p: ['M5 19c0-8.5 5-14 15-14 0 10-5.500 15-14 15', 'M5 19l8-8'] },
  bell: { p: ['M18 9a6 6 0 0 0-12 0c0 6.500-2.500 8-2.500 8h17S18 15.500 18 9z', 'M13.800 20.500a2 2 0 0 1-3.600 0'] },
  calendar: { r: [[3.5, 5, 17, 15.5, 3]], p: ['M3.500 10h17', 'M8 3v4', 'M16 3v4'] },
  drop: { p: ['M12 3s6.500 6.500 6.500 11a6.500 6.500 0 0 1-13 0C5.500 9.500 12 3 12 3z'] },
  tag: { c: [[7.5, 7.5, 1.2]], p: ['M20.500 13.500l-7 7a2 2 0 0 1-2.800 0L3 12.800V3h9.800l7.700 7.700a2 2 0 0 1 0 2.800z'] },
  close: { p: ['M6 6l12 12', 'M18 6L6 18'] },
  trash: { p: ['M4 7h16', 'M9.500 7V4h5v3', 'M6 7l1 13h10l1-13', 'M10 11v5.500', 'M14 11v5.500'] },
  clock: { c: [[12, 12, 9]], p: ['M12 7v5.200l3.300 2'] },
  chevron: { p: ['M9.500 6l6 6-6 6'] },
  edit: { p: ['M4 20h4L19.500 8.500l-4-4L4 16z', 'M13.500 6.500l4 4'] },
};

export function Icon({
  name, size = 22, color = '#fff', stroke = 1.8,
}: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const d = DEFS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.r?.map(([x, y, w, h, rx], i) => <Rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={rx} />)}
      {d.c?.map(([cx, cy, r], i) => <Circle key={`c${i}`} cx={cx} cy={cy} r={r} />)}
      {d.p?.map((s, i) => <Path key={`p${i}`} d={s} />)}
    </Svg>
  );
}
