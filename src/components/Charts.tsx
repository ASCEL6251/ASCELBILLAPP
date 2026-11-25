// Lightweight SVG charts for the Insights screen: trend (line / bar / area), donut and sparkline.
// Pure react-native-svg, no extra native deps; tap a column to read its exact value.
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { moneyShort } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';

export type ChartKind = 'line' | 'bar' | 'area';
export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

/** Smooth path through points using a cardinal spline. */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return n * exp;
}

export const TrendChart = memo(function TrendChart({
  width,
  height = 200,
  labels,
  series,
  kind,
  currency,
}: {
  width: number;
  height?: number;
  labels: string[];
  series: Series[];
  kind: ChartKind;
  currency: string;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const axisW = 40;
  const padTop = 12;
  const padBottom = 6;
  const plotW = width - axisW;
  const plotH = height - padTop - padBottom;
  const n = labels.length;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const slot = plotW / Math.max(1, n);
  const cx = (i: number) => axisW + slot * i + slot / 2;
  const y = (v: number) => padTop + plotH - (v / max) * plotH;
  const ticks = [0, 0.5, 1];

  const barGroupW = Math.min(slot * 0.7, 18 * series.length + 6);
  const barW = Math.max(3, (barGroupW - (series.length - 1) * 3) / series.length);

  return (
    <View>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Defs>
            {series.map((s) => (
              <LinearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.color} stopOpacity={0.32} />
                <Stop offset="1" stopColor={s.color} stopOpacity={0.02} />
              </LinearGradient>
            ))}
          </Defs>
          {ticks.map((t) => (
            <Line
              key={t}
              x1={axisW}
              x2={width}
              y1={padTop + plotH * (1 - t)}
              y2={padTop + plotH * (1 - t)}
              stroke={t === 0 ? colors.lineStrong : colors.line}
              strokeDasharray={t === 0 ? undefined : '3 5'}
            />
          ))}
          {sel !== null ? <Rect x={axisW + slot * sel + 2} y={padTop - 4} width={slot - 4} height={plotH + 4} rx={10} fill={colors.tintSoft} /> : null}

          {kind === 'bar'
            ? labels.map((_, i) => (
                <G key={i}>
                  {series.map((s, si) => {
                    const v = s.values[i] ?? 0;
                    const h = Math.max(v > 0 ? 3 : 0, (v / max) * plotH);
                    const x = cx(i) - barGroupW / 2 + si * (barW + 3);
                    return (
                      <Rect
                        key={s.key}
                        x={x}
                        y={padTop + plotH - h}
                        width={barW}
                        height={h}
                        rx={Math.min(5, barW / 2)}
                        fill={s.color}
                        opacity={s.dashed ? 0.45 : sel === null || sel === i ? 1 : 0.55}
                      />
                    );
                  })}
                </G>
              ))
            : series.map((s) => {
                const pts = s.values.map((v, i) => [cx(i), y(v)] as [number, number]);
                const d = smooth(pts);
                return (
                  <G key={s.key}>
                    {kind === 'area' && !s.dashed && pts.length > 1 ? (
                      <Path d={`${d} L${pts[pts.length - 1][0]},${padTop + plotH} L${pts[0][0]},${padTop + plotH} Z`} fill={`url(#g-${s.key})`} />
                    ) : null}
                    <Path d={d} stroke={s.color} strokeWidth={s.dashed ? 2 : 2.6} strokeDasharray={s.dashed ? '5 5' : undefined} fill="none" strokeLinecap="round" />
                    {!s.dashed
                      ? pts.map(([px, py], i) => (
                          <Circle key={i} cx={px} cy={py} r={sel === i ? 5.5 : 3.5} fill="#fff" stroke={s.color} strokeWidth={2.2} />
                        ))
                      : null}
                  </G>
                );
              })}
        </Svg>
        {ticks.map((t) => (
          <Text key={t} style={[styles.axis, { top: padTop + plotH * (1 - t) - 7 }]}>
            {moneyShort(max * t, currency)}
          </Text>
        ))}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', left: axisW }]}>
          {labels.map((l, i) => (
            <Pressable key={l + i} style={{ flex: 1 }} onPress={() => setSel(sel === i ? null : i)} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: axisW }}>
        {labels.map((l, i) => (
          <Text key={l + i} style={[styles.xLabel, sel === i && { color: colors.ink, fontFamily: fonts.semibold }]} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
      {sel !== null ? (
        <View style={styles.tip}>
          <Text style={styles.tipTitle}>{labels[sel]}</Text>
          {series.map((s) => (
            <View key={s.key} style={styles.tipRow}>
              <View style={[styles.dot, { backgroundColor: s.color, opacity: s.dashed ? 0.6 : 1 }]} />
              <Text style={styles.tipLabel}>{s.label}</Text>
              <Text style={styles.tipVal}>{moneyShort(s.values[sel] ?? 0, currency)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.legend}>
          {series.map((s) => (
            <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.legendSwatch, { backgroundColor: s.color, opacity: s.dashed ? 0.55 : 1 }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
          <Text style={[styles.legendText, { color: colors.textFaint }]}>Tap a month for details</Text>
        </View>
      )}
    </View>
  );
});

export const Donut = memo(function Donut({
  size = 132,
  stroke = 18,
  segments,
  center,
  sub,
}: {
  size?: number;
  stroke?: number;
  segments: { value: number; color: string }[];
  center: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.canvas} strokeWidth={stroke} fill="none" />
        {total > 0
          ? segments.map((s, i) => {
              const len = (s.value / total) * c;
              const gap = segments.length > 1 ? Math.min(4, len / 3) : 0;
              const el = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
              acc += len;
              return el;
            })
          : null}
      </Svg>
      <Text style={styles.donutVal} numberOfLines={1} adjustsFontSizeToFit>{center}</Text>
      {sub ? <Text style={styles.donutSub}>{sub}</Text> : null}
    </View>
  );
});

export const Sparkline = memo(function Sparkline({ values, color, width = 72, height = 28 }: { values: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i * width) / Math.max(1, values.length - 1), height - 3 - (v / max) * (height - 6)] as [number, number]);
  const d = smooth(pts);
  return (
    <Svg width={width} height={height}>
      {pts.length > 1 ? <Path d={`${d} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} /> : null}
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
});

const styles = StyleSheet.create({
  axis: { position: 'absolute', left: 0, width: 36, fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
  xLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.body, fontSize: 10.5, color: colors.textFaint, marginTop: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 12 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  tip: { marginTop: 10, backgroundColor: colors.ink, borderRadius: 14, padding: 12, gap: 6 },
  tipTitle: { fontFamily: fonts.semibold, fontSize: 12.5, color: '#fff' },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tipLabel: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.onInkMuted },
  tipVal: { fontFamily: fonts.semibold, fontSize: 12.5, color: '#fff', fontVariant: ['tabular-nums'] },
  donutVal: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, maxWidth: '70%' },
  donutSub: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
