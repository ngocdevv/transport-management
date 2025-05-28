// ArcGIS module loader with caching
// This prevents re-loading modules on each component mount

// Track if modules are already loaded
let modulesLoaded = false;

// Module cache
const arcgisModules: {
  MapView: any;
  Map: any;
  GraphicsLayer: any;
  Graphic: any;
  Point: any;
  SimpleMarkerSymbol: any;
  Polyline: any;
  SimpleLineSymbol: any;
} = {
  MapView: null,
  Map: null,
  GraphicsLayer: null,
  Graphic: null,
  Point: null,
  SimpleMarkerSymbol: null,
  Polyline: null,
  SimpleLineSymbol: null,
};

// Promise to track loading status
let loadingPromise: Promise<typeof arcgisModules> | null = null;

/**
 * Loads ArcGIS modules once and caches them for future use
 * This significantly improves performance by avoiding repeated dynamic imports
 */
export async function loadArcGISModules() {
  // Return cached modules if already loaded
  if (modulesLoaded) return arcgisModules;

  // If already loading, return the existing promise to avoid duplicate loading
  if (loadingPromise) return loadingPromise;

  // Create and store the loading promise
  loadingPromise = (async () => {
    try {
      // Load all modules in parallel with Promise.all for better performance
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
        import('@arcgis/core/views/MapView').then(m => m.default),
        import('@arcgis/core/Map').then(m => m.default),
        import('@arcgis/core/layers/GraphicsLayer').then(m => m.default),
        import('@arcgis/core/Graphic').then(m => m.default),
        import('@arcgis/core/geometry/Point').then(m => m.default),
        import('@arcgis/core/symbols/SimpleMarkerSymbol').then(m => m.default),
        import('@arcgis/core/geometry/Polyline').then(m => m.default),
        import('@arcgis/core/symbols/SimpleLineSymbol').then(m => m.default)
      ]);

      // Assign modules to cache
      arcgisModules.MapView = MapViewModule;
      arcgisModules.Map = MapModule;
      arcgisModules.GraphicsLayer = GraphicsLayerModule;
      arcgisModules.Graphic = GraphicModule;
      arcgisModules.Point = PointModule;
      arcgisModules.SimpleMarkerSymbol = SimpleMarkerSymbolModule;
      arcgisModules.Polyline = PolylineModule;
      arcgisModules.SimpleLineSymbol = SimpleLineSymbolModule;

      // Mark as loaded
      modulesLoaded = true;

      return arcgisModules;
    } catch (error) {
      // Reset loading state on error to allow retry
      loadingPromise = null;
      console.error('Failed to load ArcGIS modules:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

// Helper function to check if modules are loaded without triggering a load
export function areArcGISModulesLoaded(): boolean {
  return modulesLoaded;
}

// Helper function to preload modules in the background
export function preloadArcGISModules(): void {
  if (!modulesLoaded && !loadingPromise) {
    // Start loading in the background without awaiting the result
    loadArcGISModules().catch(err => {
      console.warn('ArcGIS preload failed:', err);
    });
  }
}

// Expose preload function to window for client-side usage
if (typeof window !== 'undefined') {
  (window as any).preloadArcGISModules = preloadArcGISModules;
}

export type ArcGISModules = typeof arcgisModules; 