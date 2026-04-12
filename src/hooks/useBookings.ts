import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBookingsApi,
  getBookingApi,
  updateBookingStatusApi,
  assignChauffeurApi,
  addBookingNoteApi,
  getBookingStatsApi,
  getBookingAnalyticsApi,
  type ListBookingsParams,
} from '@/lib/api';
import type { BookingStatus } from '@/types';

export function useBookings(params?: ListBookingsParams) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => listBookingsApi(params),
  });
}

export function useBooking(id: number | string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingApi(id),
    enabled: !!id,
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: ['booking-stats'],
    queryFn: getBookingStatsApi,
  });
}

export function useBookingAnalytics() {
  return useQuery({
    queryKey: ['booking-analytics'],
    queryFn: getBookingAnalyticsApi,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: BookingStatus }) =>
      updateBookingStatusApi(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useAssignChauffeur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      chauffeur_id,
      vehicle_id,
    }: {
      id: number | string;
      chauffeur_id: number;
      vehicle_id?: number;
    }) => assignChauffeurApi(id, chauffeur_id, vehicle_id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['chauffeurs'] });
    },
  });
}

export function useAddBookingNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number | string; note: string }) =>
      addBookingNoteApi(id, note),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['booking-logs', id] });
    },
  });
}
