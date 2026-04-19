import type { BookingStatus, ChauffeurStatus } from '@/types';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  chauffeur_assigned: 'Chauffeur Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  chauffeur_assigned: '#8B5CF6',
  in_progress: '#38BDF8',
  completed: '#22C55E',
  cancelled: '#6B7280',
  rejected: '#EF4444',
};

export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['chauffeur_assigned', 'cancelled', 'rejected'],
  chauffeur_assigned: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
};

export const COUNTRY_CODES = [
  { code: '+971', label: '+971', country: 'UAE' },
  { code: '+966', label: '+966', country: 'Saudi Arabia' },
  { code: '+965', label: '+965', country: 'Kuwait' },
  { code: '+974', label: '+974', country: 'Qatar' },
  { code: '+973', label: '+973', country: 'Bahrain' },
  { code: '+968', label: '+968', country: 'Oman' },
  { code: '+44', label: '+44', country: 'United Kingdom' },
  { code: '+1', label: '+1', country: 'United States' },
];

export const CHAUFFEUR_STATUS_COLOR: Record<ChauffeurStatus, string> = {
  available: '#22C55E',
  on_trip: '#38BDF8',
  off_duty: '#F59E0B',
  inactive: '#6B7280',
};
