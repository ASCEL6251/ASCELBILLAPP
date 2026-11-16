import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import {
  Avatar, Badge, Button, Card, Chip, Divider, Field, KV, Row, Screen, SearchBar, Segmented, Sheet, T, tap, success,
} from '@/components/ui';
import {
  getBusiness, getInvoice, getParty, listItems, listParties, nextInvoiceNumber, saveInvoice, saveParty,
} from '@/db/repo';
import type { Business, DocType, InvoiceLine, Item, PartyWithBalance } from '@/db/types';
import { computeLine, computeTotals, isInterState } from '@/lib/calc';
import { addDays, dateLong, money, num, todayISO } from '@/lib/format';
import { colors, fonts, radius } from '@/lib/theme';

const TAX_RATES = [0, 3, 5, 12, 18, 28];
const MODES = ['Cash', 'UPI', 'Card', 'Bank', 'Cheque'];
const TITLES: Record<DocType, string> = { sale: 'Sale Invoice', estimate: 'Estimate', purchase: 'Purchase Bill' };

const blankLine = (): InvoiceLine => ({
  item_id: null, name: '', hsn: '', unit: 'pcs', qty: 1, rate: 0, discount: 0, tax_rate: 0, tax: 0, amount: 0,
});

interface PartyPick {
  id: number | null;
  name: string;
  phone: string;
  address: string;
  gstin: string;
  state: string;
  balance?: number;
}

