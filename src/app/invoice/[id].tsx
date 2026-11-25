import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { statusOf } from '@/components/InvoiceCard';
import { Badge, Button, Card, Chip, Divider, Field, IconBtn, IconName, KV, Row, Screen, Sheet, T, tap, success } from '@/components/ui';
import { convertEstimate, deleteInvoice, getBusiness, getInvoice, recordInvoicePayment } from '@/db/repo';
import { isInterState } from '@/lib/calc';
import { dateLong, money, num } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { printInvoice, sharePdf, whatsappReminder } from '@/lib/pdf';
import { colors, fonts } from '@/lib/theme';
import { getTemplate } from '@/templates';
import { docMeta } from '@/lib/docs';

const MODES = ['Cash', 'UPI', 'Card', 'Bank', 'Cheque'];

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, db, reload } = useData(async (db) => ({ biz: await getBusiness(db), inv: await getInvoice(db, Number(id)) }), [id]);
  const [paySheet, setPaySheet] = useState(false);
  const [amt, setAmt] = useState('');
  const [mode, setMode] = useState('UPI');
  const [sharing, setSharing] = useState(false);

  if (!data?.inv) return <Screen><T v="small">{data ? 'This invoice no longer exists.' : ''}</T></Screen>;
  const { biz, inv } = data;
  const cur = biz.currency;
  const bal = Math.max(0, inv.total - inv.received);
  const st = statusOf(inv);
  const inter = isInterState(biz.state, inv.party_state);
  const meta = docMeta(inv.type);
  const kind = meta.label;

  const share = async () => {
    setSharing(true);
    try {
      await sharePdf(biz, inv);
    } catch (e: any) {
      Alert.alert('Could not share', String(e?.message ?? e));
    } finally {
      setSharing(false);
    }
  };

  const remove = () =>
    Alert.alert(`Delete ${inv.number}?`, 'The invoice is removed permanently and stock is restored. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteInvoice(db, inv.id);
          router.back();
        },
      },
    ]);

  const convert = async () => {
    const newId = await convertEstimate(db, inv.id);
    if (newId) {
      success();
      router.replace(`/invoice/${newId}`);
    }
  };

  const savePayment = async () => {
    const a = Math.min(num(amt), bal);
    if (a <= 0) return Alert.alert('Amount', 'Enter an amount greater than zero.');
    await recordInvoicePayment(db, inv.id, a, mode);
    success();
    setPaySheet(false);
    setAmt('');
    reload();
  };

  const actions: { icon: IconName; label: string; onPress: () => void; hide?: boolean }[] = [
    { icon: 'color-palette-outline', label: 'Design', onPress: () => router.push(`/invoice/preview?id=${inv.id}`) },
    { icon: 'print-outline', label: 'Print', onPress: () => printInvoice(biz, inv).catch(() => {}) },
    { icon: 'logo-whatsapp', label: bal > 0 && inv.type === 'sale' ? 'Remind' : 'WhatsApp', onPress: () => whatsappReminder(biz, inv) },
    { icon: 'create-outline', label: 'Edit', onPress: () => router.push(`/invoice/new?id=${inv.id}`) },
  ];

  return (
    <>
      <Stack.Screen options={{ title: inv.number, headerRight: () => <IconBtn name="trash-outline" color={colors.danger} onPress={remove} /> }} />
      <Screen
        footer={
          <>
            {inv.type === 'estimate' || inv.type === 'sale_order' || inv.type === 'delivery_challan' ? (
              <Button kind="soft" title="Convert to sale" icon="swap-horizontal" onPress={convert} style={{ flex: 1 }} />
            ) : meta.pay && bal > 0 ? (
              <Button kind="soft" title={meta.balance < 0 ? 'Pay' : 'Take payment'} icon="cash-outline" onPress={() => { setAmt(String(bal)); setPaySheet(true); }} style={{ flex: 1 }} />
            ) : null}
            <Button title="Share PDF" icon="share-outline" onPress={share} loading={sharing} style={{ flex: 1.2 }} />
          </>
        }
      >
        {/* hero */}
        <Card dark style={{ padding: 20 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="eyebrow" style={{ color: colors.tint }}>{kind}</T>
            <Badge label={st.label} tone={st.tone} />
          </Row>
          <T v="display" style={{ color: colors.onInk, marginTop: 10 }}>{money(inv.total, cur)}</T>
          <T v="small" style={{ color: colors.onInkMuted }}>
            {inv.party_name || 'Cash sale'} · {dateLong(inv.date)}
          </T>
          {meta.pay ? (
            <View style={{ marginTop: 16 }}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${inv.total ? Math.min(100, (inv.received / inv.total) * 100) : 0}%` }]} />
              </View>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <T v="small" style={{ color: colors.onInkMuted, fontSize: 12 }}>
                  {meta.balance < 0 ? 'Paid' : 'Received'} {money(inv.received, cur)}
                </T>
                <T v="small" style={{ color: bal > 0 ? '#F0A39B' : '#7FD1AE', fontSize: 12, fontFamily: fonts.semibold }}>
                  {bal > 0 ? `Due ${money(bal, cur)}` : 'Settled'}
                </T>
              </Row>
            </View>
          ) : null}
        </Card>

        {/* actions */}
        <Row style={{ marginTop: 14, justifyContent: 'space-between' }}>
          {actions.map((a) => (
            <Pressable key={a.label} onPress={() => { tap(); a.onPress(); }} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}>
              <View style={styles.actionIcon}><Ionicons name={a.icon} size={21} color={colors.ink} /></View>
              <T v="label" style={{ fontSize: 12, color: colors.text }}>{a.label}</T>
            </Pressable>
          ))}
        </Row>

        {/* party */}
        {inv.party_id ? (
          <Card onPress={() => router.push(`/party/${inv.party_id}`)} style={{ marginTop: 16 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T v="eyebrow">{meta.side === 'purchase' ? 'Supplier' : 'Billed to'}</T>
                <T v="h3" style={{ marginTop: 4 }}>{inv.party_name}</T>
                <T v="small" style={{ fontSize: 12.5 }}>{[inv.party_phone, inv.party_state, inv.party_gstin && `GSTIN ${inv.party_gstin}`].filter(Boolean).join(' · ')}</T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Row>
          </Card>
        ) : null}

        {/* lines */}
        <Card style={{ marginTop: 12 }}>
          <T v="eyebrow" style={{ marginBottom: 6 }}>Items</T>
          {inv.lines.map((l, i) => (
            <View key={i} style={{ paddingVertical: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{l.name}</T>
                <T v="h3">{money(l.amount, cur)}</T>
              </Row>
              <T v="small" style={{ fontSize: 12 }}>
                {l.qty} {l.unit} × {money(l.rate, cur)}{l.discount ? ` − ${money(l.discount, cur)}` : ''}{l.tax_rate ? ` · GST ${l.tax_rate}%` : ''}
              </T>
            </View>
          ))}
          <Divider style={{ marginVertical: 8 }} />
          <KV k="Sub total" v={money(inv.subtotal, cur)} />
          {inv.tax > 0 ? (inter ? <KV k="IGST" v={money(inv.tax, cur)} /> : <><KV k="CGST" v={money(inv.tax / 2, cur)} /><KV k="SGST" v={money(inv.tax / 2, cur)} /></>) : null}
          {inv.discount ? <KV k="Discount" v={`− ${money(inv.discount, cur)}`} /> : null}
          {inv.shipping ? <KV k="Shipping" v={money(inv.shipping, cur)} /> : null}
          {inv.round_off ? <KV k="Round off" v={money(inv.round_off, cur)} /> : null}
          <Divider style={{ marginVertical: 8 }} />
          <KV k="Total" v={money(inv.total, cur)} strong />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <KV k="Design" v={getTemplate(inv.template || biz.template).name} />
          {inv.due_date ? <KV k={meta.pay ? 'Due date' : 'Valid till'} v={dateLong(inv.due_date)} /> : null}
          {meta.pay ? <KV k="Payment mode" v={inv.payment_mode} /> : null}
          {inv.notes ? <T v="small" style={{ marginTop: 8 }}>{inv.notes}</T> : null}
        </Card>
      </Screen>

      <Sheet visible={paySheet} onClose={() => setPaySheet(false)} title={meta.balance < 0 ? 'Record payment' : 'Take payment'}>
        <Field label="Amount" prefix={cur} value={amt} onChangeText={setAmt} keyboardType="decimal-pad" autoFocus hint={`Balance due ${money(bal, cur)}`} />
        <Row style={{ flexWrap: 'wrap', marginBottom: 16 }}>
          {MODES.map((m) => <Chip key={m} label={m} active={mode === m} onPress={() => setMode(m)} />)}
        </Row>
        <Button title="Save payment" icon="checkmark" onPress={savePayment} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: colors.inkRaised, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.tint },
  action: { alignItems: 'center', gap: 6, width: '23%' },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: colors.paperRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
});
