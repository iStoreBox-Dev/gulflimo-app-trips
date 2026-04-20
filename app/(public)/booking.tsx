import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import { router, useSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getVehiclesApi,
  getQuoteApi,
  validatePromoApi,
  createBookingApi,
  getApiError,
} from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/constants';
import GeoSearchInput from '@/components/booking/GeoSearchInput';
import VehicleCard from '@/components/booking/VehicleCard';
import QuoteSummary from '@/components/booking/QuoteSummary';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { GeoResult, ServiceType, TransferType, AddOns, Vehicle, Quote } from '@/types';

interface FormData {
  service_type: ServiceType;
  transfer_type: TransferType;
  pickup_location: string;
  pickup_lat: string | null;
  pickup_lng: string | null;
  dropoff_location: string;
  dropoff_lat: string | null;
  dropoff_lng: string | null;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  hourly_duration: number;
  passengers: number;
  luggage: number;
  flight_number: string;
  add_ons: AddOns;
  vehicle_id: number | null;
  selected_vehicle: Vehicle | null;
  promo_code: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone: string;
  special_requests: string;
}

const defaultForm: FormData = {
  service_type: 'trip',
  transfer_type: 'oneway',
  pickup_location: '',
  pickup_lat: null,
  pickup_lng: null,
  dropoff_location: '',
  dropoff_lat: null,
  dropoff_lng: null,
  departure_date: '',
  departure_time: '',
  return_date: '',
  return_time: '',
  hourly_duration: 2,
  passengers: 1,
  luggage: 0,
  flight_number: '',
  add_ons: {},
  vehicle_id: null,
  selected_vehicle: null,
  promo_code: '',
  first_name: '',
  last_name: '',
  email: '',
  country_code: '+971',
  phone: '',
  special_requests: '',
};

function todayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const HOURLY_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12];

