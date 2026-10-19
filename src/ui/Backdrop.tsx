import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/** 主題背景裝飾：網格光暈、遠山、雨絲、點點 */
export function Backdrop() {
  const { theme: t } = useTheme();
  const { width: w, height: h } = useWindowDimensions();
  if (t.background === 'none') return null;

  const glow = (
    <Defs>
      <RadialGradient id="g" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={t.primary} stopOpacity="0.32" />
        <Stop offset="1" stopColor={t.primary} stopOpacity="0" />
      </RadialGradient>
    </Defs>
  );

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      {glow}
      {t.background === 'grid' && (
        <>
          <Circle cx={w * 0.9} cy={90} r={240} fill="url(#g)" />
          {Array.from({ length: Math.ceil(w / 30) + 1 }).map((_, i) => (
            <Line key={`v${i}`} x1={i * 30} y1={0} x2={i * 30} y2={h} stroke={t.primary} strokeOpacity={0.06} />
          ))}
          {Array.from({ length: Math.ceil(h / 30) + 1 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i * 30} x2={w} y2={i * 30} stroke={t.primary} strokeOpacity={0.06} />
          ))}
        </>
      )}
      {t.background === 'rain' && (
        <>
          <Circle cx={0} cy={h * 0.92} r={280} fill="url(#g)" />
          {Array.from({ length: 70 }).map((_, i) => {
            const x = ((i * 53) % 100) / 100 * w;
            const y = ((i * 37) % 100) / 100 * h;
            return <Line key={i} x1={x} y1={y} x2={x - 5} y2={y + 18} stroke={t.text} strokeOpacity={0.09} strokeWidth={1} />;
          })}
        </>
      )}
      {t.background === 'ink' && (
        <>
          <Circle cx={w * 0.84} cy={110} r={64} fill={t.primary} fillOpacity={0.1} />
          <Path
            d={`M0 ${h} L0 ${h - 120} Q${w * 0.2} ${h - 200} ${w * 0.38} ${h - 110} Q${w * 0.6} ${h - 220} ${w * 0.8} ${h - 120} Q${w * 0.92} ${h - 165} ${w} ${h - 100} L${w} ${h} Z`}
            fill={t.text} fillOpacity={0.05}
          />
        </>
      )}
      {t.background === 'dots' &&
        Array.from({ length: Math.ceil(h / 34) }).flatMap((_, r) =>
          Array.from({ length: Math.ceil(w / 34) + 1 }).map((__, c) => (
            <Circle key={`${r}-${c}`} cx={c * 34 + (r % 2 ? 17 : 0)} cy={r * 34} r={2.4} fill={t.primary} fillOpacity={0.22} />
          ))
        )}
    </Svg>
  );
}
