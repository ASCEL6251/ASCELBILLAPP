import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Field, Row, Screen, Segmented, T, success } from '@/components/ui';
import { getParty, saveParty } from '@/db/repo';
import { num } from '@/lib/format';

export default function PartyForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const [kind, setKind] = useState<'customer' | 'supplier'>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [opening, setOpening] = useState('');
  const [dir, setDir] = useState<'get' | 'give'>('get');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getParty(db, Number(id)).then((p) => {
      if (!p) return;
      setKind(p.kind);
      setName(p.name);
      setPhone(p.phone);
      setEmail(p.email);
      setGstin(p.gstin);
      setAddress(p.address);
      setState(p.state);
      setOpening(p.opening_balance ? String(Math.abs(p.opening_balance)) : '');
      setDir(p.opening_balance < 0 ? 'give' : 'get');
    });
  }, [id, db]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Enter the party name.');
    setSaving(true);
    const pid = await saveParty(db, {
      id: id ? Number(id) : undefined,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      address: address.trim(),
      state: state.trim(),
      kind,
      opening_balance: (dir === 'give' ? -1 : 1) * num(opening),
    });
    success();
    if (id) router.back();
    else router.replace(`/party/${pid}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: id ? 'Edit party' : 'New party' }} />
      <Screen footer={<Button title={id ? 'Save changes' : 'Add party'} icon="checkmark" onPress={save} loading={saving} style={{ flex: 1 }} />}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'customer', label: 'Customer' }, { value: 'supplier', label: 'Supplier' }]} />
        <View style={{ height: 16 }} />
        <Field label="Party name" value={name} onChangeText={setName} autoFocus={!id} autoCapitalize="words" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="GSTIN" value={gstin} onChangeText={setGstin} autoCapitalize="characters" hint="Different state from yours → IGST is applied automatically." />
        <Field label="Billing address" value={address} onChangeText={setAddress} multiline />
        <Field label="State" value={state} onChangeText={setState} autoCapitalize="words" />
        <T v="eyebrow" style={{ marginTop: 10, marginBottom: 10 }}>Opening balance</T>
        <Row gap={10}>
          <Field label="Amount" prefix="₹" value={opening} onChangeText={setOpening} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} placeholder="0" />
          <View style={{ flex: 1.2, marginBottom: 12 }}>
            <Segmented value={dir} onChange={setDir} options={[{ value: 'get', label: "To get" }, { value: 'give', label: 'To give' }]} />
          </View>
        </Row>
      </Screen>
    </>
  );
}
