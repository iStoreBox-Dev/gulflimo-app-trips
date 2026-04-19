import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Badge from '../ui/Badge';
import type { Vehicle, Quote } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  quote?: Quote | null;
  selected: boolean;
  onSelect: () => void;
}

export default function VehicleCard({
  vehicle,
  quote,
  selected,
  onSelect,
}: VehicleCardProps) {
  const price = quote?.final_price ?? vehicle.base_price;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[styles.card, selected && styles.selected]}
    >
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}

      {vehicle.image_url ? (
        <Image
          source={{ uri: vehicle.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🚗</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <Text style={styles.model}>{vehicle.model}</Text>
        <View style={styles.row}>
          <Badge label={vehicle.category} />
          <Text style={styles.capacity}>👤 {vehicle.capacity}</Text>
        </View>
        <Text style={styles.price}>
          AED {price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121A2B',
    borderColor: '#1E2940',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  selected: {
    borderColor: '#38BDF8',
    borderWidth: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#38BDF8',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkmarkText: {
    color: '#0B1220',
    fontWeight: '700',
    fontSize: 13,
  },
  image: {
    width: 110,
    height: 90,
  },
  imagePlaceholder: {
    width: 110,
    height: 90,
    backgroundColor: '#1E2940',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  name: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
  },
  model: {
    color: '#94A3B8',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  capacity: {
    color: '#94A3B8',
    fontSize: 12,
  },
  price: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
});
