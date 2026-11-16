import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Badge, Button, Card, Empty, IconBtn, Row, Screen, T, tap } from '@/components/ui';
import { deleteParty, deletePayment, getBusiness, getParty, partyLedger } from '@/db/repo';
import { dateLabel, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts, radius } from '@/lib/theme';
import { statementHtml } from '@/templates/statement';

export default function PartyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, db, reload } = useData(
    async (db) => ({ biz: await getBusiness(db), party: await getParty(db, Number(id)), rows: await partyLedger(db, Number(id)) }),
    [id],
  );
  if (!data?.party) return <Screen><T v="small">{data ? 'Party not found.' : ''}</T></Screen>;
  const { biz, party, rows } = data;
  const cur = biz.currency;
  const tone = party.balance > 0.004 ? colors.success : party.balance < -0.004 ? colors.danger : colors.textMuted;

  const statement = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: statementHtml(biz, party, rows), width: 595, height: 842 });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      Alert.alert('Could not create statement', String(e?.message ?? e));
    }
  };

  const remind = () => {
    const digits = party.phone.replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const text =
      party.balance > 0
        ? `Hello ${party.name}, a friendly reminder from ${biz.name}: your pending balance is ${money(party.balance, cur)}.${biz.upi ? ` UPI: ${biz.upi}` : ''} Thank you!`
        : `Hello ${party.name}, greetings from ${biz.name}!`;
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
  };

  const remove = () =>
    Alert.alert(`Delete ${party.name}?`, 'Payments for this party are deleted. Invoices stay but are unlinked. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteParty(db, party.id); router.back(); } },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Row gap={4}>
              <IconBtn name="create-outline" onPress={() => router.push(`/party/new?id=${party.id}`)} />
              <IconBtn name="trash-outline" color={colors.danger} onPress={remove} />
            </Row>
          ),
        }}
      />
      <Screen
        footer={
          <>
            <Button kind="soft" title={party.kind === 'supplier' ? 'Pay out' : 'Take payment'} icon="cash-outline" style={{ flex: 1 }}
              onPress={() => router.push(`/payment?direction=${party.kind === 'supplier' ? 'out' : 'in'}&partyId=${party.id}`)} />
            <Button title={party.kind === 'supplier' ? 'Add purchase' : 'New invoice'} icon="add" style={{ flex: 1 }}
              onPress={() => router.push(`/invoice/new?type=${party.kind === 'supplier' ? 'purchase' : 'sale'}&partyId=${party.id}`)} />
          </>
        }
      >
        <Row gap={14}>
          <Avatar name={party.name} size={58} dark />
          <View style={{ flex: 1 }}>
            <T v="title" numberOfLines={2}>{party.name}</T>
            <T v="small">{[party.kind === 'supplier' ? 'Supplier' : 'Customer', party.phone, party.state].filter(Boolean).join(' · ')}</T>
          </View>
        </Row>

        <Card style={{ marginTop: 16 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <T v="eyebrow" style={{ color: tone }}>
                {party.balance > 0.004 ? "You'll get" : party.balance < -0.004 ? "You'll give" : 'All settled'}
              </T>
              <T v="display" style={{ color: tone, fontSize: 32, marginTop: 4 }}>{money(Math.abs(party.balance), cur)}</T>
            </View>
          </Row>
          <Row style={{ marginTop: 14 }} gap={8}>
            <Pressable style={styles.pill} onPress={() => { tap(); statement(); }}>
              <Ionicons name="document-text-outline" size={16} color={colors.ink} />
              <T v="label" style={{ color: colors.ink }}>Statement</T>
            </Pressable>
            {party.phone ? (
              <>
                <Pressable style={styles.pill} onPress={() => { tap(); remind(); }}>
                  <Ionicons name="logo-whatsapp" size={16} color={colors.ink} />
                  <T v="label" style={{ color: colors.ink }}>Remind</T>
                </Pressable>
                <Pressable style={styles.pill} onPress={() => { tap(); Linking.openURL(`tel:${party.phone}`); }}>
                  <Ionicons name="call-outline" size={16} color={colors.ink} />
                  <T v="label" style={{ color: colors.ink }}>Call</T>
                </Pressable>
              </>
            ) : null}
          </Row>
        </Card>

        <T v="eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>Activity</T>
        {rows.length === 0 ? (
          <Empty icon="time-outline" title="No activity yet" body="Invoices and payments for this party will show here." />
        ) : (
          rows.map((r) =>
            r.kind === 'invoice' ? (
              <Card key={`i${r.id}`} onPress={() => router.push(`/invoice/${r.id}`)} style={styles.row}>
                <View style={[styles.ic, { backgroundColor: colors.tintSoft }]}>
                  <Ionicons name={r.type === 'purchase' ? 'cart-outline' : r.type === 'estimate' ? 'document-text-outline' : 'receipt-outline'} size={18} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="h3">{r.type === 'sale' ? 'Sale' : r.type === 'estimate' ? 'Estimate' : 'Purchase'} · {r.number}</T>
                  <T v="small" style={{ fontSize: 12 }}>{dateLabel(r.date)}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T v="h3" style={{ fontFamily: fonts.bold }}>{money(r.total, cur)}</T>
                  {r.type !== 'estimate' ? (
                    r.balance > 0 ? <Badge label={`Due ${money(r.balance, cur, 0)}`} tone="warn" /> : <Badge label="Paid" tone="success" />
                  ) : null}
                </View>
              </Card>
            ) : (
              <Card key={`p${r.id}`} style={styles.row} onPress={() =>
                Alert.alert('Delete payment?', `${money(r.amount, cur)} on ${dateLabel(r.date)}`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deletePayment(db, r.id); reload(); } },
                ])
              }>
                <View style={[styles.ic, { backgroundColor: r.direction === 'in' ? colors.successSoft : colors.dangerSoft }]}>
                  <Ionicons name={r.direction === 'in' ? 'arrow-down' : 'arrow-up'} size={18} color={r.direction === 'in' ? colors.success : colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="h3">{r.direction === 'in' ? 'Payment received' : 'Payment made'}</T>
                  <T v="small" style={{ fontSize: 12 }}>{dateLabel(r.date)} · {r.mode}</T>
                </View>
                <T v="h3" style={{ fontFamily: fonts.bold, color: r.direction === 'in' ? colors.success : colors.danger }}>{money(r.amount, cur)}</T>
              </Card>
            ),
          )
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.paperSunk },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8 },
  ic: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
