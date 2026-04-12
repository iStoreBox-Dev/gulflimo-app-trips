import React from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function PublicHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>GULF LIMO</Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => router.push('/(public)/lookup')}>
          <Text style={styles.link}>My Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(admin)/login')}
          style={styles.adminLink}
        >
          <Text style={styles.adminText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <PublicHeader />,
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0a0a0a',
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  logo: {
    color: '#C9A84C',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
  links: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  link: {
    color: '#F5F0E8',
    fontSize: 14,
  },
  adminLink: {
    backgroundColor: '#C9A84C',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  adminText: {
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: '700',
  },
});
