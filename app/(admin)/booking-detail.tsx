import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookingApi,
  getBookingLogsApi,
  updateBookingStatusApi,
  assignChauffeurApi,
  addBookingNoteApi,
  listChauffeursApi,
  getApiError,
} from '@/lib/api';
import { STATUS_TRANSITIONS } from '@/lib/constants';
import AdminHeader from '@/components/admin/AdminHeader';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import Button from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { BookingStatus } from '@/types';

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingApi(id!),
    enabled: !!id,
  });

  const logsQuery = useQuery({
    queryKey: ['booking-logs', id],
    queryFn: () => getBookingLogsApi(id!),
    enabled: !!id,
  });

  const booking = bookingQuery.data?.booking;
  const logs = logsQuery.data?.logs ?? [];

  const [statusError, setStatusError] = useState('');
  const [assignError, setAssignError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<number | null>(null);

  const chauffeursQuery = useQuery({
    queryKey: ['chauffeurs', { assignable: true }],
    queryFn: () => listChauffeursApi({ assignable: true }),
    enabled: showAssignModal,
  });

  const statusMutation = useMutation({
    mutationFn: (status: BookingStatus) => updateBookingStatusApi(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setStatusError('');
    },
    onError: (err) => setStatusError(getApiError(err)),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignChauffeurApi(id!, selectedChauffeurId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['chauffeurs'] });
      setShowAssignModal(false);
      setAssignError('');
    },
    onError: (err) => setAssignError(getApiError(err)),
  });

  const noteMutation = useMutation({
    mutationFn: () => addBookingNoteApi(id!, noteText.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-logs', id] });
      setNoteText('');
      setNoteError('');
    },
    onError: (err) => setNoteError(getApiError(err)),
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (bookingQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <AdminHeader title="Booking Detail" />
        <View style={styles.padding}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.screen}>
        <AdminHeader title="Booking Detail" />
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const transitions = STATUS_TRANSITIONS[booking.status] ?? [];
  const isTerminal = transitions.length === 0;
  const canAssign =
    booking.status === 'confirmed' || booking.status === 'chauffeur_assigned';

  return (
    <View style={styles.screen}>
      <AdminHeader title={`Booking · ${booking.booking_ref}`} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Section 1 — Header */}
        <Text style={styles.bookingRef}>{booking.booking_ref}</Text>
        <View style={styles.rowSpread}>
          <BookingStatusBadge status={booking.status} />
          <Text style={styles.muted}>{formatDate(booking.created_at)}</Text>
        </View>

        {/* Section 2 — Route */}
        <SectionTitle title="Route" />
        <View style={styles.card}>
          <Text style={styles.cardRow}>📍 {booking.pickup_location}</Text>
          {booking.service_type === 'hourly' ? (
            <Text style={styles.cardRow}>
              ⏱ Hourly · {booking.hourly_duration}h
            </Text>
          ) : (
            <Text style={styles.cardRow}>
              🏁 {booking.dropoff_location ?? '—'}
            </Text>
          )}
          <Text style={styles.cardRow}>
            📅 {booking.departure_date} · ⏰ {booking.departure_time}
          </Text>
          {booking.transfer_type === 'return' && booking.return_date && (
            <Text style={styles.cardRow}>
              🔄 Return: {booking.return_date} · {booking.return_time}
            </Text>
          )}
          {booking.flight_number && (
            <Text style={styles.cardRow}>✈️ {booking.flight_number}</Text>
          )}
        </View>

        {/* Section 3 — Customer */}
        <SectionTitle title="Customer" />
        <View style={styles.card}>
          <Text style={styles.cardRow}>
            👤 {booking.first_name} {booking.last_name}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${booking.email}`)}
          >
            <Text style={[styles.cardRow, styles.link]}>✉️ {booking.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(`tel:${booking.country_code}${booking.phone}`)
            }
          >
            <Text style={[styles.cardRow, styles.link]}>
              📞 {booking.country_code} {booking.phone}
            </Text>
          </TouchableOpacity>
          <Text style={styles.cardRow}>
            🧳 {booking.passengers} pax · {booking.luggage} bags
          </Text>
        </View>

        {/* Section 4 — Vehicle & Pricing */}
        <SectionTitle title="Vehicle & Pricing" />
        <View style={styles.card}>
          <Text style={styles.cardRow}>
            🚗 {booking.vehicle_snapshot.name} · {booking.vehicle_snapshot.model} ·{' '}
            {booking.vehicle_snapshot.category}
          </Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Price</Text>
            <Text style={styles.pricingValue}>
              AED {booking.base_price.toFixed(0)}
            </Text>
          </View>
          {booking.add_ons_price > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Add-ons</Text>
              <Text style={styles.pricingValue}>
                +AED {booking.add_ons_price.toFixed(0)}
              </Text>
            </View>
          )}
          {booking.discount_amount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Promo {booking.promo_code ? `(${booking.promo_code})` : ''}
              </Text>
              <Text style={[styles.pricingValue, { color: '#22C55E' }]}>
                -AED {booking.discount_amount.toFixed(0)}
              </Text>
            </View>
          )}
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              AED {booking.final_price.toFixed(0)}
            </Text>
          </View>
          {booking.special_requests && (
            <Text style={styles.specialReqs}>
              📝 {booking.special_requests}
            </Text>
          )}
        </View>

        {/* Section 5 — Chauffeur */}
        <SectionTitle title="Chauffeur" />
        <View style={styles.card}>
          {booking.chauffeur_id ? (
            <Text style={styles.cardRow}>
              👨‍✈️ Chauffeur #{booking.chauffeur_id}
            </Text>
          ) : (
            <Text style={styles.muted}>Not assigned yet</Text>
          )}
        </View>

        {/* Section 6 — Actions */}
        {!isTerminal && (
          <>
            <SectionTitle title="Actions" />

            {statusError ? (
              <Text style={styles.errorText}>{statusError}</Text>
            ) : null}

            {transitions.length > 0 && (
              <View style={styles.actionsRow}>
                {transitions.map((s) => (
                  <Button
                    key={s}
                    label={s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    onPress={() => statusMutation.mutate(s)}
                    loading={statusMutation.isPending}
                    variant={s === 'cancelled' || s === 'rejected' ? 'danger' : 'secondary'}
                    size="sm"
                    style={styles.actionBtn}
                  />
                ))}
              </View>
            )}

            {canAssign && (
              <Button
                label="Assign Chauffeur"
                onPress={() => setShowAssignModal(true)}
                variant="secondary"
                size="md"
                style={styles.assignBtn}
              />
            )}

            {assignError ? (
              <Text style={styles.errorText}>{assignError}</Text>
            ) : null}

            {/* Add Note */}
            <SectionTitle title="Add Note" />
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add internal note..."
              placeholderTextColor="#6b6b6b"
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
            {noteError ? (
              <Text style={styles.errorText}>{noteError}</Text>
            ) : null}
            <Button
              label="Save Note"
              onPress={() => {
                if (!noteText.trim()) return;
                noteMutation.mutate();
              }}
              loading={noteMutation.isPending}
              size="md"
              style={styles.saveNoteBtn}
            />
          </>
        )}

        {/* Section 7 — Activity Log */}
        <SectionTitle title="Activity Log" />
        {logsQuery.isLoading ? (
          <SkeletonRow />
        ) : (
          <View style={styles.card}>
            {logs.length === 0 && (
              <Text style={styles.muted}>No activity yet</Text>
            )}
            {[...logs].reverse().map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logAction}>{log.action}</Text>
                {log.note ? (
                  <Text style={styles.logNote}>{log.note}</Text>
                ) : null}
                <Text style={styles.logDate}>
                  {formatDate(log.created_at)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Assign Chauffeur Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Chauffeur</Text>
            {chauffeursQuery.isLoading ? (
              <ActivityIndicator color="#C9A84C" />
            ) : (
              <FlatList
                data={chauffeursQuery.data?.chauffeurs ?? []}
                keyExtractor={(c) => String(c.id)}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.chauffeurRow,
                      selectedChauffeurId === item.id && styles.chauffeurSelected,
                    ]}
                    onPress={() => setSelectedChauffeurId(item.id)}
                  >
                    <Text style={styles.chauffeurName}>{item.full_name}</Text>
                    <Text style={styles.chauffeurPhone}>{item.phone}</Text>
                    <Text style={styles.chauffeurStatus}>{item.status}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            {assignError ? (
              <Text style={styles.errorText}>{assignError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setShowAssignModal(false)}
                size="md"
              />
              <Button
                label="Assign"
                onPress={() => {
                  if (!selectedChauffeurId) return;
                  assignMutation.mutate();
                }}
                loading={assignMutation.isPending}
                disabled={!selectedChauffeurId}
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>
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
  padding: {
    padding: 16,
  },
  bookingRef: {
    color: '#C9A84C',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 8,
    letterSpacing: 1,
  },
  rowSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F5F0E8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 4,
  },
  cardRow: {
    color: '#F5F0E8',
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: '#C9A84C',
    textDecorationLine: 'underline',
  },
  muted: {
    color: '#6b6b6b',
    fontSize: 13,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    color: '#6b6b6b',
    fontSize: 13,
  },
  pricingValue: {
    color: '#F5F0E8',
    fontSize: 13,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
  },
  totalLabel: {
    color: '#F5F0E8',
    fontWeight: '700',
    fontSize: 15,
  },
  totalValue: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 18,
  },
  specialReqs: {
    color: '#6b6b6b',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
  },
  assignBtn: {
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#F5F0E8',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
  },
  logRow: {
    paddingVertical: 8,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
    gap: 2,
  },
  logAction: {
    color: '#F5F0E8',
    fontWeight: '600',
    fontSize: 13,
  },
  logNote: {
    color: '#6b6b6b',
    fontSize: 12,
  },
  logDate: {
    color: '#6b6b6b',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#F5F0E8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chauffeurRow: {
    padding: 12,
    borderRadius: 8,
    borderColor: '#2a2a2a',
    borderWidth: 1,
    marginBottom: 8,
    gap: 2,
  },
  chauffeurSelected: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  chauffeurName: {
    color: '#F5F0E8',
    fontWeight: '600',
    fontSize: 14,
  },
  chauffeurPhone: {
    color: '#6b6b6b',
    fontSize: 12,
  },
  chauffeurStatus: {
    color: '#C9A84C',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
