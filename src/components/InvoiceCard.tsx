import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Invoice } from '@/db/types';
import { dateLabel, money } from '@/lib/format';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { Badge, Row, T, tap } from './ui';

export function statusOf(inv: Invoice): { label: string; tone: 'success' | 'danger' | 'warn' | 'accent' | 'neutral' } {
  if (inv.type === 'estimate') return { label: 'Estimate', tone: 'accent' };
  const bal = inv.total - inv.received;
  if (inv.type === 'purchase') return bal <= 0.004 ? { label: 'Purchase · Paid', tone: 'neutral' } : { label: 'Purchase · Due', tone: 'warn' };
  if (bal <= 0.004) return { label: 'Paid', tone: 'success' };
  if (inv.received > 0) return { label: 'Partial', tone: 'warn' };
  return { label: 'Unpaid', tone: 'danger' };
}

export function InvoiceCard({ inv, currency = '₹', onShare }: { inv: Invoice; currency?: string; onShare?: (inv: Invoice) => void }) {
  const s = statusOf(inv);
  const bal = Math.max(0, inv.total - inv.received);
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push(`/invoice/${inv.id}`);
      }}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T v="h3" numberOfLines={1}>{inv.party_name || 'Cash Sale'}</T>
          <Row style={{ marginTop: 6 }} gap={8}>
            <Badge label={s.label} tone={s.tone} />
            <T v="mono" style={{ fontSize: 11.5, color: colors.textMuted }}>{inv.number}</T>
          </Row>
        </View>
        <T v="small" style={{ fontSize: 12 }}>{dateLabel(inv.date)}</T>
      </Row>
      <View style={styles.hr} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={22}>
          <View>
            <T v="small" style={styles.k}>Total</T>
            <T v="h3" style={styles.v}>{money(inv.total, currency)}</T>
          </View>
          {inv.type !== 'estimate' ? (
            <View>
              <T v="small" style={styles.k}>Balance</T>
              <T v="h3" style={[styles.v, bal > 0 && { color: inv.type === 'purchase' ? colors.warn : colors.danger }]}>
                {money(bal, currency)}
              </T>
            </View>
          ) : null}
        </Row>
        {onShare ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              tap();
              onShare(inv);
            }}
            style={styles.share}
          >
            <Ionicons name="share-outline" size={17} color={colors.ink} />
          </Pressable>
        ) : null}
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.l,
    padding: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 12 },
  k: { fontSize: 11, fontFamily: fonts.medium },
  v: { fontFamily: fonts.semibold, fontSize: 15, marginTop: 1 },
  share: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' },
});
