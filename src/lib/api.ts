import axios from 'axios';
import { router } from 'expo-router';
import { getToken, clearAuth } from './auth';
import type {
  Vehicle,
  Booking,
  BookingStats,
  BookingLog,
  Chauffeur,
  GeoResult,
  Quote,
  AddOns,
  ServiceType,
  TransferType,
  BookingStatus,
  User,
  PromoCode,
} from '@/types';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
});

// Request interceptor — attach Bearer token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
      router.replace('/(admin)/login');
    }
    return Promise.reject(error);
  }
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function loginApi(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getMeApi(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data;
}

// ─── Vehicles ────────────────────────────────────────────────────────────────
export async function getVehiclesApi(): Promise<{ vehicles: Vehicle[] }> {
  const { data } = await api.get<{ vehicles: Vehicle[] }>('/vehicles');
  return data;
}

export async function getAllVehiclesApi(): Promise<{ vehicles: Vehicle[] }> {
  const { data } = await api.get<{ vehicles: Vehicle[] }>('/vehicles/all');
  return data;
}

export async function createVehicleApi(
  vehicleData: Partial<Vehicle>
): Promise<{ vehicle: Vehicle }> {
  const { data } = await api.post<{ vehicle: Vehicle }>('/vehicles', vehicleData);
  return data;
}

export async function updateVehicleApi(
  id: number,
  vehicleData: Partial<Vehicle>
): Promise<{ vehicle: Vehicle }> {
  const { data } = await api.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, vehicleData);
  return data;
}

export async function deleteVehicleApi(id: number): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export interface QuotePayload {
  service_type: ServiceType;
  vehicle_id: number;
  pickup_location: string;
  dropoff_location?: string;
  departure_date: string;
  departure_time: string;
  passengers: number;
  luggage?: number;
  hourly_duration?: number;
  transfer_type?: TransferType;
  distance_km?: number | null;
  add_ons?: AddOns;
  promo_code?: string;
}

export async function getQuoteApi(
  payload: QuotePayload
): Promise<{
  quote: Quote;
  promo: PromoCode | null;
  promo_error: string | null;
  recommendations: Vehicle[];
  fixed_price_rule: unknown | null;
}> {
  const { data } = await api.post('/bookings/quote', payload);
  return data;
}

export interface CreateBookingPayload {
  service_type: ServiceType;
  transfer_type: TransferType;
  pickup_location: string;
  pickup_lat?: string | null;
  pickup_lng?: string | null;
  dropoff_location?: string | null;
  dropoff_lat?: string | null;
  dropoff_lng?: string | null;
  departure_date: string;
  departure_time: string;
  return_date?: string | null;
  return_time?: string | null;
  hourly_duration?: number | null;
  passengers: number;
  luggage: number;
  flight_number?: string | null;
  vehicle_id: number;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone: string;
  special_requests?: string | null;
  add_ons?: AddOns;
  promo_code?: string | null;
  distance_km?: number | null;
  source: 'mobile';
}

export async function createBookingApi(
  payload: CreateBookingPayload
): Promise<{ message: string; booking: Booking }> {
  const { data } = await api.post<{ message: string; booking: Booking }>('/bookings', payload);
  return data;
}

export async function lookupBookingApi(
  ref: string,
  email: string
): Promise<{ booking: Booking }> {
  const { data } = await api.get<{ booking: Booking }>(
    `/bookings/lookup?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`
  );
  return data;
}

export async function cancelBookingByRefApi(
  ref: string,
  email: string
): Promise<{ message: string; booking: Booking }> {
  const { data } = await api.post<{ message: string; booking: Booking }>('/bookings/cancel', {
    ref,
    email,
  });
  return data;
}

export interface ListBookingsParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export async function listBookingsApi(
  params?: ListBookingsParams
): Promise<{ bookings: Booking[]; total: number; page: number; pages: number }> {
  const { data } = await api.get<{
    bookings: Booking[];
    total: number;
    page: number;
    pages: number;
  }>('/bookings', { params });
  return data;
}

