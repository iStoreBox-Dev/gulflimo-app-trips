import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { lookupBookingApi, cancelBookingByRefApi, getApiError } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { Booking } from '@/types';

export default function LookupScreen() {
  const params = useLocalSearchParams<{ ref?: string; email?: string }>();
  const [ref, setRef] = useState(params.ref ?? '');
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (params.ref && params.email) {
      handleLookup(params.ref, params.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLookup = async (r?: string, e?: string) => {
    const lookupRef = r ?? ref;
    const lookupEmail = e ?? email;
    if (!lookupRef.trim() || !lookupEmail.trim()) {
      setError('Please enter both booking reference and email');
      return;
    }
    setLoading(true);
    setError('');
    setNotFound(false);
    setBooking(null);
    setSuccessMsg('');
    try {
      const data = await lookupBookingApi(lookupRef.trim().toUpperCase(), lookupEmail.trim().toLowerCase());
      setBooking(data.booking);
    } catch (err) {
      const msg = getApiError(err);
      if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
        setNotFound(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel your booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!booking) return;
            setCancelling(true);
            try {
              const data = await cancelBookingByRefApi(
                booking.booking_ref,
                email.trim().toLowerCase()
              );
              setBooking(data.booking);
              setSuccessMsg('Your booking has been cancelled.');
            } catch (err) {
              setError(getApiError(err));
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const canCancel = booking && (booking.status === 'pending' || booking.status === 'confirmed');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Find My Booking</Text>

      <Input
        label="Booking Reference"
        value={ref}
        onChangeText={(v) => setRef(v.toUpperCase())}
        placeholder="GL-XXXXXX"
        autoCapitalize="characters"
      />
      <Input
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        label="Find My Booking"
        onPress={() => handleLookup()}
        loading={loading}
        size="lg"
        style={styles.searchBtn}
      />

      {loading && (
        <View style={styles.skeletonWrap}>
          <SkeletonRow />
          <SkeletonRow />
        </View>
      )}

      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {notFound && !loading && (
        <EmptyState
          title="Booking Not Found"
          message="Check your reference and email and try again."
        />
      )}

      {booking && !loading && (
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingRef}>{booking.booking_ref}</Text>
            <BookingStatusBadge status={booking.status} />
          </View>
          <Text style={styles.bookingVehicle}>{booking.vehicle_snapshot.name}</Text>
          <Text style={styles.bookingRoute}>
            📍 {booking.pickup_location}
          </Text>
          {booking.dropoff_location ? (
            <Text style={styles.bookingRoute}>
              🏁 {booking.dropoff_location}
            </Text>
          ) : null}
          <Text style={styles.bookingDetail}>
            📅 {booking.departure_date} · {booking.departure_time}
          </Text>
          <Text style={styles.bookingDetail}>
            👤 {booking.first_name} {booking.last_name}
          </Text>
          <Text style={styles.bookingPrice}>
            AED {booking.final_price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </Text>

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Text style={styles.cancelBtnText}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: '#F5F0E8',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  searchBtn: {
    marginTop: 8,
  },
  skeletonWrap: {
    marginTop: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 8,
  },
  successBanner: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  successText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingRef: {
    color: '#C9A84C',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 16,
  },
  bookingVehicle: {
    color: '#F5F0E8',
    fontWeight: '700',
    fontSize: 16,
  },
  bookingRoute: {
    color: '#F5F0E8',
    fontSize: 13,
  },
  bookingDetail: {
    color: '#6b6b6b',
    fontSize: 13,
  },
  bookingPrice: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
});
