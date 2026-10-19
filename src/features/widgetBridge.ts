import { ExtensionStorage } from '@bacons/apple-targets';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useCategories, useNotes } from '../data/hooks';
import { Category, Note, toDateKey } from '../data/storage';
import { useTheme } from '../theme/ThemeProvider';
import { Theme } from '../theme/themes';

/**
 * App Group 規則：一律是 "group." + bundleIdentifier。
 * 小工具端（Swift）用同一規則從自己的 bundle id 推回來，所以兩邊不可能打錯。
 * app.json 的 entitlements 也要寫成同樣的字串。
 */
export const APP_GROUP = `group.${Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.padapadaReminder.app'}`;
const storage = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP) : null;

const LABELS = {
  zh: { all: '全部', add: '新增', empty: '目前沒有內容', daily: '每天' },
  en: { all: 'All', add: 'Add', empty: 'Nothing here yet', daily: 'Daily' },
};

const short = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n);

function nextOccurrence(note: Note, cat: Category, now: Date): Date | null {
  if (cat.reminderMode === 'once' && note.remindAt) {
    const d = new Date(note.remindAt);
    return d > now ? d : null;
  }
  if (cat.reminderMode === 'daily') {
    const [h, m] = (cat.dailyTime ?? '09:00').split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }
  return null;
}

export function buildPayload(notes: Note[], cats: Category[], theme: Theme, locale: string) {
  const now = new Date();
  const L = locale.toLowerCase().startsWith('zh') ? LABELS.zh : LABELS.en;
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const fmtDT = (d: Date) =>
    d.toLocaleString(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtT = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // 月曆標註：本月 + 下個月，每一筆記帶分類 id（小工具依分類過濾）
  const marks: Record<string, { cat: string; t: string }[]> = {};
  const y = now.getFullYear();
  const mo = now.getMonth();
  const rangeEnd = new Date(y, mo + 2, 0);
  for (const n of notes) {
    const c = catMap.get(n.categoryId);
    if (!c) continue;
    const t = short(n.text, 16);
    if (c.reminderMode === 'daily') {
      for (let d = new Date(y, mo, 1); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
        const k = toDateKey(d);
        if (k >= n.noteDate) (marks[k] ??= []).push({ cat: c.id, t });
      }
    } else {
      (marks[n.noteDate] ??= []).push({ cat: c.id, t });
    }
  }

  // 清單：有時間的依時間排前面，沒有時間的（心情小帖、已過期）依更新時間
  const timed: { n: Note; c: Category; at: Date }[] = [];
  const untimed: Note[] = [];
  for (const n of notes) {
    const c = catMap.get(n.categoryId);
    if (!c) continue;
    const at = nextOccurrence(n, c, now);
    if (at) timed.push({ n, c, at });
    else untimed.push(n);
  }
  timed.sort((a, b) => a.at.getTime() - b.at.getTime());
  untimed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const items = [
    ...timed.slice(0, 40).map(({ n, c, at }) => ({
      id: n.id, cat: c.id, text: short(n.text, 60), ts: at.getTime(),
      label: c.reminderMode === 'daily' ? `${L.daily} ${fmtT(at)}` : fmtDT(at),
    })),
    ...untimed.slice(0, 40).map((n) => ({
      id: n.id, cat: n.categoryId, text: short(n.text, 60), ts: 0, label: n.noteDate,
    })),
  ];

  return {
    v: Date.now(),
    palette: {
      bg: theme.bg, card: theme.card, text: theme.text, subText: theme.subText,
      primary: theme.primary, onPrimary: theme.onPrimary, border: theme.border,
    },
    look: { font: theme.widgetFont, radius: theme.radius, style: theme.background },
    labels: L,
    locale,
    categories: cats.map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon, mode: c.reminderMode })),
    items,
    marks,
  };
}

/** 寫入 App Group 並請 WidgetKit 重新整理；回傳寫入的項目數 */
export function pushWidget(notes: Note[], cats: Category[], theme: Theme): number {
  if (!storage) return 0;
  const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
  const payload = buildPayload(notes, cats, theme, locale);
  storage.set('widgetData', JSON.stringify(payload));
  ExtensionStorage.reloadWidget();
  return payload.items.length;
}

export function useWidgetSync() {
  const { theme } = useTheme();
  const { data: notes } = useNotes();
  const { data: cats } = useCategories();
  useEffect(() => {
    if (notes && cats) pushWidget(notes, cats, theme);
  }, [notes, cats, theme]);
}
