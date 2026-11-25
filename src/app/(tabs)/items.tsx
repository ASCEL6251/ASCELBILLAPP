import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Glyph } from '@/components/Glyph';
import { AppHeader, FabPill, IconTile, QuickLinks, SectionTitle, Stat, TinyIcon } from '@/components/kit';
import { Empty, tap } from '@/components/ui';
import { getBusiness, listItems } from '@/db/repo';
import type { Item } from '@/db/types';
import { money, moneyShort } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

type Filter = 'all' | 'goods' | 'service' | 'low';

export default function Items() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), items: await listItems(db) }));
  const cur = data?.biz.currency ?? '₹';

  const summary = useMemo(() => {
    const items = data?.items ?? [];
    let value = 0;
    let low = 0;
    for (const i of items) {
      if (i.is_service) continue;
      if (i.stock > 0) value += i.stock * i.purchase_price;
      if (i.stock <= i.min_stock) low++;
    }
    return { count: items.length, value, low };
  }, [data?.items]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.items ?? []).filter((i) => {
      if (needle && !i.name.toLowerCase().includes(needle) && !(i.category ?? '').toLowerCase().includes(needle)) return false;
      if (filter === 'goods') return !i.is_service;
      if (filter === 'service') return !!i.is_service;
      if (filter === 'low') return !i.is_service && i.stock <= i.min_stock;
      return true;
    });
  }, [data?.items, q, filter]);

  const share = (i: Item) =>
    Share.share({
      message: `${i.name}${i.category ? ` (${i.category})` : ''}\nPrice: ${money(i.sale_price, cur)}${i.tax_rate ? ` + GST ${i.tax_rate}%` : ''}\n— ${data?.biz.name ?? ''}`,
    });

  const header = (
    <View>
      <View style={styles.sumRow}>
        <SumCard label="Items" value={String(summary.count)} tone={colors.accent} icon="items" />
        <SumCard label="Stock value" value={moneyShort(summary.value, cur)} tone={colors.success} icon="layers" onPress={() => router.push('/stock-summary')} />
        <SumCard label="Low stock" value={String(summary.low)} tone={summary.low ? colors.danger : colors.textFaint} icon="alert" onPress={() => setFilter('low')} />
      </View>
      <QuickLinks
        style={{ marginTop: 2 }}
        links={[
          { icon: 'store', label: 'Online Store', onPress: () => router.push('/feature?key=store'), tone: '#8D7FE0' },
          { icon: 'layers', label: 'Stock Summary', onPress: () => router.push('/stock-summary'), tone: colors.success },
          { icon: 'importIn', label: 'Import Items', onPress: () => router.push('/import-items') },
          { icon: 'exportOut', label: 'Export Items', onPress: () => router.push('/export-items') },
          { icon: 'trend', label: 'Item wise PnL', onPress: () => router.push('/report?tab=item'), tone: colors.success },
          { icon: 'alert', label: 'Low Stock', onPress: () => router.push('/stock-summary?low=1'), tone: colors.danger },
          { icon: 'info', label: 'Item Details', onPress: () => router.push('/export-items?view=1') },
          { icon: 'fields', label: 'Extra Fields', onPress: () => router.push('/prefs?group=item'), tone: colors.gold },
          { icon: 'sliders', label: 'Item Settings', onPress: () => router.push('/prefs?group=item'), tone: colors.warn },
        ]}
      />
      <View style={styles.search}>
        <Glyph name="search" size={19} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search items or categories"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {q ? (
          <Pressable hitSlop={10} onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.chips}>
        {(['all', 'goods', 'service', 'low'] as Filter[]).map((f) => (
          <Pressable key={f} onPress={() => { tap(); setFilter(f); }} style={[styles.chip, filter === f && styles.chipOn]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
              {f === 'all' ? 'All' : f === 'goods' ? 'Products' : f === 'service' ? 'Services' : 'Low stock'}
            </Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle title="Your items" action={`${list.length}`} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppHeader biz={data?.biz} />
      <FlatList
        data={list}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ItemCard item={item} cur={cur} onShare={() => share(item)} />}
        ListEmptyComponent={data ? <Empty icon="cube-outline" title={q || filter !== 'all' ? 'Nothing matches' : 'No items yet'} body="Add the products or services you sell to bill faster." /> : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
      />
      <FabPill label="New Item" onPress={() => router.push('/item/new')} />
    </View>
  );
}

function SumCard({ label, value, tone, icon, onPress }: { label: string; value: string; tone: string; icon: 'items' | 'layers' | 'alert'; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={() => { tap(); onPress?.(); }} style={({ pressed }) => [styles.sum, pressed && { opacity: 0.85 }]}>
      <Glyph name={icon} size={18} accent={tone} />
      <Text style={[styles.sumVal, { color: tone === colors.textFaint ? colors.ink : tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </Pressable>
  );
}

const ItemCard = memo(function ItemCard({ item, cur, onShare }: { item: Item; cur: string; onShare: () => void }) {
  const low = !item.is_service && item.stock <= item.min_stock;
  const margin = item.sale_price > 0 && item.purchase_price > 0 ? ((item.sale_price - item.purchase_price) / item.sale_price) * 100 : null;
  return (
    <Pressable onPress={() => { tap(); router.push(`/item/${item.id}`); }} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile name={item.is_service ? 'tools' : 'items'} tone={item.is_service ? '#8D7FE0' : colors.accent} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.category || (item.is_service ? 'Service' : 'Product')}
            {item.tax_rate ? ` · GST ${item.tax_rate}%` : ''}
            {margin !== null ? ` · ${margin.toFixed(0)}% margin` : ''}
          </Text>
        </View>
        <TinyIcon name="share" onPress={onShare} />
      </View>
      <View style={styles.stats}>
        <Stat label="Sale price" value={money(item.sale_price, cur)} style={{ flex: 1 }} />
        <Stat label="Purchase price" value={money(item.purchase_price, cur)} style={{ flex: 1 }} />
        {item.is_service ? (
          <Stat label="Type" value="Service" style={{ flex: 0.8 }} />
        ) : (
          <View style={{ flex: 0.8 }}>
            <Text style={styles.statLabel}>In stock</Text>
            <View style={[styles.stock, { backgroundColor: low ? colors.dangerSoft : colors.successSoft }]}>
              <Text style={[styles.stockText, { color: low ? colors.danger : colors.success }]}>
                {item.stock % 1 ? item.stock.toFixed(1) : item.stock} {item.unit || ''}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  sumRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 4 },
  sum: { flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 2 },
  sumVal: { fontFamily: fonts.bold, fontSize: 18, marginTop: 6, fontVariant: ['tabular-nums'] },
  sumLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, marginHorizontal: 16, paddingHorizontal: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: colors.text, paddingVertical: 0 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  chipTextOn: { color: '#fff', fontFamily: fonts.semibold },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderColor: colors.line },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint, marginTop: 3 },
  stats: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  statLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  stock: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  stockText: { fontFamily: fonts.semibold, fontSize: 13.5, fontVariant: ['tabular-nums'] },
});
