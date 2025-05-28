'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useArcGIS } from '@/hooks/useArcgis';
import { useVehicleData, useVehicleHistoryData } from '@/hooks/useVehicleData';
import { useVehicleSimulation } from '@/hooks/useVehicleSimulation';
import { CornerUpRight } from 'lucide-react';

interface MapProps {
  selectedVehicleId?: number | null;
  mode?: 'tracking' | 'history';
  dateRange?: { start: Date, end: Date };
  isLiveTracking?: boolean;
}

const Map = ({ selectedVehicleId, mode = 'tracking', dateRange, isLiveTracking = false }: MapProps) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Use the appropriate data hook based on the mode
  const { vehicles: allVehicles, loading: loadingAll } = useVehicleData();
  const { vehicle: historyVehicle, loading: loadingHistory } = useVehicleHistoryData(
    mode === 'history' && selectedVehicleId ? selectedVehicleId : 0,
    dateRange
  );

  // Get the vehicles data to display based on mode
  const baseVehicles = mode === 'tracking'
    ? allVehicles
    : (historyVehicle ? [historyVehicle] : []);

  // In live tracking mode, we only want to show the selected vehicle
  const filteredBaseVehicles = useMemo(() => {
    if (isLiveTracking && selectedVehicleId && mode === 'tracking') {
      return baseVehicles.filter(v => v.id === selectedVehicleId);
    }
    return baseVehicles;
  }, [baseVehicles, isLiveTracking, selectedVehicleId, mode]);

  // Simulation hook for demo mode - only simulate the selected vehicle
  const { simulatedVehicles } = useVehicleSimulation(
    Boolean(isLiveTracking && mode === 'tracking'),
    filteredBaseVehicles,
    false // Do not force Ho Chi Minh City area, use actual vehicle position
  );

  // Use simulated vehicles when in live tracking mode, otherwise use the base vehicles
  const vehicles = isLiveTracking && mode === 'tracking' && simulatedVehicles.length > 0
    ? simulatedVehicles
    : (isLiveTracking ? filteredBaseVehicles : baseVehicles);

  // Get selected vehicle info for display
  const selectedVehicleInfo = useMemo(() => {
    if (!selectedVehicleId) return null;

    const matchingSimulated = simulatedVehicles.find(v => v.id === selectedVehicleId);
    if (matchingSimulated) return matchingSimulated;

    return baseVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [selectedVehicleId, simulatedVehicles, baseVehicles]);

  // Check if we're in the browser environment
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    isMapLoaded,
    displayVehicles,
    zoomToVehicle,
    currentTime
  } = useArcGIS(isClient ? 'mapDiv' : "", mode);

  // Update map when vehicles or current time changes
  useEffect(() => {
    if (isMapLoaded && vehicles.length > 0) {
      // Call displayVehicles with the vehicles data
      displayVehicles(vehicles);

      // If we haven't already zoomed to a vehicle and there's a selected vehicle, zoom to it
      if (!mapInitialized && selectedVehicleId) {
        zoomToVehicle(selectedVehicleId, vehicles);
        setMapInitialized(true);
      }
    }
  }, [isMapLoaded, displayVehicles, vehicles, currentTime, selectedVehicleId, mapInitialized, zoomToVehicle]);

  // Zoom to selected vehicle when it changes
  useEffect(() => {
    if (isMapLoaded && selectedVehicleId) {
      zoomToVehicle(selectedVehicleId, vehicles);
    }
  }, [isMapLoaded, selectedVehicleId, zoomToVehicle, vehicles]);

  return (
    <div className="map-container relative w-full h-full">
      <div
        id="mapDiv"
        ref={mapDivRef}
        className="absolute inset-0"
      ></div>

      {mode === 'history' && (
        <div id="timeSliderDiv" className="time-slider absolute bottom-0 left-0 right-0 h-12 bg-white bg-opacity-80 z-10"></div>
      )}

      {/* Demo mode indicator */}
      {isLiveTracking && mode === 'tracking' && selectedVehicleInfo && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs z-10 shadow-md">
          <div className="flex items-center">
            <CornerUpRight className="h-3 w-3 mr-1" />
            <span className="font-medium">Demo Mode</span>
          </div>
          <div className="mt-1 text-xs opacity-90">
            Tracking single vehicle route
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {(loadingAll || loadingHistory || !isMapLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default Map;