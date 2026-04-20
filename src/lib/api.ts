import axios from 'axios';
import { router } from 'expo-router';
import { getToken, clearAuth } from './auth';
import { log, logFunctionStart } from '@/lib/logger';
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

const USE_LOCAL = !process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_LOCAL_DB === 'true';
let localDb: any = null;
if (USE_LOCAL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    localDb = require('./local-db.json');
  } catch (e) {
    localDb = { vehicles: [], bookings: [], promos: [] };
  }
}

// Request interceptor — attach Bearer token and log
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  try {
    console.log('[API][REQUEST]', {
      method: config.method,
      url: `${config.baseURL || ''}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data,
    });
  } catch (e) {}
  return config;
});

// Response interceptor — log and handle 401
api.interceptors.response.use(
  (response) => {
    try {
      console.log('[API][RESPONSE]', {
        status: response.status,
        url: response.config?.url,
        data: response.data,
        headers: response.headers,
      });
    } catch (e) {}
    return response;
  },
  async (error) => {
    try {
      console.error('[API][RESPONSE-ERROR]', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
      });
    } catch (e) {}
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
  const name = 'loginApi';
  logFunctionStart(name, { email });
  try {
    const resp = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getMeApi(): Promise<{ user: User }> {
  const name = 'getMeApi';
  logFunctionStart(name);
  try {
    const resp = await api.get<{ user: User }>('/auth/me');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

// ─── Vehicles ────────────────────────────────────────────────────────────────
export async function getVehiclesApi(): Promise<{ vehicles: Vehicle[] }> {
  const name = 'getVehiclesApi';
  logFunctionStart(name);
  if (USE_LOCAL) {
    return { vehicles: (localDb.vehicles || []).filter((v: any) => v.is_active) };
  }
  try {
    const resp = await api.get<{ vehicles: Vehicle[] }>('/vehicles');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getAllVehiclesApi(): Promise<{ vehicles: Vehicle[] }> {
  const name = 'getAllVehiclesApi';
  logFunctionStart(name);
  if (USE_LOCAL) {
    return { vehicles: localDb.vehicles || [] };
  }
  try {
    const resp = await api.get<{ vehicles: Vehicle[] }>('/vehicles/all');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function createVehicleApi(
  vehicleData: Partial<Vehicle>
): Promise<{ vehicle: Vehicle }> {
  const name = 'createVehicleApi';
  logFunctionStart(name, { vehicleData });
  try {
    const resp = await api.post<{ vehicle: Vehicle }>('/vehicles', vehicleData);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function updateVehicleApi(
  id: number,
  vehicleData: Partial<Vehicle>
): Promise<{ vehicle: Vehicle }> {
  const name = 'updateVehicleApi';
  logFunctionStart(name, { id, vehicleData });
  try {
    const resp = await api.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, vehicleData);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function deleteVehicleApi(id: number): Promise<void> {
  const name = 'deleteVehicleApi';
  logFunctionStart(name, { id });
  try {
    const resp = await api.delete(`/vehicles/${id}`);
    console.log(`[API][${name}] status`, resp?.status);
    return resp?.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
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
  const name = 'getQuoteApi';
  logFunctionStart(name, { payload });
  if (USE_LOCAL) {
    const vehicle = (localDb.vehicles || []).find((v: any) => v.id === payload.vehicle_id);
    const base = vehicle ? vehicle.base_price : 100;
    const addOns = payload.add_ons || {};
    const addOnsPrice = Object.values(addOns).filter(Boolean).length * 10;
    const subtotal = base + addOnsPrice;
    const quote = {
      service_type: payload.service_type,
      base_price: base,
      add_ons_price: addOnsPrice,
      subtotal_price: subtotal,
      discount_amount: 0,
      final_price: subtotal,
      add_ons: addOns,
      distance_km: 10,
    } as Quote;
    return { quote, promo: null, promo_error: null, recommendations: [], fixed_price_rule: null };
  }
  try {
    const resp = await api.post('/bookings/quote', payload);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
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
  const name = 'createBookingApi';
  logFunctionStart(name, { payload });
  if (USE_LOCAL) {
    const id = Date.now();
    const bookingRef = `LOCAL-${id}`;
    const vehicle = (localDb.vehicles || []).find((v: any) => v.id === payload.vehicle_id);
    const base = vehicle ? vehicle.base_price : 100;
    const addOnsPrice = Object.values(payload.add_ons || {}).filter(Boolean).length * 10;
    const subtotal = base + addOnsPrice;
    const booking: any = {
      id,
      booking_ref: bookingRef,
      ...payload,
      vehicle_snapshot: vehicle
        ? {
            name: vehicle.name,
            model: vehicle.model,
            category: vehicle.category,
            base_price: vehicle.base_price,
            capacity: vehicle.capacity,
          }
        : {
            name: 'Vehicle',
            model: '',
            category: 'sedan',
            base_price: base,
            capacity: 3,
          },
      add_ons_price: addOnsPrice,
      base_price: base,
      discount_amount: 0,
      final_price: subtotal,
      distance_km: payload.distance_km ?? 10,
      language_code: 'en',
      chauffeur_id: null,
      payment_status: 'unpaid',
      status: 'pending',
      source: 'local',
      internal_notes: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localDb.bookings = localDb.bookings || [];
    localDb.bookings.unshift(booking);
    return { message: 'OK', booking };
  }
  try {
    const resp = await api.post<{ message: string; booking: Booking }>('/bookings', payload);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function lookupBookingApi(
  ref: string,
  email: string
): Promise<{ booking: Booking }> {
  const name = 'lookupBookingApi';
  logFunctionStart(name, { ref, email });
  if (USE_LOCAL) {
    const booking = (localDb.bookings || []).find(
      (b: any) => b.booking_ref === ref && b.email === email
    );
    if (!booking) throw new Error('Booking not found');
    return { booking };
  }
  try {
    const resp = await api.get<{ booking: Booking }>(
      `/bookings/lookup?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`
    );
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function cancelBookingByRefApi(
  ref: string,
  email: string
): Promise<{ message: string; booking: Booking }> {
  const name = 'cancelBookingByRefApi';
  logFunctionStart(name, { ref, email });
  try {
    const resp = await api.post<{ message: string; booking: Booking }>('/bookings/cancel', {
      ref,
      email,
    });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
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
  const name = 'listBookingsApi';
  logFunctionStart(name, { params });
  if (USE_LOCAL) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    let list = localDb.bookings || [];
    if (params?.status) list = list.filter((b: any) => b.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (b: any) =>
          String(b.booking_ref).toLowerCase().includes(q) ||
          String(b.first_name).toLowerCase().includes(q) ||
          String(b.last_name).toLowerCase().includes(q) ||
          String(b.email).toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const bookings = list.slice(start, start + limit);
    return { bookings, total, page, pages };
  }
  try {
    const resp = await api.get<{
      bookings: Booking[];
      total: number;
      page: number;
      pages: number;
    }>('/bookings', { params });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getBookingApi(id: number | string): Promise<{ booking: Booking }> {
  const name = 'getBookingApi';
  logFunctionStart(name, { id });
  if (USE_LOCAL) {
    const booking = (localDb.bookings || []).find((b: any) => String(b.id) === String(id));
    if (!booking) throw new Error('Booking not found');
    return { booking };
  }
  try {
    const resp = await api.get<{ booking: Booking }>(`/bookings/${id}`);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getBookingLogsApi(
  id: number | string
): Promise<{ logs: BookingLog[] }> {
  const name = 'getBookingLogsApi';
  logFunctionStart(name, { id });
  if (USE_LOCAL) {
    return { logs: [] };
  }
  try {
    const resp = await api.get<{ logs: BookingLog[] }>(`/bookings/${id}/logs`);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function updateBookingStatusApi(
  id: number | string,
  status: BookingStatus
): Promise<{ booking: Booking }> {
  const name = 'updateBookingStatusApi';
  logFunctionStart(name, { id, status });
  try {
    const resp = await api.patch<{ booking: Booking }>(`/bookings/${id}/status`, { status });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function assignChauffeurApi(
  id: number | string,
  chauffeur_id: number,
  vehicle_id?: number
): Promise<{ booking: Booking; message: string }> {
  const name = 'assignChauffeurApi';
  logFunctionStart(name, { id, chauffeur_id, vehicle_id });
  try {
    const resp = await api.patch<{ booking: Booking; message: string }>(`/bookings/${id}/assign`, {
      chauffeur_id,
      vehicle_id,
    });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function addBookingNoteApi(
  id: number | string,
  note: string
): Promise<{ logs: BookingLog[]; notes: unknown[] }> {
  const name = 'addBookingNoteApi';
  logFunctionStart(name, { id, note });
  try {
    const resp = await api.patch<{ logs: BookingLog[]; notes: unknown[] }>(`/bookings/${id}/notes`, { note });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function deleteBookingApi(id: number | string): Promise<void> {
  const name = 'deleteBookingApi';
  logFunctionStart(name, { id });
  try {
    const resp = await api.delete(`/bookings/${id}`);
    console.log(`[API][${name}] status`, resp?.status);
    return resp?.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getBookingStatsApi(): Promise<{ stats: BookingStats }> {
  const name = 'getBookingStatsApi';
  logFunctionStart(name);
  try {
    const resp = await api.get<{ stats: BookingStats }>('/bookings/stats');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function getBookingAnalyticsApi(): Promise<{
  daily_bookings: { date: string; count: number }[];
  daily_revenue: { date: string; revenue: number }[];
}> {
  const name = 'getBookingAnalyticsApi';
  logFunctionStart(name);
  try {
    const resp = await api.get('/bookings/analytics');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
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
  const name = 'validatePromoApi';
  logFunctionStart(name, { code, amount });
  if (USE_LOCAL) {
    const promo = (localDb.promos || []).find((p: any) => p.code === String(code).toUpperCase());
    if (!promo || !promo.is_active) return { valid: false, error: 'Invalid promo' };
    if (amount < (promo.min_amount || 0)) return { valid: false, error: 'Minimum amount not met' };
    return { valid: true, promo };
  }
  try {
    const resp = await api.post('/promo/validate', { code, amount });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function listPromosApi(): Promise<{ promos: PromoCode[] }> {
  const name = 'listPromosApi';
  logFunctionStart(name);
  try {
    const resp = await api.get<{ promos: PromoCode[] }>('/promo');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function createPromoApi(
  promoData: Partial<PromoCode>
): Promise<{ promo: PromoCode }> {
  const name = 'createPromoApi';
  logFunctionStart(name, { promoData });
  try {
    const resp = await api.post<{ promo: PromoCode }>('/promo', promoData);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function togglePromoApi(id: number): Promise<{ promo: PromoCode }> {
  const name = 'togglePromoApi';
  logFunctionStart(name, { id });
  try {
    const resp = await api.patch<{ promo: PromoCode }>(`/promo/${id}/toggle`);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

// ─── Geo ─────────────────────────────────────────────────────────────────────
export async function geoSearchApi(q: string): Promise<{ results: GeoResult[] }> {
  const name = 'geoSearchApi';
  logFunctionStart(name, { q });
  try {
    const resp = await api.get<{ results: GeoResult[] }>(`/geo/search?q=${encodeURIComponent(q)}`);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

// ─── Chauffeurs ───────────────────────────────────────────────────────────────
export async function listChauffeursApi(
  params?: { search?: string; assignable?: boolean }
): Promise<{ chauffeurs: Chauffeur[] }> {
  const name = 'listChauffeursApi';
  logFunctionStart(name, { params });
  try {
    const resp = await api.get<{ chauffeurs: Chauffeur[] }>('/chauffeurs', { params });
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function createChauffeurApi(
  chauffeurData: Partial<Chauffeur>
): Promise<{ chauffeur: Chauffeur }> {
  const name = 'createChauffeurApi';
  logFunctionStart(name, { chauffeurData });
  try {
    const resp = await api.post<{ chauffeur: Chauffeur }>('/chauffeurs', chauffeurData);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function updateChauffeurApi(
  id: number,
  chauffeurData: Partial<Chauffeur>
): Promise<{ chauffeur: Chauffeur }> {
  const name = 'updateChauffeurApi';
  logFunctionStart(name, { id, chauffeurData });
  try {
    const resp = await api.patch<{ chauffeur: Chauffeur }>(`/chauffeurs/${id}`, chauffeurData);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function toggleChauffeurApi(id: number): Promise<{ chauffeur: Chauffeur }> {
  const name = 'toggleChauffeurApi';
  logFunctionStart(name, { id });
  try {
    const resp = await api.patch<{ chauffeur: Chauffeur }>(`/chauffeurs/${id}/toggle`);
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

export async function deleteChauffeurApi(id: number): Promise<void> {
  const name = 'deleteChauffeurApi';
  logFunctionStart(name, { id });
  try {
    const resp = await api.delete(`/chauffeurs/${id}`);
    console.log(`[API][${name}] status`, resp?.status);
    return resp?.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getPublicSettingsApi(): Promise<Record<string, unknown>> {
  const name = 'getPublicSettingsApi';
  logFunctionStart(name);
  try {
    const resp = await api.get('/settings');
    console.log(`[API][${name}] status`, resp.status);
    return resp.data;
  } catch (e: any) {
    console.error(`[API][${name}] Error:`, e?.message, e?.stack, e?.response?.data);
    throw e;
  }
}
