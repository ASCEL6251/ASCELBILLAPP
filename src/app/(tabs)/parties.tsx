import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Chip, Empty, IconBtn, Row, SearchBar, T, tap } from '@/components/ui';
import { getBusiness, listParties } from '@/db/repo';
import { dateLabel, money } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts, radius, shadow } from '@/lib/theme';

type F = 'all' | 'get' | 'give';

export default function Parties() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('all');
  const { data } = useData(async (db) => ({ biz: await getBusiness(db), parties: await listParties(db, q) }), [q]);
  const cur = data?.biz.currency ?? '₹';
  const all = data?.parties ?? [];
  const get = all.filter((p) => p.balance > 0.004).reduce((s, p) => s + p.balance, 0);
  const give = all.filter((p) => p.balance < -0.004).reduce((s, p) => s - p.balance, 0);
  const list = all.filter((p) => (f === 'get' ? p.balance > 0.004 : f === 'give' ? p.balance < -0.004 : true));

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 6 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <T v="title">Parties</T>
              <IconBtn name="person-add-outline" onPress={() => router.push('/party/new')} bg={colors.ink} color={colors.onInk} size={18} />
            </Row>
            <Row gap={10}>
              <View style={[styles.sum, { backgroundColor: colors.successSoft }]}>
                <T v="eyebrow" style={{ color: colors.success }}>You’ll get</T>
                <T v="h2" style={{ color: colors.success, marginTop: 4 }}>{money(get, cur, 0)}</T>
              </View>
              <View style={[styles.sum, { backgroundColor: colors.dangerSoft }]}>
                <T v="eyebrow" style={{ color: colors.danger }}>You’ll give</T>
                <T v="h2" style={{ color: colors.danger, marginTop: 4 }}>{money(give, cur, 0)}</T>
              </View>
            </Row>
            <View style={{ marginTop: 14 }}>
              <SearchBar value={q} onChangeText={setQ} placeholder="Search name or phone" />
            </View>
            <Row style={{ paddingVertical: 12 }}>
              <Chip label="All" active={f === 'all'} onPress={() => setF('all')} />
              <Chip label="To collect" active={f === 'get'} onPress={() => setF('get')} />
              <Chip label="To pay" active={f === 'give'} onPress={() => setF('give')} />
            </Row>
          </View>
        }
        ListEmptyComponent={
          data ? (
            <Empty
              icon="people-outline"
              title="No parties yet"
              body="Add customers and suppliers to track who owes what."
              action={<Button title="Add party" icon="add" onPress={() => router.push('/party/new')} />}
            />
          ) : undefined
        }
        renderItem={({ item: p }) => {
          const tone = p.balance > 0.004 ? colors.success : p.balance < -0.004 ? colors.danger : colors.textMuted;
          return (
            <Pressable
              onPress={() => {
                tap();
                router.push(`/party/${p.id}`);
              }}
              style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.985 }] }]}
            >
              <Avatar name={p.name} />
              <View style={{ flex: 1 }}>
                <T v="h3" numberOfLines={1}>{p.name}</T>
                <T v="small" style={{ fontSize: 12 }}>
                  {p.kind === 'supplier' ? 'Supplier' : 'Customer'}
                  {p.last_date ? ` · ${dateLabel(p.last_date)}` : p.phone ? ` · ${p.phone}` : ''}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="h3" style={{ color: tone, fontFamily: fonts.bold }}>{money(Math.abs(p.balance), cur, 0)}</T>
                <T v="small" style={{ fontSize: 11, color: tone }}>
                  {p.balance > 0.004 ? "You'll get" : p.balance < -0.004 ? "You'll give" : 'Settled'}
                </T>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sum: { flex: 1, borderRadius: radius.l, padding: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.l,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
});
