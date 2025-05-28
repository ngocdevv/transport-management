'use client';

import Map from '@/components/maps/Map';
import UpdateListItem from '@/components/vehicles/UpdateListItem';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import { useRealTimeTracking } from '@/hooks/useTracking';
import { useVehicles } from '@/hooks/useVehicles';
import { useVehicleSimulation } from '@/hooks/useVehicleSimulation';
import { MAP_CONFIG } from '@/utils/constants';
import { Layers, MapPin, RefreshCw, Play, Pause, BarChart } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

function LiveTrackingPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [basemap, setBasemap] = useState(MAP_CONFIG.BASEMAPS.STREETS);
  const [autoZoom, setAutoZoom] = useState(true);
  const [isBasemapDropdownOpen, setIsBasemapDropdownOpen] = useState(false);
  const [liveTrackingVehicles, setLiveTrackingVehicles] = useState<Set<number>>(new Set());
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  // Check if current selected vehicle has live tracking enabled
  const isLiveTracking = useMemo(() =>
    selectedVehicleId ? liveTrackingVehicles.has(selectedVehicleId) : false,
    [selectedVehicleId, liveTrackingVehicles]
  );

  // Prepare vehicle ID for the tracking hook
  const vehicleIdArray = useMemo(() =>
    selectedVehicleId ? [selectedVehicleId] : vehicles.map(v => v.id),
    [selectedVehicleId, vehicles]
  );

  const { currentPositions, loading: trackingLoading } = useRealTimeTracking(vehicleIdArray);

  // Get simulated vehicles data for demo mode
  const { simulatedVehicles, totalDistance } = useVehicleSimulation(
    isLiveTracking,
    selectedVehicleId ? vehicles.filter(v => v.id === selectedVehicleId) : [],
    false // Use actual vehicle position instead of forcing Ho Chi Minh City area
  );

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

  const handleVehicleSelect = useCallback((vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const handleBasemapChange = useCallback((newBasemap: string) => {
    setBasemap(newBasemap);
    setIsBasemapDropdownOpen(false);
  }, []);

  const toggleBasemapDropdown = useCallback(() => {
    setIsBasemapDropdownOpen(prev => !prev);
  }, []);

  const toggleLiveTracking = useCallback(() => {
    if (!selectedVehicleId) return;

    // Check if vehicle is active before enabling live tracking
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle && selectedVehicle.status !== 'active') {
      // Don't allow demo mode for inactive vehicles
      return;
    }

    setLiveTrackingVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(selectedVehicleId)) {
        newSet.delete(selectedVehicleId);
      } else {
        newSet.add(selectedVehicleId);
      }
      return newSet;
    });
  }, [selectedVehicleId, vehicles]);

  // Memoize recent updates to prevent unnecessary re-renders
  const recentUpdates = useMemo(() => {
    if (isLiveTracking && simulatedVehicles.length > 0) {
      // Use simulated data in demo mode
      return simulatedVehicles
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(vehicle => ({
          vehicle: vehicles.find(v => v.id === vehicle.id) || {
            id: vehicle.id,
            license_plate: vehicle.license_plate
          },
          position: {
            timestamp: vehicle.timestamp,
            speed: vehicle.speed,
            coordinates: vehicle.coordinates,
            distance: vehicle.distance
          }
        }));
    }

    // Use real API data
    return Array.from(currentPositions.entries())
      .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime())
      .slice(0, 10)
      .map(([vehicleId, position]) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return null;
        return { vehicle, position };
      })
      .filter((item): item is { vehicle: any; position: any } => item !== null);
  }, [currentPositions, vehicles, isLiveTracking, simulatedVehicles]);

  // Get the selected vehicle's simulated data if any
  const selectedVehicleSimulated = useMemo(() => {
    if (!selectedVehicleId || !isLiveTracking) return null;
    return simulatedVehicles.find(v => v.id === selectedVehicleId);
  }, [selectedVehicleId, simulatedVehicles, isLiveTracking]);

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
              simulatedVehicles={simulatedVehicles}
              isLiveTracking={isLiveTracking}
              liveTrackingVehicles={liveTrackingVehicles}
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
                  {selectedVehicleId ? (
                    <>
                      Tracking vehicle: {vehicles.find(v => v.id === selectedVehicleId)?.license_plate || ''}
                      {isLiveTracking && (
                        <span className="text-green-600 ml-2 text-xs font-medium">
                          • Demo Mode
                        </span>
                      )}
                    </>
                  ) : 'No vehicle selected'}
                </p>
              </div>

              {/* Map Controls */}
              <div className="flex space-x-2">
                {/* Demo Mode Toggle - Only show when a vehicle is selected */}
                {selectedVehicleId && (
                  <button
                    onClick={toggleLiveTracking}
                    className={`flex items-center space-x-1 px-3 py-1 border rounded-md text-sm ${isLiveTracking
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700'
                      } ${vehicles.find(v => v.id === selectedVehicleId)?.status !== 'active' && !isLiveTracking
                        ? 'opacity-50 cursor-not-allowed'
                        : ''}`}
                    title={isLiveTracking
                      ? "Disable demo mode"
                      : vehicles.find(v => v.id === selectedVehicleId)?.status === 'active'
                        ? "Enable demo mode"
                        : "Vehicle must be active to enable demo mode"}
                    disabled={!isLiveTracking && vehicles.find(v => v.id === selectedVehicleId)?.status !== 'active'}
                  >
                    {isLiveTracking ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>Stop Demo</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Start Demo</span>
                      </>
                    )}
                  </button>
                )}

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

            <div className="h-[600px] relative">
              <Map
                selectedVehicleId={selectedVehicleId}
                mode="tracking"
                key={`map-${selectedVehicleId}-${isLiveTracking}`}
                isLiveTracking={isLiveTracking}
              />

              {/* Distance info overlay for simulation mode */}
              {isLiveTracking && selectedVehicleSimulated && (
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow z-10 max-w-xs">
                  <div className="flex items-center text-gray-700 font-medium">
                    <BarChart className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Simulation Statistics</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance traveled:</span>
                      <span className="font-medium">{selectedVehicleSimulated.distance?.toFixed(1) || 0} km</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Current speed:</span>
                      <span className="font-medium">{selectedVehicleSimulated.speed?.toFixed(1) || 0} km/h</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Heading:</span>
                      <span className="font-medium">{Math.round(selectedVehicleSimulated.heading || 0)}°</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">Current Location</span>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Simulation Summary - Only show for currently simulated vehicle */}
      {isLiveTracking && selectedVehicleSimulated && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Simulation Summary</h2>
            <p className="text-sm text-gray-600">Vehicle movement simulation (Demo Mode)</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedVehicleSimulated.license_plate}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {vehicles.find(v => v.id === selectedVehicleSimulated.id)?.model || 'Unknown Model'}
                    </p>
                  </div>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: `rgb(${selectedVehicleSimulated.color?.[0] || 0}, ${selectedVehicleSimulated.color?.[1] || 0}, ${selectedVehicleSimulated.color?.[2] || 0})`
                    }}
                  />
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{selectedVehicleSimulated.distance?.toFixed(1) || 0} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed:</span>
                    <span className="font-medium">{selectedVehicleSimulated.speed?.toFixed(1) || 0} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heading:</span>
                    <span className="font-medium">{Math.round(selectedVehicleSimulated.heading || 0)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">Current Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LiveTrackingPage); 