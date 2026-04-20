import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getVehiclesApi } from '@/lib/api';
import VehicleCard from '@/components/booking/VehicleCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default function TripsList() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({ queryKey: ['vehicles'], queryFn: getVehiclesApi });
  const vehicles = data?.vehicles ?? [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Book a Trip' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Available Vehicles</Text>
        {isLoading ? (
          <LoadingOverlay />
        ) : error ? (
          <Text style={styles.error}>Failed to load vehicles.</Text>
        ) : (
          vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              quote={null}
              selected={false}
              onSelect={() => {
                // Navigate to booking form with vehicle preselected
                router.push(`/(public)/booking?vehicle_id=${v.id}`);
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 12, paddingBottom: 40, maxWidth: 1024, width: '100%', alignSelf: 'center' },
  header: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  error: { color: '#F87171' },
});
