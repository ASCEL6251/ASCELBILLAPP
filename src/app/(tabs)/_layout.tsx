import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconName, Sheet, T, tap } from '@/components/ui';
import { getBusiness } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, fonts, radius, shadow } from '@/lib/theme';

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  parties: { label: 'Parties', icon: 'people-outline', iconActive: 'people' },
  items: { label: 'Items', icon: 'cube-outline', iconActive: 'cube' },
  more: { label: 'More', icon: 'grid-outline', iconActive: 'grid' },
};

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const CREATE: { icon: IconName; title: string; sub: string; go: () => void }[] = [
  { icon: 'receipt', title: 'Sale Invoice', sub: 'Bill a customer', go: () => router.push('/invoice/new?type=sale') },
  { icon: 'document-text', title: 'Estimate / Quotation', sub: 'Send a price quote', go: () => router.push('/invoice/new?type=estimate') },
  { icon: 'cart', title: 'Purchase Bill', sub: 'Record stock bought', go: () => router.push('/invoice/new?type=purchase') },
  { icon: 'cash', title: 'Payment In', sub: 'Money received from a party', go: () => router.push('/payment?direction=in') },
  { icon: 'arrow-redo', title: 'Payment Out', sub: 'Money paid to a party', go: () => router.push('/payment?direction=out') },
  { icon: 'wallet', title: 'Expense', sub: 'Rent, salary, bills…', go: () => router.push('/expenses?add=1') },
];

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const routes = state.routes;
  const render = (i: number) => {
    const r = routes[i];
    const meta = TABS[r.name];
    if (!meta) return null;
    const focused = state.index === i;
    return (
      <Pressable
        key={r.key}
        style={styles.tab}
        onPress={() => {
          tap();
          if (!focused) navigateToTab(r.key);
        }}
      >
        <Ionicons name={focused ? meta.iconActive : meta.icon} size={22} color={focused ? colors.ink : colors.textFaint} />
        <Text style={[styles.label, focused && { color: colors.ink, fontFamily: fonts.semibold }]}>{meta.label}</Text>
      </Pressable>
    );
  };
  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {render(0)}
        {render(1)}
        <View style={styles.tab}>
          <Pressable
            onPress={() => {
              tap();
              setOpen(true);
            }}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            <Ionicons name="add" size={30} color={colors.onInk} />
          </Pressable>
        </View>
        {render(2)}
        {render(3)}
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Create">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 6 }}>
          {CREATE.map((c) => (
            <Pressable
              key={c.title}
              onPress={() => {
                tap();
                setOpen(false);
                setTimeout(c.go, 180);
              }}
              style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.tileIcon}>
                <Ionicons name={c.icon} size={20} color={colors.tint} />
              </View>
              <T v="h3" style={{ marginTop: 10 }}>{c.title}</T>
              <T v="small" style={{ fontSize: 12 }}>{c.sub}</T>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}

export default function TabsLayout() {
  const { data: biz, loading } = useData(getBusiness);
  if (loading || !biz) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  if (!biz.onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="parties" />
      <Tabs.Screen name="items" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: colors.paper,
    ...shadow.lift,
  },
  tile: {
    width: '48.5%',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.l,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
