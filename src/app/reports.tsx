import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProBadge } from '@/components/kit';
import { tap } from '@/components/ui';
import { getPrefs, setPref } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

type R = { label: string; go: string; pro?: boolean };

const SECTIONS: { title: string; rows: R[] }[] = [
  {
    title: 'Transaction reports',
    rows: [
      { label: 'Sale', go: '/report?tab=overview' },
      { label: 'Purchase', go: '/report?tab=overview' },
      { label: 'Day book', go: '/' },
      { label: 'All Transactions', go: '/' },
      { label: 'Profit & Loss', go: '/report?tab=overview' },
      { label: 'Cash flow', go: '/cash' },
      { label: 'Balance Sheet', go: '/report?tab=overview', pro: true },
    ],
  },
  {
    title: 'Party reports',
    rows: [
      { label: 'Party Statement', go: '/report?tab=party' },
      { label: 'Party Wise Profit & Loss', go: '/report?tab=party', pro: true },
      { label: 'All Parties Report', go: '/report?tab=party' },
      { label: 'Party Report by Items', go: '/report?tab=item' },
      { label: 'Sale/Purchase by Party', go: '/report?tab=party' },
    ],
  },
  {
    title: 'Item/Stock reports',
    rows: [
      { label: 'Stock Summary Report', go: '/stock-summary' },
      { label: 'Item Report by Party', go: '/report?tab=item' },
      { label: 'Item Wise Profit & Loss', go: '/report?tab=item' },
      { label: 'Low Stock Summary Report', go: '/stock-summary?low=1' },
      { label: 'Item Detail Report', go: '/export-items?view=1' },
      { label: 'Sale/Purchase By Item Category', go: '/report?tab=item' },
    ],
  },
  {
    title: 'GST reports',
    rows: [
      { label: 'GST Report', go: '/report?tab=gst' },
      { label: 'GST Rate Report', go: '/report?tab=gst' },
    ],
  },
  {
    title: 'Expense reports',
    rows: [
      { label: 'Expense Transaction Report', go: '/expenses?tab=items' },
      { label: 'Expense Category Report', go: '/expenses' },
    ],
  },
  {
    title: 'Sale/Purchase Order reports',
    rows: [
      { label: 'Sale/Purchase Order Transaction Report', go: '/' },
      { label: 'Sale/Purchase Order Item Report', go: '/report?tab=item' },
    ],
  },
];

export default function Reports() {
  const { data, db, reload } = useData(getPrefs);
  const fav = (l: string) => data?.[`fav.${l}`] === '1';
  const toggle = async (l: string) => { tap(); await setPref(db, `fav.${l}`, fav(l) ? '0' : '1'); reload(); };
  const favs = SECTIONS.flatMap((s) => s.rows).filter((r) => fav(r.label));
  const sections = favs.length ? [{ title: 'Favourites', rows: favs }, ...SECTIONS] : SECTIONS;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingBottom: 30 }}>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.title}>{s.title}</Text>
          {s.rows.map((r) => (
            <Pressable key={s.title + r.label} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paper }]} onPress={() => { tap(); router.push(r.go as any); }}>
              <Text style={styles.label}>{r.label}</Text>
              {r.pro ? <ProBadge /> : null}
              <View style={{ flex: 1 }} />
              <Pressable hitSlop={10} onPress={() => toggle(r.label)}>
                <Ionicons name={fav(r.label) ? 'star' : 'star-outline'} size={18} color={fav(r.label) ? colors.gold : colors.textFaint} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, marginHorizontal: 8, marginTop: 8, paddingVertical: 6 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, paddingHorizontal: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  label: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text },
});
