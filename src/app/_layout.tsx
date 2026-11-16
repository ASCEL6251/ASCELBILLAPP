import { InterTight_400Regular } from '@expo-google-fonts/inter-tight/400Regular';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrate } from '@/db/schema';
import { colors, fonts } from '@/lib/theme';

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.tint} />
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });
  if (!loaded) return <Splash />;

  return (
    <SafeAreaProvider>
      <Suspense fallback={<Splash />}>
        <SQLiteProvider databaseName="ascelbill.db" onInit={migrate} useSuspense>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.paper },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.paper },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="invoice/new" options={{ title: 'New Invoice' }} />
            <Stack.Screen name="invoice/[id]" options={{ title: '' }} />
            <Stack.Screen name="invoice/preview" options={{ title: 'Choose a design', presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="party/new" options={{ title: 'Party', presentation: 'modal' }} />
            <Stack.Screen name="party/[id]" options={{ title: '' }} />
            <Stack.Screen name="item/new" options={{ title: 'Item', presentation: 'modal' }} />
            <Stack.Screen name="item/[id]" options={{ title: '' }} />
            <Stack.Screen name="payment" options={{ title: 'Record Payment', presentation: 'modal' }} />
            <Stack.Screen name="business" options={{ title: 'Business Profile' }} />
            <Stack.Screen name="reports" options={{ title: 'Reports' }} />
            <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
            <Stack.Screen name="settings" options={{ title: 'Invoice Settings' }} />
          </Stack>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
