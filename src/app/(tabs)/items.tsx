import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Chip, Empty, IconBtn, Row, SearchBar, T, tap } from '@/components/ui';
import { getBusiness, listItems } from '@/db/repo';
import { money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export default function Items() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), items: await listItems(db, q) }), [q]);
  const cur = data?.biz.currency ?? '₹';
  const all = data?.items ?? [];
  const goods = all.filter((i) => !i.is_service);
  const stockValue = goods.reduce((s, i) => s + Math.max(0, i.stock) * i.purchase_price, 0);
  const lowCount = goods.filter((i) => i.stock <= i.min_stock).length;
  const list = low ? goods.filter((i) => i.stock <= i.min_stock) : all;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        data={list}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 6 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <T v="title">Items</T>
              <IconBtn name="add" onPress={() => router.push('/item/new')} bg={colors.ink} color={colors.onInk} size={20} />
            </Row>
            <Row gap={10}>
              <View style={styles.sum}>
                <T v="eyebrow">Stock value</T>
                <T v="h2" style={{ marginTop: 4 }}>{money(stockValue, cur, 0)}</T>
              </View>
              <View style={styles.sum}>
                <T v="eyebrow">Items</T>
                <T v="h2" style={{ marginTop: 4 }}>{all.length}</T>
              </View>
              <Pressable style={[styles.sum, lowCount > 0 && { backgroundColor: colors.warnSoft }]} onPress={() => setLow(!low)}>
                <T v="eyebrow" style={{ color: lowCount ? colors.warn : colors.accent }}>Low stock</T>
                <T v="h2" style={{ marginTop: 4, color: lowCount ? colors.warn : colors.text }}>{lowCount}</T>
              </Pressable>
            </Row>
            <View style={{ marginTop: 14 }}>
              <SearchBar value={q} onChangeText={setQ} placeholder="Search item, HSN or category" />
            </View>
            <Row style={{ paddingVertical: 12 }}>
              <Chip label="All items" active={!low} onPress={() => setLow(false)} />
              <Chip label="Low stock" icon="alert-circle-outline" active={low} onPress={() => setLow(true)} />
            </Row>
          </View>
        }
        ListEmptyComponent={
          data ? (
            <Empty
              icon="cube-outline"
              title={low ? 'Stock looks healthy' : 'No items yet'}
              body={low ? 'Nothing is below its minimum level.' : 'Add products or services to bill them in a tap.'}
              action={!low ? <Button title="Add item" icon="add" onPress={() => router.push('/item/new')} /> : undefined}
            />
          ) : undefined
        }
        renderItem={({ item: i }) => {
          const isLow = !i.is_service && i.stock <= i.min_stock;
          return (
            <Pressable
              onPress={() => {
                tap();
                router.push(`/item/${i.id}`);
              }}
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h3" numberOfLines={1} style={{ flex: 1 }}>{i.name}</T>
                {i.category ? <Badge label={i.category} /> : null}
              </Row>
              <Row style={{ marginTop: 12 }} gap={0}>
                <View style={{ flex: 1 }}>
                  <T v="small" style={styles.k}>Sale price</T>
                  <T v="h3" style={styles.v}>{money(i.sale_price, cur)}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="small" style={styles.k}>Purchase</T>
                  <T v="h3" style={styles.v}>{money(i.purchase_price, cur)}</T>
                </View>
                <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                  <T v="small" style={styles.k}>{i.is_service ? 'Type' : 'In stock'}</T>
                  <T v="h3" style={[styles.v, isLow && { color: colors.danger }]}>
                    {i.is_service ? 'Service' : `${Number.isInteger(i.stock) ? i.stock : i.stock.toFixed(2)} ${i.unit}`}
                  </T>
                </View>
              </Row>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sum: { flex: 1, borderRadius: radius.l, padding: 14, backgroundColor: colors.paperRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.l,
    padding: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  k: { fontSize: 11, fontFamily: fonts.medium },
  v: { fontFamily: fonts.semibold, fontSize: 14.5, marginTop: 1 },
});
