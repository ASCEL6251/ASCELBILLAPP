import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { DuoIcon } from '@/components/kit';
import { success, tap } from '@/components/ui';
import { saveItem } from '@/db/repo';
import { ITEM_COLUMNS, pickItemsCsv } from '@/lib/csv';
import { colors, fonts } from '@/lib/theme';

export default function ImportItems() {
  const db = useSQLiteContext();
  const fromCsv = async () => {
    tap();
    try {
      const rows = await pickItemsCsv();
      if (!rows) return;
      Alert.alert(`Import ${rows.length} items?`, 'They are added to your item list. Existing items are not changed.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            await db.withTransactionAsync(async () => {
              for (const r of rows) await saveItem(db, r);
            });
            success();
            router.back();
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Could not import', String(e?.message ?? e));
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Pressable style={styles.row} onPress={() => { tap(); router.push('/item/new'); }}>
        <DuoIcon name="items" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add Manually</Text>
          <Text style={styles.sub}>Create one item at a time with price, tax and stock</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
      <Pressable style={styles.row} onPress={fromCsv}>
        <DuoIcon name="statement" tone={colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Excel / CSV file</Text>
          <Text style={styles.sub}>Upload your items from a CSV file saved from Excel or Sheets</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
      <View style={styles.help}>
        <Text style={styles.sub}>Columns (first row): {ITEM_COLUMNS.join(', ')}. Only “name” is required.</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.safe}>
        <Ionicons name="shield-checkmark" size={30} color={colors.success} />
        <Text style={[styles.sub, { flex: 1 }]}>Your data stays on this phone. Nothing is uploaded.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, marginHorizontal: 8, marginTop: 8, borderRadius: 6, padding: 14 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  help: { marginHorizontal: 16, marginTop: 12 },
  safe: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 20, marginBottom: 40, padding: 12, borderRadius: 8, backgroundColor: colors.warnSoft },
});