export default function BookingScreen() {
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [apiError, setApiError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState('');
  const [confirmedBookingData, setConfirmedBookingData] = useState<{
    booking_ref: string;
    vehicle_name: string;
    departure_date: string;
    departure_time: string;
    pickup: string;
    dropoff: string;
    first_name: string;
    last_name: string;
    email: string;
    final_price: number;
  } | null>(null);

  // Date picker state (native)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);

  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  // Step 2 data
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehiclesApi,
    enabled: step === 2,
  });

  const vehicles = vehiclesQuery.data?.vehicles ?? [];

  // Preselect vehicle when provided via query param: ?vehicle_id=2
  useEffect(() => {
    const vid = params?.vehicle_id ? Number(params.vehicle_id) : null;
    if (vid && vehicles.length) {
      const v = vehicles.find((x) => x.id === vid);
      if (v) {
        updateForm('vehicle_id', v.id);
        updateForm('selected_vehicle', v);
      }
    }
  }, [params?.vehicle_id, vehicles]);

  // Per-vehicle quote queries
  const vehicleQuotes = useQuery({
    queryKey: ['vehicle-quotes', form, vehicles.map((v) => v.id)],
    queryFn: async () => {
      if (!vehicles.length) return {};
      const results: Record<number, Quote> = {};
      await Promise.all(
        vehicles.map(async (v) => {
          try {
            const res = await getQuoteApi({
              service_type: form.service_type,
              vehicle_id: v.id,
              pickup_location: form.pickup_location,
              dropoff_location: form.service_type === 'trip' ? form.dropoff_location : undefined,
              departure_date: form.departure_date,
              departure_time: form.departure_time,
              passengers: form.passengers,
              luggage: form.luggage,
              hourly_duration: form.service_type === 'hourly' ? form.hourly_duration : undefined,
              transfer_type: form.transfer_type,
              add_ons: form.add_ons,
              promo_code: form.promo_code || undefined,
            });
            results[v.id] = res.quote;
          } catch {
            // skip failed quotes
          }
        })
      );
      return results;
    },
    enabled: step === 2 && vehicles.length > 0,
  });

  const quotes = vehicleQuotes.data ?? {};

  const validatePromoMutation = useMutation({
    mutationFn: ({ code, amount }: { code: string; amount: number }) =>
      validatePromoApi(code, amount),
    onSuccess: (data) => {
      if (data.valid && data.promo) {
        setPromoApplied(true);
        setPromoError('');
        setPromoDiscount(
          data.promo.discount_type === 'percentage'
            ? ((form.selected_vehicle
                ? (quotes[form.vehicle_id!]?.subtotal_price ?? 0)
                : 0) *
                data.promo.discount_value) /
                100
            : data.promo.discount_value
        );
        updateForm('promo_code', promoInput.toUpperCase());
      } else {
        setPromoError(data.error ?? 'Invalid promo code');
        setPromoApplied(false);
        setPromoDiscount(0);
      }
    },
    onError: (err) => {
      setPromoError(getApiError(err));
      setPromoApplied(false);
      setPromoDiscount(0);
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: createBookingApi,
    onSuccess: (data) => {
      setConfirmedBookingRef(data.booking.booking_ref);
      setConfirmedBookingData({
        booking_ref: data.booking.booking_ref,
        vehicle_name: data.booking.vehicle_snapshot.name,
        departure_date: data.booking.departure_date,
        departure_time: data.booking.departure_time,
        pickup: data.booking.pickup_location,
        dropoff: data.booking.dropoff_location ?? '',
        first_name: data.booking.first_name,
        last_name: data.booking.last_name,
        email: data.booking.email,
        final_price: data.booking.final_price,
      });
      setStep(4);
    },
    onError: (err) => {
      setApiError(getApiError(err));
    },
  });

  // Validation per step
  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.pickup_location) errs.pickup_location = 'Pickup location required';
    if (form.service_type === 'trip' && !form.dropoff_location)
      errs.dropoff_location = 'Dropoff location required';
    if (!form.departure_date) errs.departure_date = 'Departure date required';
    else if (form.departure_date < todayString())
      errs.departure_date = 'Date must be today or in the future';
    if (!form.departure_time) errs.departure_time = 'Departure time required';
    if (form.service_type === 'hourly' && !form.hourly_duration)
      errs.hourly_duration = 'Select duration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    if (!form.vehicle_id) {
      setErrors({ vehicle_id: 'Please select a vehicle' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.first_name || form.first_name.length < 2)
      errs.first_name = 'Min 2 characters';
    if (!form.last_name || form.last_name.length < 2)
      errs.last_name = 'Min 2 characters';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = 'Valid email required';
    if (!form.phone || form.phone.replace(/\D/g, '').length < 7)
      errs.phone = 'Min 7 digits';
    if (!form.country_code) errs.country_code = 'Select country code';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const subtotal = form.vehicle_id ? (quotes[form.vehicle_id]?.subtotal_price ?? 0) : 0;
    validatePromoMutation.mutate({ code: promoInput.trim(), amount: subtotal });
  };

  const handleConfirmBooking = () => {
    if (!validateStep3()) return;
    setApiError('');
    createBookingMutation.mutate({
      service_type: form.service_type,
      transfer_type: form.transfer_type,
      pickup_location: form.pickup_location,
      pickup_lat: form.pickup_lat,
      pickup_lng: form.pickup_lng,
      dropoff_location: form.service_type === 'trip' ? form.dropoff_location : null,
      dropoff_lat: form.service_type === 'trip' ? form.dropoff_lat : null,
      dropoff_lng: form.service_type === 'trip' ? form.dropoff_lng : null,
      departure_date: form.departure_date,
      departure_time: form.departure_time,
      return_date:
        form.transfer_type === 'return' ? form.return_date || null : null,
      return_time:
        form.transfer_type === 'return' ? form.return_time || null : null,
      hourly_duration: form.service_type === 'hourly' ? form.hourly_duration : null,
      passengers: form.passengers,
      luggage: form.luggage,
      flight_number: form.flight_number || null,
      vehicle_id: form.vehicle_id!,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      country_code: form.country_code,
      phone: form.phone,
      special_requests: form.special_requests || null,
      add_ons: form.add_ons,
      promo_code: form.promo_code || null,
      distance_km: form.vehicle_id ? (quotes[form.vehicle_id]?.distance_km ?? null) : null,
      source: 'mobile',
    });
  };

  const progressSteps = [1, 2, 3, 4];

  // ─── Step 1 ─────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>Route & Schedule</Text>

      {/* Service Type */}
      <Text style={styles.fieldLabel}>Service Type</Text>
      <View style={styles.toggleRow}>
        {(['trip', 'hourly'] as ServiceType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, form.service_type === t && styles.toggleActive]}
            onPress={() => updateForm('service_type', t)}
          >
            <Text
              style={[
                styles.toggleText,
                form.service_type === t && styles.toggleTextActive,
              ]}
            >
              {t === 'trip' ? 'Trip' : 'Hourly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pickup */}
      <GeoSearchInput
        label="Pickup Location *"
        value={form.pickup_location}
        placeholder="Enter pickup address"
        onSelect={(r: GeoResult) => {
          updateForm('pickup_location', r.display_name);
          updateForm('pickup_lat', r.lat);
          updateForm('pickup_lng', r.lon);
        }}
      />
      {errors.pickup_location ? (
        <Text style={styles.errorText}>{errors.pickup_location}</Text>
      ) : null}

      {/* Dropoff (trip only) */}
      {form.service_type === 'trip' && (
        <>
          <GeoSearchInput
            label="Dropoff Location *"
            value={form.dropoff_location}
            placeholder="Enter dropoff address"
            onSelect={(r: GeoResult) => {
              updateForm('dropoff_location', r.display_name);
              updateForm('dropoff_lat', r.lat);
              updateForm('dropoff_lng', r.lon);
            }}
          />
          {errors.dropoff_location ? (
            <Text style={styles.errorText}>{errors.dropoff_location}</Text>
          ) : null}

          {/* Transfer Type */}
          <Text style={styles.fieldLabel}>Transfer Type</Text>
          <View style={styles.toggleRow}>
            {(['oneway', 'return'] as TransferType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.toggleBtn,
                  form.transfer_type === t && styles.toggleActive,
                ]}
                onPress={() => updateForm('transfer_type', t)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    form.transfer_type === t && styles.toggleTextActive,
                  ]}
                >
                  {t === 'oneway' ? 'One Way' : 'Return'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Hourly Duration */}
      {form.service_type === 'hourly' && (
        <>
          <Text style={styles.fieldLabel}>Duration (hours)</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.hourly_duration}
              onValueChange={(v) => updateForm('hourly_duration', Number(v))}
              style={styles.picker}
              dropdownIconColor="#38BDF8"
            >
              {HOURLY_OPTIONS.map((h) => (
                <Picker.Item
                  key={h}
                  label={`${h} hours`}
                  value={h}
                  color={Platform.OS === 'android' ? '#F8FAFC' : undefined}
                />
              ))}
            </Picker>
          </View>
        </>
      )}

      {/* Departure Date */}
      <Text style={styles.fieldLabel}>Departure Date *</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={form.departure_date}
          min={todayString()}
          onChange={(e) => updateForm('departure_date', e.target.value)}
          style={{
            backgroundColor: '#121A2B',
            color: '#F8FAFC',
            border: '1px solid #2A3A57',
            borderRadius: 8,
            height: 48,
            padding: '0 12px',
            fontSize: 15,
            marginBottom: 12,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={form.departure_date ? styles.dateBtnText : styles.datePlaceholder}>
              {form.departure_date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={
                form.departure_date ? new Date(form.departure_date) : new Date()
              }
              mode="date"
              minimumDate={new Date()}
              onChange={(_: unknown, date?: Date) => {
                setShowDatePicker(false);
                if (date) updateForm('departure_date', date.toISOString().split('T')[0]);
              }}
            />
          )}
        </>
      )}
      {errors.departure_date ? (
        <Text style={styles.errorText}>{errors.departure_date}</Text>
      ) : null}

      {/* Departure Time */}
      <Text style={styles.fieldLabel}>Departure Time *</Text>
      {Platform.OS === 'web' ? (
        <input
          type="time"
          value={form.departure_time}
          onChange={(e) => updateForm('departure_time', e.target.value)}
          style={{
            backgroundColor: '#121A2B',
            color: '#F8FAFC',
            border: '1px solid #2A3A57',
            borderRadius: 8,
            height: 48,
            padding: '0 12px',
            fontSize: 15,
            marginBottom: 12,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={form.departure_time ? styles.dateBtnText : styles.datePlaceholder}>
              {form.departure_time || 'Select time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour
              onChange={(_: unknown, date?: Date) => {
                setShowTimePicker(false);
                if (date) {
                  const h = date.getHours().toString().padStart(2, '0');
                  const m = date.getMinutes().toString().padStart(2, '0');
                  updateForm('departure_time', `${h}:${m}`);
                }
              }}
            />
          )}
        </>
      )}
      {errors.departure_time ? (
        <Text style={styles.errorText}>{errors.departure_time}</Text>
      ) : null}

      {/* Return fields */}
      {form.service_type === 'trip' && form.transfer_type === 'return' && (
        <>
          <Text style={styles.fieldLabel}>Return Date</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={form.return_date}
              min={form.departure_date || todayString()}
              onChange={(e) => updateForm('return_date', e.target.value)}
              style={{
                backgroundColor: '#121A2B',
                color: '#F8FAFC',
                border: '1px solid #2A3A57',
                borderRadius: 8,
                height: 48,
                padding: '0 12px',
                fontSize: 15,
                marginBottom: 12,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowReturnDatePicker(true)}
              >
                <Text style={form.return_date ? styles.dateBtnText : styles.datePlaceholder}>
                  {form.return_date || 'Select return date'}
                </Text>
              </TouchableOpacity>
              {showReturnDatePicker && (
                <DateTimePicker
                  value={
                    form.return_date ? new Date(form.return_date) : new Date()
                  }
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_: unknown, date?: Date) => {
                    setShowReturnDatePicker(false);
                    if (date) updateForm('return_date', date.toISOString().split('T')[0]);
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>Return Time</Text>
          {Platform.OS === 'web' ? (
            <input
              type="time"
              value={form.return_time}
              onChange={(e) => updateForm('return_time', e.target.value)}
              style={{
                backgroundColor: '#121A2B',
                color: '#F8FAFC',
                border: '1px solid #2A3A57',
                borderRadius: 8,
                height: 48,
                padding: '0 12px',
                fontSize: 15,
                marginBottom: 12,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowReturnTimePicker(true)}
              >
                <Text style={form.return_time ? styles.dateBtnText : styles.datePlaceholder}>
                  {form.return_time || 'Select return time'}
                </Text>
              </TouchableOpacity>
              {showReturnTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour
                  onChange={(_: unknown, date?: Date) => {
                    setShowReturnTimePicker(false);
                    if (date) {
                      const h = date.getHours().toString().padStart(2, '0');
                      const m = date.getMinutes().toString().padStart(2, '0');
                      updateForm('return_time', `${h}:${m}`);
                    }
                  }}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Passengers */}
      <Text style={styles.fieldLabel}>Passengers</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateForm('passengers', Math.max(1, form.passengers - 1))}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{form.passengers}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateForm('passengers', Math.min(10, form.passengers + 1))}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Luggage */}
      <Text style={styles.fieldLabel}>Luggage Bags</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateForm('luggage', Math.max(0, form.luggage - 1))}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{form.luggage}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateForm('luggage', Math.min(10, form.luggage + 1))}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add-ons */}
      <Text style={styles.fieldLabel}>Add-ons</Text>
      {(
        [
          ['meet_greet', 'Meet & Greet'],
          ['extra_stop', 'Extra Stop'],
          ['child_seat', 'Child Seat'],
          ['pet_friendly', 'Pet Friendly'],
          ['extra_luggage', 'Extra Luggage'],
        ] as [keyof AddOns, string][]
      ).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={styles.checkboxRow}
          onPress={() =>
            updateForm('add_ons', { ...form.add_ons, [key]: !form.add_ons[key] })
          }
        >
          <View
            style={[styles.checkbox, form.add_ons[key] && styles.checkboxChecked]}
          >
            {form.add_ons[key] ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>{label}</Text>
        </TouchableOpacity>
      ))}

      {/* Flight Number */}
      <Input
        label="Flight Number (optional)"
        value={form.flight_number}
        onChangeText={(v) => updateForm('flight_number', v)}
        placeholder="e.g. EK501"
        containerStyle={{ marginTop: 8 }}
      />

      <Button
        label="Get Quote →"
        onPress={() => {
          if (validateStep1()) setStep(2);
        }}
        size="lg"
        style={styles.ctaBtn}
      />
    </ScrollView>
  );

  // ─── Step 2 ─────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>Select Vehicle</Text>

      {vehiclesQuery.isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : vehiclesQuery.error ? (
        <Text style={styles.errorBanner}>
          Failed to load vehicles. Please try again.
        </Text>
      ) : (
        vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            quote={quotes[v.id] ?? null}
            selected={form.vehicle_id === v.id}
            onSelect={() => {
              updateForm('vehicle_id', v.id);
              updateForm('selected_vehicle', v);
            }}
          />
        ))
      )}

      {errors.vehicle_id ? (
        <Text style={styles.errorText}>{errors.vehicle_id}</Text>
      ) : null}

      {/* Promo */}
      <View style={styles.promoRow}>
        <TextInput
          value={promoInput}
          onChangeText={setPromoInput}
          placeholder="Promo code"
          placeholderTextColor="#94A3B8"
          style={styles.promoInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleApplyPromo}
          disabled={validatePromoMutation.isPending}
        >
          {validatePromoMutation.isPending ? (
            <ActivityIndicator color="#0B1220" size="small" />
          ) : (
            <Text style={styles.applyBtnText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>
      {promoApplied && (
        <Text style={styles.promoSuccess}>
          ✓ Promo applied — AED {promoDiscount.toFixed(0)} off
        </Text>
      )}
      {promoError ? (
        <Text style={styles.errorText}>{promoError}</Text>
      ) : null}

      <Button
        label="Continue →"
        onPress={() => {
          if (validateStep2()) setStep(3);
        }}
        size="lg"
        style={styles.ctaBtn}
        disabled={!form.vehicle_id}
      />
    </ScrollView>
  );

  // ─── Step 3 ─────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepTitle}>Passenger Details</Text>

      {apiError ? (
        <View style={styles.apiBanner}>
          <Text style={styles.apiBannerText}>{apiError}</Text>
          <TouchableOpacity onPress={() => setApiError('')}>
            <Text style={styles.apiBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Input
        label="First Name *"
        value={form.first_name}
        onChangeText={(v) => updateForm('first_name', v)}
        placeholder="John"
        error={errors.first_name}
      />
      <Input
        label="Last Name *"
        value={form.last_name}
        onChangeText={(v) => updateForm('last_name', v)}
        placeholder="Doe"
        error={errors.last_name}
      />
      <Input
        label="Email *"
        value={form.email}
        onChangeText={(v) => updateForm('email', v)}
        placeholder="john@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <Text style={styles.fieldLabel}>Country Code *</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.country_code}
          onValueChange={(v) => updateForm('country_code', String(v))}
          style={styles.picker}
          dropdownIconColor="#38BDF8"
        >
          {COUNTRY_CODES.map((c) => (
            <Picker.Item
              key={c.code}
              label={`${c.label} (${c.country})`}
              value={c.code}
              color={Platform.OS === 'android' ? '#F8FAFC' : undefined}
            />
          ))}
        </Picker>
      </View>
      {errors.country_code ? (
        <Text style={styles.errorText}>{errors.country_code}</Text>
      ) : null}

      <Input
        label="Phone *"
        value={form.phone}
        onChangeText={(v) => updateForm('phone', v)}
        placeholder="501234567"
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <Input
        label="Special Requests (optional)"
        value={form.special_requests}
        onChangeText={(v) =>
          v.length <= 500 ? updateForm('special_requests', v) : null
        }
        placeholder="Any special requirements..."
        multiline
        numberOfLines={3}
      />

      {/* Quote Summary */}
      {form.selected_vehicle && form.vehicle_id && (
        <QuoteSummary
          pickup={form.pickup_location}
          dropoff={form.service_type === 'trip' ? form.dropoff_location : null}
          date={form.departure_date}
          time={form.departure_time}
          vehicle={form.selected_vehicle}
          addOns={form.add_ons}
          promoCode={form.promo_code}
          discount={promoDiscount}
          quote={quotes[form.vehicle_id] ?? null}
        />
      )}

      <Button
        label="Confirm Booking"
        onPress={handleConfirmBooking}
        loading={createBookingMutation.isPending}
        size="lg"
        style={styles.ctaBtn}
      />

      <LoadingOverlay
        visible={createBookingMutation.isPending}
        message="Creating your booking..."
      />
    </ScrollView>
  );

  // ─── Step 4 ─────────────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, styles.confirmCenter]}
    >
      <View style={styles.confirmCircle}>
        <Text style={styles.confirmCheck}>✓</Text>
      </View>
      <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
      <Text style={styles.confirmRef}>{confirmedBookingRef}</Text>

      {confirmedBookingData && (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmRow}>
            🚗 {confirmedBookingData.vehicle_name}
          </Text>
          <Text style={styles.confirmRow}>
            📅 {confirmedBookingData.departure_date} · {confirmedBookingData.departure_time}
          </Text>
          <Text style={styles.confirmRow}>
            📍 {confirmedBookingData.pickup}
          </Text>
          {confirmedBookingData.dropoff ? (
            <Text style={styles.confirmRow}>
              🏁 {confirmedBookingData.dropoff}
            </Text>
          ) : null}
          <Text style={styles.confirmRow}>
            👤 {confirmedBookingData.first_name} {confirmedBookingData.last_name}
          </Text>
          <Text style={styles.confirmRow}>
            ✉️ {confirmedBookingData.email}
          </Text>
          <Text style={[styles.confirmRow, styles.confirmPrice]}>
            Total: AED {confirmedBookingData.final_price.toFixed(0)}
          </Text>
        </View>
      )}

      <Button
        label="Track My Booking"
        onPress={() =>
          router.push({
            pathname: '/(public)/lookup',
            params: {
              ref: confirmedBookingRef,
              email: confirmedBookingData?.email ?? '',
            },
          })
        }
        size="lg"
        style={styles.ctaBtn}
      />
      <Button
        label="Book Another Ride"
        variant="secondary"
        onPress={() => {
          setForm(defaultForm);
          setStep(1);
          setPromoInput('');
          setPromoApplied(false);
          setPromoDiscount(0);
          setPromoError('');
          setApiError('');
          setConfirmedBookingRef('');
          setConfirmedBookingData(null);
        }}
        size="lg"
        style={styles.ctaSecondaryBtn}
      />
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      {/* Progress Bar */}
      {step < 4 && (
        <View style={styles.progressBar}>
          {progressSteps.slice(0, 3).map((s) => (
            <View key={s} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  step >= s && styles.progressDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressDotText,
                    step >= s && styles.progressDotTextActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    step > s && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {step > 1 && step < 4 && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setStep(step - 1)}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  confirmCenter: {
    alignItems: 'center',
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A3A57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  toggleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#0B1220',
  },
  pickerWrapper: {
    backgroundColor: '#121A2B',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#F8FAFC',
    height: 48,
  },
  dateBtn: {
    backgroundColor: '#121A2B',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dateBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
  },
  datePlaceholder: {
    color: '#94A3B8',
    fontSize: 15,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2940',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '600',
  },
  stepperValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2A3A57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  checkmark: {
    color: '#0B1220',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  ctaBtn: {
    marginTop: 24,
  },
  ctaSecondaryBtn: {
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#EF4444',
    fontSize: 13,
  },
  apiBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apiBannerText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  apiBannerClose: {
    color: '#EF4444',
    fontSize: 16,
    marginLeft: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0B1220',
    borderBottomColor: '#1E2940',
    borderBottomWidth: 1,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#2A3A57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  progressDotText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  progressDotTextActive: {
    color: '#0B1220',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#2A3A57',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#38BDF8',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#121A2B',
    borderColor: '#2A3A57',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  applyBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#0B1220',
    fontWeight: '700',
    fontSize: 14,
  },
  promoSuccess: {
    color: '#22C55E',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  confirmCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  confirmCheck: {
    color: '#0B1220',
    fontSize: 36,
    fontWeight: '700',
  },
  confirmTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  confirmRef: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 24,
    letterSpacing: 2,
  },
  confirmCard: {
    backgroundColor: '#121A2B',
    borderColor: '#1E2940',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  confirmRow: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  confirmPrice: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
});
