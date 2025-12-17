// Supabase Database Types
// Generated from database schema

// Enums
export type UserRole = 'customer' | 'detailer' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Table: profiles
export interface Profile {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

// Table: detailers
export interface Detailer {
    id: string;
    business_name: string | null;
    service_area_description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Table: services
export interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number;
    estimated_duration_minutes: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Table: bookings
export interface Booking {
    id: string;
    customer_id: string;
    detailer_id: string | null;
    service_id: string;
    booking_time: string;
    location_address: string;
    status: BookingStatus;
    final_price: number | null;
    created_at: string;
    updated_at: string;
}

// Table: detailer_availability
export interface Availability {
    id: string;
    detailer_id: string;
    day_of_week: number; // 0-6 (Sunday-Saturday)
    start_time: string; // TIME format (e.g., "09:00:00")
    end_time: string;   // TIME format (e.g., "17:00:00")
    created_at: string;
    updated_at: string;
}

// Database helper types
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
            };
            detailers: {
                Row: Detailer;
                Insert: Omit<Detailer, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Detailer, 'id' | 'created_at' | 'updated_at'>>;
            };
            services: {
                Row: Service;
                Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;
            };
            bookings: {
                Row: Booking;
                Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
            };
            detailer_availability: {
                Row: Availability;
                Insert: Omit<Availability, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Availability, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}
