import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, makeSolid, SOLID_COLORS, Theme, ThemeId } from './themes';

const KEY = 'theme.v1';

type Ctx = {
  theme: Theme;
  themeId: ThemeId;
  solidColor: string;
  setThemeId: (id: ThemeId) => void;
  setSolidColor: (c: string) => void;
};

const ThemeCtx = createContext<Ctx>(null as unknown as Ctx);
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('neon');
  const [solidColor, setSolidState] = useState(SOLID_COLORS[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        const v = JSON.parse(raw);
        setThemeIdState(v.themeId ?? 'neon');
        setSolidState(v.solidColor ?? SOLID_COLORS[0]);
      }
      setReady(true);
    });
  }, []);

  const persist = (id: ThemeId, color: string) =>
    AsyncStorage.setItem(KEY, JSON.stringify({ themeId: id, solidColor: color }));

  const value = useMemo<Ctx>(
    () => ({
      theme: themeId === 'solid' ? makeSolid(solidColor) : THEMES[themeId],
      themeId,
      solidColor,
      setThemeId: (id) => { setThemeIdState(id); persist(id, solidColor); },
      setSolidColor: (c) => { setSolidState(c); setThemeIdState('solid'); persist('solid', c); },
    }),
    [themeId, solidColor]
  );

  if (!ready) return null;
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
