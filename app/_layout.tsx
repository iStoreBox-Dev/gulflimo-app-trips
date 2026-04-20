import '../global.css';
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { initGlobalLogging } from '@/lib/logger';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import ErrorBoundary from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('[ROOT] RootLayout render', { pathname: typeof window !== 'undefined' ? window.location.pathname : null });
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    console.log('[ROOT] RootLayout mounted');
    initGlobalLogging();
    return () => {
      console.log('[ROOT] RootLayout unmounted');
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1220' }}>
        <Text style={{ color: '#F8FAFC', fontSize: 16 }}>Loading…</Text>
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <StatusBar style="light" backgroundColor="#0B1220" />
            <Stack screenOptions={{ headerShown: false }} />
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
