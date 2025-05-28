'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleType, GPSDevice, ApiResponse } from '@/lib/types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_type:vehicle_types(*),
          gps_device:gps_devices(*)
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setVehicles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchVehicles(); // Refresh the list
      return { success: true, data, error: null };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to create vehicle'
      };
    }
  };

  const updateVehicle = async (id: number, vehicleData: Partial<Vehicle>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .update({ ...vehicleData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchVehicles(); // Refresh the list
      return { success: true, data, error: null };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update vehicle'
      };
    }
  };

  const deleteVehicle = async (id: number) => {
    try {
      const { error: supabaseError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      await fetchVehicles(); // Refresh the list
      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete vehicle'
      };
    }
  };

  const getVehicleById = async (id: number): Promise<ApiResponse<Vehicle>> => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_type:vehicle_types(*),
          gps_device:gps_devices(*)
        `)
        .eq('id', id)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return { data, error: null, loading: false };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch vehicle',
        loading: false
      };
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById
  };
}

export function useVehicleTypes() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('vehicle_types')
          .select('*')
          .order('type_name');

        if (supabaseError) {
          throw supabaseError;
        }

        setVehicleTypes(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicle types');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  return { vehicleTypes, loading, error };
}

export function useGPSDevices() {
  const [devices, setDevices] = useState<(GPSDevice & { vehicle_id?: number | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Get devices with information about which vehicle they're assigned to
        const { data, error: supabaseError } = await supabase
          .from('gps_devices')
          .select(`
            *,
            vehicles!gps_devices_id_fkey(id)
          `)
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        // Process the data to add vehicle_id property
        const processedData = (data || []).map(device => {
          const vehicleInfo = device.vehicles && device.vehicles.length > 0
            ? device.vehicles[0]
            : null;

          return {
            ...device,
            vehicle_id: vehicleInfo ? vehicleInfo.id : null,
            // @ts-ignore - Remove the vehicles property as we've extracted what we need
            vehicles: undefined
          };
        });

        setDevices(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch GPS devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, loading, error };
} 