import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BookingStatusBadge from './BookingStatusBadge';
import type { Booking } from '@/types';

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

export default function BookingCard({ booking, onPress }: BookingCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.ref}>{booking.booking_ref}</Text>
        <BookingStatusBadge status={booking.status} />
      </View>
      <Text style={styles.vehicle}>{booking.vehicle_snapshot.name}</Text>
      <Text style={styles.route} numberOfLines={1}>
        {booking.pickup_location}
        {booking.dropoff_location ? ` → ${booking.dropoff_location}` : ''}
      </Text>
      <View style={styles.bottomRow}>
        <Text style={styles.date}>{booking.departure_date} · {booking.departure_time}</Text>
        <Text style={styles.price}>
          AED {booking.final_price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ref: {
    color: '#C9A84C',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
  },
  vehicle: {
    color: '#F5F0E8',
    fontWeight: '600',
    fontSize: 14,
  },
  route: {
    color: '#6b6b6b',
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    color: '#6b6b6b',
    fontSize: 12,
  },
  price: {
    color: '#F5F0E8',
    fontWeight: '600',
    fontSize: 14,
  },
});
