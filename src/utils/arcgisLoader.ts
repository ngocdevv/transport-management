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

/**
 * Loads ArcGIS modules once and caches them for future use
 * This significantly improves performance by avoiding repeated dynamic imports
 */
export async function loadArcGISModules() {
  // Return cached modules if already loaded
  if (modulesLoaded) return arcgisModules;

  try {
    // Load all modules in parallel
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

    // Assign modules to cache
    arcgisModules.MapView = MapViewModule.default;
    arcgisModules.Map = MapModule.default;
    arcgisModules.GraphicsLayer = GraphicsLayerModule.default;
    arcgisModules.Graphic = GraphicModule.default;
    arcgisModules.Point = PointModule.default;
    arcgisModules.SimpleMarkerSymbol = SimpleMarkerSymbolModule.default;
    arcgisModules.Polyline = PolylineModule.default;
    arcgisModules.SimpleLineSymbol = SimpleLineSymbolModule.default;

    // Mark as loaded
    modulesLoaded = true;

    return arcgisModules;
  } catch (error) {
    console.error('Failed to load ArcGIS modules:', error);
    throw error;
  }
}

export type ArcGISModules = typeof arcgisModules; 