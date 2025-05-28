// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [105.8342, 21.0278] as [number, number], // Hanoi coordinates
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 8,
  MAX_ZOOM: 18,
  BASEMAPS: {
    STREETS: 'streets-navigation-vector',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TOPO: 'topo-vector'
  }
};

// Vehicle status options
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive'
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
} as const;

// GPS device status
export const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline'
} as const;

// Time slider configuration
export const TIME_SLIDER_CONFIG = {
  DEFAULT_SPEED: 1, // 1x speed
  SPEED_OPTIONS: [0.5, 1, 2, 5, 10],
  UPDATE_INTERVAL: 1000, // milliseconds
  STEP_SIZE: 60000 // 1 minute in milliseconds
};

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#6366F1',
  SECONDARY: '#6B7280'
};

// Vehicle type colors for map markers
export const VEHICLE_TYPE_COLORS = {
  1: '#3B82F6', // Truck - Blue
  2: '#10B981', // Van - Green
  3: '#F59E0B', // Car - Yellow
  4: '#EF4444', // Bus - Red
  5: '#8B5CF6'  // Motorcycle - Purple
};

// API endpoints
export const API_ENDPOINTS = {
  VEHICLES: '/api/vehicles',
  TRACK_POINTS: '/api/track-points',
  JOURNEYS: '/api/journeys',
  USERS: '/api/users',
  VEHICLE_TYPES: '/api/vehicle-types',
  GPS_DEVICES: '/api/gps-devices',
  STATISTICS: '/api/statistics'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm:ss',
  ISO: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss'
};

// Local storage keys
export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  MAP_VIEW: 'mapView',
  PREFERENCES: 'userPreferences',
  SELECTED_VEHICLES: 'selectedVehicles'
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  VEHICLE_CREATED: 'Vehicle created successfully',
  VEHICLE_UPDATED: 'Vehicle updated successfully',
  VEHICLE_DELETED: 'Vehicle deleted successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful'
};

// Validation rules
export const VALIDATION = {
  LICENSE_PLATE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 15,
    PATTERN: /^[0-9]{2}[A-Z]-[0-9]{4,5}$/ // Vietnamese license plate format
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  IMEI: {
    LENGTH: 15,
    PATTERN: /^[0-9]{15}$/
  }
};

// Real-time update intervals
export const UPDATE_INTERVALS = {
  VEHICLE_POSITIONS: 30000, // 30 seconds
  STATISTICS: 60000, // 1 minute
  JOURNEY_STATUS: 10000 // 10 seconds
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json'
} as const;

// Map layer types
export const MAP_LAYERS = {
  VEHICLES: 'vehicles',
  ROUTES: 'routes',
  TRACK_POINTS: 'track-points',
  GEOFENCES: 'geofences'
} as const;

// Journey status
export const JOURNEY_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
} as const; 