'use client';

import { useEffect, useRef, useState } from 'react';
import { useArcGIS } from '@/hooks/useArcgis';
import { useVehicleData, useVehicleHistoryData } from '@/hooks/useVehicleData';

interface MapProps {
  selectedVehicleId?: number | null;
  onSelectVehicle?: (id: number) => void;
  mode?: 'tracking' | 'history';
  dateRange?: { start: Date, end: Date };
}

const Map = ({ selectedVehicleId, onSelectVehicle, mode = 'tracking', dateRange }: MapProps) => {
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
  const vehicles = mode === 'tracking'
    ? allVehicles
    : (historyVehicle ? [historyVehicle] : []);

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