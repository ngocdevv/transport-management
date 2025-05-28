'use client';

import { useEffect, useRef, useState } from 'react';
import { MAP_CONFIG } from '@/utils/constants';

// ArcGIS imports - these will be loaded dynamically
let MapView: any;
let Map: any;
let GraphicsLayer: any;
let Graphic: any;
let Point: any;
let SimpleMarkerSymbol: any;
let Polyline: any;
let SimpleLineSymbol: any;

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

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      try {
        // Dynamically import ArcGIS modules
        const [
          MapViewModule,
          MapModule,
          GraphicsLayerModule,
          GraphicModule,
          PointModule,
          SimpleMarkerSymbolModule,
          PolylineModule,
          SimpleLineSymbolModule
        ] = await Promise.all([
          import('@arcgis/core/views/MapView'),
          import('@arcgis/core/Map'),
          import('@arcgis/core/layers/GraphicsLayer'),
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point'),
          import('@arcgis/core/symbols/SimpleMarkerSymbol'),
          import('@arcgis/core/geometry/Polyline'),
          import('@arcgis/core/symbols/SimpleLineSymbol')
        ]);

        // Assign to module variables
        MapView = MapViewModule.default;
        Map = MapModule.default;
        GraphicsLayer = GraphicsLayerModule.default;
        Graphic = GraphicModule.default;
        Point = PointModule.default;
        SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
        Polyline = PolylineModule.default;
        SimpleLineSymbol = SimpleLineSymbolModule.default;

        if (!mounted || !mapDiv.current) return;

        // Create the map
        const map = new Map({
          basemap: MAP_CONFIG.BASEMAPS.STREETS
        });

        // Create the map view
        const view = new MapView({
          container: mapDiv.current,
          map: map,
          center: center,
          zoom: zoom,
          constraints: {
            minZoom: MAP_CONFIG.MIN_ZOOM,
            maxZoom: MAP_CONFIG.MAX_ZOOM
          }
        });

        // Add graphics layers for vehicles and routes
        const vehicleLayer = new GraphicsLayer({
          id: 'vehicles',
          title: 'Vehicles'
        });

        const routeLayer = new GraphicsLayer({
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
  }, [center, zoom, onMapLoad]);

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
    if (!view || !Point || !SimpleMarkerSymbol || !Graphic) return null;

    const point = new Point({
      longitude: position[0],
      latitude: position[1]
    });

    const symbol = new SimpleMarkerSymbol({
      color: [51, 130, 246], // Blue color
      size: 12,
      outline: {
        color: [255, 255, 255],
        width: 2
      }
    });

    const graphic = new Graphic({
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
    if (!view || !Polyline || !SimpleLineSymbol || !Graphic) return null;

    const polyline = new Polyline({
      paths: [coordinates]
    });

    const symbol = new SimpleLineSymbol({
      color: [255, 0, 0, 0.8], // Red color with transparency
      width: 3
    });

    const graphic = new Graphic({
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
    if (!view) return;

    const layer = view.map.findLayerById(layerId);
    if (layer) {
      layer.removeAll();
    }
  },

  // Zoom to fit all graphics in a layer
  zoomToLayer: (view: any, layerId: string) => {
    if (!view) return;

    const layer = view.map.findLayerById(layerId);
    if (layer && layer.graphics.length > 0) {
      view.goTo(layer.graphics);
    }
  },

  // Change basemap
  changeBasemap: (view: any, basemap: string) => {
    if (!view) return;
    view.map.basemap = basemap;
  }
}; 