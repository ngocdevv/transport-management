'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Truck, MapPin, Route, Activity } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useRealTimeTracking } from '@/hooks/useTracking';
import { formatVehicleStatus, getStatusColor } from '@/utils/formatting';
import ClientOnly from '@/components/ClientOnly';
import React from 'react';


// Memoized statistics card to prevent unnecessary re-renders
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`bg-${color}-100 p-3 rounded-full`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

// Memoized list item component to prevent unnecessary re-renders
const VehicleListItem = React.memo(({ vehicle }: { vehicle: any }) => (
  <div key={vehicle.id} className="flex items-center justify-between p-3 border-b border-gray-100">
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
    <span className={`text-xs font-medium ${getStatusColor(vehicle.status)}`}>
      {formatVehicleStatus(vehicle.status)}
    </span>
  </div>
));

VehicleListItem.displayName = 'VehicleListItem';

function DashboardPage() {
  const [mapView, setMapView] = useState<any>(null);
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const mapInitialized = useRef(false);

  // Memoize vehicleIds to prevent unnecessary calculations
  const vehicleIds = useMemo(() =>
    vehicles.map(v => v.id),
    [vehicles]
  );

  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(vehicleIds);

  // Calculate statistics with memoization to prevent recalculation on every render
  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length
  }), [vehicles]);

  // Memoize callback to reduce rerenders
  const handleMapLoad = useCallback((view: any) => {
    if (!mapInitialized.current) {
      mapInitialized.current = true;
      setMapView(view);
    }
  }, []);

  // Update map with vehicle positions - optimized to reduce rerenders
  useEffect(() => {
    if (!mapView || !mapView.map || currentPositions.size === 0) return;

    // Use requestAnimationFrame to ensure smooth UI
    const animationFrameId = requestAnimationFrame(() => {
      try {
        // Clear existing vehicle markers
        // MapUtils.clearLayer(mapView, 'vehicles');

        // Add current vehicle positions
        currentPositions.forEach((position, vehicleId) => {
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (vehicle && position.location?.coordinates) {
            // MapUtils.addVehicleMarker(mapView, vehicle, position.location.coordinates);
          }
        });
      } catch (error) {
        console.error('Error updating map:', error);
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mapView, currentPositions, vehicles]);

  // Memoize recent activity data to prevent unnecessary re-renders
  const recentActivityData = useMemo(() => {
    if (vehiclesLoading) return [];

    return vehicles
      .filter(v => v.status === 'active')
      .slice(0, 5)
      .map(vehicle => {
        const position = currentPositions.get(vehicle.id);
        return { vehicle, position };
      });
  }, [vehicles, currentPositions, vehiclesLoading]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Vehicle Journey Management System Overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vehicles" value={stats.total} icon={Truck} color="blue" />
        <StatCard title="Active" value={stats.active} icon={Activity} color="green" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={MapPin} color="yellow" />
        <StatCard title="Inactive" value={stats.inactive} icon={Route} color="red" />
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
              {/* <ClientOnly fallback={
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-600">Loading map...</div>
                  </div>
                </div>
              }>
                <ArcGISMap onMapLoad={handleMapLoad} key="map-component" />
              </ClientOnly> */}
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Vehicle Status</h2>
              <p className="text-sm text-gray-600">Current status of all vehicles</p>
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
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {vehicles.slice(0, 10).map(vehicle => (
                    <VehicleListItem key={vehicle.id} vehicle={vehicle} />
                  ))}
                  {vehicles.length > 10 && (
                    <div className="pt-2 text-center">
                      <a href="/dashboard/vehicles" className="text-sm text-blue-600 hover:text-blue-800">
                        View all {vehicles.length} vehicles
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Latest vehicle updates</p>
            </div>
            <div className="p-4">
              {vehiclesLoading || trackingLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <div className="text-gray-600">Loading...</div>
                </div>
              ) : recentActivityData.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivityData.map(({ vehicle, position }) => (
                    <div key={vehicle.id} className="text-sm">
                      <div className="font-medium">{vehicle.license_plate}</div>
                      <div className="text-gray-500">
                        {position ? (
                          `Last update: ${new Date(position.timestamp).toLocaleTimeString()}`
                        ) : (
                          'No recent position data'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardPage); 