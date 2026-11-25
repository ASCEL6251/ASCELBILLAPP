import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '@/components/ui';
import { getBusiness, listItems } from '@/db/repo';
import { money } from '@/lib/format';
import { exportItemsCsv } from '@/lib/csv';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

export default function ExportItems() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const insets = useSafeAreaInsets();
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), items: await listItems(db) }));
  const cur = data?.biz.currency ?? '₹';
  const run = async () => {
    tap();
    try {
      await exportItemsCsv(data?.items ?? []);
    } catch (e: any) {
      Alert.alert('Export failed', String(e?.message ?? e));
    }
  };
  const Pair = ({ l, r }: { l: [string, string]; r: [string, string] }) => (
    <View style={styles.pair}>
      <View><Text style={styles.k}>{l[0]}</Text><Text style={styles.v}>{l[1]}</Text></View>
      <View style={{ alignItems: 'flex-end' }}><Text style={styles.k}>{r[0]}</Text><Text style={styles.v}>{r[1]}</Text></View>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen options={{ title: view ? 'Item Details' : 'Export Items' }} />
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: view ? 30 : 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.pair}>
              <View><Text style={styles.title}>Item Name:</Text><Text style={styles.k}>Item Code</Text></View>
              <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
                <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.k}>{item.hsn || 'N/A'}</Text>
              </View>
            </View>
            <Pair l={['Sale Price', money(item.sale_price, cur)]} r={['Purchase Price', money(item.purchase_price, cur)]} />
            <Pair l={['Current Stock Quantity', item.stock.toFixed(1)]} r={['Minimum Stock Quantity', item.min_stock.toFixed(1)]} />
            <Pair l={['Tax Rate', `GST@${item.tax_rate}%`]} r={['Unit', item.unit]} />
            <Pair l={['Item Category', item.category || '—']} r={['Type', item.is_service ? 'Service' : 'Product']} />
          </View>
        )}
        ListEmptyComponent={data ? <Text style={[styles.k, { textAlign: 'center', marginTop: 40 }]}>No items to export.</Text> : undefined}
      />
      {!view ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom }]}>
          <Pressable style={[styles.btn, { backgroundColor: colors.card }]} onPress={run}>
            <Text style={[styles.btnText, { color: colors.ink }]}>EXPORT TO FILE</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={run}>
            <Text style={[styles.btnText, { color: '#fff' }]}>SHARE CSV</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, marginHorizontal: 8, marginTop: 8, padding: 14, gap: 12 },
  pair: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  k: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  v: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, marginTop: 2 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: colors.card },
  btn: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.semibold, fontSize: 13.5, letterSpacing: 0.4 },
});
