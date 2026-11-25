import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AddTxnSheet } from '@/components/AddTxnSheet';
import { Glyph } from '@/components/Glyph';
import { AppHeader, BalanceCard, FabPill, PillTabs, QuickLinks, SectionTitle, TxnCard } from '@/components/kit';
import { Empty, tap } from '@/components/ui';
import { deleteInvoice, getBusiness, getInvoice, listInvoices, listParties } from '@/db/repo';
import type { DocType, Invoice, PartyWithBalance } from '@/db/types';
import { DOCS, DOC_TYPES } from '@/lib/docs';
import { dateLabel, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { printInvoice, sharePdf } from '@/lib/pdf';
import { colors, fonts } from '@/lib/theme';

type Tab = 'txn' | 'party';
type PartySort = 'recent' | 'name' | 'amount';

const SHORT: Partial<Record<DocType, string>> = {
  sale: 'Sales',
  sale_return: 'Credit Notes',
  estimate: 'Estimates',
  sale_order: 'Sale Orders',
  delivery_challan: 'Challans',
  purchase: 'Purchases',
  purchase_return: 'Debit Notes',
  purchase_order: 'Purchase Orders',
};

export default function Home() {
  const [tab, setTab] = useState<Tab>('txn');
  const [q, setQ] = useState('');
  const [pq, setPq] = useState('');
  const [type, setType] = useState<DocType | 'all'>('all');
  const [sort, setSort] = useState<PartySort>('recent');
  const [addOpen, setAddOpen] = useState(false);

  const { data, db, reload } = useData(
    async (db) => ({
      biz: await getBusiness(db),
      invoices: await listInvoices(db, { q, type }),
      parties: await listParties(db, ''),
    }),
    [q, type],
  );
  const biz = data?.biz;
  const cur = biz?.currency ?? '₹';

  const totals = useMemo(() => {
    let get = 0;
    let give = 0;
    for (const p of data?.parties ?? []) {
      if (p.balance > 0) get += p.balance;
      else give -= p.balance;
    }
    return { get, give };
  }, [data?.parties]);

  const parties = useMemo(() => {
    const needle = pq.trim().toLowerCase();
    const list = needle
      ? (data?.parties ?? []).filter((p) => p.name.toLowerCase().includes(needle) || (p.phone ?? '').includes(needle))
      : data?.parties ?? [];
    return sortParties(list, sort);
  }, [data?.parties, pq, sort]);

  const withFull = useCallback(
    async (inv: Invoice, fn: (full: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) => Promise<void>) => {
      try {
        const full = await getInvoice(db, inv.id);
        if (full && biz) await fn(full);
      } catch (e: any) {
        if (!String(e?.message ?? e).toLowerCase().includes('cancel')) Alert.alert('Something went wrong', String(e?.message ?? e));
      }
    },
    [db, biz],
  );

  const moreFor = (inv: Invoice) => {
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: 'Open', run: () => router.push(`/invoice/${inv.id}`) },
      { label: 'Edit', run: () => router.push(`/invoice/new?id=${inv.id}`) },
      { label: 'Change Theme', run: () => router.push(`/invoice/preview?id=${inv.id}`) },
      {
        label: 'Delete',
        destructive: true,
        run: () =>
          Alert.alert(`Delete ${inv.number}?`, 'This removes the transaction permanently and restores stock. It cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteInvoice(db, inv.id); reload(); } },
          ]),
      },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((a) => a.label), 'Cancel'], cancelButtonIndex: actions.length, destructiveButtonIndex: 3, title: `${DOCS[inv.type].label} #${inv.number}` },
        (i) => actions[i]?.run(),
      );
    } else {
      Alert.alert(`${DOCS[inv.type].label} #${inv.number}`, undefined, [
        ...actions.map((a) => ({ text: a.label, onPress: a.run, style: a.destructive ? ('destructive' as const) : ('default' as const) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const balance = (
    <BalanceCard
      get={totals.get}
      give={totals.give}
      currency={cur}
      onGet={() => { setSort('amount'); setTab('party'); }}
      onGive={() => { setSort('amount'); setTab('party'); }}
    />
  );

  const txnHeader = (
    <View>
      {balance}
      <QuickLinks
        style={{ marginTop: 6 }}
        links={[
          { icon: 'plusDoc', label: 'Add Txn', onPress: () => setAddOpen(true) },
          { icon: 'report', label: 'Sale Report', onPress: () => router.push('/report?tab=sale'), tone: colors.success },
          { icon: 'palette', label: 'Bill Themes', onPress: () => router.push(data?.invoices[0] ? `/invoice/preview?id=${data.invoices[0].id}` : '/settings'), tone: '#8D7FE0' },
          { icon: 'sliders', label: 'Txn Settings', onPress: () => router.push('/prefs?group=txn'), tone: colors.warn },
          { icon: 'apps', label: 'Show All', onPress: () => setAddOpen(true) },
        ]}
      />
      <SearchRow value={q} onChange={setQ} placeholder="Search bills, parties or numbers" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <FilterChip label="All" on={type === 'all'} onPress={() => setType('all')} />
        {DOC_TYPES.map((t) => (
          <FilterChip key={t} label={SHORT[t] ?? DOCS[t].label} on={type === t} onPress={() => setType(t)} />
        ))}
      </ScrollView>
      <SectionTitle title={type === 'all' ? 'Recent transactions' : SHORT[type] ?? DOCS[type].label} action={data ? `${data.invoices.length} total` : undefined} />
    </View>
  );

  const partyHeader = (
    <View>
      {balance}
      <QuickLinks
        style={{ marginTop: 6 }}
        links={[
          { icon: 'userAdd', label: 'Add Party', onPress: () => router.push('/party/new') },
          { icon: 'statement', label: 'Party Statement', onPress: () => router.push('/report?tab=party'), tone: colors.success },
          { icon: 'sliders', label: 'Party Settings', onPress: () => router.push('/prefs?group=party'), tone: colors.warn },
          { icon: 'apps', label: 'All Reports', onPress: () => router.push('/reports') },
        ]}
      />
      <SearchRow value={pq} onChange={setPq} placeholder="Search by name or phone" />
      <View style={[styles.chips, { flexDirection: 'row' }]}>
        <FilterChip label="Recent" on={sort === 'recent'} onPress={() => setSort('recent')} />
        <FilterChip label="Name A–Z" on={sort === 'name'} onPress={() => setSort('name')} />
        <FilterChip label="Highest balance" on={sort === 'amount'} onPress={() => setSort('amount')} />
      </View>
      <SectionTitle title="Parties" action={`${parties.length}`} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppHeader biz={biz} />
      <PillTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'txn', label: 'Transactions' },
          { value: 'party', label: 'Parties' },
        ]}
      />
      {tab === 'txn' ? (
        <FlatList
          key="txn"
          data={data?.invoices ?? []}
          keyExtractor={(i) => String(i.id)}
          ListHeaderComponent={txnHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TxnCard
              inv={item}
              currency={cur}
              onPrint={() => withFull(item, (f) => printInvoice(biz!, f))}
              onShare={() => withFull(item, async (f) => { await sharePdf(biz!, f); })}
              onMore={() => moreFor(item)}
            />
          )}
          ListEmptyComponent={data ? (
            <Empty icon="receipt-outline" title={q || type !== 'all' ? 'Nothing matches' : 'No transactions yet'} body={q || type !== 'all' ? 'Try a different search or filter.' : 'Tap “New Sale” to create your first bill.'} />
          ) : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
        />
      ) : (
        <FlatList
          key="party"
          data={parties}
          keyExtractor={(p) => String(p.id)}
          ListHeaderComponent={partyHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => <PartyRow p={item} currency={cur} first={index === 0} last={index === parties.length - 1} />}
          ListEmptyComponent={data ? <Empty icon="people-outline" title={pq ? 'No party found' : 'No parties yet'} body="Add customers and suppliers to track what they owe." /> : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          windowSize={7}
        />
      )}

      {tab === 'txn' ? (
        <FabPill label="New Sale" onPress={() => router.push('/invoice/new?type=sale')} />
      ) : (
        <FabPill label="New Party" onPress={() => router.push('/party/new')} />
      )}

      <AddTxnSheet visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function sortParties(list: PartyWithBalance[], sort: PartySort) {
  if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'amount') return [...list].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  return list;
}

function FilterChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { if (!on) { tap(); onPress(); } }}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Glyph name="search" size={19} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.searchInput}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <Pressable hitSlop={10} onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={18} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const AVATAR_TONES = ['#5980A6', '#2F8F6B', '#B7832F', '#8D7FE0', '#C2483D', '#3E8FB0'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function PartyRow({ p, currency, first, last }: { p: PartyWithBalance; currency: string; first: boolean; last: boolean }) {
  const get = p.balance > 0.004;
  const give = p.balance < -0.004;
  const tone = AVATAR_TONES[p.id % AVATAR_TONES.length];
  return (
    <Pressable
      onPress={() => { tap(); router.push(`/party/${p.id}`); }}
      style={({ pressed }) => [
        styles.partyRow,
        first && { borderTopLeftRadius: 18, borderTopRightRadius: 18, marginTop: 10, borderTopWidth: 1 },
        last && { borderBottomLeftRadius: 18, borderBottomRightRadius: 18, borderBottomWidth: 1 },
        pressed && { backgroundColor: colors.canvas },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: tone + '1F' }]}>
        <Text style={[styles.avatarText, { color: tone }]}>{initials(p.name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.partyName} numberOfLines={1}>{p.name}</Text>
        <Text style={styles.partyDate}>
          {p.kind === 'supplier' ? 'Supplier' : 'Customer'} · {dateLabel(p.last_date ?? p.created_at.slice(0, 10))}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.partyAmt, get && { color: colors.success }, give && { color: colors.danger }]}>
          {money(Math.abs(p.balance), currency, 0)}
        </Text>
        <Text style={[styles.partyTag, get && { color: colors.success }, give && { color: colors.danger }]}>
          {get ? "You'll get" : give ? "You'll give" : 'Settled'}
        </Text>
      </View>
      {!last ? <View style={styles.partyHr} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: colors.text, paddingVertical: 0 },
  chips: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  chipTextOn: { color: '#fff', fontFamily: fonts.semibold },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
  },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 14 },
  partyName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  partyDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint, marginTop: 2 },
  partyAmt: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  partyTag: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  partyHr: { position: 'absolute', left: 68, right: 14, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
});
