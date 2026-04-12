import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import type { Vehicle, AddOns, Quote } from '@/types';

interface QuoteSummaryProps {
  pickup: string;
  dropoff?: string | null;
  date: string;
  time: string;
  vehicle: Vehicle | null;
  addOns: AddOns;
  promoCode?: string | null;
  discount: number;
  quote: Quote | null;
}

const ADD_ON_LABELS: Record<keyof AddOns, string> = {
  meet_greet: 'Meet & Greet',
  extra_stop: 'Extra Stop',
  child_seat: 'Child Seat',
  pet_friendly: 'Pet Friendly',
  extra_luggage: 'Extra Luggage',
};

export default function QuoteSummary({
  pickup,
  dropoff,
  date,
  time,
  vehicle,
  addOns,
  promoCode,
  discount,
  quote,
}: QuoteSummaryProps) {
  const activeAddOns = (Object.keys(addOns) as (keyof AddOns)[]).filter(
    (k) => addOns[k]
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.header}>Booking Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>📍 Route</Text>
        <Text style={styles.value} numberOfLines={2}>
          {pickup}
          {dropoff ? ` → ${dropoff}` : ''}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>📅 Date & Time</Text>
        <Text style={styles.value}>
          {date} · {time}
        </Text>
      </View>

      {vehicle && (
        <View style={styles.row}>
          <Text style={styles.label}>🚗 Vehicle</Text>
          <Text style={styles.value}>{vehicle.name}</Text>
        </View>
      )}

      {activeAddOns.length > 0 && (
        <View style={styles.addOnsSection}>
          <Text style={styles.label}>Add-ons</Text>
          {activeAddOns.map((k) => (
            <View key={k} style={styles.addOnRow}>
              <Text style={styles.addOnLabel}>+ {ADD_ON_LABELS[k]}</Text>
            </View>
          ))}
        </View>
      )}

      {quote && quote.add_ons_price > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Add-ons Total</Text>
          <Text style={styles.value}>
            +AED {quote.add_ons_price.toFixed(0)}
          </Text>
        </View>
      )}

      {discount > 0 && promoCode && (
        <View style={styles.row}>
          <Text style={styles.label}>Promo ({promoCode})</Text>
          <Text style={styles.promoValue}>-AED {discount.toFixed(0)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          AED {quote ? quote.final_price.toFixed(0) : '—'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
  },
  header: {
    color: '#F5F0E8',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    color: '#6b6b6b',
    fontSize: 13,
    flex: 1,
  },
  value: {
    color: '#F5F0E8',
    fontSize: 13,
    flex: 2,
    textAlign: 'right',
  },
  promoValue: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  addOnsSection: {
    marginBottom: 10,
  },
  addOnRow: {
    marginTop: 4,
    paddingLeft: 8,
  },
  addOnLabel: {
    color: '#F5F0E8',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#F5F0E8',
    fontWeight: '700',
    fontSize: 16,
  },
  totalValue: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 22,
  },
});
