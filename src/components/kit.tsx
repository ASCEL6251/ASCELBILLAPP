// Building blocks for the main app screens: header, segmented tabs, action tiles,
// balance card, transaction cards, menu rows and the floating action button.
// Everything is drawn with Ascel's own Glyph icon set in the Ascelstack palette.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { memo, ReactNode, useState } from 'react';
import { Image, LayoutAnimation, Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Business, DocType, Invoice } from '@/db/types';
import { docMeta } from '@/lib/docs';
import { dateLabel, money } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';
import { Glyph, GlyphName } from './Glyph';
import { Mark, tap } from './ui';

/* ---------- Document type → icon + colour ---------- */

const DOC_GLYPH: Record<DocType, GlyphName> = {
  sale: 'receipt',
  sale_return: 'returnIn',
  estimate: 'quote',
  sale_order: 'order',
  delivery_challan: 'truck',
  purchase: 'cart',
  purchase_return: 'returnOut',
  purchase_order: 'order',
};

export const docGlyph = (t: DocType): GlyphName => DOC_GLYPH[t] ?? 'receipt';
export function docTone(t: DocType) {
  const m = docMeta(t);
  if (!m.pay) return colors.accent;
  return m.side === 'purchase' ? colors.warn : colors.success;
}

/* ---------- Icon tile: soft rounded square holding a glyph ---------- */

export const IconTile = memo(function IconTile({
  name,
  tone = colors.accent,
  size = 44,
  glyph,
  solid,
}: {
  name: GlyphName;
  tone?: string;
  size?: number;
  glyph?: number;
  solid?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: solid ? tone : tone + '1A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph name={name} size={glyph ?? Math.round(size * 0.56)} color={solid ? '#fff' : colors.ink} accent={solid ? 'rgba(255,255,255,0.45)' : tone} />
    </View>
  );
});

/** Kept for older screens: same as IconTile. */
export const DuoIcon = IconTile;

/* ---------- Brand header (logo · greeting · business · bell · settings) ---------- */

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function AppHeader({ biz }: { biz: Business | null | undefined }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={() => { tap(); router.push('/business'); }} style={styles.headerLeft} hitSlop={6}>
        <View style={styles.logo}>
          {biz?.logo ? <Image source={{ uri: biz.logo }} style={{ width: 40, height: 40 }} /> : <Mark size={24} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>{greeting()}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{biz?.name || 'Your Business'}</Text>
        </View>
      </Pressable>
      <HeaderBtn icon="bell" onPress={() => router.push('/notifications')} />
      <HeaderBtn icon="gear" onPress={() => router.push('/app-settings')} />
    </View>
  );
}

function HeaderBtn({ icon, onPress }: { icon: GlyphName; onPress: () => void }) {
  return (
    <Pressable
      hitSlop={6}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [styles.headerBtn, pressed && { backgroundColor: colors.tintSoft }]}
    >
      <Glyph name={icon} size={21} />
    </Pressable>
  );
}

/* ---------- Segmented control ---------- */

export function PillTabs<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <View style={styles.segWrap}>
      <View style={styles.seg}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                if (on) return;
                tap();
                LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));
                onChange(o.value);
              }}
              style={[styles.segItem, on && styles.segOn]}
            >
              <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Balance card: what you'll get vs. what you'll give ---------- */

