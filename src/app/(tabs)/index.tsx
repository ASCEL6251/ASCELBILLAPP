import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InvoiceCard } from '@/components/InvoiceCard';
import { MiniBars } from '@/components/MiniBars';
import { Avatar, Chip, Empty, IconBtn, IconName, Row, SearchBar, T, tap, Button } from '@/components/ui';
import { dashboardStats, getBusiness, getInvoice, listInvoices } from '@/db/repo';
import type { DocType, Invoice } from '@/db/types';
import { money, moneyShort } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { sharePdf } from '@/lib/pdf';
import { colors, fonts, radius, shadow } from '@/lib/theme';

const FILTERS: { v: DocType | 'all'; l: string }[] = [
  { v: 'all', l: 'All' },
  { v: 'sale', l: 'Sales' },
  { v: 'estimate', l: 'Estimates' },
  { v: 'purchase', l: 'Purchases' },
];

const QUICK: { icon: IconName; label: string; go: () => void }[] = [
  { icon: 'receipt-outline', label: 'Invoice', go: () => router.push('/invoice/new?type=sale') },
  { icon: 'document-text-outline', label: 'Estimate', go: () => router.push('/invoice/new?type=estimate') },
  { icon: 'cash-outline', label: 'Payment', go: () => router.push('/payment?direction=in') },
  { icon: 'stats-chart-outline', label: 'Reports', go: () => router.push('/reports') },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [q, setQ] = useState('');
  const [type, setType] = useState<DocType | 'all'>('all');
  const { data, db } = useData(
    async (db) => ({
      biz: await getBusiness(db),
      stats: await dashboardStats(db),
      invoices: await listInvoices(db, { q, type }),
    }),
    [q, type],
  );

  const share = async (inv: Invoice) => {
    try {
      const full = await getInvoice(db, inv.id);
      if (full && data) await sharePdf(data.biz, full);
    } catch (e: any) {
      Alert.alert('Could not share', String(e?.message ?? e));
    }
  };

  const biz = data?.biz;
  const s = data?.stats;
  const cur = biz?.currency ?? '₹';
  const growth = s && s.salesPrev > 0 ? ((s.salesMonth - s.salesPrev) / s.salesPrev) * 100 : null;

  const header = (
    <View>
      {/* top bar */}
      <Row style={{ justifyContent: 'space-between', paddingTop: insets.top + 6, paddingBottom: 14 }}>
        <Pressable onPress={() => router.push('/business')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {biz?.logo ? (
            <Image source={{ uri: biz.logo }} style={{ width: 40, height: 40, borderRadius: 14 }} />
          ) : (
            <Avatar name={biz?.name ?? ''} dark />
          )}
          <View style={{ flex: 1 }}>
            <T v="eyebrow">Good {greeting()}</T>
            <T v="h2" numberOfLines={1} style={{ fontSize: 17 }}>{biz?.name || 'Your Business'}</T>
          </View>
        </Pressable>
        <IconBtn name="settings-outline" onPress={() => router.push('/settings')} bg={colors.paperRaised} />
      </Row>

      {/* hero */}
      <View style={styles.hero}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="eyebrow" style={{ color: colors.tint }}>{`Sales in ${monthName()}`}</T>
          {growth !== null ? (
            <View style={[styles.growthPill, { backgroundColor: growth >= 0 ? 'rgba(127,209,174,0.16)' : 'rgba(240,163,155,0.16)' }]}>
              <Ionicons name={growth >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={growth >= 0 ? '#7FD1AE' : '#F0A39B'} />
              <T v="label" style={{ color: growth >= 0 ? '#7FD1AE' : '#F0A39B', fontSize: 12.5, fontFamily: fonts.bold }}>
                {`${Math.abs(growth).toFixed(0)}%`}
              </T>
            </View>
          ) : null}
        </Row>

        <Row style={{ alignItems: 'flex-start', marginTop: 14 }}>
          <T style={styles.heroCur}>{cur}</T>
          <T style={styles.heroAmt} numberOfLines={1} adjustsFontSizeToFit>
            {money(s?.salesMonth ?? 0, '', 0)}
          </T>
        </Row>
        <T v="small" style={{ color: colors.onInkMuted, fontSize: 13, marginTop: 2 }}>
          {growth !== null
            ? `${growth >= 0 ? 'Up' : 'Down'} from ${moneyShort(s?.salesPrev ?? 0, cur)} last month`
            : 'Your first month on Ascel Bill'}
        </T>

        <View style={{ marginTop: 18 }}>
          <MiniBars series={s?.series ?? []} width={width - 72} currency={cur} />
        </View>

        <View style={styles.heroDivider} />

        <Row gap={8}>
          <HeroStat icon="arrow-down" tone="#7FD1AE" label="You’ll get" value={moneyShort(s?.receivable ?? 0, cur)} onPress={() => router.push('/parties')} />
          <HeroStat icon="arrow-up" tone="#F0A39B" label="You’ll give" value={moneyShort(s?.payable ?? 0, cur)} onPress={() => router.push('/parties')} />
          <HeroStat icon="wallet" tone={colors.tint} label="Expenses" value={moneyShort(s?.expenseMonth ?? 0, cur)} onPress={() => router.push('/expenses')} />
        </Row>
      </View>

      {/* quick actions */}
      <Row style={{ marginTop: 16, justifyContent: 'space-between' }}>
        {QUICK.map((qa) => (
          <Pressable
            key={qa.label}
            onPress={() => {
              tap();
              qa.go();
            }}
            style={({ pressed }) => [styles.quick, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <View style={styles.quickIcon}>
              <Ionicons name={qa.icon} size={22} color={colors.ink} />
            </View>
            <T v="label" style={{ fontSize: 12, color: colors.text }}>{qa.label}</T>
          </Pressable>
        ))}
      </Row>

      {/* low stock nudge */}
      {s && s.lowStock.length > 0 ? (
        <Pressable onPress={() => router.push('/items')} style={styles.nudge}>
          <Ionicons name="alert-circle" size={18} color={colors.warn} />
          <T v="small" style={{ flex: 1, color: colors.text }}>
            {s.lowStock.length} item{s.lowStock.length > 1 ? 's are' : ' is'} running low — {s.lowStock.slice(0, 2).map((i) => i.name).join(', ')}
          </T>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <Row style={{ justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }}>
        <T v="title" style={{ fontSize: 24 }}>Transactions</T>
      </Row>
      <SearchBar value={q} onChangeText={setQ} placeholder="Search party or invoice no." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        {FILTERS.map((f) => (
          <Chip key={f.v} label={f.l} active={type === f.v} onPress={() => setType(f.v)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        data={data?.invoices ?? []}
        keyExtractor={(i) => String(i.id)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => <InvoiceCard inv={item} currency={cur} onShare={share} />}
        ListEmptyComponent={
          data ? (
            <Empty
              icon="receipt-outline"
              title={q || type !== 'all' ? 'Nothing matches' : 'No invoices yet'}
              body={q || type !== 'all' ? 'Try a different search or filter.' : 'Create your first invoice and send it on WhatsApp in under a minute.'}
              action={!q && type === 'all' ? <Button title="Create invoice" icon="add" onPress={() => router.push('/invoice/new?type=sale')} /> : undefined}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function monthName() {
  return new Date().toLocaleString('en-IN', { month: 'long' });
}

function HeroStat({ icon, tone, label, value, onPress }: { icon: IconName; tone: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.heroStat, pressed && { opacity: 0.75 }]} onPress={onPress}>
      <View style={[styles.heroStatIcon, { backgroundColor: tone + '26' }]}>
        <Ionicons name={icon} size={13} color={tone} />
      </View>
      <T style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit>{value}</T>
      <T v="small" style={{ color: colors.onInkMuted, fontSize: 11.5, marginTop: 1 }} numberOfLines={1}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.inkDeep,
    borderRadius: radius.xl,
    padding: 20,
    overflow: 'hidden',
    ...shadow.lift,
  },
  growthPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, height: 26, borderRadius: radius.pill },
  heroCur: { color: colors.onInkMuted, fontFamily: fonts.semibold, fontSize: 26, lineHeight: 34, marginTop: 6, marginRight: 4 },
  heroAmt: { color: colors.white, fontFamily: fonts.bold, fontSize: 52, lineHeight: 58, letterSpacing: -2, fontVariant: ['tabular-nums'], flexShrink: 1 },
  heroDivider: { height: 1, backgroundColor: 'rgba(148,188,227,0.12)', marginTop: 16, marginBottom: 14 },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroStatIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroStatValue: { color: colors.onInk, fontFamily: fonts.bold, fontSize: 19, letterSpacing: -0.4 },
  quick: { alignItems: 'center', gap: 7, width: '23%' },
  quickIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: colors.warnSoft,
    borderRadius: radius.m,
    padding: 12,
  },
});
