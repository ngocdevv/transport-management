import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          password_hash: string | null;
          full_name: string | null;
          role: "admin" | "manager" | "viewer" | null;
          email: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          username?: string | null;
          password_hash?: string | null;
          full_name?: string | null;
          role?: "admin" | "manager" | "viewer" | null;
          email: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          password_hash?: string | null;
          full_name?: string | null;
          role?: "admin" | "manager" | "viewer" | null;
          email?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      vehicle_types: {
        Row: {
          id: number;
          type_name: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          type_name: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          type_name?: string;
          description?: string | null;
          created_at?: string | null;
        };
      };
      gps_devices: {
        Row: {
          id: number;
          device_imei: string;
          sim_number: string | null;
          install_date: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          device_imei: string;
          sim_number?: string | null;
          install_date?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          device_imei?: string;
          sim_number?: string | null;
          install_date?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
      };
      vehicles: {
        Row: {
          id: number;
          license_plate: string;
          model: string | null;
          year: number | null;
          status: "active" | "maintenance" | "inactive" | null;
          vehicle_type_id: number | null;
          device_id: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          license_plate: string;
          model?: string | null;
          year?: number | null;
          status?: "active" | "maintenance" | "inactive" | null;
          vehicle_type_id?: number | null;
          device_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          license_plate?: string;
          model?: string | null;
          year?: number | null;
          status?: "active" | "maintenance" | "inactive" | null;
          vehicle_type_id?: number | null;
          device_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      track_points: {
        Row: {
          id: number;
          vehicle_id: number;
          location: any; // PostGIS geometry
          timestamp: string;
          speed: number | null;
          altitude: number | null;
          heading: number | null;
          accuracy: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          vehicle_id: number;
          location: any;
          timestamp: string;
          speed?: number | null;
          altitude?: number | null;
          heading?: number | null;
          accuracy?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          vehicle_id?: number;
          location?: any;
          timestamp?: string;
          speed?: number | null;
          altitude?: number | null;
          heading?: number | null;
          accuracy?: number | null;
          created_at?: string | null;
        };
      };
      journeys: {
        Row: {
          id: number;
          vehicle_id: number;
          start_timestamp: string;
          end_timestamp: string | null;
          start_location: any | null;
          end_location: any | null;
          total_distance: number | null;
          start_address: string | null;
          end_address: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          vehicle_id: number;
          start_timestamp: string;
          end_timestamp?: string | null;
          start_location?: any | null;
          end_location?: any | null;
          total_distance?: number | null;
          start_address?: string | null;
          end_address?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          vehicle_id?: number;
          start_timestamp?: string;
          end_timestamp?: string | null;
          start_location?: any | null;
          end_location?: any | null;
          total_distance?: number | null;
          start_address?: string | null;
          end_address?: string | null;
          created_at?: string | null;
        };
      };
    };
  };
}
