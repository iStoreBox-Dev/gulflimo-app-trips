import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllVehiclesApi,
  createVehicleApi,
  updateVehicleApi,
  deleteVehicleApi,
  getApiError,
} from '@/lib/api';
import AdminHeader from '@/components/admin/AdminHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { Vehicle, VehicleCategory } from '@/types';

const CATEGORIES: VehicleCategory[] = ['sedan', 'business', 'suv', 'van', 'luxury'];

interface VehicleFormData {
  name: string;
  model: string;
  category: VehicleCategory;
  capacity: number;
  base_price: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

const defaultForm: VehicleFormData = {
  name: '',
  model: '',
  category: 'sedan',
  capacity: 4,
  base_price: '',
  description: '',
  image_url: '',
  is_active: true,
};

function VehicleModal({
  visible,
  vehicle,
  onClose,
}: {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<VehicleFormData>(
    vehicle
      ? {
          name: vehicle.name,
          model: vehicle.model,
          category: vehicle.category,
          capacity: vehicle.capacity,
          base_price: String(vehicle.base_price),
          description: vehicle.description ?? '',
          image_url: vehicle.image_url ?? '',
          is_active: vehicle.is_active,
        }
      : defaultForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [apiError, setApiError] = useState('');

  const update = <K extends keyof VehicleFormData>(k: K, v: VehicleFormData[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        model: form.model.trim(),
        category: form.category,
        capacity: form.capacity,
        base_price: parseFloat(form.base_price),
        description: form.description.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        is_active: form.is_active,
      };
      if (vehicle) {
        return updateVehicleApi(vehicle.id, payload);
      }
      return createVehicleApi(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-vehicles'] });
      onClose();
    },
    onError: (err) => setApiError(getApiError(err)),
  });

  const validate = () => {
    const errs: Partial<Record<keyof VehicleFormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.model.trim()) errs.model = 'Required';
    if (!form.base_price || isNaN(parseFloat(form.base_price)))
      errs.base_price = 'Valid price required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </Text>
          {apiError ? (
            <Text style={styles.errorText}>{apiError}</Text>
          ) : null}
          <Input label="Name *" value={form.name} onChangeText={(v) => update('name', v)} error={errors.name} />
          <Input label="Model *" value={form.model} onChangeText={(v) => update('model', v)} error={errors.model} />
          <Text style={styles.pickerLabel}>Category</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.category}
              onValueChange={(v) => update('category', v as VehicleCategory)}
              style={styles.picker}
              dropdownIconColor="#38BDF8"
            >
              {CATEGORIES.map((c) => (
                <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} />
              ))}
            </Picker>
          </View>
          <View style={styles.stepperRow}>
            <Text style={styles.pickerLabel}>Capacity: {form.capacity}</Text>
            <View style={styles.stepperBtns}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => update('capacity', Math.max(1, form.capacity - 1))}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => update('capacity', Math.min(20, form.capacity + 1))}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Input
            label="Base Price (AED) *"
            value={form.base_price}
            onChangeText={(v) => update('base_price', v)}
            keyboardType="decimal-pad"
            error={errors.base_price}
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChangeText={(v) => update('description', v)}
            multiline
            numberOfLines={2}
          />
          <Input
            label="Image URL (optional)"
            value={form.image_url}
            onChangeText={(v) => update('image_url', v)}
            placeholder="https://..."
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={form.is_active}
              onValueChange={(v) => update('is_active', v)}
              trackColor={{ false: '#1E2940', true: '#38BDF8' }}
              thumbColor="#F8FAFC"
            />
          </View>
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

export default function VehiclesScreen() {
  const qc = useQueryClient();
  const [modalVehicle, setModalVehicle] = useState<Vehicle | null | 'new'>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['all-vehicles'],
    queryFn: getAllVehiclesApi,
  });

  const vehicles = data?.vehicles ?? [];

  const toggleMutation = useMutation({
    mutationFn: (v: Vehicle) => updateVehicleApi(v.id, { is_active: !v.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-vehicles'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVehicleApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-vehicles'] }),
  });

  const handleDelete = (v: Vehicle) => {
    Alert.alert('Delete Vehicle', `Are you sure you want to delete "${v.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(v.id),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Vehicles" />
      {isLoading ? (
        <View style={styles.padding}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{item.name}</Text>
                <Text style={styles.vehicleModel}>{item.model}</Text>
                <View style={styles.badgeRow}>
                  <Badge label={item.category} />
                  <Text style={styles.muted}>👤 {item.capacity}</Text>
                  <Text style={styles.muted}>AED {item.base_price}</Text>
                </View>
              </View>
              <View style={styles.vehicleActions}>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggleMutation.mutate(item)}
                  trackColor={{ false: '#1E2940', true: '#38BDF8' }}
                  thumbColor="#F8FAFC"
                />
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setModalVehicle(item)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title="No vehicles" message="Add your first vehicle." />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVehicle('new')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {(modalVehicle === 'new' || (modalVehicle && modalVehicle !== 'new')) && (
        <VehicleModal
          visible
          vehicle={modalVehicle === 'new' ? null : (modalVehicle as Vehicle)}
          onClose={() => setModalVehicle(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
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
  vehicleRow: {
    backgroundColor: '#121A2B',
    borderColor: '#1E2940',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleInfo: {
    flex: 1,
    gap: 4,
  },
  vehicleName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
  },
  vehicleModel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  muted: {
    color: '#94A3B8',
    fontSize: 12,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    padding: 8,
  },
  editBtnText: {
    fontSize: 16,
  },
  deleteBtn: {
    padding: 8,
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
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#0B1220',
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
    backgroundColor: '#121A2B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  pickerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  pickerWrapper: {
    backgroundColor: '#121A2B',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#F8FAFC',
    height: 44,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepperBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2940',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
  },
});
