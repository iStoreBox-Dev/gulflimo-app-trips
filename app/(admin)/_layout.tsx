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
        <ActivityIndicator color="#38BDF8" size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#121A2B' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { color: '#38BDF8', fontWeight: '700' },
        contentStyle: { backgroundColor: '#0B1220' },
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
