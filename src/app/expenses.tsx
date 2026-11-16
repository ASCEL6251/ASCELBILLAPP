import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, Chip, Empty, Field, Row, Screen, Sheet, T, success } from '@/components/ui';
import { addExpense, deleteExpense, getBusiness, listExpenses } from '@/db/repo';
import { dateLabel, money, num, todayISO } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

const CATS = ['Shop Rent', 'Salary', 'Electricity', 'Transport', 'Packaging', 'Marketing', 'Repairs', 'Other'];

export default function Expenses() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const { data, db, reload } = useData(async (db) => ({ biz: await getBusiness(db), list: await listExpenses(db) }));
  const [open, setOpen] = useState(!!add);
  const [cat, setCat] = useState(CATS[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const cur = data?.biz.currency ?? '₹';
  const month = todayISO().slice(0, 7);
  const list = data?.list ?? [];
  const monthTotal = list.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);

  const save = async () => {
    if (num(amount) <= 0) return Alert.alert('Amount', 'Enter an amount greater than zero.');
    await addExpense(db, { category: cat, amount: num(amount), date: todayISO(), note: note.trim() });
    success();
    setOpen(false);
    setAmount('');
    setNote('');
    reload();
  };

  return (
    <>
      <Screen footer={<Button title="Add expense" icon="add" onPress={() => setOpen(true)} style={{ flex: 1 }} />}>
        <Card dark>
          <T v="eyebrow" style={{ color: colors.tint }}>This month</T>
          <T v="display" style={{ color: colors.onInk, marginTop: 6 }}>{money(monthTotal, cur)}</T>
        </Card>
        <T v="eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>History</T>
        {list.length === 0 ? (
          <Empty icon="wallet-outline" title="No expenses yet" body="Track rent, salaries and bills to see your real profit." />
        ) : (
          list.map((e) => (
            <Card
              key={e.id}
              style={{ marginBottom: 8, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              onPress={() =>
                Alert.alert('Delete expense?', `${e.category} · ${money(e.amount, cur)}`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(db, e.id); reload(); } },
                ])
              }
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="wallet-outline" size={18} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="h3">{e.category}</T>
                <T v="small" style={{ fontSize: 12 }}>{dateLabel(e.date)}{e.note ? ` · ${e.note}` : ''}</T>
              </View>
              <T v="h3" style={{ fontFamily: fonts.bold }}>{money(e.amount, cur)}</T>
            </Card>
          ))
        )}
      </Screen>
      <Sheet visible={open} onClose={() => setOpen(false)} title="New expense">
        <Row style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {CATS.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
        </Row>
        <Field label="Amount" prefix={cur} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
        <Button title="Save expense" icon="checkmark" onPress={save} />
      </Sheet>
    </>
  );
}