export default function InvoiceEditor() {
  const params = useLocalSearchParams<{ type?: DocType; id?: string; partyId?: string }>();
  const db = useSQLiteContext();
  const editId = params.id ? Number(params.id) : undefined;

  const [biz, setBiz] = useState<Business | null>(null);
  const [type, setType] = useState<DocType>(params.type ?? 'sale');
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [dueDays, setDueDays] = useState(7);
  const [party, setParty] = useState<PartyPick | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [discount, setDiscount] = useState('');
  const [shipping, setShipping] = useState('');
  const [roundOff, setRoundOff] = useState(true);
  const [received, setReceived] = useState('');
  const [fullyPaid, setFullyPaid] = useState(false);
  const [mode, setMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [template, setTemplate] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);

  const [partySheet, setPartySheet] = useState(false);
  const [itemSheet, setItemSheet] = useState(false);
  const [editLine, setEditLine] = useState<{ idx: number; line: InvoiceLine } | null>(null);

  // load
  useEffect(() => {
    (async () => {
      const b = await getBusiness(db);
      setBiz(b);
      if (editId) {
        const inv = await getInvoice(db, editId);
        if (!inv) return;
        setType(inv.type);
        setNumber(inv.number);
        setDate(inv.date);
        if (inv.due_date) {
          const diff = Math.round((new Date(inv.due_date).getTime() - new Date(inv.date).getTime()) / 864e5);
          setDueDays(Math.max(0, diff));
        }
        setParty({
          id: inv.party_id, name: inv.party_name, phone: inv.party_phone, address: inv.party_address,
          gstin: inv.party_gstin, state: inv.party_state,
        });
        setLines(inv.lines);
        setDiscount(inv.discount ? String(inv.discount) : '');
        setShipping(inv.shipping ? String(inv.shipping) : '');
        setRoundOff(Math.abs(inv.round_off) > 0 || Number.isInteger(inv.total));
        setReceived(inv.received ? String(inv.received) : '');
        setFullyPaid(inv.received >= inv.total && inv.total > 0);
        setMode(inv.payment_mode || 'Cash');
        setNotes(inv.notes);
        setTerms(inv.terms);
        setTemplate(inv.template);
        setColor(inv.color);
      } else {
        setTerms(b.terms);
        setTemplate(b.template);
        setColor(b.color);
        if (params.partyId) {
          const p = await getParty(db, Number(params.partyId));
          if (p) setParty({ id: p.id, name: p.name, phone: p.phone, address: p.address, gstin: p.gstin, state: p.state, balance: p.balance });
        }
      }
    })();
  }, [db, editId, params.partyId]);

  // number follows type for new docs
  useEffect(() => {
    if (editId) return;
    nextInvoiceNumber(db, type).then(setNumber);
  }, [type, db, editId]);

  const totals = useMemo(
    () => computeTotals(lines, { discount: num(discount), shipping: num(shipping), roundOff }),
    [lines, discount, shipping, roundOff],
  );
  const receivedNum = fullyPaid ? totals.total : Math.min(num(received), totals.total);
  const cur = biz?.currency ?? '₹';
  const inter = biz && party ? isInterState(biz.state, party.state) : false;

  const save = async () => {
    if (!lines.length) return Alert.alert('Add an item', 'An invoice needs at least one item.');
    if (!number.trim()) return Alert.alert('Invoice number', 'Please enter an invoice number.');
    setSaving(true);
    try {
      let partyId = party?.id ?? null;
      if (party && !partyId && party.name.trim()) {
        partyId = await saveParty(db, { name: party.name.trim(), phone: party.phone, kind: type === 'purchase' ? 'supplier' : 'customer' });
      }
      const id = await saveInvoice(db, {
        id: editId,
        type,
        number: number.trim(),
        party_id: partyId,
        party_name: party?.name.trim() ?? '',
        party_phone: party?.phone ?? '',
        party_address: party?.address ?? '',
        party_gstin: party?.gstin ?? '',
        party_state: party?.state ?? '',
        date,
        due_date: dueDays > 0 ? addDays(date, dueDays) : '',
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        shipping: totals.shipping,
        round_off: totals.roundOff,
        total: totals.total,
        received: type === 'estimate' ? 0 : receivedNum,
        payment_mode: mode,
        notes: notes.trim(),
        terms: terms.trim(),
        template,
        color,
        lines,
      });
      success();
      if (editId) router.back();
      else router.replace(`/invoice/preview?id=${id}&fresh=1`);
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Could not save', String(e?.message ?? e));
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: editId ? `Edit ${number}` : TITLES[type] }} />
      <Screen
        footer={
          <>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <T v="small" style={{ fontSize: 11.5 }}>Total</T>
              <T v="h2" style={{ fontFamily: fonts.bold }}>{money(totals.total, cur)}</T>
            </View>
            <Button title={editId ? 'Save changes' : 'Save & design'} icon={editId ? 'checkmark' : 'color-palette-outline'} onPress={save} loading={saving} style={{ flex: 1.3 }} />
          </>
        }
      >
        {!editId ? (
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'sale', label: 'Sale' },
              { value: 'estimate', label: 'Estimate' },
              { value: 'purchase', label: 'Purchase' },
            ]}
          />
        ) : null}

        {/* number + date */}
        <Row style={{ marginTop: 14 }} gap={10}>
          <Card style={{ flex: 1, padding: 12 }}>
            <T v="small" style={styles.k}>{type === 'estimate' ? 'Estimate No.' : 'Invoice No.'}</T>
            <TextInput value={number} onChangeText={setNumber} style={styles.inlineInput} autoCapitalize="characters" />
          </Card>
          <Card style={{ flex: 1.3, padding: 12 }}>
            <T v="small" style={styles.k}>Date</T>
            <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
              <Pressable hitSlop={8} onPress={() => setDate(addDays(date, -1))}><Ionicons name="chevron-back" size={18} color={colors.accent} /></Pressable>
              <T v="h3">{dateLong(date)}</T>
              <Pressable hitSlop={8} onPress={() => setDate(addDays(date, 1))}><Ionicons name="chevron-forward" size={18} color={colors.accent} /></Pressable>
            </Row>
          </Card>
        </Row>

        {/* party */}
        <T v="eyebrow" style={styles.eyebrow}>{type === 'purchase' ? 'Supplier' : 'Bill to'}</T>
        <Card onPress={() => setPartySheet(true)} style={{ padding: 14 }}>
          {party ? (
            <Row gap={12}>
              <Avatar name={party.name} />
              <View style={{ flex: 1 }}>
                <T v="h3">{party.name}</T>
                <T v="small" style={{ fontSize: 12 }}>
                  {[party.phone, party.state].filter(Boolean).join(' · ') || 'Tap to change'}
                </T>
              </View>
              {party.balance ? (
                <Badge label={`Bal ${money(party.balance, cur, 0)}`} tone={party.balance > 0 ? 'warn' : 'success'} />
              ) : null}
              <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
            </Row>
          ) : (
            <Row gap={12}>
              <View style={styles.plus}><Ionicons name="person-add-outline" size={18} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <T v="h3">Choose party</T>
                <T v="small" style={{ fontSize: 12 }}>Or leave empty for a cash sale</T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Row>
          )}
        </Card>

        {/* items */}
        <Row style={{ justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
          <T v="eyebrow">Items · {lines.length}</T>
        </Row>
        {lines.map((l, idx) => (
          <Card key={idx} onPress={() => setEditLine({ idx, line: l })} style={{ marginBottom: 8, padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <T v="h3" numberOfLines={1}>{l.name}</T>
                <T v="small" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {`${l.qty} ${l.unit} × ${money(l.rate, cur)}`}
                  {l.discount ? ` − ${money(l.discount, cur)}` : ''}
                  {l.tax_rate ? ` · GST ${l.tax_rate}%` : ''}
                </T>
              </View>
              <T v="h3" style={{ fontFamily: fonts.bold }}>{money(l.amount, cur)}</T>
            </Row>
          </Card>
        ))}
        <Pressable onPress={() => { tap(); setItemSheet(true); }} style={styles.addItem}>
          <Ionicons name="add-circle" size={20} color={colors.accent} />
          <T v="h3" style={{ color: colors.accent }}>Add item</T>
        </Pressable>

        {/* totals */}
        {lines.length ? (
          <Card style={{ marginTop: 18 }}>
            <KV k="Sub total" v={money(totals.subtotal, cur)} />
            {totals.tax > 0 ? (
              inter ? (
                <KV k="IGST" v={money(totals.tax, cur)} />
              ) : (
                <>
                  <KV k="CGST" v={money(totals.tax / 2, cur)} />
                  <KV k="SGST" v={money(totals.tax / 2, cur)} />
                </>
              )
            ) : null}
            <Row gap={10} style={{ marginTop: 8 }}>
              <Field label="Discount" prefix={cur} value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" containerStyle={{ flex: 1, marginBottom: 0 }} placeholder="0" />
              <Field label="Shipping / other" prefix={cur} value={shipping} onChangeText={setShipping} keyboardType="decimal-pad" containerStyle={{ flex: 1, marginBottom: 0 }} placeholder="0" />
            </Row>
            <Row style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <T v="small">Round off {totals.roundOff ? `(${totals.roundOff > 0 ? '+' : ''}${totals.roundOff.toFixed(2)})` : ''}</T>
              <Switch value={roundOff} onValueChange={setRoundOff} trackColor={{ true: colors.accent }} />
            </Row>
            <Divider style={{ marginVertical: 10 }} />
            <KV k="Total" v={money(totals.total, cur)} strong />
          </Card>
        ) : null}

        {/* payment */}
        {type !== 'estimate' && lines.length ? (
          <>
            <T v="eyebrow" style={styles.eyebrow}>{type === 'purchase' ? 'Paid' : 'Received'}</T>
            <Card>
              <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <T v="h3">{type === 'purchase' ? 'Fully paid' : 'Fully received'}</T>
                <Switch value={fullyPaid} onValueChange={setFullyPaid} trackColor={{ true: colors.success }} />
              </Row>
              {!fullyPaid ? (
                <Field label="Amount" prefix={cur} value={received} onChangeText={setReceived} keyboardType="decimal-pad" placeholder="0" />
              ) : null}
              <Row style={{ flexWrap: 'wrap' }}>
                {MODES.map((m) => <Chip key={m} label={m} active={mode === m} onPress={() => setMode(m)} />)}
              </Row>
              <Divider style={{ marginVertical: 12 }} />
              <KV k="Balance due" v={money(Math.max(0, totals.total - receivedNum), cur)} color={totals.total - receivedNum > 0 ? colors.danger : colors.success} />
            </Card>
          </>
        ) : null}

        {/* due */}
        <T v="eyebrow" style={styles.eyebrow}>{type === 'estimate' ? 'Valid for' : 'Payment due'}</T>
        <Row style={{ flexWrap: 'wrap' }}>
          {[0, 7, 15, 30, 45].map((d) => (
            <Chip key={d} label={d === 0 ? 'On receipt' : `${d} days`} active={dueDays === d} onPress={() => setDueDays(d)} />
          ))}
        </Row>

        <T v="eyebrow" style={styles.eyebrow}>Notes & terms</T>
        <Field label="Note to customer" value={notes} onChangeText={setNotes} multiline placeholder="Optional" />
        <Field label="Terms & conditions" value={terms} onChangeText={setTerms} multiline />
      </Screen>

      <PartyPicker
        visible={partySheet}
        onClose={() => setPartySheet(false)}
        cur={cur}
        onPick={(p) => {
          setParty(p);
          setPartySheet(false);
        }}
      />
      <ItemPicker
        visible={itemSheet}
        type={type}
        cur={cur}
        onClose={() => setItemSheet(false)}
        onPick={(l) => {
          setItemSheet(false);
          setTimeout(() => setEditLine({ idx: -1, line: l }), 350);
        }}
      />
      <LineEditor
        state={editLine}
        cur={cur}
        onClose={() => setEditLine(null)}
        onSave={(l) => {
          if (!editLine) return;
          const c = computeLine(l);
          setLines((prev) => (editLine.idx < 0 ? [...prev, c] : prev.map((x, i) => (i === editLine.idx ? c : x))));
          setEditLine(null);
        }}
        onDelete={() => {
          if (editLine && editLine.idx >= 0) setLines((prev) => prev.filter((_, i) => i !== editLine.idx));
          setEditLine(null);
        }}
      />
    </>
  );
}

/* ---------------- Party picker ---------------- */

function PartyPicker({ visible, onClose, onPick, cur }: { visible: boolean; onClose: () => void; onPick: (p: PartyPick) => void; cur: string }) {
  const db = useSQLiteContext();
  const [q, setQ] = useState('');
  const [list, setList] = useState<PartyWithBalance[]>([]);
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (visible) listParties(db, q).then(setList);
  }, [visible, q, db]);
  const exact = list.some((p) => p.name.toLowerCase() === q.trim().toLowerCase());
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose party">
      <SearchBar value={q} onChangeText={setQ} placeholder="Search or type a new name" />
      {q.trim() && !exact ? (
        <Card style={{ marginTop: 12, padding: 12 }}>
          <T v="small" style={{ marginBottom: 8 }}>New party “{q.trim()}”</T>
          <Row gap={8}>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" keyboardType="phone-pad" placeholderTextColor={colors.textFaint} style={[styles.inlineInput, styles.miniInput]} />
            <Button small title="Add" icon="add" onPress={() => onPick({ id: null, name: q.trim(), phone, address: '', gstin: '', state: '' })} />
          </Row>
        </Card>
      ) : null}
      <FlatList
        style={{ marginTop: 8, maxHeight: 380 }}
        data={list}
        keyExtractor={(p) => String(p.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: p }) => (
          <Pressable
            onPress={() => {
              tap();
              onPick({ id: p.id, name: p.name, phone: p.phone, address: p.address, gstin: p.gstin, state: p.state, balance: p.balance });
            }}
            style={({ pressed }) => [styles.pickRow, pressed && { backgroundColor: colors.paperSunk }]}
          >
            <Avatar name={p.name} size={36} />
            <View style={{ flex: 1 }}>
              <T v="h3">{p.name}</T>
              {p.phone ? <T v="small" style={{ fontSize: 12 }}>{p.phone}</T> : null}
            </View>
            {Math.abs(p.balance) > 0.004 ? (
              <T v="small" style={{ color: p.balance > 0 ? colors.success : colors.danger, fontFamily: fonts.semibold }}>{money(Math.abs(p.balance), cur, 0)}</T>
            ) : null}
          </Pressable>
        )}
      />
    </Sheet>
  );
}

