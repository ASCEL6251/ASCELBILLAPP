import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Card, ListRow, Mark, Row, Section, T } from '@/components/ui';
import { countRows, exportBackup, pickBackup, restoreBackup } from '@/db/backup';
import { getBusiness, resetAll } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, radius } from '@/lib/theme';

export default function More() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { data: biz } = useData(getBusiness);

  const reset = () =>
    Alert.alert(
      'Erase all data?',
      'This permanently deletes every invoice, party, item, payment and expense on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: async () => {
            await resetAll(db);
            router.replace('/welcome');
          },
        },
      ],
    );

  const backup = async () => {
    try {
      await exportBackup(db, biz?.name ?? '');
    } catch (e: any) {
      Alert.alert('Backup failed', String(e?.message ?? e));
    }
  };

  const restore = async () => {
    try {
      const data = await pickBackup();
      if (!data) return;
      const c = countRows(data);
      const when = new Date(data.exportedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      Alert.alert(
        'Restore this backup?',
        `Saved on ${when}: ${c.invoices} invoices, ${c.parties} parties, ${c.items} items. It replaces everything currently on this device.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreBackup(db, data);
                router.replace('/');
              } catch (e: any) {
                Alert.alert('Restore failed', `Your data was not changed. ${String(e?.message ?? e)}`);
              }
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Could not open backup', String(e?.message ?? e));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 6, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <T v="title" style={{ marginBottom: 14 }}>More</T>

      <Pressable onPress={() => router.push('/business')}>
        <Card dark style={{ padding: 18 }}>
          <Row gap={14}>
            {biz?.logo ? (
              <Image source={{ uri: biz.logo }} style={{ width: 54, height: 54, borderRadius: 18 }} />
            ) : (
              <Avatar name={biz?.name ?? ''} size={54} dark />
            )}
            <View style={{ flex: 1 }}>
              <T v="h2" style={{ color: colors.onInk }} numberOfLines={1}>{biz?.name || 'Your Business'}</T>
              <T v="small" style={{ color: colors.onInkMuted, fontSize: 12.5 }} numberOfLines={1}>
                {biz?.gstin ? `GSTIN ${biz.gstin}` : biz?.phone || 'Complete your profile'}
              </T>
            </View>
            <View style={styles.editPill}>
              <T v="label" style={{ color: colors.ink, fontSize: 12 }}>Edit</T>
            </View>
          </Row>
          <ProfileMeter biz={biz} />
        </Card>
      </Pressable>

      <Section title="Business">
        <Card style={{ padding: 6 }}>
          <ListRow icon="color-palette-outline" title="Invoice Designs" subtitle="Templates, colours & numbering" onPress={() => router.push('/settings')} />
          <ListRow icon="stats-chart-outline" title="Reports" subtitle="Sales, GST, party & item reports" onPress={() => router.push('/reports')} />
          <ListRow icon="wallet-outline" title="Expenses" subtitle="Rent, salaries, utilities" onPress={() => router.push('/expenses')} />
          <ListRow icon="cash-outline" title="Payment In" subtitle="Record money received" onPress={() => router.push('/payment?direction=in')} />
          <ListRow icon="arrow-redo-outline" title="Payment Out" subtitle="Record money paid" onPress={() => router.push('/payment?direction=out')} />
        </Card>
      </Section>

      <Section title="Create">
        <Card style={{ padding: 6 }}>
          <ListRow icon="receipt-outline" title="Sale Invoice" onPress={() => router.push('/invoice/new?type=sale')} />
          <ListRow icon="document-text-outline" title="Estimate / Quotation" onPress={() => router.push('/invoice/new?type=estimate')} />
          <ListRow icon="cart-outline" title="Purchase Bill" onPress={() => router.push('/invoice/new?type=purchase')} />
        </Card>
      </Section>

      <Section title="Data">
        <Card style={{ padding: 6 }}>
          <ListRow icon="phone-portrait-outline" title="Stored on this device" subtitle="Works fully offline. No account required." />
          <ListRow icon="cloud-upload-outline" title="Back up data" subtitle="Save a backup file to Drive, Files or WhatsApp" onPress={backup} />
          <ListRow icon="cloud-download-outline" title="Restore from backup" subtitle="Replace this device's data with a backup file" onPress={restore} />
          <ListRow icon="trash-outline" title="Erase all data" danger onPress={reset} />
        </Card>
      </Section>

      <View style={{ alignItems: 'center', marginTop: 34, gap: 8 }}>
        <Mark size={34} />
        <T v="title" style={{ fontSize: 20 }}>Ascel Bill</T>
        <T v="eyebrow" style={{ color: colors.textMuted }}>Crafted by Ascelstack · v{Constants.expoConfig?.version ?? '1.0.0'}</T>
      </View>
    </ScrollView>
  );
}

function ProfileMeter({ biz }: { biz: any }) {
  if (!biz) return null;
  const fields: [string, string][] = [
    ['name', 'name'], ['phone', 'phone'], ['email', 'email'], ['address', 'address'], ['state', 'state'],
    ['gstin', 'GSTIN'], ['logo', 'logo'], ['signature', 'signature'], ['bank_name', 'bank'], ['account_no', 'bank'], ['upi', 'UPI'],
  ];
  const missing = [...new Set(fields.filter(([k]) => !biz[k]).map(([, label]) => label))];
  const pct = Math.round(((fields.length - fields.filter(([k]) => !biz[k]).length) / fields.length) * 100);
  if (!missing.length) return null;
  const show = missing.slice(0, 3);
  const hint = 'Add ' + (show.length > 1 ? `${show.slice(0, -1).join(', ')} & ${show[show.length - 1]}` : show[0]);
  return (
    <View style={{ marginTop: 16 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <T v="small" style={{ color: colors.onInkMuted, fontSize: 12 }}>Profile {pct}% complete</T>
        <T v="small" style={{ color: colors.tint, fontSize: 12 }} numberOfLines={1}>{hint}</T>
      </Row>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.inkRaised }}>
        <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: colors.tint }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editPill: { backgroundColor: colors.tint, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
});
