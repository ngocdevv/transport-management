'use client';

import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import TimeSlider from '@arcgis/core/widgets/TimeSlider';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import { SimpleMarkerSymbol, SimpleLineSymbol, PictureMarkerSymbol } from '@arcgis/core/symbols';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

// Import ArcGIS CSS at component level for Next.js
import '@arcgis/core/assets/esri/themes/light/main.css';
import { initResizeObserverPolyfill, isBrowser } from '@/utils/browserPolyfills';

export function useArcGIS(mapContainerId: string, mode: 'tracking' | 'history' = 'tracking') {
  const mapRef = useRef<Map | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const vehicleLayerRef = useRef<GraphicsLayer | null>(null);
  const routeLayerRef = useRef<GraphicsLayer | null>(null);
  const timeSliderRef = useRef<TimeSlider | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize the map
  useEffect(() => {
    // Initialize browser polyfills
    if (isBrowser) {
      initResizeObserverPolyfill();
    }

    if (!mapContainerId || !isBrowser) return;

    const initializeMap = async () => {
      // Create a Map instance
      const map = new Map({
        basemap: 'streets-navigation-vector'
      });

      mapRef.current = map;

      // Create vehicle and route graphics layers
      const vehicleLayer = new GraphicsLayer({
        title: 'Vehicles',
        listMode: 'show'
      });

      const routeLayer = new GraphicsLayer({
        title: 'Routes',
        listMode: 'show'
      });

      vehicleLayerRef.current = vehicleLayer;
      routeLayerRef.current = routeLayer;

      // Add graphics layers to the map
      map.add(routeLayer);
      map.add(vehicleLayer);

      // Create map view
      const view = new MapView({
        container: mapContainerId,
        map: map,
        center: [106.6297, 10.8231], // Ho Chi Minh City coordinates
        zoom: 12
      });

      viewRef.current = view;

      // Create time slider widget only in history mode
      if (mode === 'history') {
        const timeSlider = new TimeSlider({
          container: "timeSliderDiv",
          view: view,
          mode: "instant",
          fullTimeExtent: {
            start: new Date(2023, 4, 15, 8, 0),
            end: new Date(2023, 4, 15, 9, 0)
          },
          stops: {
            interval: {
              value: 5,
              unit: "minutes" as any
            }
          }
        });

        timeSliderRef.current = timeSlider;

        // Watch for time changes
        reactiveUtils.watch(
          () => timeSlider.timeExtent,
          (timeExtent) => {
            if (timeExtent && timeExtent.end) {
              setCurrentTime(timeExtent.end);
            }
          }
        );
      } else {
        // In tracking mode, always use current time
        setCurrentTime(new Date());
      }

      await view.when();
      setIsMapLoaded(true);
    };

    initializeMap();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [mapContainerId, mode]);

  // Function to display vehicles on the map
  const displayVehicles = (vehicles: any[]) => {
    if (!vehicleLayerRef.current || !routeLayerRef.current) return;

    // Clear existing graphics
    vehicleLayerRef.current.removeAll();
    routeLayerRef.current.removeAll();

    vehicles.forEach(vehicle => {
      if (!vehicle.routes || vehicle.routes.length === 0) return;

      // Create route lines
      const paths = vehicle.routes.map((point: any) => [point.longitude, point.latitude]);

      const routePolyline = new Polyline({
        paths: [paths],
        spatialReference: { wkid: 4326 }
      });

      const routeGraphic = new Graphic({
        geometry: routePolyline,
        symbol: new SimpleLineSymbol({
          color: vehicle.color || [66, 133, 244],
          width: 3
        }),
        attributes: {
          id: vehicle.id,
          name: vehicle.name,
          type: "route"
        }
      });

      routeLayerRef.current.add(routeGraphic);

      // In tracking mode, only show latest position
      // In history mode, show position based on time slider
      let currentPosition = null;

      if (mode === 'tracking') {
        // Just use the latest position available
        currentPosition = vehicle.routes[vehicle.routes.length - 1];
      } else {
        // Find the most recent position at the current time
        for (let i = 0; i < vehicle.routes.length; i++) {
          const routeTime = new Date(vehicle.routes[i].timestamp);

          if (routeTime <= currentTime) {
            currentPosition = vehicle.routes[i];
          } else {
            break;
          }
        }
      }

      if (currentPosition) {
        // Add a point for the current vehicle position
        const point = new Point({
          longitude: currentPosition.longitude,
          latitude: currentPosition.latitude,
          spatialReference: { wkid: 4326 }
        });

        // Use PictureMarkerSymbol with local SVG icons based on vehicle type
        let vehicleSymbol;

        const vehicleType = vehicle.type?.toLowerCase() || 'default';

        switch (vehicleType) {
          case 'truck':
          case 'delivery':
            // Use truck icon
            vehicleSymbol = new SimpleMarkerSymbol({
              color: vehicle.color || [66, 133, 244],
              style: "square",
              size: 12,
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            });
            break;
          case 'van':
          case 'service':
            // Use van icon
            vehicleSymbol = new SimpleMarkerSymbol({
              color: vehicle.color || [67, 160, 71],
              style: "diamond",
              size: 12,
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            });
            break;
          case 'car':
          case 'sedan':
            // Use car icon
            vehicleSymbol = new SimpleMarkerSymbol({
              color: vehicle.color || [229, 57, 53],
              style: "circle",
              size: 12,
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            });
            break;
          default:
            // Use circle for default
            vehicleSymbol = new SimpleMarkerSymbol({
              color: vehicle.color || [66, 133, 244],
              style: "circle",
              size: 12,
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            });
        }

        const pointGraphic = new Graphic({
          geometry: point,
          symbol: vehicleSymbol,
          attributes: {
            id: vehicle.id,
            name: vehicle.name,
            type: "vehicle",
            speed: currentPosition.speed || 0,
            license_plate: vehicle.license_plate || 'Unknown',
            model: vehicle.model || 'Unknown',
            status: vehicle.status || 'Unknown',
            timestamp: currentPosition.timestamp || new Date().toISOString(),
            latitude: currentPosition.latitude.toFixed(5),
            longitude: currentPosition.longitude.toFixed(5)
          },
          popupTemplate: {
            title: "{name}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  {
                    fieldName: "license_plate",
                    label: "License Plate"
                  },
                  {
                    fieldName: "model",
                    label: "Model"
                  },
                  {
                    fieldName: "status",
                    label: "Status"
                  },
                  {
                    fieldName: "speed",
                    label: "Current Speed",
                    format: {
                      places: 1,
                      digitSeparator: true
                    }
                  },
                  {
                    fieldName: "timestamp",
                    label: "Last Update",
                    format: {
                      dateFormat: "short-date-short-time"
                    }
                  },
                  {
                    fieldName: "latitude",
                    label: "Latitude"
                  },
                  {
                    fieldName: "longitude",
                    label: "Longitude"
                  }
                ]
              }
            ],
            actions: [
              {
                title: "Zoom to Vehicle",
                id: "zoom-to-vehicle",
                className: "esri-icon-zoom-in-magnifying-glass"
              }
            ]
          }
        });

        vehicleLayerRef.current.add(pointGraphic);
      }
    });
  };

  // Function to zoom to a specific vehicle
  const zoomToVehicle = (vehicleId: number, vehicles: any[]) => {
    if (!viewRef.current) return;

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.routes || vehicle.routes.length === 0) return;

    // Find the current position
    let currentPosition = null;

    if (mode === 'tracking') {
      // Use latest position in tracking mode
      currentPosition = vehicle.routes[vehicle.routes.length - 1];
    } else {
      // Find the position at the current time in history mode
      for (let i = 0; i < vehicle.routes.length; i++) {
        const routeTime = new Date(vehicle.routes[i].timestamp);
        if (routeTime <= currentTime) {
          currentPosition = vehicle.routes[i];
        } else {
          break;
        }
      }
    }

    if (currentPosition) {
      viewRef.current.goTo({
        center: [currentPosition.longitude, currentPosition.latitude],
        zoom: 15
      });
    }
  };

  // Function to get distance statistics
  const getVehicleStatistics = (vehicle: any) => {
    if (!vehicle || !vehicle.routes || vehicle.routes.length < 2) {
      return { totalDistance: 0, avgSpeed: 0, maxSpeed: 0 };
    }

    let totalDistance = 0;
    let totalSpeed = 0;
    let maxSpeed = 0;
    let nonZeroSpeedPoints = 0;

    for (let i = 1; i < vehicle.routes.length; i++) {
      const prevPoint = vehicle.routes[i - 1];
      const currPoint = vehicle.routes[i];

      // Calculate distance using Haversine formula
      const R = 6371000; // Earth radius in meters
      const lat1 = prevPoint.latitude * Math.PI / 180;
      const lat2 = currPoint.latitude * Math.PI / 180;
      const deltaLat = (currPoint.latitude - prevPoint.latitude) * Math.PI / 180;
      const deltaLng = (currPoint.longitude - prevPoint.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // in meters

      totalDistance += distance;

      // Speed statistics
      if (currPoint.speed > 0) {
        totalSpeed += currPoint.speed;
        nonZeroSpeedPoints++;
      }

      maxSpeed = Math.max(maxSpeed, currPoint.speed);
    }

    const avgSpeed = nonZeroSpeedPoints > 0 ? totalSpeed / nonZeroSpeedPoints : 0;

    return {
      totalDistance: totalDistance / 1000, // Convert to kilometers
      avgSpeed,
      maxSpeed
    };
  };

  return {
    map: mapRef.current,
    view: viewRef.current,
    isMapLoaded,
    currentTime,
    displayVehicles,
    zoomToVehicle,
    getVehicleStatistics
  };
}