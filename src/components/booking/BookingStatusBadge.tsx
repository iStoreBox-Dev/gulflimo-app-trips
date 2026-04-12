import React from 'react';
import Badge from '../ui/Badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/constants';
import type { BookingStatus } from '@/types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <Badge
      label={BOOKING_STATUS_LABELS[status]}
      color={BOOKING_STATUS_COLORS[status]}
    />
  );
}
