// Tiny schematic drawing of each invoice design, so the picker shows the layout at a glance
// without rendering eight WebViews.
import { memo } from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

const W = 64;
const H = 86;
const GREY = '#D9DEE5';
const SOFT = '#EEF1F5';

function lines(x: number, y: number, widths: number[], gap = 5, h = 2.4, color = GREY) {
  return widths.map((w, i) => <Rect key={`${x}-${y}-${i}`} x={x} y={y + i * gap} width={w} height={h} rx={1.2} fill={color} />);
}

function table(x: number, y: number, w: number, rows = 4) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={5} rx={1} fill={SOFT} />
      {Array.from({ length: rows }).map((_, i) => (
        <G key={i}>
          <Rect x={x + 2} y={y + 9 + i * 6} width={w * 0.45} height={2.2} rx={1} fill={GREY} />
          <Rect x={x + w - 12} y={y + 9 + i * 6} width={10} height={2.2} rx={1} fill={GREY} />
        </G>
      ))}
    </G>
  );
}

export const TemplateThumb = memo(function TemplateThumb({ id, color }: { id: string; color: string }) {
  const [c, c2 = c] = color.split('|');
  let body: React.ReactNode;
  switch (id) {
    case 'noir':
      body = (
        <>
          <Rect x={0} y={0} width={W} height={24} fill={c} />
          <Line x1={6} x2={W - 6} y1={20} y2={20} stroke="#D7A93F" strokeWidth={0.8} />
          {lines(6, 7, [22, 14], 5, 2.6, 'rgba(255,255,255,0.75)')}
          <Rect x={W - 20} y={7} width={14} height={4} rx={1} fill="#D7A93F" />
          {table(6, 30, W - 12)}
          <Rect x={W - 28} y={H - 14} width={22} height={7} rx={1.5} fill={c} />
        </>
      );
      break;
    case 'atelier':
      body = (
        <>
          <Circle cx={W / 2} cy={13} r={7} fill="none" stroke={c} strokeWidth={1.4} />
          <Rect x={W / 2 - 2.5} y={10} width={5} height={6} rx={1} fill={c} />
          {lines(W / 2 - 13, 24, [26], 5, 2.4, c)}
          {lines(W / 2 - 9, 29, [18], 5, 2, GREY)}
          {table(6, 37, W - 12)}
          <Line x1={W / 2 - 10} x2={W / 2 + 10} y1={H - 8} y2={H - 8} stroke={c} strokeWidth={1.2} />
        </>
      );
      break;
    case 'ledger':
      body = (
        <>
          <Rect x={4} y={4} width={W - 8} height={H - 8} fill="none" stroke={c} strokeWidth={0.9} />
          <Line x1={4} x2={W - 4} y1={18} y2={18} stroke={c} strokeWidth={0.9} />
          <Line x1={W / 2} x2={W / 2} y1={18} y2={34} stroke={c} strokeWidth={0.7} />
          <Line x1={4} x2={W - 4} y1={34} y2={34} stroke={c} strokeWidth={0.9} />
          {lines(8, 9, [24], 4, 3, c)}
          {lines(8, 22, [18, 12], 5)}
          {lines(W / 2 + 4, 22, [16, 10], 5)}
          {[0, 1, 2, 3, 4].map((i) => (
            <Line key={i} x1={4} x2={W - 4} y1={42 + i * 7} y2={42 + i * 7} stroke={GREY} strokeWidth={0.6} />
          ))}
          <Line x1={W - 18} x2={W - 18} y1={34} y2={70} stroke={GREY} strokeWidth={0.6} />
          <Rect x={W - 26} y={H - 14} width={20} height={6} fill={c} opacity={0.18} />
        </>
      );
      break;
    case 'split':
      body = (
        <>
          <Rect x={0} y={0} width={20} height={H} fill={c} />
          <Rect x={5} y={7} width={10} height={10} rx={2} fill="rgba(255,255,255,0.85)" />
          {lines(4, 24, [12, 9, 11], 5, 2, 'rgba(255,255,255,0.6)')}
          {lines(26, 8, [24, 16], 5, 2.6, c)}
          {table(26, 24, W - 31)}
          <Rect x={W - 22} y={H - 14} width={17} height={7} rx={1.5} fill={c} />
        </>
      );
      break;
    case 'wave':
      body = (
        <>
          <Path d={`M0 0 H${W} V16 C${W * 0.7} 26 ${W * 0.35} 8 0 20 Z`} fill={c} />
          <Path d={`M0 0 H${W} V10 C${W * 0.7} 18 ${W * 0.35} 4 0 12 Z`} fill={c2} opacity={0.65} />
          {lines(6, 5, [20], 4, 2.6, 'rgba(255,255,255,0.85)')}
          {table(6, 28, W - 12)}
          <Path d={`M0 ${H} H${W} V${H - 8} C${W * 0.6} ${H - 2} ${W * 0.3} ${H - 12} 0 ${H - 6} Z`} fill={c2} />
        </>
      );
      break;
    case 'swiss':
      body = (
        <>
          <Rect x={6} y={6} width={4} height={18} fill={c} />
          {lines(14, 7, [30, 18], 6, 3.4, '#1D1F20')}
          {table(6, 30, W - 12, 3)}
          <Rect x={6} y={H - 22} width={W - 12} height={14} fill={c} />
          <Rect x={W - 30} y={H - 18} width={20} height={6} rx={1} fill="#fff" />
        </>
      );
      break;
    case 'thermal':
      return (
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#F4F5F7" />
          <Path
            d={`M16 6 H48 V${H - 10} l-2.7 3 -2.7 -3 -2.7 3 -2.7 -3 -2.7 3 -2.7 -3 -2.7 3 -2.7 -3 -2.7 3 -2.7 -3 -2.7 3 Z`}
            fill="#fff"
            stroke={GREY}
            strokeWidth={0.6}
          />
          {lines(22, 12, [20], 4, 2.6, '#111')}
          {lines(25, 18, [14], 4, 1.8)}
          <Line x1={19} x2={45} y1={25} y2={25} stroke="#111" strokeWidth={0.6} strokeDasharray="2 1.5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <G key={i}>
              <Rect x={20} y={30 + i * 6} width={12} height={2} rx={1} fill={GREY} />
              <Rect x={37} y={30 + i * 6} width={7} height={2} rx={1} fill={GREY} />
            </G>
          ))}
          <Line x1={19} x2={45} y1={62} y2={62} stroke="#111" strokeWidth={0.6} strokeDasharray="2 1.5" />
          <Rect x={30} y={66} width={14} height={3.4} rx={1} fill="#111" />
        </Svg>
      );
    default: // meridian
      body = (
        <>
          <Rect x={0} y={0} width={W} height={3} fill={c} />
          <Rect x={6} y={9} width={9} height={9} rx={2.5} fill={c} opacity={0.9} />
          {lines(19, 10, [18, 12], 4.5)}
          {lines(W - 22, 10, [16], 4, 3, c)}
          <Rect x={6} y={24} width={W - 12} height={9} rx={2} fill={SOFT} />
          {table(6, 38, W - 12)}
          <Rect x={W - 30} y={H - 15} width={24} height={8} rx={2} fill={c} opacity={0.14} />
          <Rect x={W - 26} y={H - 12} width={16} height={2.6} rx={1} fill={c} />
        </>
      );
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={6} fill="#fff" />
      {body}
    </Svg>
  );
});
