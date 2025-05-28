'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { MAP_CONFIG } from '@/utils/constants';
import { loadArcGISModules, ArcGISModules } from '@/utils/arcgisLoader';

interface ArcGISMapProps {
  onMapLoad?: (view: any) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function ArcGISMap({
  onMapLoad,
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  className = "w-full h-full"
}: ArcGISMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<ArcGISModules | null>(null);

  // Memoize center and zoom to prevent unnecessary re-renders
  const memoizedCenter = useMemo(() => center, [center[0], center[1]]);
  const memoizedZoom = useMemo(() => zoom, [zoom]);

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        // Load ArcGIS modules efficiently
        const arcgisModules = await loadArcGISModules();
        if (!mounted) return;

        setModules(arcgisModules);

        if (!mapDiv.current) return;

        // Create the map
        const map = new arcgisModules.Map({
          basemap: MAP_CONFIG.BASEMAPS.STREETS
        });

        // Create the map view
        const view = new arcgisModules.MapView({
          container: mapDiv.current,
          map: map,
          center: memoizedCenter,
          zoom: memoizedZoom,
          constraints: {
            minZoom: MAP_CONFIG.MIN_ZOOM,
            maxZoom: MAP_CONFIG.MAX_ZOOM
          }
        });

        // Add graphics layers for vehicles and routes
        const vehicleLayer = new arcgisModules.GraphicsLayer({
          id: 'vehicles',
          title: 'Vehicles'
        });

        const routeLayer = new arcgisModules.GraphicsLayer({
          id: 'routes',
          title: 'Routes'
        });

        map.addMany([routeLayer, vehicleLayer]);

        // Wait for the view to load
        await view.when();

        if (!mounted) {
          view.destroy();
          return;
        }

        viewRef.current = view;
        setIsLoading(false);
        onMapLoad?.(view);

      } catch (err) {
        console.error('Failed to initialize map:', err);
        if (mounted) {
          setError('Failed to load map. Please refresh the page.');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [memoizedCenter, memoizedZoom, onMapLoad]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <div className="text-gray-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapDiv}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for map operations
export const MapUtils = {
  // Add a vehicle marker to the map
  addVehicleMarker: (view: any, vehicle: any, position: [number, number]) => {
    if (!view || !view.map) return null;

    // Access ArcGIS modules
    const arcgisModules = getArcGISModulesFromView(view);
    if (!arcgisModules) return null;

    const point = new arcgisModules.Point({
      longitude: position[0],
      latitude: position[1]
    });

    const symbol = new arcgisModules.SimpleMarkerSymbol({
      color: [51, 130, 246], // Blue color
      size: 12,
      outline: {
        color: [255, 255, 255],
        width: 2
      }
    });

    const graphic = new arcgisModules.Graphic({
      geometry: point,
      symbol: symbol,
      attributes: {
        vehicleId: vehicle.id,
        licensePlate: vehicle.license_plate,
        type: 'vehicle'
      },
      popupTemplate: {
        title: `Vehicle: ${vehicle.license_plate}`,
        content: `
          <div>
            <p><strong>Model:</strong> ${vehicle.model || 'N/A'}</p>
            <p><strong>Status:</strong> ${vehicle.status || 'N/A'}</p>
            <p><strong>Position:</strong> ${position[1].toFixed(6)}, ${position[0].toFixed(6)}</p>
          </div>
        `
      }
    });

    const vehicleLayer = view.map.findLayerById('vehicles');
    if (vehicleLayer) {
      vehicleLayer.add(graphic);
    }

    return graphic;
  },

  // Add a route polyline to the map
  addRoute: (view: any, coordinates: number[][], vehicleId: number) => {
    if (!view || !view.map) return null;

    // Access ArcGIS modules
    const arcgisModules = getArcGISModulesFromView(view);
    if (!arcgisModules) return null;

    const polyline = new arcgisModules.Polyline({
      paths: [coordinates]
    });

    const symbol = new arcgisModules.SimpleLineSymbol({
      color: [255, 0, 0, 0.8], // Red color with transparency
      width: 3
    });

    const graphic = new arcgisModules.Graphic({
      geometry: polyline,
      symbol: symbol,
      attributes: {
        vehicleId: vehicleId,
        type: 'route'
      }
    });

    const routeLayer = view.map.findLayerById('routes');
    if (routeLayer) {
      routeLayer.add(graphic);
    }

    return graphic;
  },

  // Clear all graphics from a layer
  clearLayer: (view: any, layerId: string) => {
    if (!view || !view.map) return;

    const layer = view.map.findLayerById(layerId);
    if (layer) {
      layer.removeAll();
    }
  },

  // Zoom to fit all graphics in a layer
  zoomToLayer: (view: any, layerId: string) => {
    if (!view || !view.map) return;

    const layer = view.map.findLayerById(layerId);
    if (layer && layer.graphics.length > 0) {
      view.goTo(layer.graphics);
    }
  },

  // Change basemap
  changeBasemap: (view: any, basemap: string) => {
    if (!view || !view.map) return;
    view.map.basemap = basemap;
  }
};

// Helper to extract ArcGIS modules from view
function getArcGISModulesFromView(view: any) {
  if (!view) return null;

  // The Point constructor is on the view's Point property
  const Point = view.Point;
  const Graphic = view.Graphic;
  const SimpleMarkerSymbol = view.SimpleMarkerSymbol;
  const Polyline = view.Polyline;
  const SimpleLineSymbol = view.SimpleLineSymbol;

  if (!Point || !Graphic || !SimpleMarkerSymbol || !Polyline || !SimpleLineSymbol) {
    // Fall back to loading modules if not available on view
    return null;
  }

  return {
    Point,
    Graphic,
    SimpleMarkerSymbol,
    Polyline,
    SimpleLineSymbol
  };
} 