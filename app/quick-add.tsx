import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCategories, useNotes, useSaveNote } from '../src/data/hooks';
import { Note, toDateKey } from '../src/data/storage';
import { Icon } from '../src/ui/Icon';
import { Chip, Label, RoundButton, Screen, useUI } from '../src/ui/kit';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const addMinutes = (m: number) => new Date(Date.now() + m * 60000);
const tomorrow9 = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; };

export default function QuickAdd() {
  const { t, font, card } = useUI();
  const router = useRouter();
  const { id, categoryId } = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const { data: cats = [] } = useCategories();
  const { data: notes = [] } = useNotes();
  const save = useSaveNote();

  const [text, setText] = useState('');
  const [catId, setCatId] = useState<string | undefined>(categoryId);
  const [remindAt, setRemindAt] = useState<Date>(addMinutes(60));

  const editing = id ? notes.find((n) => n.id === id) : undefined;
  useEffect(() => {
    if (editing) {
      setText(editing.text); setCatId(editing.categoryId);
      if (editing.remindAt) setRemindAt(new Date(editing.remindAt));
    }
  }, [editing?.id]);

  const cat = cats.find((c) => c.id === (catId ?? cats[0]?.id));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSave = async () => {
    if (!text.trim() || !cat) return;
    const note: Note = {
      id: editing?.id ?? uid(),
      categoryId: cat.id,
      text: text.trim(),
      remindAt: cat.reminderMode === 'once' ? remindAt.toISOString() : undefined,
      noteDate: toDateKey(cat.reminderMode === 'once' ? remindAt : new Date()),
      notificationId: editing?.notificationId,
      updatedAt: new Date().toISOString(),
    };
    await save.mutateAsync({ note, category: cat });
    close();
  };

  const whenText = remindAt.toLocaleString(undefined, {
    month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
        <RoundButton icon="close" onPress={close} />
        <Text style={[font, { color: t.text, fontSize: 18, fontWeight: '700' }]}>{editing ? '編輯' : '新增提醒'}</Text>
        <RoundButton icon="tick" filled onPress={onSave} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 4, gap: 24 }} keyboardShouldPersistTaps="handled">
        <TextInput
          autoFocus multiline value={text} onChangeText={setText}
          placeholder="要提醒自己什麼？" placeholderTextColor={t.subText}
          style={[font, card, { minHeight: 130, padding: 16, color: t.text, fontSize: 19, lineHeight: 27, textAlignVertical: 'top' }]}
        />

        <View>
          <Label>分類</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {cats.map((c) => (
              <Chip key={c.id} label={c.name} icon={c.icon} color={c.color} active={cat?.id === c.id} onPress={() => setCatId(c.id)} />
            ))}
          </View>
        </View>

        {cat?.reminderMode === 'once' && (
          <View>
            <Label>提醒時間</Label>
            <View style={[card, { padding: 16, gap: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="clock" size={22} color={t.primary} />
                <Text style={[font, { color: t.text, fontSize: 18, fontWeight: '700' }]}>{whenText}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label="10 分鐘後" active={false} onPress={() => setRemindAt(addMinutes(10))} />
                <Chip label="1 小時後" active={false} onPress={() => setRemindAt(addMinutes(60))} />
                <Chip label="明早 9 點" active={false} onPress={() => setRemindAt(tomorrow9())} />
              </View>
              <DateTimePicker value={remindAt} mode="datetime" display="compact" accentColor={t.primary}
                themeVariant={t.dark ? 'dark' : 'light'} onChange={(_, d) => d && setRemindAt(d)}
                style={{ alignSelf: 'flex-start' }} />
            </View>
          </View>
        )}
        {cat?.reminderMode === 'daily' && (
          <Text style={[font, { color: t.subText, fontSize: 14 }]}>這個分類每天 {cat.dailyTime} 提醒，時間可到「分類」頁調整。</Text>
        )}
        {cat?.reminderMode === 'none' && (
          <Text style={[font, { color: t.subText, fontSize: 14 }]}>這個分類不會發出通知，只會顯示在小工具與月曆上。</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
