import * as Notifications from 'expo-notifications';
import { Category, Note } from '../data/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelNotification(id?: string) {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function scheduleForNote(note: Note, cat: Category): Promise<string | undefined> {
  await cancelNotification(note.notificationId);
  if (cat.reminderMode === 'none') return undefined;
  if (!(await ensurePermission())) return undefined;

  const content = { title: cat.name, body: note.text, sound: true };

  if (cat.reminderMode === 'once') {
    if (!note.remindAt) return undefined;
    const date = new Date(note.remindAt);
    if (date.getTime() <= Date.now()) return undefined;
    return Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }

  const [hour, minute] = (cat.dailyTime ?? '09:00').split(':').map(Number);
  return Notifications.scheduleNotificationAsync({
    content,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}
