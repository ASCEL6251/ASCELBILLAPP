import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DocType } from '@/db/types';
import { colors, fonts } from '@/lib/theme';
import type { GlyphName } from './Glyph';
import { IconTile } from './kit';
import { Sheet, T, tap } from './ui';

type Entry = { icon: GlyphName; label: string; go: () => void; tone?: string };

const doc = (t: DocType) => () => router.push(`/invoice/new?type=${t}`);

const SALE: Entry[] = [
  { icon: 'receipt', label: 'Sale Invoice', go: doc('sale'), tone: colors.success },
  { icon: 'cashIn', label: 'Payment-In', go: () => router.push('/payment?direction=in'), tone: colors.success },
  { icon: 'returnIn', label: 'Sale Return', go: doc('sale_return'), tone: colors.success },
  { icon: 'quote', label: 'Estimate', go: doc('estimate') },
  { icon: 'order', label: 'Sale Order', go: doc('sale_order') },
  { icon: 'truck', label: 'Delivery Challan', go: doc('delivery_challan') },
];

const PURCHASE: Entry[] = [
  { icon: 'cart', label: 'Purchase', go: doc('purchase'), tone: colors.warn },
  { icon: 'cashOut', label: 'Payment-Out', go: () => router.push('/payment?direction=out'), tone: colors.danger },
  { icon: 'returnOut', label: 'Purchase Return', go: doc('purchase_return'), tone: colors.warn },
  { icon: 'order', label: 'Purchase Order', go: doc('purchase_order'), tone: colors.warn },
];

const OTHER: Entry[] = [
  { icon: 'wallet', label: 'Expenses', go: () => router.push('/expenses?add=1'), tone: colors.danger },
  { icon: 'cash', label: 'Cash In-Hand', go: () => router.push('/cash'), tone: colors.success },
];

export function AddTxnSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const grid = (title: string, list: Entry[]) => (
    <View style={{ marginBottom: 14 }}>
      <T v="eyebrow" style={{ marginBottom: 8 }}>{title}</T>
      <View style={styles.grid}>
        {list.map((e) => (
          <Pressable
            key={e.label}
            style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}
            onPress={() => {
              tap();
              onClose();
              setTimeout(e.go, 220);
            }}
          >
            <IconTile name={e.icon} tone={e.tone} size={46} />
            <Text style={styles.label} numberOfLines={2}>{e.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Add Transaction">
      {grid('Sale Transactions', SALE)}
      {grid('Purchase Transactions', PURCHASE)}
      {grid('Other Transactions', OTHER)}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.canvas, borderRadius: 18, paddingVertical: 10 },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 8, gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.text, textAlign: 'center', paddingHorizontal: 2 },
});
