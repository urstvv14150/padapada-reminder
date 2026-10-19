import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories, useNotes } from '../../src/data/hooks';
import { MODE_LABEL } from '../../src/data/storage';
import { Icon } from '../../src/ui/Icon';
import { IconBubble, RoundButton, Screen, useUI } from '../../src/ui/kit';

export default function Categories() {
  const { t, font, card } = useUI();
  const router = useRouter();
  const { data: cats = [] } = useCategories();
  const { data: notes = [] } = useNotes();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }}>
        <View>
          <Text style={[font, { color: t.subText, fontSize: 13, fontWeight: '600' }]}>{cats.length} 個分類</Text>
          <Text style={[font, { color: t.text, fontSize: 34, fontWeight: '800', marginTop: 2 }]}>分類</Text>
        </View>
        <RoundButton icon="plus" filled onPress={() => router.push('/category')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 6, gap: 12 }}>
        {cats.map((c) => {
          const count = notes.filter((n) => n.categoryId === c.id).length;
          const mode = c.reminderMode === 'daily' ? `${MODE_LABEL.daily} ${c.dailyTime}` : MODE_LABEL[c.reminderMode];
          return (
            <Pressable key={c.id} onPress={() => router.push({ pathname: '/category', params: { id: c.id } })}
              style={[card, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }]}>
              <IconBubble name={c.icon} color={c.color} size={46} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[font, { color: t.text, fontSize: 17, fontWeight: '700' }]}>{c.name}</Text>
                <Text style={[font, { color: t.subText, fontSize: 13 }]}>{mode}　·　{count} 則</Text>
              </View>
              <Icon name="chevron" size={20} color={t.subText} />
            </Pressable>
          );
        })}
        <Text style={[font, { color: t.subText, fontSize: 12, marginTop: 6, lineHeight: 18 }]}>
          每個分類都可以在小工具設定裡單獨選擇：長按小工具，選「編輯小工具」，再選分類。
        </Text>
      </ScrollView>
    </Screen>
  );
}
