import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';
import { Badge, Button, Card, Empty, IconBtn, KV, Row, Screen, T } from '@/components/ui';
import { deleteItem, getBusiness, getItem, itemMovements } from '@/db/repo';
import { dateLabel, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';
import { docMeta } from '@/lib/docs';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, db } = useData(
    async (db) => ({ biz: await getBusiness(db), item: await getItem(db, Number(id)), moves: await itemMovements(db, Number(id)) }),
    [id],
  );
  if (!data?.item) return <Screen><T v="small">{data ? 'Item not found.' : ''}</T></Screen>;
  const { biz, item, moves } = data;
  const cur = biz.currency;
  const margin = item.sale_price && item.purchase_price ? ((item.sale_price - item.purchase_price) / item.sale_price) * 100 : null;
  const low = !item.is_service && item.stock <= item.min_stock;

  const remove = () =>
    Alert.alert(`Delete ${item.name}?`, 'Past invoices keep their lines. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem(db, item.id); router.back(); } },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Row gap={4}>
              <IconBtn name="create-outline" onPress={() => router.push(`/item/new?id=${item.id}`)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={remove} />
            </Row>
          ),
        }}
      />
      <Screen footer={<Button title="Sell this item" icon="receipt-outline" onPress={() => router.push('/invoice/new?type=sale')} style={{ flex: 1 }} />}>
        <T v="title">{item.name}</T>
        <Row style={{ marginTop: 6 }}>
          {item.category ? <Badge label={item.category} /> : null}
          {item.is_service ? <Badge label="Service" tone="accent" /> : null}
          {low ? <Badge label="Low stock" tone="danger" /> : null}
        </Row>
        <Row gap={10} style={{ marginTop: 16 }}>
          <Card dark style={{ flex: 1 }}>
            <T v="eyebrow" style={{ color: colors.tint }}>{item.is_service ? 'Type' : 'In stock'}</T>
            <T v="title" style={{ color: colors.onInk, marginTop: 4 }}>{item.is_service ? 'Service' : `${item.stock} ${item.unit}`}</T>
          </Card>
          <Card style={{ flex: 1 }}>
            <T v="eyebrow">Margin</T>
            <T v="title" style={{ marginTop: 4 }}>{margin === null ? '—' : `${margin.toFixed(0)}%`}</T>
          </Card>
        </Row>
        <Card style={{ marginTop: 12 }}>
          <KV k="Sale price" v={money(item.sale_price, cur)} />
          <KV k="Purchase price" v={money(item.purchase_price, cur)} />
          <KV k="GST" v={item.tax_rate ? `${item.tax_rate}%` : 'None'} />
          {item.hsn ? <KV k="HSN / SAC" v={item.hsn} /> : null}
          {!item.is_service ? <KV k="Stock value" v={money(Math.max(0, item.stock) * item.purchase_price, cur)} /> : null}
          {!item.is_service ? <KV k="Low stock alert" v={`${item.min_stock} ${item.unit}`} /> : null}
        </Card>
        <T v="eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>Movements</T>
        {moves.length === 0 ? (
          <Empty icon="swap-vertical-outline" title="No movements" body="Sales and purchases of this item will appear here." />
        ) : (
          moves.map((m, i) => (
            <Card key={i} onPress={() => router.push(`/invoice/${m.invoice_id}`)} style={{ marginBottom: 8, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={docMeta(m.type).stock > 0 ? 'arrow-down-circle' : docMeta(m.type).stock === 0 ? 'ellipse-outline' : 'arrow-up-circle'} size={24}
                color={docMeta(m.type).stock > 0 ? colors.success : docMeta(m.type).stock === 0 ? colors.textFaint : colors.accent} />
              <View style={{ flex: 1 }}>
                <T v="h3">{m.party_name || 'Cash'} · {m.number}</T>
                <T v="small" style={{ fontSize: 12 }}>{dateLabel(m.date)} · {docMeta(m.type).label}</T>
              </View>
              <T v="h3" style={{ fontFamily: fonts.bold }}>{docMeta(m.type).stock > 0 ? '+' : docMeta(m.type).stock < 0 ? '−' : ''}{m.qty}</T>
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}
