import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  color: string;
}

export default function StatCard({ label, value, subLabel, color }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {subLabel ? <Text style={styles.sub}>{subLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121A2B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2940',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 140,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    paddingLeft: 12,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  sub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
});
