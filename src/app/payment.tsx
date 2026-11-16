import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Avatar, Button, Card, Chip, Field, Row, Screen, SearchBar, Sheet, T, tap, success } from '@/components/ui';
import { addPayment, getBusiness, getParty, listParties } from '@/db/repo';
import type { PartyWithBalance } from '@/db/types';
import { addDays, dateLong, money, num, todayISO } from '@/lib/format';
import { colors } from '@/lib/theme';

const MODES = ['Cash', 'UPI', 'Card', 'Bank', 'Cheque'];

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ direction?: 'in' | 'out'; partyId?: string }>();
  const db = useSQLiteContext();
  const direction = params.direction === 'out' ? 'out' : 'in';
  const [party, setParty] = useState<PartyWithBalance | null>(null);
  const [cur, setCur] = useState('₹');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [date, setDate] = useState(todayISO());
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState('');
  const [list, setList] = useState<PartyWithBalance[]>([]);

  useEffect(() => {
    getBusiness(db).then((b) => setCur(b.currency));
    if (params.partyId) getParty(db, Number(params.partyId)).then((p) => p && setParty(p));
  }, [db, params.partyId]);
  useEffect(() => {
    if (picker) listParties(db, q).then(setList);
  }, [picker, q, db]);

  const save = async () => {
    if (!party) return Alert.alert('Choose a party', 'Select who this payment is for.');
    if (num(amount) <= 0) return Alert.alert('Amount', 'Enter an amount greater than zero.');
    await addPayment(db, { party_id: party.id, direction, amount: num(amount), date, mode, reference: ref.trim(), note: note.trim() });
    success();
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: direction === 'in' ? 'Payment In' : 'Payment Out' }} />
      <Screen footer={<Button title="Save payment" icon="checkmark" onPress={save} style={{ flex: 1 }} />}>
        <Card onPress={() => setPicker(true)}>
          {party ? (
            <Row gap={12}>
              <Avatar name={party.name} />
              <View style={{ flex: 1 }}>
                <T v="h3">{party.name}</T>
                <T v="small" style={{ fontSize: 12, color: party.balance > 0 ? colors.success : party.balance < 0 ? colors.danger : colors.textMuted }}>
                  {party.balance > 0.004 ? `Owes you ${money(party.balance, cur)}` : party.balance < -0.004 ? `You owe ${money(-party.balance, cur)}` : 'Settled'}
                </T>
              </View>
              <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
            </Row>
          ) : (
            <Row gap={12}>
              <Ionicons name="person-circle-outline" size={36} color={colors.accent} />
              <T v="h3" style={{ flex: 1 }}>Choose party</T>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Row>
          )}
        </Card>

        <View style={{ alignItems: 'center', marginVertical: 26 }}>
          <T v="eyebrow">{direction === 'in' ? 'Amount received' : 'Amount paid'}</T>
          <Row gap={4} style={{ marginTop: 8 }}>
            <T v="display" style={{ color: colors.textMuted }}>{cur}</T>
            <Field label="" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" autoFocus
              containerStyle={{ marginBottom: 0, minWidth: 160 }} style={{ fontSize: 34, fontFamily: 'InterTight_700Bold' }} />
          </Row>
          {party && direction === 'in' && party.balance > 0 ? (
            <Pressable onPress={() => { tap(); setAmount(String(party.balance)); }} style={{ marginTop: 10 }}>
              <T v="label" style={{ color: colors.accent }}>Full balance {money(party.balance, cur)}</T>
            </Pressable>
          ) : null}
        </View>

        <Row style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {MODES.map((m) => <Chip key={m} label={m} active={mode === m} onPress={() => setMode(m)} />)}
        </Row>
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable hitSlop={8} onPress={() => setDate(addDays(date, -1))}><Ionicons name="chevron-back" size={18} color={colors.accent} /></Pressable>
            <T v="h3">{dateLong(date)}</T>
            <Pressable hitSlop={8} onPress={() => setDate(addDays(date, 1))}><Ionicons name="chevron-forward" size={18} color={colors.accent} /></Pressable>
          </Row>
        </Card>
        <Field label="Reference / UTR" value={ref} onChangeText={setRef} placeholder="Optional" />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
      </Screen>

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Choose party">
        <SearchBar value={q} onChangeText={setQ} placeholder="Search parties" />
        <FlatList
          style={{ marginTop: 8, maxHeight: 420 }}
          data={list}
          keyExtractor={(p) => String(p.id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<T v="small" style={{ padding: 16 }}>No parties yet — add one from the Parties tab.</T>}
          renderItem={({ item: p }) => (
            <Pressable onPress={() => { tap(); setParty(p); setPicker(false); }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12 }, pressed && { backgroundColor: colors.paperSunk }]}>
              <Avatar name={p.name} size={36} />
              <T v="h3" style={{ flex: 1 }}>{p.name}</T>
              <T v="small" style={{ color: p.balance > 0 ? colors.success : p.balance < 0 ? colors.danger : colors.textMuted }}>{money(Math.abs(p.balance), cur, 0)}</T>
            </Pressable>
          )}
        />
      </Sheet>
    </>
  );
}
