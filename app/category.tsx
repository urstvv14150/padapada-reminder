import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCategories, useDeleteCategory, useSaveCategory } from '../src/data/hooks';
import { CATEGORY_COLORS, Category, MODE_LABEL, ReminderMode } from '../src/data/storage';
import { CATEGORY_ICONS, Icon, IconName } from '../src/ui/Icon';
import { Chip, IconBubble, Label, RoundButton, Screen, useUI, withAlpha } from '../src/ui/kit';

const uid = () => 'c' + Math.random().toString(36).slice(2, 9);
const MODES: ReminderMode[] = ['once', 'daily', 'none'];

export default function CategoryEditor() {
  const { t, font, card } = useUI();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: cats = [] } = useCategories();
  const save = useSaveCategory();
  const del = useDeleteCategory();
  const editing = id ? cats.find((c) => c.id === id) : undefined;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>('star');
  const [color, setColor] = useState(CATEGORY_COLORS[5]);
  const [mode, setMode] = useState<ReminderMode>('once');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (editing) {
      setName(editing.name); setIcon(editing.icon); setColor(editing.color);
      setMode(editing.reminderMode); setTime(editing.dailyTime ?? '09:00');
    }
  }, [editing?.id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const [hh, mm] = time.split(':').map(Number);
  const timeDate = new Date(); timeDate.setHours(hh, mm, 0, 0);

  const onSave = async () => {
    if (!name.trim()) return;
    const cat: Category = {
      id: editing?.id ?? uid(), name: name.trim(), icon, color, reminderMode: mode,
      dailyTime: mode === 'daily' ? time : undefined, isDefault: editing?.isDefault,
    };
    await save.mutateAsync(cat);
    close();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
        <RoundButton icon="close" onPress={close} />
        <Text style={[font, { color: t.text, fontSize: 18, fontWeight: '700' }]}>{editing ? '編輯分類' : '新增分類'}</Text>
        <RoundButton icon="tick" filled onPress={onSave} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 4, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <IconBubble name={icon} color={color} size={56} />
          <TextInput value={name} onChangeText={setName} placeholder="分類名稱" placeholderTextColor={t.subText}
            style={[font, card, { flex: 1, height: 52, paddingHorizontal: 16, color: t.text, fontSize: 17, fontWeight: '600' }]} />
        </View>

        <View>
          <Label>圖示</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CATEGORY_ICONS.map((n) => (
              <Pressable key={n} onPress={() => setIcon(n)} style={{
                width: 50, height: 50, alignItems: 'center', justifyContent: 'center',
                borderRadius: Math.min(t.radius + 4, 16),
                backgroundColor: icon === n ? withAlpha(color, 0.2) : t.card,
                borderWidth: 1.5, borderColor: icon === n ? color : withAlpha(t.border, 0.9),
              }}>
                <Icon name={n} size={24} color={icon === n ? color : t.subText} />
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Label>顏色</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CATEGORY_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={{
                width: 38, height: 38, borderRadius: 19, backgroundColor: c, alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: color === c ? t.text : 'transparent',
              }} />
            ))}
          </View>
        </View>

        <View>
          <Label>提醒方式</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MODES.map((m) => <Chip key={m} label={MODE_LABEL[m]} active={mode === m} onPress={() => setMode(m)} />)}
          </View>
          {mode === 'daily' && (
            <View style={[card, { marginTop: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={[font, { color: t.text, fontSize: 16 }]}>每天提醒時間</Text>
              <DateTimePicker value={timeDate} mode="time" display="compact" accentColor={t.primary}
                themeVariant={t.dark ? 'dark' : 'light'}
                onChange={(_, d) => d && setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)} />
            </View>
          )}
          {mode === 'none' && (
            <Text style={[font, { color: t.subText, fontSize: 13, marginTop: 10 }]}>不會發出通知，適合當作心情語錄。</Text>
          )}
        </View>

        {editing && !editing.isDefault && (
          <Pressable
            onPress={() => Alert.alert('刪除分類', '這個分類底下的內容也會一起刪除。', [
              { text: '取消', style: 'cancel' },
              { text: '刪除', style: 'destructive', onPress: async () => { await del.mutateAsync(editing.id); close(); } },
            ])}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48,
              borderRadius: t.radius, borderWidth: 1, borderColor: '#E5484D' }}>
            <Icon name="trash" size={18} color="#E5484D" />
            <Text style={[font, { color: '#E5484D', fontWeight: '700' }]}>刪除分類</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
