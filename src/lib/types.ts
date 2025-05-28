// User roles and permissions
export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  role: UserRole | null;
  email: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Permissions {
  canManageUsers: boolean;
  canManageVehicles: boolean;
  canViewAllVehicles: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageDevices: boolean;
}

// Vehicle related types
export interface VehicleType {
  id: number;
  type_name: string;
  description: string | null;
  created_at: string | null;
}

export interface GPSDevice {
  id: number;
  device_imei: string;
  sim_number: string | null;
  install_date: string | null;
  status: string | null;
  created_at: string | null;
}

export interface Vehicle {
  id: number;
  license_plate: string;
  model: string | null;
  year: number | null;
  status: 'active' | 'maintenance' | 'inactive' | null;
  vehicle_type_id: number | null;
  device_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  vehicle_type?: VehicleType;
  gps_device?: GPSDevice;
}

// Tracking and journey types
export interface TrackPoint {
  id: number;
  vehicle_id: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  timestamp: string;
  speed: number | null;
  altitude: number | null;
  heading: number | null;
  accuracy: number | null;
  created_at: string | null;
}

export interface Journey {
  id: number;
  vehicle_id: number;
  start_timestamp: string;
  end_timestamp: string | null;
  start_location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  end_location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  total_distance: number | null;
  start_address: string | null;
  end_address: string | null;
  created_at: string | null;
  // Joined data
  vehicle?: Vehicle;
}

// Map and UI types
export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSliderState {
  startTime: Date;
  endTime: Date;
  currentTime: Date;
  isPlaying: boolean;
  playbackSpeed: number;
}

// Statistics and reports
export interface VehicleStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;
}

export interface JourneyStats {
  totalJourneys: number;
  totalDistance: number;
  averageSpeed: number;
  totalDuration: number;
}

// Form types
export interface VehicleFormData {
  license_plate: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  vehicle_type_id: number;
  device_id: number | null;
}

export interface UserFormData {
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  password?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Permission matrix
export const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    canManageUsers: true,
    canManageVehicles: true,
    canViewAllVehicles: true,
    canViewReports: true,
    canExportData: true,
    canManageDevices: true
  },
  manager: {
    canManageUsers: false,
    canManageVehicles: true,
    canViewAllVehicles: true,
    canViewReports: true,
    canExportData: true,
    canManageDevices: false
  },
  viewer: {
    canManageUsers: false,
    canManageVehicles: false,
    canViewAllVehicles: true,
    canViewReports: false,
    canExportData: false,
    canManageDevices: false
  }
}; 