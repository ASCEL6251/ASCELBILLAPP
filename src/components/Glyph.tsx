// Ascel Bill's own icon set. Every glyph is drawn on a 24-unit grid as a soft
// filled "accent" shape behind a rounded ink outline, so icons read as one family.
import { memo, ReactElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/lib/theme';

type P = { s: string; a: string; w: number };
type Draw = (p: P) => ReactElement;

const st = (p: P) => ({ stroke: p.s, strokeWidth: p.w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });
const fl = (p: P, o = 1) => ({ fill: p.a, opacity: o });

const G = {
  home: (p) => (<>
    <Path d="M5 11.5 12 5l7 6.5V19a1 1 0 0 1-1 1h-3.5v-5h-5v5H6a1 1 0 0 1-1-1z" {...fl(p, 0.35)} />
    <Path d="M3.5 12 12 4.5l8.5 7.5M6 10.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-8.5" {...st(p)} />
  </>),
  insights: (p) => (<>
    <Rect x="4" y="12" width="4" height="8" rx="1.4" {...fl(p, 0.45)} />
    <Rect x="10" y="7" width="4" height="13" rx="1.4" {...fl(p, 0.7)} />
    <Rect x="16" y="4" width="4" height="16" rx="1.4" {...fl(p, 0.35)} />
    <Path d="M4 13.5l6-5 4 3 6-6.5M16 5h4v4" {...st(p)} />
  </>),
  items: (p) => (<>
    <Path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" {...fl(p, 0.3)} />
    <Path d="M12 3.5 20 8v8l-8 4.5L4 16V8zM4 8l8 4.5L20 8M12 12.5v8" {...st(p)} />
  </>),
  more: (p) => (<>
    <Rect x="4" y="4" width="7" height="7" rx="2.2" {...fl(p, 0.55)} />
    <Rect x="13" y="13" width="7" height="7" rx="2.2" {...fl(p, 0.35)} />
    <Rect x="4" y="4" width="7" height="7" rx="2.2" {...st(p)} />
    <Rect x="13" y="4" width="7" height="7" rx="2.2" {...st(p)} />
    <Rect x="4" y="13" width="7" height="7" rx="2.2" {...st(p)} />
    <Circle cx="16.5" cy="16.5" r="3.5" {...st(p)} />
  </>),
  pro: (p) => (<>
    <Path d="M4 9l4 3 4-6 4 6 4-3-1.5 9h-13z" {...fl(p, 0.5)} />
    <Path d="M4 9l4 3 4-6 4 6 4-3-1.5 9h-13zM6.5 20.5h11" {...st(p)} />
  </>),
  bell: (p) => (<>
    <Path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5z" {...fl(p, 0.3)} />
    <Path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 1.5H5zM10 20a2 2 0 0 0 4 0" {...st(p)} />
  </>),
  gear: (p) => (<>
    <Circle cx="12" cy="12" r="6.5" {...fl(p, 0.3)} />
    <Path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" {...st(p)} />
    <Circle cx="12" cy="12" r="5" {...st(p)} />
    <Circle cx="12" cy="12" r="1.8" {...st(p)} />
  </>),
  plusDoc: (p) => (<>
    <Rect x="5" y="3.5" width="14" height="17" rx="3" {...fl(p, 0.3)} />
    <Rect x="5" y="3.5" width="14" height="17" rx="3" {...st(p)} />
    <Path d="M12 8.5v7M8.5 12h7" {...st(p)} />
  </>),
  report: (p) => (<>
    <Rect x="4.5" y="3.5" width="15" height="17" rx="3" {...st(p)} />
    <Rect x="8" y="12" width="2.4" height="5" rx="0.8" {...fl(p, 0.9)} />
    <Rect x="11.3" y="9.5" width="2.4" height="7.5" rx="0.8" {...fl(p, 0.6)} />
    <Rect x="14.6" y="13.5" width="2.4" height="3.5" rx="0.8" {...fl(p, 0.9)} />
    <Path d="M8 7h5" {...st(p)} />
  </>),
  sliders: (p) => (<>
    <Circle cx="9" cy="7.5" r="2.4" {...fl(p, 0.7)} />
    <Circle cx="15" cy="16.5" r="2.4" {...fl(p, 0.7)} />
    <Path d="M4 7.5h2.6M11.4 7.5H20M4 16.5h8.6M17.4 16.5H20" {...st(p)} />
    <Circle cx="9" cy="7.5" r="2.4" {...st(p)} />
    <Circle cx="15" cy="16.5" r="2.4" {...st(p)} />
  </>),
  apps: (p) => (<>
    <Circle cx="7.5" cy="7.5" r="3" {...fl(p, 0.6)} />
    <Circle cx="16.5" cy="16.5" r="3" {...fl(p, 0.35)} />
    {[7.5, 16.5].map((x) => [7.5, 16.5].map((y) => <Circle key={`${x}${y}`} cx={x} cy={y} r="3" {...st(p)} />))}
  </>),
  userAdd: (p) => (<>
    <Circle cx="10" cy="8.5" r="3.5" {...fl(p, 0.45)} />
    <Circle cx="10" cy="8.5" r="3.5" {...st(p)} />
    <Path d="M3.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M18.5 7.5v5M16 10h5" {...st(p)} />
  </>),
  users: (p) => (<>
    <Circle cx="9" cy="8.5" r="3.3" {...fl(p, 0.45)} />
    <Circle cx="9" cy="8.5" r="3.3" {...st(p)} />
    <Path d="M3 19.5c.7-3 3-4.8 6-4.8s5.3 1.8 6 4.8M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.9c1.8.6 3 2.2 3.5 4.6" {...st(p)} />
  </>),
  statement: (p) => (<>
    <Path d="M6 3.5h9l4 4v13H6z" {...fl(p, 0.28)} />
    <Path d="M6 3.5h9l4 4v13H6zM15 3.5v4h4M9 11h7M9 14.5h7M9 18h4" {...st(p)} />
  </>),
  store: (p) => (<>
    <Path d="M4.5 9.5h15V20h-15z" {...fl(p, 0.28)} />
    <Path d="M4 9.5 5.5 4h13L20 9.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0zM5 11.5V20h14v-8.5M10 20v-4.5h4V20" {...st(p)} />
  </>),
  layers: (p) => (<>
    <Path d="M12 4 20.5 8.5 12 13 3.5 8.5z" {...fl(p, 0.5)} />
    <Path d="M12 4 20.5 8.5 12 13 3.5 8.5zM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5" {...st(p)} />
  </>),
  importIn: (p) => (<>
    <Rect x="4" y="13" width="16" height="7.5" rx="2.5" {...fl(p, 0.35)} />
    <Path d="M12 3.5v10M8 9.5l4 4 4-4M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15" {...st(p)} />
  </>),
  exportOut: (p) => (<>
    <Rect x="4" y="13" width="16" height="7.5" rx="2.5" {...fl(p, 0.35)} />
    <Path d="M12 14V4M8 8l4-4 4 4M4 15v3.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V15" {...st(p)} />
  </>),
  trend: (p) => (<>
    <Path d="M4 19.5h16V9l-5 5-4-4-7 6z" {...fl(p, 0.3)} />
    <Path d="M4 16l7-6 4 4 5-5M16 9h4v4M4 20h16" {...st(p)} />
  </>),
  fields: (p) => (<>
    <Rect x="3.5" y="5" width="17" height="5.5" rx="2" {...fl(p, 0.4)} />
    <Rect x="3.5" y="5" width="17" height="5.5" rx="2" {...st(p)} />
    <Rect x="3.5" y="13.5" width="10" height="5.5" rx="2" {...st(p)} />
    <Path d="M18 13.5v6M15 16.5h6" {...st(p)} />
  </>),
  info: (p) => (<>
    <Circle cx="12" cy="12" r="8.5" {...fl(p, 0.3)} />
    <Circle cx="12" cy="12" r="8.5" {...st(p)} />
    <Path d="M12 11v5.5M12 7.8v.2" {...st(p)} />
  </>),
  alert: (p) => (<>
    <Path d="M12 4 21 19.5H3z" {...fl(p, 0.35)} />
    <Path d="M12 4 21 19.5H3zM12 10v4.5M12 17v.2" {...st(p)} />
  </>),
  receipt: (p) => (<>
    <Path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" {...fl(p, 0.3)} />
    <Path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4zM9 8h6M9 11.5h6M9 15h3.5" {...st(p)} />
  </>),
  cashIn: (p) => (<>
    <Rect x="3" y="7" width="18" height="11" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="3" y="7" width="18" height="11" rx="2.5" {...st(p)} />
    <Circle cx="12" cy="12.5" r="2.6" {...st(p)} />
    <Path d="M12 2.5v3M10.3 4 12 5.7 13.7 4" {...st(p)} />
  </>),
  cashOut: (p) => (<>
    <Rect x="3" y="7" width="18" height="11" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="3" y="7" width="18" height="11" rx="2.5" {...st(p)} />
    <Circle cx="12" cy="12.5" r="2.6" {...st(p)} />
    <Path d="M12 5.5v-3M10.3 4 12 2.3 13.7 4" {...st(p)} />
  </>),
  returnIn: (p) => (<>
    <Rect x="4" y="4" width="16" height="16" rx="4" {...fl(p, 0.3)} />
    <Path d="M9 8 5.5 11.5 9 15M5.5 11.5H15a3.5 3.5 0 0 1 0 7h-2" {...st(p)} />
  </>),
  returnOut: (p) => (<>
    <Rect x="4" y="4" width="16" height="16" rx="4" {...fl(p, 0.3)} />
    <Path d="M15 8l3.5 3.5L15 15M18.5 11.5H9a3.5 3.5 0 0 0 0 7h2" {...st(p)} />
  </>),
  quote: (p) => (<>
    <Rect x="4.5" y="3.5" width="15" height="17" rx="3" {...fl(p, 0.28)} />
    <Rect x="4.5" y="3.5" width="15" height="17" rx="3" {...st(p)} />
    <Path d="M8 8h8M8 11.5h5M14.5 16.5l1.5 1.5 3-3.5" {...st(p)} />
  </>),
  order: (p) => (<>
    <Rect x="5" y="5" width="14" height="15.5" rx="2.5" {...fl(p, 0.28)} />
    <Path d="M9 5h-1.5A2.5 2.5 0 0 0 5 7.5v10.5A2.5 2.5 0 0 0 7.5 20.5h9A2.5 2.5 0 0 0 19 18V7.5A2.5 2.5 0 0 0 16.5 5H15" {...st(p)} />
    <Rect x="9" y="3.5" width="6" height="3" rx="1.2" {...st(p)} />
    <Path d="M8.5 12l1.5 1.5L13 10.5M8.5 16.5h7" {...st(p)} />
  </>),
  truck: (p) => (<>
    <Rect x="3" y="6" width="11" height="10" rx="1.5" {...fl(p, 0.35)} />
    <Path d="M3 6h11v10H3zM14 9.5h3.5L20.5 13v3H14" {...st(p)} />
    <Circle cx="7" cy="17.5" r="1.8" {...st(p)} />
    <Circle cx="17" cy="17.5" r="1.8" {...st(p)} />
  </>),
  pos: (p) => (<>
    <Rect x="6" y="3" width="12" height="18" rx="3" {...fl(p, 0.28)} />
    <Rect x="6" y="3" width="12" height="18" rx="3" {...st(p)} />
    <Rect x="8.5" y="6" width="7" height="4" rx="1" {...st(p)} />
    <Path d="M9 13.5h.1M12 13.5h.1M15 13.5h.1M9 16.5h.1M12 16.5h.1M15 16.5h.1" {...st(p)} />
  </>),
  cart: (p) => (<>
    <Path d="M6.5 7h14l-1.8 7.5H8z" {...fl(p, 0.35)} />
    <Path d="M3 4h2.5l2.4 10.5h10.6L20.5 7H6.3" {...st(p)} />
    <Circle cx="9.5" cy="18.5" r="1.6" {...st(p)} />
    <Circle cx="17" cy="18.5" r="1.6" {...st(p)} />
  </>),
  wallet: (p) => (<>
    <Rect x="3.5" y="6.5" width="17" height="13" rx="3" {...fl(p, 0.3)} />
    <Path d="M17 6.5V5a1.5 1.5 0 0 0-1.9-1.4L5 6.5" {...st(p)} />
    <Rect x="3.5" y="6.5" width="17" height="13" rx="3" {...st(p)} />
    <Path d="M20.5 11h-3.5a2 2 0 0 0 0 4h3.5" {...st(p)} />
  </>),
  bank: (p) => (<>
    <Path d="M3.5 9 12 4l8.5 5z" {...fl(p, 0.45)} />
    <Path d="M3.5 9 12 4l8.5 5zM6 11v6M10 11v6M14 11v6M18 11v6M3.5 20h17" {...st(p)} />
  </>),
  cash: (p) => (<>
    <Rect x="2.5" y="6.5" width="19" height="11" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="2.5" y="6.5" width="19" height="11" rx="2.5" {...st(p)} />
    <Circle cx="12" cy="12" r="2.6" {...st(p)} />
    <Path d="M6 9.5v.1M18 14.5v.1" {...st(p)} />
  </>),
  cheque: (p) => (<>
    <Rect x="2.5" y="6" width="19" height="12" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="2.5" y="6" width="19" height="12" rx="2.5" {...st(p)} />
    <Path d="M6 10h6M6 14c1-1.5 2-1.5 3 0s2 1.5 3 0M15.5 14h3" {...st(p)} />
  </>),
  loan: (p) => (<>
    <Path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5H12z" {...fl(p, 0.6)} />
    <Circle cx="12" cy="12" r="8.5" {...st(p)} />
    <Path d="M12 3.5V12h8.5" {...st(p)} />
  </>),
  sync: (p) => (<>
    <Circle cx="12" cy="12" r="5" {...fl(p, 0.3)} />
    <Path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5M19.5 4v5h-5M4.5 20v-5h5" {...st(p)} />
  </>),
  companies: (p) => (<>
    <Rect x="3.5" y="9" width="8" height="11.5" rx="1.5" {...fl(p, 0.35)} />
    <Path d="M3.5 9h8v11.5h-8zM11.5 4.5h9v16h-9M14.5 8h3M14.5 11.5h3M14.5 15h3M6 12.5h3M6 16h3" {...st(p)} />
  </>),
  backup: (p) => (<>
    <Path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5z" {...fl(p, 0.3)} />
    <Path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5M12 11.5v6M9.5 14 12 11.5l2.5 2.5" {...st(p)} />
  </>),
  restore: (p) => (<>
    <Path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5z" {...fl(p, 0.3)} />
    <Path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5M12 11.5v6M9.5 15l2.5 2.5 2.5-2.5" {...st(p)} />
  </>),
  tools: (p) => (<>
    <Circle cx="16.5" cy="7.5" r="3.5" {...fl(p, 0.4)} />
    <Path d="M14 10 5 19a1.4 1.4 0 0 1-2-2l9-9M13.5 5a3.5 3.5 0 0 0 5.5 4.5L17 7.5z" {...st(p)} />
  </>),
  calendar: (p) => (<>
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...fl(p, 0.28)} />
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" {...st(p)} />
    <Path d="M3.5 10h17M8 3v4M16 3v4M8 14h.1M12 14h.1M16 14h.1" {...st(p)} />
  </>),
  chat: (p) => (<>
    <Path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v8a2.5 2.5 0 0 1-2.5 2.5H10L5.5 20v-3.5H6.5A2.5 2.5 0 0 1 4 14z" {...fl(p, 0.3)} />
    <Path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6v8a2.5 2.5 0 0 1-2.5 2.5H10L5.5 20v-3.5H6.5A2.5 2.5 0 0 1 4 14zM8.5 10h.1M12 10h.1M15.5 10h.1" {...st(p)} />
  </>),
  trash: (p) => (<>
    <Path d="M6.5 7h11l-1 13.5h-9z" {...fl(p, 0.3)} />
    <Path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10.5 11v6M13.5 11v6" {...st(p)} />
  </>),
  tag: (p) => (<>
    <Path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" {...fl(p, 0.3)} />
    <Path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" {...st(p)} />
    <Circle cx="8" cy="8.5" r="1.5" {...st(p)} />
  </>),
  desktop: (p) => (<>
    <Rect x="3" y="4" width="18" height="12" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="3" y="4" width="18" height="12" rx="2.5" {...st(p)} />
    <Path d="M9 20h6M12 16v4" {...st(p)} />
  </>),
  megaphone: (p) => (<>
    <Path d="M4 10h4l9-5v14l-9-5H4z" {...fl(p, 0.3)} />
    <Path d="M4 9.5h4l9-5v15l-9-5H4zM8 14.5l1.5 5h2.5l-1.3-5M20 10v4" {...st(p)} />
  </>),
  card: (p) => (<>
    <Rect x="3" y="5.5" width="18" height="13" rx="2.5" {...fl(p, 0.3)} />
    <Rect x="3" y="5.5" width="18" height="13" rx="2.5" {...st(p)} />
    <Circle cx="8.5" cy="11" r="2" {...st(p)} />
    <Path d="M6 15.5c.7-1.2 1.6-1.7 2.5-1.7s1.8.5 2.5 1.7M14 10h4M14 13.5h3" {...st(p)} />
  </>),
  globe: (p) => (<>
    <Circle cx="12" cy="12" r="8.5" {...fl(p, 0.28)} />
    <Circle cx="12" cy="12" r="8.5" {...st(p)} />
    <Path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5S9.5 6.1 12 3.5" {...st(p)} />
  </>),
  headset: (p) => (<>
    <Rect x="3.5" y="12" width="4" height="6.5" rx="1.8" {...fl(p, 0.6)} />
    <Rect x="16.5" y="12" width="4" height="6.5" rx="1.8" {...fl(p, 0.6)} />
    <Path d="M3.5 15v-3a8.5 8.5 0 0 1 17 0v3M3.5 12h4v6.5h-4zM16.5 12h4v6.5h-4zM20.5 18.5c0 1.5-2 2.5-5 2.5" {...st(p)} />
  </>),
  play: (p) => (<>
    <Circle cx="12" cy="12" r="8.5" {...fl(p, 0.3)} />
    <Circle cx="12" cy="12" r="8.5" {...st(p)} />
    <Path d="M10 8.5v7l5.5-3.5z" {...st(p)} />
  </>),
  star: (p) => (<>
    <Path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" {...fl(p, 0.4)} />
    <Path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" {...st(p)} />
  </>),
  shield: (p) => (<>
    <Path d="M12 3.5 19 6v6c0 4.3-3 7.3-7 8.5-4-1.2-7-4.2-7-8.5V6z" {...fl(p, 0.3)} />
    <Path d="M12 3.5 19 6v6c0 4.3-3 7.3-7 8.5-4-1.2-7-4.2-7-8.5V6zM9 12l2 2 4-4" {...st(p)} />
  </>),
  palette: (p) => (<>
    <Path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.3-8.5-7.3z" {...fl(p, 0.3)} />
    <Path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.3-8.5-7.3z" {...st(p)} />
    <Circle cx="7.8" cy="11" r="1" fill={p.s} />
    <Circle cx="10.5" cy="7.5" r="1" fill={p.s} />
    <Circle cx="15" cy="7.8" r="1" fill={p.s} />
  </>),
  print: (p) => (<>
    <Rect x="3.5" y="9" width="17" height="8" rx="2.5" {...fl(p, 0.3)} />
    <Path d="M7 9V4h10v5M7 17H5.5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H17" {...st(p)} />
    <Rect x="7" y="14" width="10" height="6.5" rx="1" {...st(p)} />
  </>),
  share: (p) => (<>
    <Circle cx="17.5" cy="6" r="2.5" {...fl(p, 0.6)} />
    <Circle cx="6.5" cy="12" r="2.5" {...fl(p, 0.6)} />
    <Circle cx="17.5" cy="18" r="2.5" {...fl(p, 0.6)} />
    <Circle cx="17.5" cy="6" r="2.5" {...st(p)} />
    <Circle cx="6.5" cy="12" r="2.5" {...st(p)} />
    <Circle cx="17.5" cy="18" r="2.5" {...st(p)} />
    <Path d="M8.7 10.8l6.6-3.6M8.7 13.2l6.6 3.6" {...st(p)} />
  </>),
  search: (p) => (<>
    <Circle cx="10.5" cy="10.5" r="6" {...fl(p, 0.25)} />
    <Circle cx="10.5" cy="10.5" r="6" {...st(p)} />
    <Path d="M15 15l5 5" {...st(p)} />
  </>),
  filter: (p) => (<>
    <Path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" {...fl(p, 0.3)} />
    <Path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" {...st(p)} />
  </>),
  phone: (p) => (<>
    <Path d="M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" {...fl(p, 0.3)} />
    <Path d="M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" {...st(p)} />
  </>),
  edit: (p) => (<>
    <Path d="M15.5 4.5l4 4L9 19H5v-4z" {...fl(p, 0.3)} />
    <Path d="M15.5 4.5l4 4L9 19H5v-4zM13 7l4 4" {...st(p)} />
  </>),
  scale: (p) => (<>
    <Path d="M3.5 14h6l-3-6.5zM14.5 14h6l-3-6.5z" {...fl(p, 0.35)} />
    <Path d="M12 4v16M7.5 20h9M5 7h14M3.5 14l3-6.5 3 6.5a3 3 0 0 1-6 0M14.5 14l3-6.5 3 6.5a3 3 0 0 1-6 0" {...st(p)} />
  </>),
  whatsapp: (p) => (<>
    <Circle cx="12" cy="11.5" r="8" {...fl(p, 0.3)} />
    <Path d="M4.5 20l1.3-4A8 8 0 1 1 9 19z" {...st(p)} />
    <Path d="M9.5 8.5c0 3 2.5 5.5 5.5 5.5l.8-1.4-1.8-.9-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-.9-1.8z" {...st(p)} />
  </>),
} satisfies Record<string, Draw>;

export type GlyphName = keyof typeof G;

/** Two-tone brand icon. `accent` tints the soft fill; `color` is the outline. */
export const Glyph = memo(function Glyph({
  name,
  size = 24,
  color = colors.ink,
  accent = colors.tint,
  weight = 1.7,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  accent?: string;
  weight?: number;
}) {
  const draw: Draw = G[name] ?? G.info;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw({ s: color, a: accent, w: weight })}
    </Svg>
  );
});

