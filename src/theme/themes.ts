export type ThemeId = 'neon' | 'ink' | 'modern' | 'pink' | 'rain' | 'solid';
export type BackdropKind = 'none' | 'grid' | 'ink' | 'rain' | 'dots';

export type Theme = {
  id: ThemeId;
  name: string;
  desc: string;
  dark: boolean;
  bg: string;
  card: string;
  text: string;
  subText: string;
  primary: string;
  onPrimary: string;
  border: string;
  fontFamily?: string;
  widgetFont: 'default' | 'mono' | 'serif' | 'rounded';
  radius: number;
  background: BackdropKind;
};

export const THEMES: Record<Exclude<ThemeId, 'solid'>, Theme> = {
  neon: {
    id: 'neon', name: '霓虹科技', desc: '深色底、青紫螢光、網格光暈', dark: true,
    bg: '#080A1C', card: '#12153A', text: '#E6F7FF', subText: '#7F8BC0',
    primary: '#00F0FF', onPrimary: '#02131A', border: '#3A2D8F',
    fontFamily: 'Menlo', widgetFont: 'mono', radius: 8, background: 'grid',
  },
  ink: {
    id: 'ink', name: '山水詩藝', desc: '宣紙色、墨黑、朱紅印章、遠山', dark: false,
    bg: '#F2E9D6', card: '#FAF3E3', text: '#2A2A28', subText: '#82745C',
    primary: '#B3261E', onPrimary: '#FFF8EC', border: '#D2C4A3',
    fontFamily: 'Songti TC', widgetFont: 'serif', radius: 3, background: 'ink',
  },
  modern: {
    id: 'modern', name: '現代文青', desc: '米白、莫蘭迪鼠尾草綠、襯線字', dark: false,
    bg: '#F5F1EA', card: '#FFFFFF', text: '#3B3A36', subText: '#8C8A82',
    primary: '#7E9079', onPrimary: '#FFFFFF', border: '#E6E0D4',
    fontFamily: 'Georgia', widgetFont: 'serif', radius: 12, background: 'none',
  },
  pink: {
    id: 'pink', name: '少女粉色', desc: '粉色、圓角、點點背景', dark: false,
    bg: '#FFE6F0', card: '#FFF7FA', text: '#6B2D4A', subText: '#C27C9C',
    primary: '#FF6FA5', onPrimary: '#FFFFFF', border: '#FFC6DC',
    fontFamily: 'ChalkboardSE-Regular', widgetFont: 'rounded', radius: 22, background: 'dots',
  },
  rain: {
    id: 'rain', name: '午夜小雨', desc: '深藍夜色、窗外雨絲、暖黃燈光', dark: true,
    bg: '#0C1424', card: '#16233B', text: '#F4E4C1', subText: '#8FA0BD',
    primary: '#FFB45E', onPrimary: '#1A1206', border: '#25354F',
    fontFamily: 'Georgia', widgetFont: 'serif', radius: 16, background: 'rain',
  },
};

export const SOLID_COLORS = [
  '#4F7CFF', '#FF5C5C', '#2FBF71', '#FFB020', '#9B5DE5', '#00B8D9', '#FF7A45', '#444444',
];

export function makeSolid(color: string): Theme {
  return {
    id: 'solid', name: '純色簡約', desc: '白底，主色自己選', dark: false,
    bg: '#F6F6F7', card: '#FFFFFF', text: '#1C1C1E', subText: '#8E8E93',
    primary: color, onPrimary: '#FFFFFF', border: '#E5E5EA',
    widgetFont: 'default', radius: 14, background: 'none',
  };
}
