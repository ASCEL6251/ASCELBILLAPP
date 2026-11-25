import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, fonts } from '@/lib/theme';

/** Two-series line chart: solid line for this year, dashed line for last year. */
export function LineChart({
  width,
  height = 180,
  labels,
  current,
  previous,
  legend,
}: {
  width: number;
  height?: number;
  labels: string[];
  current: number[];
  previous: number[];
  legend: [string, string];
}) {
  const padX = 10;
  const padY = 14;
  const max = Math.max(1, ...current, ...previous);
  const x = (i: number) => padX + (i * (width - padX * 2)) / Math.max(1, labels.length - 1);
  const y = (v: number) => height - padY - (v / max) * (height - padY * 2);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={f} x1={0} x2={width} y1={padY + f * (height - padY * 2)} y2={padY + f * (height - padY * 2)} stroke={colors.line} strokeWidth={1} />
        ))}
        <Line x1={0} x2={width} y1={height - padY} y2={height - padY} stroke={colors.lineStrong} strokeWidth={1} />
        <Path d={path(previous)} stroke={colors.tint} strokeWidth={2} strokeDasharray="6 5" fill="none" />
        <Path d={path(current)} stroke={colors.accent} strokeWidth={2.5} fill="none" />
        {current.map((v, i) => (
          <Circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={colors.accent} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        {labels.map((l) => (
          <Text key={l} style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textFaint }}>{l}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 }}>
        <LegendItem color={colors.accent} label={legend[0]} />
        <LegendItem color={colors.tint} label={legend[1]} dashed />
      </View>
    </View>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {dashed ? (
          <>
            <View style={{ width: 7, height: 2, backgroundColor: color }} />
            <View style={{ width: 7, height: 2, backgroundColor: color }} />
          </>
        ) : (
          <View style={{ width: 18, height: 2, backgroundColor: color }} />
        )}
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
