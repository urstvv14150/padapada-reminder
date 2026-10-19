import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories, useDeleteNote, useNotes } from '../../src/data/hooks';
import { Icon } from '../../src/ui/Icon';
import { Chip, IconBubble, Screen, useUI, withAlpha } from '../../src/ui/kit';

export default function Home() {
  const { t, font, card } = useUI();
  const router = useRouter();
  const { data: cats = [] } = useCategories();
  const { data: notes = [] } = useNotes();
  const del = useDeleteNote();
  const [catId, setCatId] = useState<string | null>(null);

  const list = useMemo(
    () => notes
      .filter((n) => !catId || n.categoryId === catId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes, catId]
  );

  const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <Screen>
      <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }}>
        <Text style={[font, { color: t.subText, fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }]}>{today}</Text>
        <Text style={[font, { color: t.text, fontSize: 34, fontWeight: '800', marginTop: 2 }]}>提醒</Text>
      </View>

      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 8 }}>
          <Chip label="全部" active={catId === null} onPress={() => setCatId(null)} />
          {cats.map((c) => (
            <Chip key={c.id} label={c.name} icon={c.icon} color={c.color}
              active={catId === c.id} onPress={() => setCatId(c.id)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 22, paddingBottom: 120, gap: 12 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 70, gap: 14 }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
              backgroundColor: withAlpha(t.primary, 0.14) }}>
              <Icon name="bell" size={38} color={t.primary} />
            </View>
            <Text style={[font, { color: t.subText, fontSize: 15 }]}>還沒有內容，點右下角新增</Text>
          </View>
        }
        renderItem={({ item }) => {
          const c = cats.find((x) => x.id === item.categoryId);
          const color = c?.color ?? t.primary;
          const when =
            c?.reminderMode === 'once' && item.remindAt
              ? new Date(item.remindAt).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : c?.reminderMode === 'daily' ? `每天 ${c.dailyTime}` : item.noteDate;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/quick-add', params: { id: item.id } })}
              style={[card, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }]}
            >
              <IconBubble name={c?.icon ?? 'star'} color={color} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text numberOfLines={2} style={[font, { color: t.text, fontSize: 16, fontWeight: '600' }]}>{item.text}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Icon name="clock" size={13} color={t.subText} />
                  <Text style={[font, { color: t.subText, fontSize: 12 }]}>{when}</Text>
                  <Text style={[font, { color, fontSize: 12, fontWeight: '700' }]}>  {c?.name}</Text>
                </View>
              </View>
              <Pressable hitSlop={10}
                onPress={() => Alert.alert('刪除', '確定要刪除這則嗎？', [
                  { text: '取消', style: 'cancel' },
                  { text: '刪除', style: 'destructive', onPress: () => del.mutate(item) },
                ])}>
                <Icon name="trash" size={20} color={t.subText} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <Pressable
        onPress={() => router.push({ pathname: '/quick-add', params: catId ? { categoryId: catId } : {} })}
        style={{
          position: 'absolute', right: 22, bottom: 22, width: 60, height: 60,
          borderRadius: Math.min(t.radius + 14, 30), backgroundColor: t.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: t.primary, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Icon name="plus" size={28} color={t.onPrimary} stroke={2.4} />
      </Pressable>
    </Screen>
  );
}
