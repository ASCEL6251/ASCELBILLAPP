import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dashboardStats, getBusiness } from '@/db/repo';
import { money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

export default function Notifications() {
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), s: await dashboardStats(db) }));
  const cur = data?.biz.currency ?? '₹';
  const notes: { icon: keyof typeof Ionicons.glyphMap; tone: string; title: string; body: string; go: string }[] = [];
  if (data) {
    if (data.s.receivable > 0) notes.push({ icon: 'arrow-down-circle', tone: colors.success, title: 'Payments to collect', body: `${money(data.s.receivable, cur)} is pending from your parties.`, go: '/' });
    if (data.s.lowStock.length) notes.push({ icon: 'alert-circle', tone: colors.danger, title: 'Low stock', body: `${data.s.lowStock.length} item(s) are at or below minimum stock.`, go: '/stock-summary?low=1' });
    notes.push({ icon: 'cloud-upload', tone: colors.accent, title: 'Back up your data', body: 'Save a backup file regularly so you never lose your bills.', go: '/menu' });
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }}>
      {notes.map((n) => (
        <Pressable key={n.title} style={styles.row} onPress={() => router.push(n.go as any)}>
          <Ionicons name={n.icon} size={26} color={n.tone} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.body}>{n.body}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 8, marginTop: 8, borderRadius: 6, padding: 14 },
  title: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
});