export function BalanceCard({
  get,
  give,
  currency,
  onGet,
  onGive,
  style,
}: {
  get: number;
  give: number;
  currency: string;
  onGet?: () => void;
  onGive?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const total = get + give;
  const getPct = total > 0 ? get / total : 0.5;
  const net = get - give;
  return (
    <LinearGradient colors={[colors.inkRaised, colors.inkDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bal, style]}>
      <View style={styles.balGlow} />
      <View style={{ flexDirection: 'row' }}>
        <Pressable style={{ flex: 1 }} onPress={onGet && (() => { tap(); onGet(); })}>
          <View style={styles.balHead}>
            <View style={[styles.balDot, { backgroundColor: '#5CC79C' }]}>
              <Ionicons name="arrow-down" size={11} color={colors.inkDeep} />
            </View>
            <Text style={styles.balLabel}>You&apos;ll get</Text>
          </View>
          <Text style={[styles.balVal, { color: '#7FE0B6' }]} numberOfLines={1} adjustsFontSizeToFit>{money(get, currency, 0)}</Text>
          <Text style={styles.balHint}>Customers owe you</Text>
        </Pressable>
        <View style={styles.balDivider} />
        <Pressable style={{ flex: 1, paddingLeft: 16 }} onPress={onGive && (() => { tap(); onGive(); })}>
          <View style={styles.balHead}>
            <View style={[styles.balDot, { backgroundColor: '#F08A7E' }]}>
              <Ionicons name="arrow-up" size={11} color={colors.inkDeep} />
            </View>
            <Text style={styles.balLabel}>You&apos;ll give</Text>
          </View>
          <Text style={[styles.balVal, { color: '#FFB0A6' }]} numberOfLines={1} adjustsFontSizeToFit>{money(give, currency, 0)}</Text>
          <Text style={styles.balHint}>You owe suppliers</Text>
        </Pressable>
      </View>
      <View style={styles.balBar}>
        <View style={{ flex: Math.max(getPct, 0.02), backgroundColor: '#5CC79C', borderRadius: 3 }} />
        <View style={{ width: 3 }} />
        <View style={{ flex: Math.max(1 - getPct, 0.02), backgroundColor: '#F08A7E', borderRadius: 3 }} />
      </View>
      <Text style={styles.balNet}>
        Net position{'  '}
        <Text style={{ fontFamily: fonts.semibold, color: net >= 0 ? '#7FE0B6' : '#FFB0A6' }}>
          {net >= 0 ? '+' : '−'}{money(Math.abs(net), currency, 0)}
        </Text>
      </Text>
    </LinearGradient>
  );
}

/* ---------- Action tiles (scrollable row) ---------- */

export interface QuickLink {
  icon: GlyphName;
  label: string;
  onPress: () => void;
  tone?: string;
}

export function QuickLinks({ title, links, style }: { title?: string; links: QuickLink[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tilesRow}>
        {links.map((l) => (
          <Pressable
            key={l.label}
            onPress={() => { tap(); l.onPress(); }}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <IconTile name={l.icon} tone={l.tone} size={42} />
            <Text style={styles.tileLabel} numberOfLines={2}>{l.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- Generic white card ---------- */

export function Panel({
  title,
  subtitle,
  right,
  children,
  style,
  onPress,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const body = (
    <>
      {title ? (
        <View style={styles.panelHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>{title}</Text>
            {subtitle ? <Text style={styles.panelSub}>{subtitle}</Text> : null}
          </View>
          {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textFaint} /> : null)}
        </View>
      ) : null}
      {children}
    </>
  );
  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

/* ---------- Small label/value cell ---------- */

export function Stat({ label, value, color, style }: { label: string; value: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/* ---------- Status pill ---------- */

export function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={[styles.status, { backgroundColor: tone + '1A' }]}>
      <View style={[styles.statusDot, { backgroundColor: tone }]} />
      <Text style={[styles.statusText, { color: tone }]}>{label}</Text>
    </View>
  );
}

export function invoiceStatus(inv: Invoice): { label: string; tone: string } {
  const meta = docMeta(inv.type);
  if (!meta.pay) return { label: 'Open', tone: colors.accent };
  const bal = inv.total - inv.received;
  if (bal <= 0.004) return { label: 'Paid', tone: colors.success };
  if (inv.received > 0.004) return { label: 'Partial', tone: colors.warn };
  return { label: 'Unpaid', tone: colors.danger };
}

/* ---------- Floating action button (bottom-right, extended) ---------- */

export function FabPill({ label, icon, onPress, bottom = 18 }: { label: string; icon?: string; onPress: () => void; bottom?: number }) {
  void icon;
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: bottom, paddingRight: 16 }]}>
      <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.96 }] }]}>
        <LinearGradient colors={[colors.accent, colors.ink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <View style={styles.fabPlus}>
            <Ionicons name="add" size={20} color={colors.ink} />
          </View>
          <Text style={styles.fabText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/* ---------- Transaction card ---------- */

export const TxnCard = memo(function TxnCard({
  inv,
  currency,
  onPrint,
  onShare,
  onMore,
}: {
  inv: Invoice;
  currency: string;
  onPrint?: () => void;
  onShare?: () => void;
  onMore?: () => void;
}) {
  const meta = docMeta(inv.type);
  const bal = Math.max(0, inv.total - inv.received);
  const st = invoiceStatus(inv);
  return (
    <Pressable
      onPress={() => { tap(); router.push(`/invoice/${inv.id}`); }}
      style={({ pressed }) => [styles.card, styles.txn, pressed && styles.pressed]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile name={docGlyph(inv.type)} tone={docTone(inv.type)} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.txnName} numberOfLines={1}>{inv.party_name || 'Cash Sale'}</Text>
          <Text style={styles.txnMeta} numberOfLines={1}>
            {meta.label} · #{inv.number} · {dateLabel(inv.date)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          <Text style={styles.txnAmt}>{money(inv.total, currency)}</Text>
          <StatusPill {...st} />
        </View>
      </View>
      <View style={styles.txnFoot}>
        <Text style={styles.txnBal}>
          {meta.pay ? (
            <>
              Balance <Text style={{ fontFamily: fonts.semibold, color: bal > 0 ? colors.text : colors.success }}>{money(bal, currency)}</Text>
            </>
          ) : (
            'No payment due'
          )}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {onPrint ? <TinyIcon name="print" onPress={onPrint} /> : null}
          {onShare ? <TinyIcon name="share" onPress={onShare} /> : null}
          {onMore ? <TinyIcon name="more" onPress={onMore} dots /> : null}
        </View>
      </View>
    </Pressable>
  );
});

export function TinyIcon({ name, onPress, dots }: { name: GlyphName; onPress: () => void; dots?: boolean }) {
  return (
    <Pressable hitSlop={6} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.tiny, pressed && { backgroundColor: colors.tintSoft }]}>
      {dots ? <Ionicons name="ellipsis-horizontal" size={17} color={colors.ink} /> : <Glyph name={name} size={18} />}
    </Pressable>
  );
}

/* ---------- Section heading ---------- */

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.secRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable hitSlop={8} onPress={() => { tap(); onAction?.(); }}>
          <Text style={styles.secAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Menu rows (expandable group + sub rows) ---------- */

export function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginBottom: 8 }]}>{title}</Text>
      <View style={[styles.card, { paddingVertical: 4, paddingHorizontal: 0, marginTop: 0 }]}>{children}</View>
    </View>
  );
}

