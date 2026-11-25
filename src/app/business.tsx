import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';
import { SignaturePad } from '@/components/SignaturePad';
import { Avatar, Button, Field, Row, Screen, Segmented, T, success, tap } from '@/components/ui';
import { getBusiness, updateBusiness } from '@/db/repo';
import type { Business } from '@/db/types';
import { colors, fonts } from '@/lib/theme';

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

  const fields = [b.name, b.phone, b.email, b.address, b.state, b.pincode, b.gstin, b.logo, b.signature, b.bank_name, b.account_no, b.upi];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const shareCard = () => {
    tap();
    Share.share({
      message: [b.name, b.tagline, b.gstin && `GSTIN: ${b.gstin}`, b.phone && `Phone: ${b.phone}`, b.email && `Email: ${b.email}`, b.address].filter(Boolean).join('\n'),
    });
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
      {/* visiting card preview */}
      <View style={styles.vcard}>
        <View style={styles.vStripe} />
        <View style={styles.vStripe2} />
        <Row gap={14} style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <T style={styles.vName} numberOfLines={2}>{(b.name || 'Your Business').toUpperCase()}</T>
            {b.gstin ? <T v="small" style={{ fontSize: 10.5, marginTop: 2 }}>GSTIN: {b.gstin}</T> : null}
          </View>
          <Pressable onPress={pickLogo} style={styles.logo}>
            {b.logo ? <Image source={{ uri: b.logo }} style={{ width: 52, height: 52, borderRadius: 26 }} /> : <Avatar name={b.name} size={52} />}
            <View style={styles.cam}><Ionicons name="camera" size={12} color={colors.ink} /></View>
          </Pressable>
        </Row>
        <View style={{ marginTop: 14, gap: 4, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 10 }}>
          {b.phone ? <Row gap={6}><Ionicons name="call-outline" size={12} color={colors.accent} /><T v="small" style={{ fontSize: 11 }}>{b.phone}</T></Row> : null}
          {b.email ? <Row gap={6}><Ionicons name="mail-outline" size={12} color={colors.accent} /><T v="small" style={{ fontSize: 11 }}>{b.email}</T></Row> : null}
          {b.address ? <Row gap={6}><Ionicons name="location-outline" size={12} color={colors.accent} /><T v="small" style={{ fontSize: 11, flex: 1 }} numberOfLines={2}>{b.address}</T></Row> : null}
        </View>
        {b.logo ? (
          <Pressable onPress={() => setB({ ...b, logo: '' })} style={{ marginTop: 10 }}>
            <T v="label" style={{ fontSize: 11.5 }}>Remove logo</T>
          </Pressable>
        ) : null}
      </View>
      <Pressable style={styles.shareCard} onPress={shareCard}>
        <Ionicons name="arrow-redo" size={16} color="#fff" />
        <T style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 14 }}>Share Card</T>
      </Pressable>
      <Row gap={8} style={{ marginTop: 14 }}>
        <Ionicons name="bulb-outline" size={18} color={colors.gold} />
        <T v="small" style={{ fontSize: 11.5, flex: 1 }}>Businesses that share a visiting card get noticed more often.</T>
      </Row>
      <T v="small" style={{ marginTop: 14, fontSize: 12.5, color: colors.text }}>Profile {pct}% complete.</T>
      <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>

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
  vcard: { backgroundColor: '#fff', borderRadius: 10, padding: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  vStripe: { position: 'absolute', right: -40, top: -30, width: 160, height: 60, backgroundColor: colors.tintSoft, transform: [{ rotate: '35deg' }] },
  vStripe2: { position: 'absolute', right: -60, top: 10, width: 160, height: 18, backgroundColor: colors.tint, opacity: 0.5, transform: [{ rotate: '35deg' }] },
  vName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  shareCard: { flexDirection: 'row', gap: 8, alignSelf: 'center', alignItems: 'center', marginTop: -18, height: 40, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.ink },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.paperSunk, marginTop: 8 },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  logo: { borderRadius: 26 },
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
    borderColor: '#fff',
  },
});
