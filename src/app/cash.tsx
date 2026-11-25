import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '@/components/ui';
import { cashLedger, dashboardStats, getBusiness } from '@/db/repo';
import { dateLong, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

export default function CashInHand() {
  const insets = useSafeAreaInsets();
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), s: await dashboardStats(db), rows: await cashLedger(db) }));
  const cur = data?.biz.currency ?? '₹';
  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <FlatList
        data={data?.rows ?? []}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            <View style={styles.balance}>
              <Text style={styles.balLabel}>Current Cash Balance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.balVal}>{money(data?.s.cashIn ?? 0, cur)}</Text>
                <Ionicons name="cash-outline" size={22} color={colors.success} />
              </View>
            </View>
            <View style={styles.head}>
              <Text style={styles.headText}>Transaction Details</Text>
              <Text style={styles.headText}>Amount</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
              <Text style={styles.date}>{dateLong(item.date)}</Text>
            </View>
            <Text style={[styles.amt, { color: item.amount >= 0 ? colors.success : colors.danger }]}>{money(Math.abs(item.amount), cur)}</Text>
          </View>
        )}
        ListEmptyComponent={data ? <Text style={styles.empty}>No cash transactions yet.</Text> : undefined}
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => { tap(); router.push('/payment?direction=out'); }}>
          <Text style={[styles.btnText, { color: colors.ink }]}>Pay Out</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: colors.ink }]} onPress={() => { tap(); router.push('/payment?direction=in'); }}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Add Cash</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: { margin: 12, padding: 14, borderRadius: 8, backgroundColor: colors.successSoft },
  balLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  balVal: { fontFamily: fonts.bold, fontSize: 22, color: colors.success, marginTop: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  headText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  date: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint, marginTop: 3 },
  amt: { fontFamily: fonts.semibold, fontSize: 14.5, fontVariant: ['tabular-nums'] },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 14, paddingHorizontal: 30, paddingTop: 12, justifyContent: 'center' },
  btn: { flex: 1, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1.5, borderColor: colors.ink, backgroundColor: '#fff' },
  btnText: { fontFamily: fonts.semibold, fontSize: 14.5 },
});
