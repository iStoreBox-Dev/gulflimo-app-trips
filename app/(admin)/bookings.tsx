import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listBookingsApi } from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import BookingListItem from '@/components/admin/BookingListItem';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { Booking } from '@/types';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Chauffeur Assigned', value: 'chauffeur_assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

export default function BookingsScreen() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(1);
      setAllBookings([]);
    }, 400);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
    setAllBookings([]);
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bookings', { status, search: debouncedSearch, page }],
    queryFn: () =>
      listBookingsApi({ status: status || undefined, search: debouncedSearch || undefined, page, limit: 20 }),
  });

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAllBookings(data.bookings);
    } else {
      setAllBookings((prev) => [...prev, ...data.bookings]);
    }
  }, [data, page]);

  const pages = data?.pages ?? 1;
  const hasMore = page < pages;

  const loadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const onRefresh = () => {
    setPage(1);
    setAllBookings([]);
    refetch();
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Bookings" />

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={status}
            onValueChange={handleStatusChange}
            style={styles.picker}
            dropdownIconColor="#C9A84C"
          >
            {STATUS_OPTIONS.map((o) => (
              <Picker.Item key={o.value} label={o.label} value={o.value} />
            ))}
          </Picker>
        </View>
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search ref, name, email..."
          placeholderTextColor="#6b6b6b"
          style={styles.searchInput}
        />
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.skeletonWrap}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={allBookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BookingListItem
              booking={item}
              onPress={() => router.push(`/(admin)/booking-detail?id=${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={onRefresh}
              tintColor="#C9A84C"
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title="No bookings found"
                message="Try adjusting your filters or search."
              />
            ) : null
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                {isFetching ? (
                  <ActivityIndicator color="#C9A84C" size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  filters: {
    padding: 12,
    gap: 8,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  pickerWrapper: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#F5F0E8',
    height: 44,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    color: '#F5F0E8',
    fontSize: 14,
  },
  skeletonWrap: {
    padding: 16,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  loadMoreBtn: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: '#C9A84C',
    fontWeight: '600',
    fontSize: 14,
  },
});
