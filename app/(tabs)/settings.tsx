import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCategories, useNotes } from '../../src/data/hooks';
import { APP_GROUP, pushWidget } from '../../src/features/widgetBridge';
import { useTheme } from '../../src/theme/ThemeProvider';
import { SOLID_COLORS, THEMES, Theme, ThemeId, makeSolid } from '../../src/theme/themes';
import { Icon } from '../../src/ui/Icon';
import { Label, Screen, useUI, withAlpha } from '../../src/ui/kit';

const ORDER: Exclude<ThemeId, 'solid'>[] = ['neon', 'ink', 'modern', 'pink', 'rain'];

function Preview({ th }: { th: Theme }) {
  return (
    <View style={{ width: 84, height: 62, borderRadius: Math.min(th.radius, 14), backgroundColor: th.bg, padding: 8,
      borderWidth: 1, borderColor: th.border, justifyContent: 'space-between' }}>
      <View style={{ height: 22, borderRadius: Math.min(th.radius, 8), backgroundColor: th.card, borderWidth: 1,
        borderColor: th.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, gap: 4 }}>
        <View style={{ width: 4, height: 12, borderRadius: 2, backgroundColor: th.primary }} />
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: th.text, opacity: 0.55 }} />
      </View>
      <View style={{ height: 10, width: 36, borderRadius: Math.min(th.radius, 5), backgroundColor: th.primary }} />
    </View>
  );
}

export default function Settings() {
  const { t, font, card } = useUI();
  const { themeId, solidColor, setThemeId, setSolidColor } = useTheme();
  const { data: notes = [] } = useNotes();
  const { data: cats = [] } = useCategories();
  const [syncMsg, setSyncMsg] = useState('');

  const Row = ({ th, active, onPress }: { th: Theme; active: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12,
      borderWidth: active ? 2 : 1, borderColor: active ? t.primary : withAlpha(t.border, 0.9) }]}>
      <Preview th={th} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[font, { color: t.text, fontSize: 17, fontWeight: '700' }]}>{th.name}</Text>
        <Text style={[font, { color: t.subText, fontSize: 12 }]}>{th.desc}</Text>
      </View>
      {active && <Icon name="tick" size={22} color={t.primary} stroke={2.4} />}
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 10 }}>
        <Text style={[font, { color: t.subText, fontSize: 13, fontWeight: '600' }]}>App 與小工具同步套用</Text>
        <Text style={[font, { color: t.text, fontSize: 34, fontWeight: '800', marginTop: 2 }]}>主題</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8, gap: 12, paddingBottom: 60 }}>
        {ORDER.map((id) => <Row key={id} th={THEMES[id]} active={themeId === id} onPress={() => setThemeId(id)} />)}

        <Row th={makeSolid(solidColor)} active={themeId === 'solid'} onPress={() => setThemeId('solid')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 }}>
          {SOLID_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setSolidColor(c)} style={{
              width: 38, height: 38, borderRadius: 19, backgroundColor: c,
              borderWidth: 3, borderColor: themeId === 'solid' && solidColor === c ? t.text : 'transparent' }} />
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <Label>小工具狀態</Label>
          <View style={[card, { padding: 14, gap: 10 }]}>
            <Text style={[font, { color: t.subText, fontSize: 12 }]}>App Group：{APP_GROUP}</Text>
            <Text style={[font, { color: t.subText, fontSize: 12 }]}>
              小工具那邊的 App Group 必須顯示同一串字，不同的話小工具會顯示「尚未同步」。
            </Text>
            <Pressable
              onPress={() => setSyncMsg(`已寫入 ${pushWidget(notes, cats, t)} 則內容`)}
              style={{ height: 44, borderRadius: t.radius, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[font, { color: t.onPrimary, fontWeight: '700' }]}>重新同步小工具</Text>
            </Pressable>
            {!!syncMsg && <Text style={[font, { color: t.primary, fontSize: 13 }]}>{syncMsg}</Text>}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
