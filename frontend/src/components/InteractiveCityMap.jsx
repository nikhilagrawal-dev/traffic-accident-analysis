import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Compass,
  RotateCcw,
  Info,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Target,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchNearbyClusters } from '../services/api';

// Configure Leaflet default marker icons to ensure bundler compatibility
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const SEVERITY_THEMES = {
  1: {
    label: "Minor",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  2: {
    label: "Moderate",
    color: "#3b82f6",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-800 border-blue-300"
  },
  3: {
    label: "Severe",
    color: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-800 border-amber-300"
  },
  4: {
    label: "Critical",
    color: "#f43f5e",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-800",
    badge: "bg-rose-100 text-rose-800 border-rose-300"
  },
};

const createSeverityPin = (severity = 2) => {
  const theme = SEVERITY_THEMES[severity] || SEVERITY_THEMES[2];
  const color = theme.color;

  const html = `
    <div style="position: relative; width: 40px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; top: 0; width: 40px; height: 40px; border-radius: 50%; background: ${color}26; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      <div style="position: absolute; top: 3px; width: 34px; height: 34px; border-radius: 50%; background: ${color}; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 14px; font-family: ui-sans-serif, system-ui, sans-serif;">
        S${severity}
      </div>
      <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid ${color};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-severity-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

const createClusterPin = (clusterSize = 10) => {
  const displaySize = clusterSize > 999 ? (clusterSize / 1000).toFixed(1) + 'k' : clusterSize;
  const html = `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(124, 58, 237, 0.22);"></div>
      <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: #7c3aed; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 700; font-size: 9.5px; font-family: ui-sans-serif, system-ui, sans-serif;">
        ${displaySize}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-cluster-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

function MapViewController({ centerLat, centerLng, zoom = 11, recenterTrigger }) {
  const map = useMap();
  const lastCenterRef = useRef(null);
  const lastTriggerRef = useRef(recenterTrigger);

  useEffect(() => {
    if (typeof centerLat !== 'number' || typeof centerLng !== 'number' || isNaN(centerLat) || isNaN(centerLng)) {
      return;
    }

    const coordsChanged =
      !lastCenterRef.current ||
      Math.abs(lastCenterRef.current.lat - centerLat) > 1e-6 ||
      Math.abs(lastCenterRef.current.lng - centerLng) > 1e-6;

    const userClickedRecenter = recenterTrigger !== lastTriggerRef.current && recenterTrigger > 0;
    lastTriggerRef.current = recenterTrigger;

    if (coordsChanged || userClickedRecenter) {
      lastCenterRef.current = { lat: centerLat, lng: centerLng };
      if (userClickedRecenter) {
        map.flyTo([centerLat, centerLng], zoom, { duration: 0.8, easeLinearity: 0.25 });
      } else {
        map.flyTo([centerLat, centerLng], zoom, { duration: 1.0, easeLinearity: 0.25 });
      }
    }
  }, [map, centerLat, centerLng, zoom, recenterTrigger]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

function MissingCoordinatesState({ city, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center min-h-[360px]">
      <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">
        Coordinates Unavailable
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
        Could not resolve geographic coordinates for <span className="font-semibold text-slate-700">"{city || 'this location'}"</span>. The prediction was processed with baseline regional context.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5 text-slate-700 cursor-pointer"
          type="button"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Geocoding
        </button>
      )}
    </div>
  );
}

function MapLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center min-h-[360px] animate-pulse">
      <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl mb-3">
        <Compass className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Initializing City Map...</p>
      <p className="text-xs text-slate-400 mt-1">Aligning geographic center and spatial parameters</p>
    </div>
  );
}