/* ---------------- Item picker ---------------- */

function ItemPicker({ visible, onClose, onPick, cur, type }: { visible: boolean; onClose: () => void; onPick: (l: InvoiceLine) => void; cur: string; type: DocType }) {
  const db = useSQLiteContext();
  const [q, setQ] = useState('');
  const [list, setList] = useState<Item[]>([]);
  useEffect(() => {
    if (visible) listItems(db, q).then(setList);
  }, [visible, q, db]);
  const fromItem = (i: Item): InvoiceLine => ({
    item_id: i.id, name: i.name, hsn: i.hsn, unit: i.unit, qty: 1,
    rate: type === 'purchase' ? i.purchase_price : i.sale_price, discount: 0, tax_rate: i.tax_rate, tax: 0, amount: 0,
  });
  return (
    <Sheet visible={visible} onClose={onClose} title="Add item">
      <SearchBar value={q} onChangeText={setQ} placeholder="Search items" />
      <Pressable
        onPress={() => onPick({ ...blankLine(), name: q.trim() })}
        style={({ pressed }) => [styles.pickRow, { marginTop: 8 }, pressed && { backgroundColor: colors.paperSunk }]}
      >
        <View style={styles.plus}><Ionicons name="create-outline" size={18} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <T v="h3">{q.trim() ? `Bill “${q.trim()}”` : 'Custom item'}</T>
          <T v="small" style={{ fontSize: 12 }}>One-off line, not saved to inventory</T>
        </View>
      </Pressable>
      <FlatList
        style={{ maxHeight: 400 }}
        data={list}
        keyExtractor={(i) => String(i.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: i }) => (
          <Pressable onPress={() => { tap(); onPick(fromItem(i)); }} style={({ pressed }) => [styles.pickRow, pressed && { backgroundColor: colors.paperSunk }]}>
            <View style={[styles.plus, { backgroundColor: colors.paperSunk }]}><Ionicons name="cube-outline" size={18} color={colors.ink} /></View>
            <View style={{ flex: 1 }}>
              <T v="h3">{i.name}</T>
              <T v="small" style={{ fontSize: 12 }}>
                {i.is_service ? 'Service' : `Stock ${i.stock} ${i.unit}`}{i.tax_rate ? ` · GST ${i.tax_rate}%` : ''}
              </T>
            </View>
            <T v="h3">{money(type === 'purchase' ? i.purchase_price : i.sale_price, cur)}</T>
          </Pressable>
        )}
      />
    </Sheet>
  );
}

