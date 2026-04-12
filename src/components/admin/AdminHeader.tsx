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
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  title: {
    color: '#C9A84C',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 6,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
