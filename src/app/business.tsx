import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { SignaturePad } from '@/components/SignaturePad';
import { Avatar, Button, Card, Field, Row, Screen, Segmented, T, success } from '@/components/ui';
import { getBusiness, updateBusiness } from '@/db/repo';
import type { Business } from '@/db/types';
import { colors } from '@/lib/theme';

type Tab = 'basic' | 'tax' | 'bank' | 'sign';

export default function BusinessProfile() {
  const db = useSQLiteContext();
  const [b, setB] = useState<Business | null>(null);
  const [tab, setTab] = useState<Tab>('basic');
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    getBusiness(db).then(setB);
  }, [db]);
  if (!b) return <Screen><View /></Screen>;
  const set = (k: keyof Business) => (v: string) => setB({ ...b, [k]: v });

  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    const a = res.assets[0];
    setB({ ...b, logo: `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` });
  };

  const save = async () => {
    if (!b.name.trim()) return Alert.alert('Business name', 'Your business needs a name.');
    setSaving(true);
    const { id, ...rest } = b;
    await updateBusiness(db, rest);
    success();
    router.back();
  };

  return (
    <Screen scrollEnabled={!drawing} footer={<Button title="Save profile" icon="checkmark" onPress={save} loading={saving} style={{ flex: 1 }} />}>
      {/* iOS full-screen swipe-back would steal left-to-right signature strokes. */}
      <Stack.Screen options={{ gestureEnabled: tab !== 'sign', fullScreenGestureEnabled: tab !== 'sign' }} />
      {/* business card preview */}
      <Card dark style={{ padding: 20 }}>
        <Row gap={14}>
          <Pressable onPress={pickLogo} style={styles.logo}>
            {b.logo ? <Image source={{ uri: b.logo }} style={{ width: 64, height: 64, borderRadius: 20 }} /> : <Avatar name={b.name} size={64} dark />}
            <View style={styles.cam}><Ionicons name="camera" size={13} color={colors.ink} /></View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <T v="title" style={{ color: colors.onInk, fontSize: 22 }} numberOfLines={2}>{b.name || 'Your Business'}</T>
            {b.tagline ? <T v="small" style={{ color: colors.tint, fontSize: 12 }}>{b.tagline}</T> : null}
            <T v="small" style={{ color: colors.onInkMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
              {[b.phone, b.email].filter(Boolean).join(' · ') || 'Add contact details'}
            </T>
          </View>
        </Row>
        {b.logo ? (
          <Pressable onPress={() => setB({ ...b, logo: '' })} style={{ marginTop: 12 }}>
            <T v="label" style={{ color: colors.onInkMuted, fontSize: 12 }}>Remove logo</T>
          </Pressable>
        ) : null}
      </Card>

      <View style={{ marginVertical: 16 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'tax', label: 'GST' },
            { value: 'bank', label: 'Bank' },
            { value: 'sign', label: 'Sign' },
          ]}
        />
      </View>

      {tab === 'basic' ? (
        <>
          <Field label="Business name" value={b.name} onChangeText={set('name')} />
          <Field label="Tagline" value={b.tagline} onChangeText={set('tagline')} placeholder="e.g. Fine jewellery since 1998" />
          <Row gap={10}>
            <Field label="Phone" value={b.phone} onChangeText={set('phone')} keyboardType="phone-pad" containerStyle={{ flex: 1 }} />
            <Field label="Phone 2" value={b.phone2} onChangeText={set('phone2')} keyboardType="phone-pad" containerStyle={{ flex: 1 }} />
          </Row>
          <Field label="Email" value={b.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Address" value={b.address} onChangeText={set('address')} multiline />
          <Row gap={10}>
            <Field label="State" value={b.state} onChangeText={set('state')} containerStyle={{ flex: 1.4 }} />
            <Field label="Pincode" value={b.pincode} onChangeText={set('pincode')} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
          </Row>
        </>
      ) : null}

      {tab === 'tax' ? (
        <>
          <Field label="GSTIN" value={b.gstin} onChangeText={(v) => setB({ ...b, gstin: v.toUpperCase() })} autoCapitalize="characters" hint="With a GSTIN, sale invoices are titled “Tax Invoice”." />
          <Field label="Currency symbol" value={b.currency} onChangeText={set('currency')} />
          <Field label="Default terms & conditions" value={b.terms} onChangeText={set('terms')} multiline />
        </>
      ) : null}

      {tab === 'bank' ? (
        <>
          <Field label="Bank name" value={b.bank_name} onChangeText={set('bank_name')} />
          <Field label="Account holder" value={b.account_name} onChangeText={set('account_name')} />
          <Field label="Account number" value={b.account_no} onChangeText={set('account_no')} keyboardType="number-pad" />
          <Field label="IFSC" value={b.ifsc} onChangeText={(v) => setB({ ...b, ifsc: v.toUpperCase() })} autoCapitalize="characters" />
          <Field label="UPI ID" value={b.upi} onChangeText={set('upi')} autoCapitalize="none" hint="Adds a scan-to-pay QR with the exact due amount on every unpaid invoice." />
        </>
      ) : null}

      {tab === 'sign' ? (
        <>
          <T v="small" style={{ marginBottom: 10 }}>Your signature appears above “Authorised Signatory” on every invoice.</T>
          <SignaturePad value={b.signature} onDrawing={setDrawing} onChange={(s) => setB((prev) => (prev ? { ...prev, signature: s } : prev))} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { borderRadius: 20 },
  cam: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
