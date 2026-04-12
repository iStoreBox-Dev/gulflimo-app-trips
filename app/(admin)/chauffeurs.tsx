import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listChauffeursApi,
  createChauffeurApi,
  updateChauffeurApi,
  toggleChauffeurApi,
  deleteChauffeurApi,
  getVehiclesApi,
  getApiError,
} from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { CHAUFFEUR_STATUS_COLOR } from '@/lib/constants';
import type { Chauffeur, ChauffeurStatus } from '@/types';

const STATUS_OPTIONS: ChauffeurStatus[] = ['available', 'on_trip', 'off_duty', 'inactive'];

interface ChauffeurFormData {
  full_name: string;
  phone: string;
  email: string;
  national_id: string;
  license_number: string;
  license_expiry: string;
  status: ChauffeurStatus;
  assigned_vehicle_id: string;
  notes: string;
}

const defaultForm: ChauffeurFormData = {
  full_name: '',
  phone: '',
  email: '',
  national_id: '',
  license_number: '',
  license_expiry: '',
  status: 'available',
  assigned_vehicle_id: '',
  notes: '',
};

function ChauffeurModal({
  visible,
  chauffeur,
  onClose,
}: {
  visible: boolean;
  chauffeur: Chauffeur | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ChauffeurFormData>(
    chauffeur
      ? {
          full_name: chauffeur.full_name,
          phone: chauffeur.phone,
          email: chauffeur.email ?? '',
          national_id: chauffeur.national_id ?? '',
          license_number: chauffeur.license_number ?? '',
          license_expiry: chauffeur.license_expiry ?? '',
          status: chauffeur.status,
          assigned_vehicle_id: chauffeur.assigned_vehicle_id
            ? String(chauffeur.assigned_vehicle_id)
            : '',
          notes: chauffeur.notes ?? '',
        }
      : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ChauffeurFormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehiclesApi,
  });

  const update = <K extends keyof ChauffeurFormData>(k: K, v: ChauffeurFormData[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        national_id: form.national_id.trim() || undefined,
        license_number: form.license_number.trim() || undefined,
        license_expiry: form.license_expiry || undefined,
        status: form.status,
        assigned_vehicle_id: form.assigned_vehicle_id
          ? Number(form.assigned_vehicle_id)
          : undefined,
        notes: form.notes.trim() || undefined,
        languages: [],
      };
      if (chauffeur) {
        return updateChauffeurApi(chauffeur.id, payload);
      }
      return createChauffeurApi(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chauffeurs'] });
      onClose();
    },
    onError: (err) => setApiError(getApiError(err)),
  });

  const validate = () => {
    const errs: Partial<Record<keyof ChauffeurFormData, string>> = {};
    if (!form.full_name.trim()) errs.full_name = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            {chauffeur ? 'Edit Chauffeur' : 'Add Chauffeur'}
          </Text>
          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
          <Input
            label="Full Name *"
            value={form.full_name}
            onChangeText={(v) => update('full_name', v)}
            error={errors.full_name}
          />
          <Input
            label="Phone *"
            value={form.phone}
            onChangeText={(v) => update('phone', v)}
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <Input
            label="Email (optional)"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
          />
          <Input
            label="National ID (optional)"
            value={form.national_id}
            onChangeText={(v) => update('national_id', v)}
          />
          <Input
            label="License Number (optional)"
            value={form.license_number}
            onChangeText={(v) => update('license_number', v)}
          />

          <Text style={styles.pickerLabel}>License Expiry (optional)</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={form.license_expiry}
              onChange={(e) => update('license_expiry', e.target.value)}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#F5F0E8',
                border: '1px solid #3a3a3a',
                borderRadius: 8,
                height: 44,
                padding: '0 12px',
                fontSize: 14,
                marginBottom: 12,
                width: '100%',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowExpiryPicker(true)}
              >
                <Text style={form.license_expiry ? styles.dateBtnText : styles.datePlaceholder}>
                  {form.license_expiry || 'Select expiry date'}
                </Text>
              </TouchableOpacity>
              {showExpiryPicker && (
                <DateTimePicker
                  value={
                    form.license_expiry ? new Date(form.license_expiry) : new Date()
                  }
                  mode="date"
                  onChange={(_: unknown, date?: Date) => {
                    setShowExpiryPicker(false);
                    if (date) update('license_expiry', date.toISOString().split('T')[0]);
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.pickerLabel}>Status</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.status}
              onValueChange={(v) => update('status', v as ChauffeurStatus)}
              style={styles.picker}
              dropdownIconColor="#C9A84C"
            >
              {STATUS_OPTIONS.map((s) => (
                <Picker.Item
                  key={s}
                  label={s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={s}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.pickerLabel}>Assigned Vehicle (optional)</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.assigned_vehicle_id}
              onValueChange={(v) => update('assigned_vehicle_id', String(v))}
              style={styles.picker}
              dropdownIconColor="#C9A84C"
            >
              <Picker.Item label="None" value="" />
              {(vehiclesQuery.data?.vehicles ?? []).map((v) => (
                <Picker.Item key={v.id} label={`${v.name} (${v.model})`} value={String(v.id)} />
              ))}
            </Picker>
          </View>

          <Input
            label="Notes (optional)"
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
            numberOfLines={2}
          />

          <View style={styles.modalActions}>
            <Button label="Cancel" variant="ghost" onPress={onClose} size="md" />
            <Button
              label="Save"
              onPress={() => {
                if (validate()) saveMutation.mutate();
              }}
              loading={saveMutation.isPending}
              size="md"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ChauffeursScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalChauffeur, setModalChauffeur] = useState<Chauffeur | null | 'new'>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chauffeurs', { search: debouncedSearch }],
    queryFn: () => listChauffeursApi({ search: debouncedSearch || undefined }),
  });

  const chauffeurs = data?.chauffeurs ?? [];

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleChauffeurApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chauffeurs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChauffeurApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chauffeurs'] }),
  });

  const handleDelete = (c: Chauffeur) => {
    Alert.alert('Delete Chauffeur', `Delete "${c.full_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(c.id),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Chauffeurs" />
      <View style={styles.searchBar}>
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search chauffeurs..."
          placeholderTextColor="#6b6b6b"
          style={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <View style={styles.padding}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={chauffeurs}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.chauffeurRow}>
              <View style={styles.chauffeurInfo}>
                <Text style={styles.chauffeurName}>{item.full_name}</Text>
                <Text style={styles.chauffeurPhone}>{item.phone}</Text>
                <Badge
                  label={item.status.replace(/_/g, ' ')}
                  color={CHAUFFEUR_STATUS_COLOR[item.status]}
                />
              </View>
              <View style={styles.chauffeurActions}>
                <TouchableOpacity
                  style={styles.toggleStatusBtn}
                  onPress={() => toggleMutation.mutate(item.id)}
                >
                  <Text style={styles.toggleStatusText}>
                    {item.is_active ? '✅' : '❌'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setModalChauffeur(item)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No chauffeurs"
              message="Add your first chauffeur."
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalChauffeur('new')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {(modalChauffeur === 'new' ||
        (modalChauffeur && modalChauffeur !== 'new')) && (
        <ChauffeurModal
          visible
          chauffeur={
            modalChauffeur === 'new' ? null : (modalChauffeur as Chauffeur)
          }
          onClose={() => setModalChauffeur(null)}
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
  searchBar: {
    padding: 12,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
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
  padding: {
    padding: 16,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  chauffeurRow: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chauffeurInfo: {
    flex: 1,
    gap: 4,
  },
  chauffeurName: {
    color: '#F5F0E8',
    fontWeight: '700',
    fontSize: 15,
  },
  chauffeurPhone: {
    color: '#6b6b6b',
    fontSize: 12,
    marginBottom: 4,
  },
  chauffeurActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleStatusBtn: {
    padding: 6,
  },
  toggleStatusText: {
    fontSize: 18,
  },
  editBtn: {
    padding: 6,
  },
  editBtnText: {
    fontSize: 16,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#0a0a0a',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
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
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#F5F0E8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  pickerLabel: {
    color: '#6b6b6b',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  pickerWrapper: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#F5F0E8',
    height: 44,
  },
  dateBtn: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dateBtnText: {
    color: '#F5F0E8',
    fontSize: 14,
  },
  datePlaceholder: {
    color: '#6b6b6b',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
  },
});
