import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export default function Badge({ label, color = '#38BDF8', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1A` }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
