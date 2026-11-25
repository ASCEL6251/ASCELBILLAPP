import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AppHeader, MenuGroup, MenuRow, ProBadge, SubRow } from '@/components/kit';
import { Mark, tap } from '@/components/ui';
import { countRows, exportBackup, pickBackup, restoreBackup } from '@/db/backup';
import { getBusiness, resetAll } from '@/db/repo';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

const go = (href: string) => () => router.push(href as any);
const feature = (key: string) => go(`/feature?key=${key}`);

export default function Menu() {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();
  const { data: biz } = useData(getBusiness);
  const [slide, setSlide] = useState(0);

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

  const erase = () =>
    Alert.alert(
      'Erase all data?',
      'This permanently deletes every invoice, party, item, payment and expense on this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase everything', style: 'destructive', onPress: async () => { await resetAll(db); router.replace('/welcome'); } },
      ],
    );

  const slideW = width - 32;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setSlide(Math.round(e.nativeEvent.contentOffset.x / slideW));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppHeader biz={biz} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* banners */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 0 }}
          snapToInterval={slideW}
          decelerationRate="fast"
        >
          <Pressable onPress={go('/pro')} style={[styles.banner, { width: slideW, backgroundColor: colors.inkDeep }]}>
            <View style={styles.proTag}>
              <Ionicons name="diamond" size={14} color={colors.inkDeep} />
              <Text style={styles.proTagText}>ASCEL PRO</Text>
            </View>
            <Text style={styles.bannerBody}>Become a Pro member and get exclusive access to premium themes, reports and settings to grow your business!</Text>
          </Pressable>
          <Pressable onPress={backup} style={[styles.banner, { width: slideW, backgroundColor: colors.accent }]}>
            <Text style={styles.bannerTitle}>Keep your data safe</Text>
            <Text style={styles.bannerBody}>Back up your invoices, parties and items to Drive, Files or WhatsApp in one tap.</Text>
            <View style={styles.bannerBtn}><Text style={styles.bannerBtnText}>Back Up Now</Text></View>
            <Ionicons name="cloud-upload-outline" size={90} color="rgba(255,255,255,0.14)" style={{ position: 'absolute', right: 10, bottom: 4 }} />
          </Pressable>
        </ScrollView>
        <View style={styles.dots}>
          {[0, 1].map((i) => <View key={i} style={[styles.dot, slide === i && styles.dotOn]} />)}
        </View>

        <MenuGroup title="My Business">
          <MenuRow icon="receipt" tone={colors.success} label="Sale">
            <SubRow label="Sale Invoice" onPress={go('/invoice/new?type=sale')} />
            <SubRow label="Payment-In" onPress={go('/payment?direction=in')} />
            <SubRow label="Sale Return" hint="Credit Note" onPress={go('/invoice/new?type=sale_return')} />
            <SubRow label="Estimate/Quotation" onPress={go('/invoice/new?type=estimate')} />
            <SubRow label="Sale Order" onPress={go('/invoice/new?type=sale_order')} />
            <SubRow label="Delivery Challan" onPress={go('/invoice/new?type=delivery_challan')} />
            <SubRow label="Mobile POS" onPress={go('/invoice/new?type=sale')} />
          </MenuRow>
          <MenuRow icon="cart" tone={colors.warn} label="Purchase">
            <SubRow label="Purchase Bills" onPress={go('/invoice/new?type=purchase')} />
            <SubRow label="Payment-Out" onPress={go('/payment?direction=out')} />
            <SubRow label="Purchase Return" hint="Debit Note" onPress={go('/invoice/new?type=purchase_return')} />
            <SubRow label="Purchase Order" onPress={go('/invoice/new?type=purchase_order')} />
          </MenuRow>
          <MenuRow icon="wallet" tone={colors.danger} label="Expenses" onPress={go('/expenses')} />
          <MenuRow icon="store" tone="#8D7FE0" label="My Online Store" onPress={feature('store')} />
          <MenuRow icon="report" label="Reports" onPress={go('/reports')} last />
        </MenuGroup>

        <MenuGroup title="Cash & Bank">
          <MenuRow icon="bank" label="Bank Accounts" onPress={feature('bank')} />
          <MenuRow icon="cash" tone={colors.success} label="Cash In-Hand" onPress={go('/cash')} />
          <MenuRow icon="cheque" tone={colors.warn} label="Cheques" onPress={feature('cheques')} />
          <MenuRow icon="loan" tone="#8D7FE0" label="Loan Accounts" onPress={feature('loan')} last />
        </MenuGroup>

        <MenuGroup title="Important Utilities">
          <MenuRow icon="sync" label="Sync & Share" onPress={feature('sync')} />
          <MenuRow icon="companies" tone={colors.warn} label="Manage Companies" onPress={feature('companies')} />
          <MenuRow icon="backup" tone={colors.success} label="Backup/Restore">
            <SubRow label="Backup to phone" onPress={backup} />
            <SubRow label="Backup to e-mail" onPress={backup} />
            <SubRow label="Restore backup" onPress={restore} />
          </MenuRow>
          <MenuRow icon="tools" tone="#8D7FE0" label="Utilities" last>
            <SubRow label="Import Items" onPress={go('/import-items')} />
            <SubRow label="Export Items" onPress={go('/export-items')} />
            <SubRow label="Close Financial Year" onPress={feature('fy')} />
            <SubRow label="Messages" onPress={feature('messages')} />
            <SubRow label="Erase All Data" onPress={erase} />
          </MenuRow>
        </MenuGroup>

        <MenuGroup title="Others">
          <MenuRow icon="pro" tone={colors.gold} label="Plans & Pricing" onPress={go('/pro')} />
          <MenuRow icon="desktop" label="Get Desktop Billing Software" onPress={feature('desktop')} />
          <MenuRow icon="apps" tone="#8D7FE0" label="Other Products" onPress={feature('products')} />
          <MenuRow icon="megaphone" tone={colors.success} label="Grow Your Business">
            <SubRow label="WhatsApp Marketing" onPress={feature('whatsapp')} />
            <SubRow label="Business Card" onPress={go('/business')} />
            <SubRow label="Smart Ads" onPress={feature('ads')} badge={<ProBadge />} />
            <SubRow label="Google Profile Manager" onPress={feature('gmb')} />
          </MenuRow>
          <MenuRow icon="gear" label="Settings" onPress={go('/app-settings')} />
          <MenuRow icon="headset" tone={colors.warn} label="Help & Support">
            <SubRow label="Customer Care" onPress={feature('care')} />
            <SubRow label="Tutorials" onPress={feature('tutorials')} />
            <SubRow label="Remote Ascel Support" onPress={feature('remote')} />
          </MenuRow>
          <MenuRow icon="star" tone={colors.gold} label="Rate this app" onPress={feature('rate')} last />
        </MenuGroup>

        <View style={[styles.version]}>
          <Text style={styles.versionTitle}>App Version</Text>
          <Text style={styles.versionNo}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
        <Pressable onPress={() => { tap(); router.push('/feature?key=privacy'); }}>
          <Text style={styles.privacy}>Privacy Policy</Text>
        </Pressable>

        <View style={styles.brand}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Mark size={36} />
            <Text style={styles.brandName}>Ascel Bill</Text>
          </View>
          <Text style={styles.brandSub}>Crafted by Ascelstack</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { height: 138, borderRadius: 22, padding: 16, overflow: 'hidden', marginRight: 0, justifyContent: 'center' },
  proTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  proTagText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkDeep, letterSpacing: 0.5 },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
  bannerBody: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 10, lineHeight: 17, maxWidth: 280 },
  bannerBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  bannerBtnText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong },
  dotOn: { width: 14, backgroundColor: colors.accent },
  version: { backgroundColor: colors.card, borderRadius: 18, marginHorizontal: 16, marginTop: 18, padding: 16, borderWidth: 1, borderColor: colors.line },
  versionTitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  versionNo: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  privacy: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, textDecorationLine: 'underline', marginHorizontal: 20, marginTop: 18 },
  brand: { alignItems: 'center', marginTop: 40, marginBottom: 10, gap: 6, opacity: 0.75 },
  brandName: { fontFamily: fonts.bold, fontSize: 30, color: colors.ink, letterSpacing: -0.8 },
  brandSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
});
