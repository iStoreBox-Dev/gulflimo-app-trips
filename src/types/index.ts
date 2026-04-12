export type ServiceType = 'trip' | 'hourly';
export type TransferType = 'oneway' | 'return';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'chauffeur_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';
export type ChauffeurStatus = 'available' | 'on_trip' | 'off_duty' | 'inactive';
export type VehicleCategory = 'sedan' | 'business' | 'suv' | 'van' | 'luxury';

export interface Vehicle {
  id: number;
  name: string;
  model: string;
  category: VehicleCategory;
  capacity: number;
  base_price: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface AddOns {
  meet_greet?: boolean;
  extra_stop?: boolean;
  child_seat?: boolean;
  pet_friendly?: boolean;
  extra_luggage?: boolean;
}

export interface Quote {
  service_type: ServiceType;
  base_price: number;
  add_ons_price: number;
  subtotal_price: number;
  discount_amount: number;
  final_price: number;
  add_ons: AddOns;
  distance_km?: number | null;
}

export interface Booking {
  id: number;
  booking_ref: string;
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
  vehicle_snapshot: {
    name: string;
    model: string;
    category: string;
    base_price: number;
    capacity: number;
  };
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone: string;
  special_requests?: string | null;
  add_ons: AddOns;
  add_ons_price: number;
  promo_code?: string | null;
  base_price: number;
  discount_amount: number;
  final_price: number;
  distance_km?: number | null;
  language_code: string;
  chauffeur_id?: number | null;
  payment_status: string;
  status: BookingStatus;
  source: string;
  internal_notes?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface Chauffeur {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  national_id?: string | null;
  license_number?: string | null;
  license_expiry?: string | null;
  status: ChauffeurStatus;
  assigned_vehicle_id?: number | null;
  languages: string[];
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue_total: number;
  revenue_today: number;
  bookings_today: number;
}

export interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'operator';
}

export interface BookingLog {
  id: number;
  booking_id: number;
  user_id?: number | null;
  action: string;
  note?: string | null;
  created_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  min_amount: number;
  is_active: boolean;
}
