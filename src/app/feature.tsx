import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { IconName } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';

const FEATURES: Record<string, { title: string; icon: IconName; body: string }> = {
  bank: { title: 'Bank Accounts', icon: 'business-outline', body: 'Hey! You have not added any bank accounts yet. Bank balances and transfers will appear here.' },
  cheques: { title: 'Cheque', icon: 'card-outline', body: 'Hey! You have not added any cheques yet. Any payment involving cheque appears here.' },
  loan: { title: 'Loan Accounts', icon: 'pie-chart-outline', body: 'Track business loans, EMIs and interest. No loan accounts added yet.' },
  store: { title: 'My Online Store', icon: 'storefront-outline', body: 'Share your item catalogue as an online store and take orders on WhatsApp. Coming soon.' },
  sync: { title: 'Sync & Share', icon: 'sync-outline', body: 'Use the same company on more than one phone and share access with your staff. Coming soon.' },
  companies: { title: 'Manage Companies', icon: 'albums-outline', body: 'Run more than one business from a single app. Coming soon.' },
  fy: { title: 'Close Financial Year', icon: 'calendar-outline', body: 'Carry closing balances and stock into a fresh financial year. Coming soon.' },
  messages: { title: 'Messages', icon: 'chatbubbles-outline', body: 'Set up automatic transaction SMS and WhatsApp messages for your parties. Coming soon.' },
  desktop: { title: 'Desktop Billing Software', icon: 'desktop-outline', body: 'Ascel Bill for Windows and Mac is on the way from Ascelstack.' },
  products: { title: 'Other Products', icon: 'apps-outline', body: 'Explore more business tools from Ascelstack. Coming soon.' },
  whatsapp: { title: 'WhatsApp Marketing', icon: 'logo-whatsapp', body: 'Send offers and greetings to all your parties on WhatsApp. Coming soon.' },
  ads: { title: 'Smart Ads', icon: 'megaphone-outline', body: 'Promote your shop to nearby customers. Coming soon.' },
  gmb: { title: 'Google Profile Manager', icon: 'logo-google', body: 'Manage your Google Business profile from Ascel Bill. Coming soon.' },
  care: { title: 'Customer Care', icon: 'headset-outline', body: 'Need help? Reach the Ascelstack support team from the Ascelstack website.' },
  tutorials: { title: 'Tutorials', icon: 'play-circle-outline', body: 'Short videos on billing, GST and stock are coming soon.' },
  remote: { title: 'Remote Ascel Support', icon: 'desktop-outline', body: 'Let our team guide you on a call. Coming soon.' },
  rate: { title: 'Rate this app', icon: 'star-outline', body: 'Enjoying Ascel Bill? Ratings open once the app is live on the App Store and Play Store.' },
  privacy: { title: 'Privacy Policy', icon: 'shield-checkmark-outline', body: 'Your data stays on this device. Ascel Bill has no account and sends nothing to our servers. Backups go only where you choose to save them.' },
};

export default function Feature() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const f = FEATURES[key ?? ''] ?? { title: 'Coming soon', icon: 'sparkles-outline' as IconName, body: 'This feature is on the way.' };
  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <Stack.Screen options={{ title: f.title }} />
      <View style={styles.center}>
        <View style={styles.art}>
          <View style={styles.paper}>
            <View style={styles.circle} />
            <View style={[styles.line, { width: 60 }]} />
            <View style={[styles.line, { width: 90 }]} />
          </View>
          <View style={styles.iconWrap}><Ionicons name={f.icon} size={30} color={colors.ink} /></View>
        </View>
        <Text style={styles.body}>{f.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 80 },
  art: { width: 170, height: 120, marginBottom: 26 },
  paper: { position: 'absolute', left: 0, top: 10, width: 150, height: 96, borderRadius: 6, backgroundColor: colors.warnSoft, padding: 14, gap: 10 },
  circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.ink },
  line: { height: 3, backgroundColor: colors.ink, borderRadius: 2 },
  iconWrap: { position: 'absolute', right: 0, bottom: 0, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  body: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
