import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ProBadge } from '@/components/kit';
import { tap } from '@/components/ui';
import { getPrefs, setPref } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

type Pref = { key: string; label: string; help: string; def: boolean; pro?: boolean; kind?: 'switch' | 'stepper' };

const GROUPS: Record<string, { title: string; prefs: Pref[] }> = {
  item: {
    title: 'Item',
    prefs: [
      { key: 'item.barcode', label: 'Barcode scanning for items', help: 'Scan barcodes to add items while billing.', def: false },
      { key: 'item.stock', label: 'Stock maintenance', help: 'Reduce stock on sale and increase it on purchase.', def: true },
      { key: 'item.manufacturing', label: 'Manufacturing', help: 'Make finished goods from raw materials.', def: false, pro: true },
      { key: 'item.units', label: 'Item Units', help: 'Choose a unit (pcs, kg, box…) for every item.', def: true },
      { key: 'item.defaultUnit', label: 'Default Unit', help: 'Use one unit for new items by default.', def: false },
      { key: 'item.category', label: 'Item Category', help: 'Group items into categories.', def: true },
      { key: 'item.partyRate', label: 'Party wise item rate', help: 'Remember a different price for each party.', def: false, pro: true },
      { key: 'item.wholesale', label: 'Wholesale Price', help: 'Keep a separate wholesale price.', def: false, pro: true },
      { key: 'item.decimals', label: 'Quantity (Upto Decimal places)', help: 'How many decimal places quantities can have.', def: true, kind: 'stepper' },
      { key: 'item.tax', label: 'Item wise tax', help: 'Set GST on each line of a bill.', def: true },
      { key: 'item.taxOnMrp', label: 'Calculate Tax based on MRP', help: 'Work out tax from the MRP instead of the rate.', def: false },
      { key: 'item.discount', label: 'Item wise discount', help: 'Give a discount on each line of a bill.', def: true },
      { key: 'item.updatePrice', label: 'Update Sale Price from TXN', help: 'Save the last billed price as the item price.', def: false },
    ],
  },
  party: {
    title: 'Party',
    prefs: [
      { key: 'party.gstin', label: 'Party GSTIN Number', help: 'Show GSTIN on party forms and invoices.', def: true },
      { key: 'party.grouping', label: 'Party Grouping', help: 'Put parties into groups.', def: false },
      { key: 'party.shipping', label: 'Shipping Address', help: 'Keep a separate shipping address.', def: false },
      { key: 'party.reminder', label: 'Payment Reminder', help: 'Remind parties when payment is due.', def: true },
      { key: 'party.loyalty', label: 'Loyalty Points', help: 'Reward repeat customers.', def: false, pro: true },
    ],
  },
  txn: {
    title: 'Transaction',
    prefs: [
      { key: 'txn.invoiceNo', label: 'Invoice/Bill No.', help: 'Show and edit the invoice number.', def: true },
      { key: 'txn.cashDefault', label: 'Cash Sale by default', help: 'Start new sales as cash sales.', def: false },
      { key: 'txn.billingName', label: 'Billing Name of Parties', help: 'Print a separate billing name.', def: false },
      { key: 'txn.poDetails', label: 'Customer P.O. Details on Transactions', help: 'Record the customer purchase order number.', def: false },
      { key: 'txn.time', label: 'Add Time on Transactions', help: 'Store the time along with the date.', def: false },
      { key: 'txn.roundOff', label: 'Round Off Total', help: 'Round the total to the nearest rupee.', def: true },
    ],
  },
};

export default function Prefs() {
  const { group } = useLocalSearchParams<{ group?: string }>();
  const g = GROUPS[group ?? 'item'] ?? GROUPS.item;
  const { data, db, reload } = useData(getPrefs);
  const val = (p: Pref) => (data?.[p.key] !== undefined ? data[p.key] === '1' : p.def);
  const num = (p: Pref) => Number(data?.[p.key] ?? 2);
  const set = async (k: string, v: string) => { await setPref(db, k, v); reload(); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.card }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: g.title }} />
      {g.prefs.map((p) => (
        <View key={p.key} style={styles.row}>
          <Text style={styles.label}>{p.label}</Text>
          <Pressable hitSlop={8} onPress={() => Alert.alert(p.label, p.help)}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
          </Pressable>
          {p.pro ? <ProBadge /> : null}
          <View style={{ flex: 1 }} />
          {p.kind === 'stepper' ? (
            <View style={styles.stepper}>
              <Pressable hitSlop={8} onPress={() => { tap(); set(p.key, String(Math.max(0, num(p) - 1))); }}><Text style={styles.step}>−</Text></Pressable>
              <Text style={styles.stepVal}>{num(p)}</Text>
              <Pressable hitSlop={8} onPress={() => { tap(); set(p.key, String(Math.min(4, num(p) + 1))); }}><Text style={styles.step}>+</Text></Pressable>
            </View>
          ) : (
            <Switch value={val(p)} onValueChange={(v) => { tap(); set(p.key, v ? '1' : '0'); }} trackColor={{ true: colors.accent, false: colors.paperSunk }} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  label: { fontFamily: fonts.body, fontSize: 14, color: colors.text, flexShrink: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  step: { fontFamily: fonts.medium, fontSize: 20, color: colors.textMuted },
  stepVal: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.text, minWidth: 18, textAlign: 'center' },
});
