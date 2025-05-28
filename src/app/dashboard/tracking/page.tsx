'use client';

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import { Truck, Layers, RefreshCw, MapPin } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useRealTimeTracking } from '@/hooks/useTracking';
import { formatVehicleStatus, getStatusColor, formatTime } from '@/utils/formatting';
import { MapUtils } from '@/components/maps/ArcGISMap';
import { MAP_CONFIG } from '@/utils/constants';
import ClientOnly from '@/components/ClientOnly';

// Dynamically import ArcGIS map to avoid SSR issues
// Use explicit key to ensure proper component mounting/unmounting
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

// Memoized vehicle list item to prevent unnecessary re-renders
const VehicleListItem = memo(({
  vehicle,
  position,
  isSelected,
  onToggle
}: {
  vehicle: any;
  position: any;
  isSelected: boolean;
  onToggle: () => void
}) => (
  <div
    className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${isSelected
      ? 'border-blue-500 bg-blue-50'
      : 'border-gray-200 hover:bg-gray-50'
      }`}
    onClick={onToggle}
  >
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <Truck className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
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
          Last update: {formatTime(position.timestamp)}
        </p>
      )}
    </div>
  </div>
));

VehicleListItem.displayName = 'VehicleListItem';

// Memoized update list item
const UpdateListItem = memo(({ vehicle, position }: { vehicle: any; position: any }) => (
  <div className="flex items-center p-2 border-b border-gray-100">
    <div className="flex-shrink-0 mr-3">
      <div className="bg-blue-100 p-2 rounded-full">
        <Truck className="h-4 w-4 text-blue-600" />
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
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [basemap, setBasemap] = useState(MAP_CONFIG.BASEMAPS.STREETS);
  const [autoZoom, setAutoZoom] = useState(true);
  const [isBasemapDropdownOpen, setIsBasemapDropdownOpen] = useState(false);
  const mapInitialized = useRef(false);

  const { vehicles, loading: vehiclesLoading } = useVehicles();

  // Memoize the selectedVehicleIds to prevent unnecessary rerenders
  const memoizedSelectedVehicleIds = useMemo(() =>
    selectedVehicleIds,
    [selectedVehicleIds.join(',')]
  );

  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(memoizedSelectedVehicleIds);

  // Initialize with all active vehicles selected
  useEffect(() => {
    if (!vehiclesLoading && vehicles.length > 0 && selectedVehicleIds.length === 0) {
      const activeVehicleIds = vehicles
        .filter(v => v.status === 'active')
        .map(v => v.id);
      setSelectedVehicleIds(activeVehicleIds);
    }
  }, [vehicles, vehiclesLoading, selectedVehicleIds]);

  // Update map with vehicle positions - use requestAnimationFrame for better performance
  useEffect(() => {
    if (!mapView || !mapView.map || currentPositions.size === 0) return;

    const animationFrameId = requestAnimationFrame(() => {
      try {
        // Clear existing vehicle markers
        MapUtils.clearLayer(mapView, 'vehicles');

        // Add current vehicle positions
        currentPositions.forEach((position, vehicleId) => {
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (vehicle && position.location?.coordinates) {
            MapUtils.addVehicleMarker(mapView, vehicle, position.location.coordinates);
          }
        });

        // Auto zoom to fit all vehicles if enabled
        if (autoZoom && currentPositions.size > 0) {
          MapUtils.zoomToLayer(mapView, 'vehicles');
        }
      } catch (error) {
        console.error('Error updating map:', error);
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mapView, currentPositions, vehicles, autoZoom]);

  const handleMapLoad = useCallback((view: any) => {
    if (!mapInitialized.current) {
      mapInitialized.current = true;
      setMapView(view);
    }
  }, []);

  const toggleVehicleSelection = useCallback((vehicleId: number) => {
    setSelectedVehicleIds(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  }, []);

  const handleBasemapChange = useCallback((newBasemap: string) => {
    setBasemap(newBasemap);
    setIsBasemapDropdownOpen(false);
    if (mapView && mapView.map) {
      MapUtils.changeBasemap(mapView, newBasemap);
    }
  }, [mapView]);

  const selectAllVehicles = useCallback(() => {
    setSelectedVehicleIds(vehicles.map(v => v.id));
  }, [vehicles]);

  const deselectAllVehicles = useCallback(() => {
    setSelectedVehicleIds([]);
  }, []);

  const selectActiveVehicles = useCallback(() => {
    const activeIds = vehicles
      .filter(v => v.status === 'active')
      .map(v => v.id);
    setSelectedVehicleIds(activeIds);
  }, [vehicles]);

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
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={selectAllVehicles}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
              >
                Select All
              </button>
              <button
                onClick={deselectAllVehicles}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
              >
                Deselect All
              </button>
              <button
                onClick={selectActiveVehicles}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded"
              >
                Active Only
              </button>
            </div>
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vehicles.map((vehicle) => {
                  const position = currentPositions.get(vehicle.id);
                  const isSelected = selectedVehicleIds.includes(vehicle.id);

                  return (
                    <VehicleListItem
                      key={vehicle.id}
                      vehicle={vehicle}
                      position={position}
                      isSelected={isSelected}
                      onToggle={() => toggleVehicleSelection(vehicle.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Live Map</h2>
                <p className="text-sm text-gray-600">
                  {selectedVehicleIds.length} vehicles selected
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
                  className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  onClick={() => {
                    if (mapView && mapView.map) {
                      MapUtils.zoomToLayer(mapView, 'vehicles');
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="h-[600px]">
              <ClientOnly fallback={
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-600">Loading map...</div>
                  </div>
                </div>
              }>
                <ArcGISMap onMapLoad={handleMapLoad} key="tracking-map-component" />
              </ClientOnly>
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