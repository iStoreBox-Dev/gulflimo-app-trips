import React from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function PublicHeader() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logo}>Gulf Limo</Text>
        <Text style={styles.tagline}>Premium rides in minutes</Text>
      </View>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => router.push('/(public)/lookup')} style={styles.actionPill}>
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
        contentStyle: { backgroundColor: '#0B1220' },
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#0B1220',
    borderBottomColor: '#1E2940',
    borderBottomWidth: 1,
  },
  logo: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  links: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionPill: {
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  link: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  adminLink: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  adminText: {
    color: '#0B1220',
    fontSize: 13,
    fontWeight: '700',
  },
});
