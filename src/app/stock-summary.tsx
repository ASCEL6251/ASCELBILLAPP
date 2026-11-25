import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stat } from '@/components/kit';
import { Chip } from '@/components/ui';
import { getBusiness, listItems } from '@/db/repo';
import { money, todayISO, dateLong } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

type Filter = 'all' | 'low' | 'in';

export default function StockSummary() {
  const params = useLocalSearchParams<{ low?: string }>();
  const [filter, setFilter] = useState<Filter>(params.low ? 'low' : 'all');
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), items: await listItems(db) }));
  const cur = data?.biz.currency ?? '₹';
  const goods = (data?.items ?? []).filter((i) => !i.is_service);
  const low = goods.filter((i) => i.stock <= i.min_stock);
  const list = filter === 'low' ? low : filter === 'in' ? goods.filter((i) => i.stock > 0) : goods;
  const value = goods.reduce((s, i) => s + Math.max(0, i.stock) * i.purchase_price, 0);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.canvas }}
      data={list}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.small}>Stock as on {dateLong(todayISO())}</Text>
          </View>
          <View style={styles.filters}>
            <Text style={styles.small}>Filters Applied:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Chip label="Stock - All" active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="In Stock" active={filter === 'in'} onPress={() => setFilter('in')} />
              <Chip label="Low Stock" active={filter === 'low'} onPress={() => setFilter('low')} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 8, marginTop: 8 }}>
            <View style={styles.tile}><Stat label="No. of Items" value={String(goods.length)} /></View>
            <View style={styles.tile}><Stat label="Low Stock Items" value={String(low.length)} color={low.length ? colors.danger : undefined} /></View>
            <View style={styles.tile}><Stat label="Stock Value" value={money(value, cur, 0)} /></View>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/item/${item.id}`)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.category ? <Text style={styles.cat}>{item.category.toUpperCase()}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 6 }}>
            <Text style={styles.small}>Stock Value: {money(Math.max(0, item.stock) * item.purchase_price, cur)}</Text>
            <Text style={[styles.small, item.stock <= item.min_stock && { color: colors.danger }]}>Stock Qty: {item.stock.toFixed(1)}</Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={data ? <Text style={[styles.small, { textAlign: 'center', marginTop: 40 }]}>No items match this filter.</Text> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 12 },
  filters: { backgroundColor: colors.card, paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 10 },
  small: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: 6, padding: 10 },
  card: { backgroundColor: colors.card, borderRadius: 6, marginHorizontal: 8, marginTop: 8, padding: 12 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  cat: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted, backgroundColor: colors.paper, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
});
