import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddTxnSheet } from '@/components/AddTxnSheet';
import { TxnCard } from '@/components/kit';
import { Empty, IconBtn, Row, tap } from '@/components/ui';
import { deleteParty, deletePayment, getBusiness, getInvoice, getParty, listInvoices, partyLedger } from '@/db/repo';
import type { Invoice } from '@/db/types';
import { dateLabel, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { printInvoice, savePdf, sharePdf } from '@/lib/pdf';
import { colors, fonts } from '@/lib/theme';
import { statementHtml } from '@/templates/statement';

type Entry = { kind: 'inv'; date: string; inv: Invoice } | { kind: 'pay'; date: string; id: number; direction: 'in' | 'out'; amount: number; mode: string };

export default function PartyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [addOpen, setAddOpen] = useState(false);
  const { data, db, reload } = useData(
    async (db) => ({
      biz: await getBusiness(db),
      party: await getParty(db, Number(id)),
      invoices: await listInvoices(db, { partyId: Number(id) }),
      ledger: await partyLedger(db, Number(id)),
    }),
    [id],
  );
  if (!data?.party) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  const { biz, party } = data;
  const cur = biz.currency;
  const supplier = party.kind === 'supplier';

  const entries: Entry[] = [
    ...data.invoices.map((inv) => ({ kind: 'inv' as const, date: inv.date, inv })),
    ...data.ledger.flatMap((r) => (r.kind === 'payment' ? [{ kind: 'pay' as const, date: r.date, id: r.id, direction: r.direction, amount: r.amount, mode: r.mode }] : [])),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const statement = async () => {
    try {
      const uri = await savePdf(statementHtml(biz, party, data.ledger), `Statement_${party.name}`, { width: 595, height: 842 });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      Alert.alert('Could not create statement', String(e?.message ?? e));
    }
  };

  const remind = () => {
    if (!party.phone) return Alert.alert('No phone number', 'Add a phone number to send reminders.');
    const digits = party.phone.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const text = `Hello ${party.name}, a friendly reminder from ${biz.name}: your pending balance is ${money(party.balance, cur)}.${biz.upi ? ` UPI: ${biz.upi}` : ''} Thank you!`;
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
  };

  const more = () => {
    const del = () =>
      Alert.alert(`Delete ${party.name}?`, 'Payments for this party are deleted. Invoices stay but are unlinked. This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await deleteParty(db, party.id); router.back(); } },
      ]);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Send Statement', 'Delete Party', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 }, (i) => {
        if (i === 0) statement();
        if (i === 1) del();
      });
    } else {
      Alert.alert(party.name, undefined, [{ text: 'Send Statement', onPress: statement }, { text: 'Delete Party', style: 'destructive', onPress: del }, { text: 'Cancel', style: 'cancel' }]);
    }
  };

  const withFull = async (inv: Invoice, share: boolean) => {
    try {
      const full = await getInvoice(db, inv.id);
      if (!full) return;
      if (share) await sharePdf(biz, full);
      else await printInvoice(biz, full);
    } catch {
      /* cancelled */
    }
  };

  const hasBal = Math.abs(party.balance) > 0.004;
  const balLabel = party.balance > 0.004 ? "You'll Get" : party.balance < -0.004 ? "You'll Give" : 'Balance Clear';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Row gap={2}>
              <IconBtn name="create-outline" onPress={() => router.push(`/party/new?id=${party.id}`)} />
              <IconBtn name="ellipsis-vertical" onPress={more} />
            </Row>
          ),
        }}
      />
      <FlatList
        data={entries}
        keyExtractor={(e) => (e.kind === 'inv' ? `i${e.inv.id}` : `p${e.id}`)}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{party.name}</Text>
                {party.phone ? (
                  <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }} onPress={() => Linking.openURL(`tel:${party.phone}`)}>
                    <Text style={styles.muted}>{party.phone}</Text>
                    <Ionicons name="call-outline" size={14} color={colors.accent} />
                  </Pressable>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.balText, party.balance > 0.004 && { color: colors.success }, party.balance < -0.004 && { color: colors.danger }]}>
                  {balLabel}: {money(Math.abs(party.balance), cur)}
                </Text>
                <Text style={styles.muted}>No Credit Limit Set</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.action} disabled={!hasBal} onPress={() => { tap(); remind(); }}>
                <Ionicons name="notifications-outline" size={17} color={hasBal ? colors.accent : colors.textFaint} />
                <Text style={[styles.actionText, !hasBal && { color: colors.textFaint }]}>Send Reminder</Text>
              </Pressable>
              <View style={styles.vr} />
              <Pressable style={styles.action} onPress={() => { tap(); statement(); }}>
                <Ionicons name="document-text-outline" size={17} color={colors.accent} />
                <Text style={styles.actionText}>Send Statement</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'inv' ? (
            <TxnCard inv={item.inv} currency={cur} onPrint={() => withFull(item.inv, false)} onShare={() => withFull(item.inv, true)} />
          ) : (
            <Pressable
              style={styles.pay}
              onPress={() =>
                Alert.alert('Delete payment?', `${money(item.amount, cur)} on ${dateLabel(item.date)}`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deletePayment(db, item.id); reload(); } },
                ])
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>{item.direction === 'in' ? 'Payment-In' : 'Payment-Out'}</Text>
                <Text style={styles.muted}>{dateLabel(item.date)} · {item.mode}</Text>
              </View>
              <Text style={[styles.payAmt, { color: item.direction === 'in' ? colors.success : colors.danger }]}>{money(item.amount, cur)}</Text>
            </Pressable>
          )
        }
        ListEmptyComponent={<Empty icon="time-outline" title="No transactions yet" body="Sales, purchases and payments for this party show here." />}
      />
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={() => { tap(); router.push(`/payment?direction=${supplier ? 'out' : 'in'}&partyId=${party.id}`); }}>
          <Text style={styles.btnText}>{supplier ? 'Make Payment' : 'Take Payment'}</Text>
        </Pressable>
        <Pressable style={styles.plus} onPress={() => { tap(); setAddOpen(true); }}>
          <Ionicons name="add" size={26} color={colors.accent} />
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: colors.ink }]} onPress={() => { tap(); router.push(`/invoice/new?type=${supplier ? 'purchase' : 'sale'}&partyId=${party.id}`); }}>
          <Text style={styles.btnText}>{supplier ? 'Add Purchase' : 'Add Sale'}</Text>
        </Pressable>
      </View>
      <AddTxnSheet visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, marginHorizontal: 8, marginTop: 8, borderRadius: 6, padding: 14, paddingBottom: 0 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  muted: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  balText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 14 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.accent },
  vr: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: colors.lineStrong },
  pay: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 8, marginTop: 8, borderRadius: 8, padding: 14 },
  payTitle: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  payAmt: { fontFamily: fonts.semibold, fontSize: 14.5 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 10 },
  btn: { flex: 1, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.semibold, fontSize: 14.5, color: '#fff' },
  plus: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