export async function getBookingApi(id: number | string): Promise<{ booking: Booking }> {
  const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`);
  return data;
}

export async function getBookingLogsApi(
  id: number | string
): Promise<{ logs: BookingLog[] }> {
  const { data } = await api.get<{ logs: BookingLog[] }>(`/bookings/${id}/logs`);
  return data;
}

export async function updateBookingStatusApi(
  id: number | string,
  status: BookingStatus
): Promise<{ booking: Booking }> {
  const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status });
  return data;
}

export async function assignChauffeurApi(
  id: number | string,
  chauffeur_id: number,
  vehicle_id?: number
): Promise<{ booking: Booking; message: string }> {
  const { data } = await api.patch<{ booking: Booking; message: string }>(
    `/bookings/${id}/assign`,
    { chauffeur_id, vehicle_id }
  );
  return data;
}

export async function addBookingNoteApi(
  id: number | string,
  note: string
): Promise<{ logs: BookingLog[]; notes: unknown[] }> {
  const { data } = await api.patch<{ logs: BookingLog[]; notes: unknown[] }>(
    `/bookings/${id}/notes`,
    { note }
  );
  return data;
}

export async function deleteBookingApi(id: number | string): Promise<void> {
  await api.delete(`/bookings/${id}`);
}

export async function getBookingStatsApi(): Promise<{ stats: BookingStats }> {
  const { data } = await api.get<{ stats: BookingStats }>('/bookings/stats');
  return data;
}

export async function getBookingAnalyticsApi(): Promise<{
  daily_bookings: { date: string; count: number }[];
  daily_revenue: { date: string; revenue: number }[];
}> {
  const { data } = await api.get('/bookings/analytics');
  return data;
}

// ─── Promo ───────────────────────────────────────────────────────────────────
export async function validatePromoApi(
  code: string,
  amount: number
): Promise<{
  valid: boolean;
  message?: string;
  error?: string;
  promo?: PromoCode;
}> {
  const { data } = await api.post('/promo/validate', { code, amount });
  return data;
}

export async function listPromosApi(): Promise<{ promos: PromoCode[] }> {
  const { data } = await api.get<{ promos: PromoCode[] }>('/promo');
  return data;
}

export async function createPromoApi(
  promoData: Partial<PromoCode>
): Promise<{ promo: PromoCode }> {
  const { data } = await api.post<{ promo: PromoCode }>('/promo', promoData);
  return data;
}

export async function togglePromoApi(id: number): Promise<{ promo: PromoCode }> {
  const { data } = await api.patch<{ promo: PromoCode }>(`/promo/${id}/toggle`);
  return data;
}

// ─── Geo ─────────────────────────────────────────────────────────────────────
export async function geoSearchApi(q: string): Promise<{ results: GeoResult[] }> {
  const { data } = await api.get<{ results: GeoResult[] }>(
    `/geo/search?q=${encodeURIComponent(q)}`
  );
  return data;
}

// ─── Chauffeurs ───────────────────────────────────────────────────────────────
export async function listChauffeursApi(
  params?: { search?: string; assignable?: boolean }
): Promise<{ chauffeurs: Chauffeur[] }> {
  const { data } = await api.get<{ chauffeurs: Chauffeur[] }>('/chauffeurs', { params });
  return data;
}

export async function createChauffeurApi(
  chauffeurData: Partial<Chauffeur>
): Promise<{ chauffeur: Chauffeur }> {
  const { data } = await api.post<{ chauffeur: Chauffeur }>('/chauffeurs', chauffeurData);
  return data;
}

export async function updateChauffeurApi(
  id: number,
  chauffeurData: Partial<Chauffeur>
): Promise<{ chauffeur: Chauffeur }> {
  const { data } = await api.patch<{ chauffeur: Chauffeur }>(
    `/chauffeurs/${id}`,
    chauffeurData
  );
  return data;
}

export async function toggleChauffeurApi(id: number): Promise<{ chauffeur: Chauffeur }> {
  const { data } = await api.patch<{ chauffeur: Chauffeur }>(`/chauffeurs/${id}/toggle`);
  return data;
}

export async function deleteChauffeurApi(id: number): Promise<void> {
  await api.delete(`/chauffeurs/${id}`);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getPublicSettingsApi(): Promise<Record<string, unknown>> {
  const { data } = await api.get('/settings');
  return data;
}
