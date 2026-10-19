import Constants from "expo-constants";
import { Tabs } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import {
  Icon,
  IconName,
} from "../../src/ui/Icon";

const tab = (
  title: string,
  icon: IconName,
) => ({
  title,
  tabBarIcon: ({
    color,
  }: {
    color: string;
  }) => (
    <Icon
      name={icon}
      size={24}
      color={color}
    />
  ),
});

console.log(
  Constants.expoConfig?.ios
    ?.bundleIdentifier,
);

export default function TabsLayout() {
  const { theme: t } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:
          t.primary,
        tabBarInactiveTintColor:
          t.subText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          fontFamily: t.fontFamily,
        },
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={tab("提醒", "bell")}
      />
      <Tabs.Screen
        name="categories"
        options={tab("分類", "tag")}
      />
      <Tabs.Screen
        name="settings"
        options={tab("主題", "drop")}
      />
    </Tabs>
  );
}
