'use client';

import Map from '@/components/maps/Map';
import { useRealTimeTracking } from '@/hooks/useTracking';
import { useVehicles } from '@/hooks/useVehicles';
import { MAP_CONFIG } from '@/utils/constants';
import { formatTime, formatVehicleStatus, getStatusColor } from '@/utils/formatting';
import { Layers, MapPin, RefreshCw } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VehicleSelector from '@/components/vehicles/VehicleSelector';

// Memoized update list item
const UpdateListItem = memo(({ vehicle, position }: { vehicle: any; position: any }) => (
  <div className="flex items-center p-2 border-b border-gray-100">
    <div className="flex-shrink-0 mr-3">
      <div className="bg-blue-100 p-2 rounded-full">
        <MapPin className="h-4 w-4 text-blue-600" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">
        {vehicle.license_plate}
      </p>
      <div className="flex text-xs text-gray-500">
        <p>
          {new Date(position.timestamp).toLocaleTimeString()} •&nbsp;
        </p>
        <p>
          Speed: {position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A'}
        </p>
      </div>
    </div>
    <div className="text-xs text-gray-500">
      {position.location.coordinates[1].toFixed(5)}, {position.location.coordinates[0].toFixed(5)}
    </div>
  </div>
));

UpdateListItem.displayName = 'UpdateListItem';

function LiveTrackingPage() {
  const [mapView, setMapView] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [basemap, setBasemap] = useState(MAP_CONFIG.BASEMAPS.STREETS);
  const [autoZoom, setAutoZoom] = useState(true);
  const [isBasemapDropdownOpen, setIsBasemapDropdownOpen] = useState(false);
  const mapInitialized = useRef(false);

  const { vehicles, loading: vehiclesLoading } = useVehicles();

  // Prepare vehicle ID for the tracking hook
  const vehicleIdArray = useMemo(() =>
    selectedVehicleId ? [selectedVehicleId] : vehicles.map(v => v.id),
    [selectedVehicleId, vehicles]
  );

  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(vehicleIdArray);

  // Initialize with first active vehicle selected
  useEffect(() => {
    if (!vehiclesLoading && vehicles.length > 0 && !selectedVehicleId) {
      const activeVehicle = vehicles.find(v => v.status === 'active');
      if (activeVehicle) {
        setSelectedVehicleId(activeVehicle.id);
      } else if (vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0].id);
      }
    }
  }, [vehicles, vehiclesLoading, selectedVehicleId]);

  const handleMapLoad = useCallback((view: any) => {
    if (!mapInitialized.current) {
      mapInitialized.current = true;
      setMapView(view);
    }
  }, []);

  const handleVehicleSelect = useCallback((vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const handleBasemapChange = useCallback((newBasemap: string) => {
    setBasemap(newBasemap);
    setIsBasemapDropdownOpen(false);
    if (mapView && mapView.map) {
      // Implementation for changing basemap would go here
    }
  }, [mapView]);

  const toggleBasemapDropdown = useCallback(() => {
    setIsBasemapDropdownOpen(prev => !prev);
  }, []);

  // Memoize recent updates to prevent unnecessary re-renders
  const recentUpdates = useMemo(() => {
    return Array.from(currentPositions.entries())
      .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime())
      .slice(0, 10)
      .map(([vehicleId, position]) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;
        return { vehicle, position };
      })
      .filter((item): item is { vehicle: any; position: any } => item !== null);
  }, [currentPositions, vehicles]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600">Real-time vehicle position monitoring</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Vehicle List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vehicles</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a vehicle to track
            </p>
          </div>
          <div className="p-4">
            <VehicleSelector
              vehicles={vehicles}
              currentPositions={currentPositions}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={handleVehicleSelect}
              loading={vehiclesLoading}
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Live Map</h2>
                <p className="text-sm text-gray-600">
                  {selectedVehicleId
                    ? `Tracking vehicle: ${vehicles.find(v => v.id === selectedVehicleId)?.license_plate || ''}`
                    : 'No vehicle selected'}
                </p>
              </div>

              {/* Map Controls */}
              <div className="flex space-x-2">
                {/* Basemap Selector */}
                <div className="relative">
                  <button
                    onClick={toggleBasemapDropdown}
                    className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-sm"
                  >
                    <Layers className="h-4 w-4 text-gray-500" />
                    <span>Basemap</span>
                  </button>
                  {isBasemapDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => handleBasemapChange(MAP_CONFIG.BASEMAPS.STREETS)}
                        className={`flex w-full px-4 py-2 text-sm text-left ${basemap === MAP_CONFIG.BASEMAPS.STREETS ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Streets
                      </button>
                      <button
                        onClick={() => handleBasemapChange(MAP_CONFIG.BASEMAPS.SATELLITE)}
                        className={`flex w-full px-4 py-2 text-sm text-left ${basemap === MAP_CONFIG.BASEMAPS.SATELLITE ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Satellite
                      </button>
                      <button
                        onClick={() => handleBasemapChange(MAP_CONFIG.BASEMAPS.HYBRID)}
                        className={`flex w-full px-4 py-2 text-sm text-left ${basemap === MAP_CONFIG.BASEMAPS.HYBRID ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Hybrid
                      </button>
                      <button
                        onClick={() => handleBasemapChange(MAP_CONFIG.BASEMAPS.TOPO)}
                        className={`flex w-full px-4 py-2 text-sm text-left ${basemap === MAP_CONFIG.BASEMAPS.TOPO ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Topographic
                      </button>
                    </div>
                  )}
                </div>

                {/* Auto Zoom Toggle */}
                <button
                  onClick={() => setAutoZoom(!autoZoom)}
                  className={`flex items-center space-x-1 px-3 py-1 border rounded-md text-sm ${autoZoom
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700'
                    }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Auto Zoom</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-sm"
                >
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="h-[600px]">
              <Map
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={handleVehicleSelect}
                mode="tracking"
                key={`map-${selectedVehicleId}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Updates Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Updates</h2>
          <p className="text-sm text-gray-600">Latest vehicle position updates</p>
        </div>
        <div className="p-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentUpdates.length > 0 ? (
              recentUpdates.map(({ vehicle, position }) => (
                <UpdateListItem
                  key={`${vehicle.id}-${position.timestamp}`}
                  vehicle={vehicle}
                  position={position}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No recent updates available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LiveTrackingPage); 