import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AdminHeaderProps {
  title: string;
  onLogout?: () => void;
}

export default function AdminHeader({ title, onLogout }: AdminHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {onLogout && (
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#121A2B',
    borderBottomColor: '#1E2940',
    borderBottomWidth: 1,
  },
  title: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 999,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
