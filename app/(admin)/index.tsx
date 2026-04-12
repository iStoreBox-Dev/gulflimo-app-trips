import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { clearAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import {
  getBookingStatsApi,
  getBookingAnalyticsApi,
  listBookingsApi,
} from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import StatCard from '@/components/admin/StatCard';
import BookingListItem from '@/components/admin/BookingListItem';
import { SkeletonRow } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';

export default function DashboardScreen() {
  const statsQuery = useQuery({
    queryKey: ['booking-stats'],
    queryFn: getBookingStatsApi,
  });

  const analyticsQuery = useQuery({
    queryKey: ['booking-analytics'],
    queryFn: getBookingAnalyticsApi,
  });

  const recentQuery = useQuery({
    queryKey: ['bookings', { limit: 5 }],
    queryFn: () => listBookingsApi({ limit: 5 }),
  });

  const stats = statsQuery.data?.stats;
  const analytics = analyticsQuery.data;
  const recentBookings = recentQuery.data?.bookings ?? [];

  const refreshing =
    statsQuery.isFetching || analyticsQuery.isFetching || recentQuery.isFetching;

  const onRefresh = () => {
    statsQuery.refetch();
    analyticsQuery.refetch();
    recentQuery.refetch();
  };

  const handleLogout = async () => {
    await clearAuth();
    queryClient.clear();
    router.replace('/(admin)/login');
  };

  // Build bar chart from last 7 daily bookings
  const chartData = analytics?.daily_bookings?.slice(-7) ?? [];
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <View style={styles.screen}>
      <AdminHeader title="Dashboard" onLogout={handleLogout} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A84C"
          />
        }
      >
        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        {statsQuery.isLoading ? (
          <View style={styles.statsGrid}>
            <Skeleton width="48%" height={90} borderRadius={12} />
            <Skeleton width="48%" height={90} borderRadius={12} />
            <Skeleton width="48%" height={90} borderRadius={12} />
            <Skeleton width="48%" height={90} borderRadius={12} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Bookings"
              value={stats?.total ?? 0}
              color="#3B82F6"
            />
            <StatCard
              label="Today"
              value={stats?.bookings_today ?? 0}
              color="#C9A84C"
            />
            <StatCard
              label="Pending"
              value={stats?.pending ?? 0}
              color="#F59E0B"
            />
            <StatCard
              label="Revenue Today"
              value={`AED ${(stats?.revenue_today ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
              color="#22C55E"
            />
          </View>
        )}

        {/* Analytics Chart */}
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        {analyticsQuery.isLoading ? (
          <Skeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: 20 }} />
        ) : (
          <View style={styles.chartContainer}>
            {chartData.map((d) => (
              <View key={d.date} style={styles.chartBar}>
                <Text style={styles.chartCount}>{d.count}</Text>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(4, (d.count / maxCount) * 80) },
                  ]}
                />
                <Text style={styles.chartLabel}>
                  {d.date.slice(5)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/bookings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentQuery.isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : (
          recentBookings.map((b) => (
            <BookingListItem
              key={b.id}
              booking={b}
              onPress={() => router.push(`/(admin)/booking-detail?id=${b.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    color: '#F5F0E8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  seeAll: {
    color: '#C9A84C',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    height: 140,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  chartCount: {
    color: '#6b6b6b',
    fontSize: 10,
  },
  bar: {
    width: '60%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
    minHeight: 4,
  },
  chartLabel: {
    color: '#6b6b6b',
    fontSize: 9,
  },
});
