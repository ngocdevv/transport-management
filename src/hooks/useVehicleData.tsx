'use client';

import { useState, useEffect } from 'react';
import { useVehicles } from './useVehicles';
import { useRealTimeTracking } from './useTracking';
import { Vehicle } from '@/lib/types';

// Define the types for our data structures
interface RoutePoint {
  timestamp: string;
  longitude: number;
  latitude: number;
  speed: number;
}

interface FormattedVehicle {
  id: number;
  name: string;
  type: string;
  color: string;
  routes: RoutePoint[];
  status: string;
  license_plate: string;
  model: string | null;
}

// Extended Vehicle type that includes display properties that exist in the database
// but might not be in the TypeScript definition yet
interface ExtendedVehicle extends Vehicle {
  display_name?: string;
  display_color?: string;
  icon_type?: string;
}

export function useVehicleData() {
  const [formattedVehicles, setFormattedVehicles] = useState<FormattedVehicle[]>([]);
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  // Get all vehicle IDs
  const vehicleIds = vehicles.map(v => v.id);
  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(vehicleIds);

  useEffect(() => {
    if (vehiclesLoading || trackingLoading) return;

    try {
      // Transform vehicles data to match the format expected by the Map component
      const formatted = vehicles.map(vehicle => {
        // Cast to ExtendedVehicle to access the display properties
        const extendedVehicle = vehicle as ExtendedVehicle;

        // Get the track points for this vehicle
        const routes: RoutePoint[] = [];

        // Add track point from the current position if available
        const currentPosition = currentPositions.get(vehicle.id);
        if (currentPosition) {
          const { location, timestamp, speed } = currentPosition;
          if (location && location.coordinates) {
            routes.push({
              timestamp,
              longitude: location.coordinates[0],
              latitude: location.coordinates[1],
              speed: speed || 0
            });
          }
        }

        // If no routes are available, we can't display this vehicle on the map
        if (routes.length === 0) return null;

        return {
          id: vehicle.id,
          name: extendedVehicle.display_name || `Vehicle ${vehicle.license_plate}`,
          type: vehicle.vehicle_type?.type_name || extendedVehicle.icon_type || 'default',
          color: extendedVehicle.display_color || '#4285F4',
          routes,
          status: vehicle.status || 'unknown',
          license_plate: vehicle.license_plate,
          model: vehicle.model
        };
      }).filter(Boolean) as FormattedVehicle[];

      console.log('Formatted vehicles:', formatted);
      setFormattedVehicles(formatted);
    } catch (error) {
      console.error('Error formatting vehicles:', error);
      setFormattedVehicles([]);
    }
  }, [vehicles, currentPositions, vehiclesLoading, trackingLoading]);

  return {
    vehicles: formattedVehicles,
    loading: vehiclesLoading || trackingLoading
  };
}

// This hook combines historical tracking data with vehicle information
// for history playback mode
export function useVehicleHistoryData(vehicleId: number, dateRange?: { start: Date, end: Date }) {
  const [formattedVehicle, setFormattedVehicle] = useState<FormattedVehicle | null>(null);
  const { vehicles } = useVehicles();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    const fetchHistoricalData = async () => {
      setLoading(true);
      try {
        // Find the vehicle in our list
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
          setLoading(false);
          return;
        }

        // Cast to ExtendedVehicle to access the display properties
        const extendedVehicle = vehicle as ExtendedVehicle;

        // Fetch historical tracking data from Supabase
        const { supabase } = await import('@/lib/supabase');
        const { postgisToGeoJSON } = await import('@/utils/geometry');

        let query = supabase
          .from('track_points')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('timestamp', { ascending: true });

        if (dateRange) {
          query = query
            .gte('timestamp', dateRange.start.toISOString())
            .lte('timestamp', dateRange.end.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform the track points to the format expected by the Map
        const routes: RoutePoint[] = (data || []).map(point => ({
          timestamp: point.timestamp,
          longitude: postgisToGeoJSON(point.location).coordinates[0],
          latitude: postgisToGeoJSON(point.location).coordinates[1],
          speed: point.speed || 0
        }));

        // If no routes are available, we can't display this vehicle on the map
        if (routes.length === 0) {
          console.log('No historical data found for vehicle:', vehicleId);
          setFormattedVehicle(null);
          setLoading(false);
          return;
        }

        const formattedData: FormattedVehicle = {
          id: vehicle.id,
          name: extendedVehicle.display_name || `Vehicle ${vehicle.license_plate}`,
          type: vehicle.vehicle_type?.type_name || extendedVehicle.icon_type || 'default',
          color: extendedVehicle.display_color || '#4285F4',
          routes,
          status: vehicle.status || 'unknown',
          license_plate: vehicle.license_plate,
          model: vehicle.model
        };

        console.log('Formatted history vehicle:', formattedData);
        setFormattedVehicle(formattedData);
      } catch (error) {
        console.error('Error fetching vehicle history:', error);
        setFormattedVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [vehicleId, vehicles, dateRange]);

  return {
    vehicle: formattedVehicle,
    loading
  };
} 