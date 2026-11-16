import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { monthLabel, moneyShort, toISO } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';

/**
 * Six-month sales bars for the dark hero card. Past months are soft glass columns;
 * the current month is a bright gradient column with a value bubble.
 */
export function MiniBars({
  series,
  width = 300,
  height = 132,
  currency = '₹',
}: {
  series: { m: string; v: number }[];
  width?: number;
  height?: number;
  currency?: string;
}) {
  const months: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(toISO(x).slice(0, 7));
  }
  const vals = months.map((m) => series.find((s) => s.m === m)?.v ?? 0);
  const max = Math.max(1, ...vals);

  const gap = 10;
  const bw = (width - gap * 5) / 6;
  const labelH = 18;
  const bubbleH = 26;
  const chartTop = bubbleH + 6;
  const chartH = height - labelH - chartTop;
  const base = chartTop + chartH;
  const barH = (v: number) => Math.max(6, (v / max) * chartH);

  const lastX = 5 * (bw + gap);
  const lastTop = base - barH(vals[5]);
  const bubbleText = moneyShort(vals[5], currency);
  const bubbleW = Math.max(bw, bubbleText.length * 7.4 + 16);
  const bubbleX = Math.min(width - bubbleW, lastX + bw / 2 - bubbleW / 2);
  const bubbleY = Math.max(0, lastTop - bubbleH - 6);

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="barNow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CFE4F8" />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
          <LinearGradient id="barPast" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.tint} stopOpacity={0.42} />
            <Stop offset="1" stopColor={colors.tint} stopOpacity={0.08} />
          </LinearGradient>
        </Defs>


        {vals.map((v, i) => {
          const h = barH(v);
          const last = i === 5;
          return (
            <Rect
              key={months[i]}
              x={i * (bw + gap)}
              y={base - h}
              width={bw}
              height={h}
              rx={Math.min(10, bw / 3)}
              fill={last ? 'url(#barNow)' : 'url(#barPast)'}
              stroke={last ? undefined : colors.tint}
              strokeOpacity={last ? undefined : 0.18}
              strokeWidth={last ? 0 : 1}
            />
          );
        })}

        {/* value bubble */}
        <Rect x={bubbleX} y={bubbleY} width={bubbleW} height={bubbleH - 4} rx={11} fill={colors.paper} />
        <SvgText x={bubbleX + bubbleW / 2} y={bubbleY + 15.5} fontSize={12} fontFamily={fonts.bold} fill={colors.ink} textAnchor="middle">
          {bubbleText}
        </SvgText>

        {months.map((m, i) => (
          <SvgText
            key={m}
            x={i * (bw + gap) + bw / 2}
            y={height - 3}
            fontSize={11.5}
            fontFamily={i === 5 ? fonts.semibold : fonts.medium}
            fill={i === 5 ? colors.onInk : colors.onInkMuted}
            textAnchor="middle"
          >
            {monthLabel(m)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
