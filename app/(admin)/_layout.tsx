import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { getToken } from '@/lib/auth';

export default function AdminLayout() {
  const [checking, setChecking] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    getToken().then((token) => {
      const isOnLogin = segments[segments.length - 1] === 'login';
      if (!token && !isOnLogin) {
        router.replace('/(admin)/login');
      }
      setChecking(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a1a' },
        headerTintColor: '#F5F0E8',
        headerTitleStyle: { color: '#C9A84C', fontWeight: '700' },
        contentStyle: { backgroundColor: '#0a0a0a' },
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
