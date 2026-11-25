import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { MenuGroup, MenuRow } from '@/components/kit';
import { colors } from '@/lib/theme';

const go = (h: string) => () => router.push(h as any);

export default function AppSettings() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingBottom: 30 }}>
      <MenuGroup title="Settings">
        <MenuRow icon="companies" label="Business Profile" onPress={go('/business')} />
        <MenuRow icon="receipt" tone={colors.success} label="Transaction" onPress={go('/prefs?group=txn')} />
        <MenuRow icon="palette" tone="#8D7FE0" label="Invoice Print & Themes" onPress={go('/settings')} />
        <MenuRow icon="users" tone={colors.warn} label="Party" onPress={go('/prefs?group=party')} />
        <MenuRow icon="items" label="Item" onPress={go('/prefs?group=item')} last />
      </MenuGroup>
    </ScrollView>
  );
}