export default function InteractiveCityMap({ result, isLoading }) {
  const [fallbackCoords, setFallbackCoords] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const markerRef = useRef(null);

  // Genuine DBSCAN Clusters Layer State
  const [showClusters, setShowClusters] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [clustersError, setClustersError] = useState(null);
  const [clusterTotalFound, setClusterTotalFound] = useState(0);

  const city = result?.city_resolved || result?.City || result?.city;
  const state = result?.state_resolved || result?.State || result?.state;
  const predictedSeverity = result?.predicted_severity || 2;
  const confidence = result?.probabilities?.[predictedSeverity.toString()]
    ? (result.probabilities[predictedSeverity.toString()] * 100).toFixed(1)
    : null;

  // 1. Direct coordinates from backend response (sync, zero delay)
  const backendLat = typeof result?.latitude === 'number' ? result.latitude : (typeof result?.Start_Lat === 'number' ? result.Start_Lat : null);
  const backendLng = typeof result?.longitude === 'number' ? result.longitude : (typeof result?.Start_Lng === 'number' ? result.Start_Lng : null);

  // Active resolved coordinates (memoized to prevent re-creation on every render)
  const resolvedCoords = useMemo(() => {
    if (backendLat !== null && backendLng !== null) {
      return { lat: backendLat, lng: backendLng };
    }
    return fallbackCoords;
  }, [backendLat, backendLng, fallbackCoords]);

  // 2. Fallback resolution via verified Open-Meteo geocoding API only when backend coords are missing
  const resolveFallbackCoordinates = useCallback(() => {
    if (!city) {
      setResolveError("No city provided");
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data?.results?.length > 0) {
          const first = data.results[0];
          setFallbackCoords({ lat: first.latitude, lng: first.longitude });
        } else {
          setResolveError(`Location "${city}" could not be geocoded`);
        }
      })
      .catch(err => {
        console.warn("Client geocoding fallback failed:", err);
        setResolveError("Failed to fetch coordinates for location");
      })
      .finally(() => {
        setIsResolving(false);
      });
  }, [city]);

  useEffect(() => {
    if (backendLat === null && city) {
      resolveFallbackCoordinates();
    }
  }, [backendLat, city, resolveFallbackCoordinates]);

  // Fetch genuine DBSCAN clusters when toggled ON or coordinates update
  const loadNearbyClusters = useCallback(async (lat, lng) => {
    setIsLoadingClusters(true);
    setClustersError(null);
    try {
      const data = await fetchNearbyClusters(lat, lng, 30.0, 50);
      setClusters(data.clusters || []);
      setClusterTotalFound(data.total_found || 0);
    } catch (err) {
      console.warn("Failed to retrieve DBSCAN clusters:", err);
      setClustersError(err?.message || "Failed to query spatial cluster index");
      setClusters([]);
      setClusterTotalFound(0);
    } finally {
      setIsLoadingClusters(false);
    }
  }, []);

  useEffect(() => {
    if (showClusters && resolvedCoords) {
      loadNearbyClusters(resolvedCoords.lat, resolvedCoords.lng);
    } else if (!showClusters) {
      setClusters([]);
      setClusterTotalFound(0);
    }
  }, [showClusters, resolvedCoords, loadNearbyClusters]);

  // Open marker popup once per new city coordinate resolution, not on every render
  const lastOpenedCoordRef = useRef(null);
  useEffect(() => {
    if (!markerRef.current || !resolvedCoords) return;
    const isNewCity =
      !lastOpenedCoordRef.current ||
      Math.abs(lastOpenedCoordRef.current.lat - resolvedCoords.lat) > 1e-6 ||
      Math.abs(lastOpenedCoordRef.current.lng - resolvedCoords.lng) > 1e-6;

    if (isNewCity) {
      lastOpenedCoordRef.current = { lat: resolvedCoords.lat, lng: resolvedCoords.lng };
      const timer = setTimeout(() => {
        try {
          markerRef.current?.openPopup();
        } catch {
          // popup could be closed or unmounted
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [resolvedCoords]);

  const handleRecenter = () => {
    setRecenterTrigger(prev => prev + 1);
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  };

  const handleToggleClusters = () => {
    setShowClusters(prev => !prev);
  };

  if (isLoading || isResolving) {
    return <MapLoadingState />;
  }

  if (resolveError || !resolvedCoords) {
    return <MissingCoordinatesState city={city} onRetry={resolveFallbackCoordinates} />;
  }

  const center = [resolvedCoords.lat, resolvedCoords.lng];
  const severityTheme = SEVERITY_THEMES[predictedSeverity] || SEVERITY_THEMES[2];
  const markerIcon = createSeverityPin(predictedSeverity);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-shadow">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">
                Interactive City Spatial Map
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs ${severityTheme.badge}`}>
                Severity {predictedSeverity}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {city}{state ? `, ${state}` : ''} · {resolvedCoords.lat.toFixed(4)}°N, {resolvedCoords.lng.toFixed(4)}°W
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* DBSCAN Clusters Layer Toggle */}
          <button
            onClick={handleToggleClusters}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border ${
              showClusters
                ? 'bg-purple-600 text-white border-purple-700 shadow-purple-200'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Toggle genuine DBSCAN cluster markers within 30 km"
            type="button"
          >
            {isLoadingClusters ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Target className={`w-3.5 h-3.5 ${showClusters ? 'text-white' : 'text-purple-600'}`} />
            )}
            <span>DBSCAN Clusters</span>
            {showClusters && !isLoadingClusters && (
              <span className="ml-1 px-1.5 py-0.2 bg-white/25 rounded-full text-[10px] font-bold">
                {clusters.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Toggle Spatial Layer Guide"
            type="button"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Layer Guide</span>
            {showLegend ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleRecenter}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Center map on city coordinates"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recenter</span>
          </button>
        </div>
      </div>

      {/* ── Layer Information Guide (Collapsible) ─────────────────────────── */}
      {showLegend && (
        <div className="bg-slate-900 text-slate-200 px-6 py-4 border-b border-slate-800 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Geographic Scope & Spatial Feature Interpretation</span>
              </div>
              <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClusters}
                  onChange={handleToggleClusters}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Enable DBSCAN Hotspots</span>
              </label>
            </div>

            <p className="text-slate-300 leading-relaxed">
              The primary marker represents the <span className="text-white font-semibold">representative city center</span> used for environmental baseline context. When enabled, the purple markers display genuine <span className="text-purple-400 font-semibold">DBSCAN cluster centroids</span> retrieved directly from the training dataset.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-400">
              <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="font-semibold text-emerald-400 block mb-0.5">City Center Baseline</span>
                Center coordinates used to retrieve live weather and timezone alignment for model features.
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="font-semibold text-purple-400 block mb-0.5">DBSCAN Cluster Centroids</span>
                Authentic accident hotspots from training data (eps=0.5 km, min_samples=5). Scaled by incident volume.
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="font-semibold text-blue-400 block mb-0.5">BallTree Radius Query</span>
                Sub-millisecond spatial search querying nearby canonical clusters within 30 km radius.
              </div>
            </div>

            {/* Live cluster status banner */}
            {showClusters && (
              <div className="mt-2 p-2.5 bg-purple-950/60 border border-purple-800/70 rounded-lg flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-purple-200">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>
                    {isLoadingClusters
                      ? 'Querying BallTree spatial index for nearby clusters…'
                      : clustersError
                      ? `Cluster status: ${clustersError}`
                      : clusters.length > 0
                      ? `Displaying ${clusters.length} genuine DBSCAN cluster centroids (${clusterTotalFound} found within 30 km)`
                      : 'Geographic Coverage Notice: No DBSCAN clusters indexed within 30 km. (Training data coverage is restricted to the contiguous United States; this does not imply zero accidents in reality.)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Leaflet Interactive Map Canvas ──────────────────────────────── */}
      <div className="relative w-full h-[380px] sm:h-[440px] bg-slate-100 z-0">
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full z-0"
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />
          <ZoomControl position="bottomright" />
          <MapViewController centerLat={resolvedCoords.lat} centerLng={resolvedCoords.lng} zoom={11} recenterTrigger={recenterTrigger} />

          {/* Primary City Center Marker */}
          <Marker
            position={center}
            icon={markerIcon}
            ref={markerRef}
          >
            <Popup className="custom-leaflet-popup" minWidth={260} maxWidth={320} autoPan={false}>
              <div className="p-1 space-y-3 font-sans">
                {/* Popup Header */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      City Spatial Context
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${severityTheme.badge}`}>
                      {severityTheme.label} (S{predictedSeverity})
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {city}{state ? `, ${state}` : ''}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500">
                    {resolvedCoords.lat.toFixed(4)}°, {resolvedCoords.lng.toFixed(4)}°
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Confidence</span>
                    <span className="font-bold text-slate-800">{confidence || 'N/A'}%</span>
                  </div>
                  {result?.weather_context && (
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Weather</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {Math.round(result.weather_context.temperature_f)}°F · {result.weather_context.condition}
                      </span>
                    </div>
                  )}
                  {result?.spatial_information && (
                    <>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Accident Density</span>
                        <span className="font-bold text-slate-800">
                          {result.spatial_information.local_accident_density}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Hotspot Status</span>
                        <span className={`font-bold ${result.spatial_information.hotspot_flag === 1 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {result.spatial_information.hotspot_flag === 1 ? 'Hotspot Detected' : 'Baseline'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-100 flex items-start gap-1">
                  <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                  <span>Representative city center baseline used for environmental and spatial analysis.</span>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Genuine DBSCAN Cluster Markers Layer */}
          {showClusters && clusters.map(cluster => (
            <Marker
              key={`cluster-${cluster.cluster_id}`}
              position={[cluster.latitude, cluster.longitude]}
              icon={createClusterPin(cluster.cluster_size)}
            >
              <Popup className="custom-leaflet-popup" minWidth={240} maxWidth={300}>
                <div className="p-1 space-y-2.5 font-sans">
                  <div className="border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        Hotspot #{cluster.hotspot_label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {cluster.distance_km} km away
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      DBSCAN Cluster #{cluster.cluster_id}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      {cluster.latitude.toFixed(4)}°N, {cluster.longitude.toFixed(4)}°W
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-purple-50/60 border border-purple-100 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-purple-500 block">Cluster Size</span>
                      <span className="font-extrabold text-purple-950 text-sm">{cluster.cluster_size}</span>
                      <span className="text-[10px] text-purple-700 block mt-0.5">accidents</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Hotspot ID</span>
                      <span className="font-bold text-slate-800 text-sm">#{cluster.hotspot_label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">canonical</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 leading-tight">
                    Authentic DBSCAN centroid from training split (eps=0.5 km, min_samples=5).
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* On-Map Coverage Notice when location is outside contiguous US training split */}
        {showClusters && !isLoadingClusters && clusters.length === 0 && !clustersError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl border border-amber-500/50 flex items-center gap-2.5 max-w-[92%] sm:max-w-md pointer-events-auto">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-amber-300">Geographic Coverage Notice:</span>{' '}
              <span className="text-slate-200">
                No DBSCAN training clusters exist within 30 km. Spatial model training coverage is restricted to the contiguous United States.
              </span>
            </div>
          </div>
        )}

        {/* Ambient bottom-left watermark info */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs pointer-events-none text-[11px] text-slate-700 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Active City: <strong className="text-slate-900">{city}</strong></span>
          {showClusters && (
            <span className="ml-2 pl-2 border-l border-slate-300 text-purple-700 font-semibold flex items-center gap-1">
              <Target className="w-3 h-3 text-purple-600" />
              <span>{clusters.length > 0 ? `${clusters.length} Hotspots` : 'Outside US Coverage'}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Footer Metadata ─────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
          <span>OpenStreetMap Leaflet Engine</span>
          {showClusters && (
            <>
              <span className="text-slate-300">&bull;</span>
              <span className="inline-block w-2 h-2 rounded-full bg-purple-600"></span>
              <span className="text-purple-700 font-medium">DBSCAN Spatial Layer</span>
            </>
          )}
        </span>
        <span className="text-[11px] text-slate-400 italic">
          {showClusters
            ? clusters.length > 0
              ? 'Purple markers indicate verified training cluster centroids. Click any marker for details.'
              : 'Location is outside contiguous US training coverage. No canonical DBSCAN clusters available.'
            : 'Click "DBSCAN Clusters" to view verified training accident hotspots near this city.'}
        </span>
      </div>
    </div>
  );
}
