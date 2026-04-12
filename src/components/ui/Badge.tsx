import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export default function Badge({ label, color = '#C9A84C', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
