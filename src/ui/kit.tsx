import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Backdrop } from './Backdrop';
import { Icon, IconName } from './Icon';

export const withAlpha = (hex: string, a: number) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return `#${h.slice(0, 6)}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0')}`;
};

export function useUI() {
  const { theme: t } = useTheme();
  const font = t.fontFamily ? { fontFamily: t.fontFamily } : {};
  const card = {
    backgroundColor: t.card,
    borderRadius: t.radius,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: withAlpha(t.border, 0.9),
  };
  return { t, font, card };
}

export function Screen({ children, edges = ['top'] }: { children: React.ReactNode; edges?: Edge[] }) {
  const { theme: t } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>{children}</SafeAreaView>
    </View>
  );
}

export function Chip({
  label, icon, color, active, onPress,
}: { label: string; icon?: IconName; color?: string; active: boolean; onPress: () => void }) {
  const { t, font } = useUI();
  const main = color ?? t.primary;
  const fg = active ? (color ? '#fff' : t.onPrimary) : t.text;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, height: 38, borderRadius: Math.min(t.radius + 8, 19),
        backgroundColor: active ? main : withAlpha(t.card, 0.9),
        borderWidth: 1, borderColor: active ? main : withAlpha(t.border, 0.9),
      }}
    >
      {icon && <Icon name={icon} size={16} color={active ? fg : main} />}
      <Text style={[font, { color: fg, fontSize: 14, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function IconBubble({ name, color, size = 42 }: { name: IconName; color: string; size?: number }) {
  const { t } = useUI();
  return (
    <View
      style={{
        width: size, height: size, alignItems: 'center', justifyContent: 'center',
        borderRadius: Math.min(t.radius + 6, size / 2),
        backgroundColor: withAlpha(color, 0.18),
      }}
    >
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function RoundButton({
  icon, onPress, filled = false, size = 40,
}: { icon: IconName; onPress: () => void; filled?: boolean; size?: number }) {
  const { t } = useUI();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: filled ? t.primary : withAlpha(t.card, 0.9),
        borderWidth: filled ? 0 : 1, borderColor: withAlpha(t.border, 0.9),
      }}
    >
      <Icon name={icon} size={size * 0.48} color={filled ? t.onPrimary : t.text} />
    </Pressable>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const { t, font } = useUI();
  return (
    <Text style={[font, { color: t.subText, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }]}>
      {children}
    </Text>
  );
}
