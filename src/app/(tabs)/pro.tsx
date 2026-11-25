import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';

const ROWS: [string, boolean, boolean][] = [
  ['Unlimited sale & purchase invoices', true, true],
  ['Parties, items & stock tracking', true, true],
  ['Payment-In / Payment-Out, expenses', true, true],
  ['WhatsApp sharing & PDF print', true, true],
  ['Local backup & restore', true, true],
  ['All 8 invoice themes & colours', false, true],
  ['Thermal printer layouts', false, true],
  ['Advanced reports (P&L, GST, stock)', false, true],
  ['Multiple companies', false, true],
  ['Priority support from Ascelstack', false, true],
];

export default function Pro() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.crown}><Ionicons name="diamond" size={26} color={colors.inkDeep} /></View>
        <Text style={styles.title}>Ascel Bill Pro</Text>
        <Text style={styles.sub}>Everything you need to bill faster, look professional and grow your business.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={[styles.cell, { flex: 1, textAlign: 'left', fontFamily: fonts.semibold }]}>Features</Text>
          <Text style={[styles.cell, styles.colHead]}>Free</Text>
          <Text style={[styles.cell, styles.colHead, { color: colors.gold }]}>Pro</Text>
        </View>
        {ROWS.map(([label, free, pro]) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.cell, { flex: 1, textAlign: 'left' }]}>{label}</Text>
            <View style={styles.col}><Ionicons name={free ? 'checkmark-circle' : 'close-circle-outline'} size={19} color={free ? colors.success : colors.textFaint} /></View>
            <View style={styles.col}><Ionicons name={pro ? 'checkmark-circle' : 'close-circle-outline'} size={19} color={pro ? colors.gold : colors.textFaint} /></View>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="gift-outline" size={18} color={colors.accent} />
        <Text style={styles.noteText}>Early access: every Pro feature is unlocked for free while Ascel Bill is in beta.</Text>
      </View>

      <Pressable
        onPress={() => { tap(); Alert.alert('You are all set', 'All Pro features are already unlocked during early access. We will let you know before plans start.'); }}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="diamond" size={16} color={colors.inkDeep} />
        <Text style={styles.ctaText}>Get Pro</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.inkDeep, paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center' },
  crown: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 26, color: '#fff', marginTop: 14 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.onInkMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  card: { backgroundColor: colors.card, borderRadius: 10, marginHorizontal: 10, marginTop: -14, paddingVertical: 6 },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  cell: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text, textAlign: 'center' },
  colHead: { width: 56, fontFamily: fonts.bold },
  col: { width: 56, alignItems: 'center' },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.tintSoft, borderRadius: 8, padding: 12, marginHorizontal: 10, marginTop: 12 },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  cta: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 999, backgroundColor: colors.gold, marginHorizontal: 16, marginTop: 20 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkDeep },
});
