import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Mark, T, success } from '@/components/ui';
import { updateBusiness } from '@/db/repo';
import { seedDemo } from '@/db/seed';
import { colors, fonts, radius } from '@/lib/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState<'start' | 'demo' | null>(null);

  const start = async () => {
    if (!name.trim()) return Alert.alert('Business name', 'Tell us what your business is called.');
    setBusy('start');
    await updateBusiness(db, { name: name.trim(), phone: phone.trim(), onboarded: 1 });
    success();
    router.replace('/');
  };

  const demo = async () => {
    setBusy('demo');
    try {
      await seedDemo(db);
      success();
      router.replace('/');
    } catch (e: any) {
      setBusy(null);
      Alert.alert('Could not load sample data', String(e?.message ?? e));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.grid} pointerEvents="none">
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.gl, { top: i * 56 }]} />
          ))}
        </View>
        <View style={styles.markWrap}>
          <Mark size={44} />
        </View>
        <T v="eyebrow" style={{ color: colors.tint, marginTop: 28 }}>Ascel Bill</T>
        <T v="display" style={{ color: colors.onInk, fontSize: 40, lineHeight: 46, letterSpacing: -1.2, marginTop: 10 }}>
          Invoices as <T v="display" style={{ color: colors.tint, fontSize: 40, lineHeight: 46 }}>refined</T> as your business.
        </T>
        <T v="body" style={{ color: colors.onInkMuted, marginTop: 14 }}>
          Bill in seconds, pick from premium designs, and share a polished PDF on WhatsApp. Works offline.
        </T>

        <View style={{ flex: 1, minHeight: 30 }} />

        <View style={styles.form}>
          <T v="label" style={styles.lbl}>Business name</T>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Chowdhury & Co." placeholderTextColor="#6F8296" style={styles.input} autoCapitalize="words" />
          <T v="label" style={[styles.lbl, { marginTop: 14 }]}>Phone (optional)</T>
          <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit mobile" placeholderTextColor="#6F8296" style={styles.input} keyboardType="phone-pad" />
        </View>

        <Button kind="tint" title="Get started" icon="arrow-forward" onPress={start} loading={busy === 'start'} style={{ marginTop: 18 }} />
        <Pressable onPress={demo} disabled={!!busy} style={{ alignItems: 'center', paddingVertical: 16 }}>
          <T v="label" style={{ color: colors.onInk, textDecorationLine: 'underline' }}>
            {busy === 'demo' ? 'Setting up sample shop…' : 'Explore with sample data'}
          </T>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  grid: { position: 'absolute', left: 0, right: 0, top: 0, height: 500, opacity: 0.25 },
  gl: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.onInkMuted },
  markWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  form: { backgroundColor: colors.inkRaised, borderRadius: radius.l, padding: 16 },
  lbl: { color: colors.onInkMuted, fontSize: 12 },
  input: {
    marginTop: 6,
    height: 48,
    borderRadius: radius.m,
    backgroundColor: colors.inkDeep,
    color: colors.onInk,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});
