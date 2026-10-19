import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORY_ICONS, IconName } from '../ui/Icon';

export type ReminderMode = 'once' | 'daily' | 'none';

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  reminderMode: ReminderMode;
  dailyTime?: string; // "HH:mm"
  isDefault?: boolean;
};

export type Note = {
  id: string;
  categoryId: string;
  text: string;
  remindAt?: string;
  noteDate: string; // YYYY-MM-DD
  notificationId?: string;
  updatedAt: string;
};

const K = { notes: 'notes.v1', cats: 'categories.v1' };

export const CATEGORY_COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#2ED573', '#1ABC9C', '#4DABF7', '#8E7CFF', '#FF6FA5',
];

export const MODE_LABEL: Record<ReminderMode, string> = {
  once: '特定時間提醒',
  daily: '每日固定時間',
  none: '不提醒',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'todo', name: '待辦事項', icon: 'check', color: '#FF6B6B', reminderMode: 'once', isDefault: true },
  { id: 'daily', name: '每天事件', icon: 'repeat', color: '#4DABF7', reminderMode: 'daily', dailyTime: '09:00', isDefault: true },
  { id: 'mood', name: '心情小帖', icon: 'moon', color: '#8E7CFF', reminderMode: 'none', isDefault: true },
];

const LEGACY_ICON: Record<string, IconName> = { todo: 'check', daily: 'repeat', mood: 'moon' };

// 舊版曾用 emoji 當 icon，這裡一律換成自畫 icon
const normalize = (cats: Category[]): Category[] =>
  cats.map((c) =>
    CATEGORY_ICONS.includes(c.icon) ? c : { ...c, icon: LEGACY_ICON[c.id] ?? 'star' }
  );

export async function loadCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(K.cats);
  if (!raw) {
    await AsyncStorage.setItem(K.cats, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return normalize(JSON.parse(raw));
}
export const saveCategories = (c: Category[]) => AsyncStorage.setItem(K.cats, JSON.stringify(c));

export async function loadNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(K.notes);
  return raw ? JSON.parse(raw) : [];
}
export const saveNotes = (n: Note[]) => AsyncStorage.setItem(K.notes, JSON.stringify(n));

export const toDateKey = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
