import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { FabPill } from '@/components/kit';
import { Button, Chip, Field, Row, Sheet, success, tap } from '@/components/ui';
import { addExpense, deleteExpense, getBusiness, listExpenses } from '@/db/repo';
import type { Expense } from '@/db/types';
import { dateLabel, money, num, todayISO } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

const CATS = ['Shop Rent', 'Salary', 'Electricity', 'Petrol', 'Tea', 'Transport', 'Packaging', 'Marketing', 'Repairs', 'Manufacturing Expense', 'Other'];
type Tab = 'cat' | 'items';

export default function Expenses() {
  const params = useLocalSearchParams<{ add?: string; tab?: string }>();
  const { data, db, reload } = useData(async (db) => ({ biz: await getBusiness(db), list: await listExpenses(db) }));
  const [tab, setTab] = useState<Tab>(params.tab === 'items' ? 'items' : 'cat');
  const [open, setOpen] = useState(!!params.add);
  const [cat, setCat] = useState(CATS[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const cur = data?.biz.currency ?? '₹';
  const list = data?.list ?? [];
  const total = list.reduce((s, e) => s + e.amount, 0);
  const byCat = Object.values(
    list.reduce<Record<string, { category: string; total: number }>>((acc, e) => {
      (acc[e.category] ??= { category: e.category, total: 0 }).total += e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);

  const save = async () => {
    if (num(amount) <= 0) return Alert.alert('Amount', 'Enter an amount greater than zero.');
    await addExpense(db, { category: cat, amount: num(amount), date: todayISO(), note: note.trim() });
    success();
    setOpen(false);
    setAmount('');
    setNote('');
    reload();
  };

  const remove = (e: Expense) =>
    Alert.alert('Delete expense?', `${e.category} · ${money(e.amount, cur)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(db, e.id); reload(); } },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={styles.tabs}>
        {(['cat', 'items'] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => { tap(); setTab(t); }}>
            <Text style={[styles.tabText, tab === t && { color: colors.accent, fontFamily: fonts.semibold }]}>{t === 'cat' ? 'Categories' : 'Items'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total: </Text>
        <Text style={styles.totalVal}>{money(total, cur)}</Text>
      </View>
      {tab === 'cat' ? (
        <FlatList
          data={byCat}
          keyExtractor={(c) => c.category}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => { setCat(item.category); setOpen(true); }}>
              <Text style={styles.label}>{item.category}</Text>
              <Text style={styles.amt}>{money(item.total, cur)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No expenses yet. Track rent, salaries and bills to see your real profit.</Text>}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => remove(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{item.category}</Text>
                <Text style={styles.sub}>{dateLabel(item.date)}{item.note ? ` · ${item.note}` : ''}</Text>
              </View>
              <Text style={[styles.amt, { color: colors.danger }]}>{money(item.amount, cur)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No expenses yet.</Text>}
        />
      )}
      <FabPill label="Add Expenses" icon="add-circle" onPress={() => setOpen(true)} bottom={30} />

      <Sheet visible={open} onClose={() => setOpen(false)} title="New expense">
        <Row style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {CATS.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </Row>
        <Field label="Amount" prefix={cur} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
        <Button title="Save expense" icon="checkmark" onPress={save} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.accent },
  tabText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 14, paddingVertical: 12 },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text },
  totalVal: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  label: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint, marginTop: 2 },
  amt: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
});