/* ---------------- Line editor ---------------- */

function LineEditor({
  state, onClose, onSave, onDelete, cur,
}: {
  state: { idx: number; line: InvoiceLine } | null;
  onClose: () => void;
  onSave: (l: InvoiceLine) => void;
  onDelete: () => void;
  cur: string;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');
  const [disc, setDisc] = useState('');
  const [tax, setTax] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [hsn, setHsn] = useState('');
  // Re-seed the form whenever a different line is opened (state-during-render, no effect cascade).
  const [seeded, setSeeded] = useState(state);
  if (state !== seeded) {
    setSeeded(state);
    if (state) {
      const l = state.line;
      setName(l.name);
      setQty(String(l.qty));
      setRate(l.rate ? String(l.rate) : '');
      setDisc(l.discount ? String(l.discount) : '');
      setTax(l.tax_rate);
      setUnit(l.unit || 'pcs');
      setHsn(l.hsn);
    }
  }
  const preview = computeLine({ ...(state?.line ?? blankLine()), qty: num(qty), rate: num(rate), discount: num(disc), tax_rate: tax });
  const submit = () => {
    if (!name.trim()) return Alert.alert('Item name', 'Give this line a name.');
    if (num(qty) <= 0) return Alert.alert('Quantity', 'Quantity must be more than zero.');
    onSave({ ...(state?.line ?? blankLine()), name: name.trim(), qty: num(qty), rate: num(rate), discount: num(disc), tax_rate: tax, unit, hsn });
  };
  return (
    <Sheet visible={!!state} onClose={onClose} title={state?.idx === -1 ? 'Item details' : 'Edit item'}>
      <Field label="Item name" value={name} onChangeText={setName} autoFocus={!name} />
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <View style={styles.stepper}>
            <Pressable hitSlop={6} onPress={() => setQty(String(Math.max(1, num(qty) - 1)))} style={styles.stepBtn}><Ionicons name="remove" size={18} color={colors.ink} /></Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <T v="small" style={{ fontSize: 11 }}>Qty ({unit})</T>
              <TextInput value={qty} onChangeText={setQty} keyboardType="decimal-pad" style={[styles.inlineInput, { textAlign: 'center', marginTop: 0 }]} />
            </View>
            <Pressable hitSlop={6} onPress={() => setQty(String(num(qty) + 1))} style={styles.stepBtn}><Ionicons name="add" size={18} color={colors.ink} /></Pressable>
          </View>
        </View>
        <Field label="Rate" prefix={cur} value={rate} onChangeText={setRate} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} placeholder="0" />
      </Row>
      <Row gap={10}>
        <Field label="Discount" prefix={cur} value={disc} onChangeText={setDisc} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} placeholder="0" />
        <Field label="HSN / SAC" value={hsn} onChangeText={setHsn} containerStyle={{ flex: 1 }} placeholder="Optional" />
      </Row>
      <T v="label" style={{ marginBottom: 8 }}>GST rate</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {TAX_RATES.map((r) => <Chip key={r} label={r ? `${r}%` : 'None'} active={tax === r} onPress={() => setTax(r)} />)}
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: 16, marginBottom: 12 }}>
        <T v="small">{preview.tax ? `incl. ${money(preview.tax, cur)} GST` : 'Line total'}</T>
        <T v="title" style={{ fontSize: 24 }}>{money(preview.amount, cur)}</T>
      </Row>
      <Row gap={10}>
        {state && state.idx >= 0 ? <Button kind="danger" title="Remove" icon="trash-outline" onPress={onDelete} style={{ flex: 1 }} /> : null}
        <Button title={state?.idx === -1 ? 'Add to invoice' : 'Update'} icon="checkmark" onPress={submit} style={{ flex: 2 }} />
      </Row>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  k: { fontSize: 11.5, fontFamily: fonts.medium },
  eyebrow: { marginTop: 22, marginBottom: 10 },
  inlineInput: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, paddingVertical: 2, marginTop: 2 },
  miniInput: { flex: 1, height: 40, borderRadius: radius.m, backgroundColor: colors.paperSunk, paddingHorizontal: 12, marginTop: 0 },
  plus: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: radius.l,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.tint,
    backgroundColor: 'rgba(148,188,227,0.08)',
  },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.m },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 6,
    height: 58,
    marginBottom: 12,
  },
  stepBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.paperSunk, alignItems: 'center', justifyContent: 'center' },
});
