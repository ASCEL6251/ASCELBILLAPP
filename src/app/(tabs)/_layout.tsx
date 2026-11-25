import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glyph, GlyphName } from '@/components/Glyph';
import { tap } from '@/components/ui';
import { getBusiness } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

const TABS: Record<string, { label: string; icon: GlyphName }> = {
  index: { label: 'Home', icon: 'home' },
  dashboard: { label: 'Insights', icon: 'insights' },
  items: { label: 'Items', icon: 'items' },
  menu: { label: 'More', icon: 'more' },
  pro: { label: 'Pro', icon: 'pro' },
};

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 10, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((r, i) => {
          const meta = TABS[r.name];
          if (!meta) return null;
          const focused = state.index === i;
          const isPro = r.name === 'pro';
          return (
            <Pressable
              key={r.key}
              style={styles.tab}
              onPress={() => {
                if (focused) return;
                tap();
                navigateToTab(r.key);
              }}
            >
              <View style={[styles.iconPill, focused && { backgroundColor: isPro ? colors.goldSoft : colors.tintSoft }]}>
                <Glyph
                  name={meta.icon}
                  size={22}
                  color={focused ? colors.ink : colors.textFaint}
                  accent={isPro ? colors.gold : focused ? colors.accent : colors.paperSunk}
                  weight={focused ? 1.9 : 1.6}
                />
              </View>
              <Text style={[styles.label, focused && { color: colors.ink, fontFamily: fonts.semibold }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { data: biz, loading } = useData(getBusiness);
  if (loading || !biz) return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
  if (!biz.onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="items" />
      <Tabs.Screen name="menu" />
      <Tabs.Screen name="pro" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.canvas, paddingHorizontal: 12, paddingTop: 6 },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#1D2D3D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconPill: { width: 50, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 11, color: colors.textFaint },
});
