import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Category, Note, loadCategories, loadNotes, saveCategories, saveNotes,
} from './storage';
import { cancelNotification, scheduleForNote } from '../features/notifications';

export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: loadCategories });
export const useNotes = () => useQuery({ queryKey: ['notes'], queryFn: loadNotes });

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ note, category }: { note: Note; category: Category }) => {
      const notificationId = await scheduleForNote(note, category);
      const saved: Note = { ...note, notificationId, updatedAt: new Date().toISOString() };
      const all = await loadNotes();
      await saveNotes([...all.filter((n) => n.id !== saved.id), saved]);
      return saved;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: Note) => {
      await cancelNotification(note.notificationId);
      await saveNotes((await loadNotes()).filter((n) => n.id !== note.id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Category) => {
      const cats = await loadCategories();
      const exists = cats.some((c) => c.id === cat.id);
      await saveCategories(exists ? cats.map((c) => (c.id === cat.id ? cat : c)) : [...cats, cat]);
      // 分類的提醒模式或時間改了，這個分類底下的通知都要重排
      const notes = await loadNotes();
      const next: Note[] = [];
      for (const n of notes) {
        next.push(n.categoryId === cat.id
          ? { ...n, notificationId: await scheduleForNote(n, cat) }
          : n);
      }
      await saveNotes(next);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (catId: string) => {
      const notes = await loadNotes();
      for (const n of notes.filter((x) => x.categoryId === catId)) await cancelNotification(n.notificationId);
      await saveNotes(notes.filter((n) => n.categoryId !== catId));
      await saveCategories((await loadCategories()).filter((c) => c.id !== catId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
