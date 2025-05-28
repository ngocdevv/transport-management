'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Truck, MapPin, Route, Activity } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useRealTimeTracking } from '@/hooks/useTracking';
import { formatVehicleStatus, getStatusColor } from '@/utils/formatting';
import { MapUtils } from '@/components/maps/ArcGISMap';

// Dynamically import ArcGIS map to avoid SSR issues
const ArcGISMap = dynamic(() => import('@/components/maps/ArcGISMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600">Loading map...</div>
      </div>
    </div>
  )
});

export default function DashboardPage() {
  const [mapView, setMapView] = useState<any>(null);
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const vehicleIds = vehicles.map(v => v.id);
  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(vehicleIds);

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length
  };

  // Update map with vehicle positions
  useEffect(() => {
    if (!mapView || currentPositions.size === 0) return;

    // Clear existing vehicle markers
    MapUtils.clearLayer(mapView, 'vehicles');

    // Add current vehicle positions
    currentPositions.forEach((position, vehicleId) => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && position.location?.coordinates) {
        MapUtils.addVehicleMarker(mapView, vehicle, position.location.coordinates);
      }
    });
  }, [mapView, currentPositions, vehicles]);

  const handleMapLoad = (view: any) => {
    setMapView(view);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Vehicle Journey Management System Overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <MapPin className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <Route className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live Vehicle Tracking</h2>
              <p className="text-sm text-gray-600">Real-time vehicle positions</p>
            </div>
            <div className="h-96">
              <ArcGISMap onMapLoad={handleMapLoad} />
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Status</h2>
            <p className="text-sm text-gray-600">Current fleet overview</p>
          </div>
          <div className="p-4">
            {vehiclesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <div className="text-gray-600">Loading vehicles...</div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No vehicles found
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {vehicles.map((vehicle) => {
                  const position = currentPositions.get(vehicle.id);
                  return (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Truck className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vehicle.license_plate}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.model || 'Unknown Model'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {formatVehicleStatus(vehicle.status)}
                        </span>
                        {position && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last seen: {new Date(position.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">Latest vehicle movements and updates</p>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {Array.from(currentPositions.entries()).slice(0, 5).map(([vehicleId, position]) => {
              const vehicle = vehicles.find(v => v.id === vehicleId);
              if (!vehicle) return null;

              return (
                <div key={vehicleId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.license_plate} updated position
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(position.timestamp).toLocaleString()} •
                      Speed: {position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 