export function MenuRow({
  icon,
  label,
  onPress,
  children,
  badge,
  last,
  tone,
}: {
  icon: GlyphName;
  label: string;
  onPress?: () => void;
  children?: ReactNode;
  badge?: ReactNode;
  last?: boolean;
  tone?: string;
}) {
  const [open, setOpen] = useState(false);
  const expandable = !!children;
  return (
    <View>
      <Pressable
        onPress={() => {
          tap();
          if (expandable) {
            LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
            setOpen((o) => !o);
          } else onPress?.();
        }}
        style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.canvas }]}
      >
        <IconTile name={icon} tone={tone} size={36} />
        <Text style={styles.menuLabel}>{label}</Text>
        {badge}
        <Ionicons name={expandable ? (open ? 'chevron-up' : 'chevron-down') : 'chevron-forward'} size={17} color={colors.textFaint} />
      </Pressable>
      {expandable && open ? <View style={styles.subWrap}>{children}</View> : null}
      {!last ? <View style={styles.menuHr} /> : null}
    </View>
  );
}

export function SubRow({ label, hint, onPress, badge }: { label: string; hint?: string; onPress: () => void; badge?: ReactNode }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.subRow, pressed && { opacity: 0.6 }]}>
      <View style={styles.subBullet} />
      <Text style={styles.subLabel}>
        {label}
        {hint ? <Text style={styles.subHint}>{`  ${hint}`}</Text> : null}
      </Text>
      {badge}
      <Ionicons name="chevron-forward" size={15} color={colors.textFaint} />
    </Pressable>
  );
}

export function ProBadge() {
  return (
    <View style={styles.pro}>
      <Text style={styles.proText}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: colors.canvas, gap: 8 },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  hello: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink, letterSpacing: -0.3, marginTop: 1 },
  headerBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  segWrap: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.canvas },
  seg: { flexDirection: 'row', backgroundColor: '#DCE5F0', borderRadius: 14, padding: 4 },
  segItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.card, shadowColor: '#1D2D3D', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segText: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textMuted },
  segTextOn: { fontFamily: fonts.semibold, color: colors.ink },
  bal: { marginHorizontal: 16, marginTop: 6, borderRadius: 22, padding: 18, overflow: 'hidden' },
  balGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.accent, opacity: 0.22, right: -80, top: -110 },
  balHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  balDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  balLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.onInkMuted },
  balVal: { fontFamily: fonts.bold, fontSize: 24, marginTop: 8, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  balHint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.onInkMuted, marginTop: 2, opacity: 0.8 },
  balDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.lineOnInk, marginVertical: 2 },
  balBar: { flexDirection: 'row', height: 6, marginTop: 16 },
  balNet: { fontFamily: fonts.body, fontSize: 12, color: colors.onInkMuted, marginTop: 10 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, letterSpacing: -0.1 },
  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 18, marginBottom: 2 },
  secAction: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent },
  tilesRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tile: { width: 84, backgroundColor: colors.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line },
  tileLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.text, textAlign: 'center', lineHeight: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  panelTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  panelSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  statValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 3, fontVariant: ['tabular-nums'] },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: fonts.semibold, fontSize: 11 },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingLeft: 8, paddingRight: 20, borderRadius: 20, shadowColor: '#1D2D3D', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabPlus: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 15 },
  txn: { paddingVertical: 14, paddingHorizontal: 14 },
  txnName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  txnMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint, marginTop: 3 },
  txnAmt: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.ink, fontVariant: ['tabular-nums'] },
  txnFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  txnBal: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  tiny: { width: 34, height: 30, borderRadius: 10, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10 },
  menuLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  menuHr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 64, marginRight: 14 },
  subWrap: { marginLeft: 64, marginRight: 14, marginBottom: 8, backgroundColor: colors.canvas, borderRadius: 12, paddingVertical: 4 },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, gap: 10 },
  subBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tint },
  subLabel: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text },
  subHint: { fontSize: 11.5, color: colors.textMuted },
  pro: { backgroundColor: colors.goldSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  proText: { fontFamily: fonts.bold, fontSize: 9.5, color: colors.warn, letterSpacing: 0.6 },
});
