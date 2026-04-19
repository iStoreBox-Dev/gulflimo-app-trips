import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BookingStatusBadge from '../booking/BookingStatusBadge';
import type { Booking } from '@/types';

interface BookingListItemProps {
  booking: Booking;
  onPress: () => void;
}

export default function BookingListItem({ booking, onPress }: BookingListItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.item}>
      <View style={styles.topRow}>
        <Text style={styles.ref}>{booking.booking_ref}</Text>
        <BookingStatusBadge status={booking.status} />
      </View>
      <Text style={styles.name}>
        {booking.first_name} {booking.last_name}
      </Text>
      <Text style={styles.route} numberOfLines={1}>
        {booking.pickup_location}
        {booking.dropoff_location ? ` → ${booking.dropoff_location}` : ''}
      </Text>
      <View style={styles.bottomRow}>
        <Text style={styles.date}>{booking.departure_date}</Text>
        <Text style={styles.price}>
          AED {booking.final_price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#121A2B',
    borderColor: '#1E2940',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ref: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  route: {
    color: '#94A3B8',
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  date: {
    color: '#94A3B8',
    fontSize: 12,
  },
  price: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
});
