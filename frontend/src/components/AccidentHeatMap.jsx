import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Flame, 
  MapPin, 
  Filter, 
  RotateCcw, 
  ShieldAlert, 
  Info
} from 'lucide-react';

// Color palette for accident severities
const SEVERITY_COLORS = {
  1: { hex: '#10b981', label: 'Severity 1 (Minimal)' },
  2: { hex: '#3b82f6', label: 'Severity 2 (Moderate)' },
  3: { hex: '#f97316', label: 'Severity 3 (Serious)' },
  4: { hex: '#ef4444', label: 'Severity 4 (Critical)' },
};

/**
 * High-performance Canvas Heatmap Overlay for Leaflet
 * All methods are guarded against un-initialized map state.
 */
class CanvasHeatmapLayer {
  constructor(map, points, options = {}) {
    this.map = map;
    this.points = points || [];
    this.radius = options.radius || 24;
    this.opacity = options.opacity || 0.75;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'leaflet-heatmap-layer pointer-events-none';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    this.canvas.style.zIndex = '400';
    this.canvas.style.opacity = String(this.opacity);
    this.canvas.style.mixBlendMode = 'screen';

    this.ctx = this.canvas.getContext('2d');

    try {
      this.pane = map.getPanes().overlayPane;
      this.pane.appendChild(this.canvas);
    } catch (e) {
      console.warn('Heatmap: could not attach canvas to overlay pane', e);
      return;
    }

    this._onMove = () => this.draw();
    this.map.on('move', this._onMove);
    this.map.on('moveend', this._onMove);
    this.map.on('zoomend', this._onMove);
    this.map.on('resize', this._onMove);

    this.gradCanvas = this._createGradientCanvas();
    this.draw();
  }

  _createGradientCanvas() {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, 'rgba(16, 185, 129, 0)');
    grad.addColorStop(0.2, 'rgba(59, 130, 246, 0.6)');
    grad.addColorStop(0.45, 'rgba(234, 179, 8, 0.8)');
    grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.9)');
    grad.addColorStop(1.0, 'rgba(239, 68, 68, 1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 256);
    return c;
  }

  setPoints(newPoints) {
    this.points = newPoints || [];
    this.draw();
  }

  draw() {
    try {
      if (!this.map || !this.canvas || !this.ctx) return;

      // Guard: map must be fully initialized before calling getBounds/getSize
      if (!this.map._loaded) return;

      const size = this.map.getSize();
      if (!size || size.x === 0 || size.y === 0) return;

      const topLeft = this.map.containerPointToLayerPoint([0, 0]);
      this.canvas.width = size.x;
      this.canvas.height = size.y;
      L.DomUtil.setPosition(this.canvas, topLeft);

      const ctx = this.ctx;
      ctx.clearRect(0, 0, size.x, size.y);

      if (!this.points || this.points.length === 0) return;

      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();
      const dynamicRadius = Math.max(10, Math.min(45, this.radius * (zoom / 11)));

      // Pre-render a single circle stamp
      const circleCanvas = document.createElement('canvas');
      circleCanvas.width = dynamicRadius * 2;
      circleCanvas.height = dynamicRadius * 2;
      const cctx = circleCanvas.getContext('2d');
      const radGrad = cctx.createRadialGradient(
        dynamicRadius, dynamicRadius, 0,
        dynamicRadius, dynamicRadius, dynamicRadius
      );
      radGrad.addColorStop(0, 'rgba(0,0,0,1)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      cctx.fillStyle = radGrad;
      cctx.fillRect(0, 0, dynamicRadius * 2, dynamicRadius * 2);

      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        if (!p || p.lat == null || p.lng == null) continue;
        if (!bounds.contains([p.lat, p.lng])) continue;

        const pt = this.map.latLngToContainerPoint([p.lat, p.lng]);
        const alpha = Math.min(1.0, Math.max(0.15, p.weight || 0.5));
        ctx.globalAlpha = alpha;
        ctx.drawImage(circleCanvas, pt.x - dynamicRadius, pt.y - dynamicRadius);
      }

      // Colorize using gradient lookup
      const imgData = ctx.getImageData(0, 0, size.x, size.y);
      const data = imgData.data;
      const gradData = this.gradCanvas.getContext('2d').getImageData(0, 0, 1, 256).data;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 0) {
          const offset = a * 4;
          data[i]     = gradData[offset];
          data[i + 1] = gradData[offset + 1];
          data[i + 2] = gradData[offset + 2];
          data[i + 3] = Math.min(255, Math.floor(a * 1.25));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Suppress draw errors during map transitions
      console.warn('Heatmap draw error (non-fatal):', e.message);
    }
  }

  destroy() {
    try {
      if (this.map) {
        this.map.off('move', this._onMove);
        this.map.off('moveend', this._onMove);
        this.map.off('zoomend', this._onMove);
        this.map.off('resize', this._onMove);
      }
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    } catch (e) {
      // ignore cleanup errors
    }
    this.map = null;
    this.canvas = null;
    this.ctx = null;
  }
}

export default function AccidentHeatMap({ result }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const cityMarkerRef = useRef(null);
  const isMapInitialized = useRef(false);

  const [activeLayer, setActiveLayer] = useState('both');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [hotspotsOnly, setHotspotsOnly] = useState(false);

  // Extract data from result
  const mapData = result?.map_data;
  const cityName = result?.city_resolved || 'Selected City';
  const stateName = result?.state_resolved || '';
  const weather = result?.weather_context;
  const predictedSeverity = result?.predicted_severity || 2;

  // Stable center coordinates - only recompute when actual lat/lng values change
  const centerLat = mapData?.center?.[0] ?? result?.latitude ?? 37.7749;
  const centerLng = mapData?.center?.[1] ?? result?.longitude ?? -122.4194;

  // Filter points based on user controls
  const filteredPoints = useMemo(() => {
    if (!mapData?.points) return [];
    return mapData.points.filter((pt) => {
      if (hotspotsOnly && !pt.is_hotspot) return false;
      if (severityFilter === 'all') return true;
      if (severityFilter === 'high') return pt.severity >= 3;
      return String(pt.severity) === String(severityFilter);
    });
  }, [mapData, severityFilter, hotspotsOnly]);

  // Initialize Map ONCE on mount — never destroy/reinitialize
  useEffect(() => {
    if (!mapContainerRef.current || isMapInitialized.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 11,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; <a href="https://openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>')
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
      isMapInitialized.current = true;
    } catch (e) {
      console.error('Failed to initialize Leaflet map:', e);
    }

    // Cleanup only when component unmounts
    return () => {
      try {
        if (heatLayerRef.current) {
          heatLayerRef.current.destroy();
          heatLayerRef.current = null;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        isMapInitialized.current = false;
      } catch (e) {
        // ignore unmount cleanup errors
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only run on mount/unmount

  // Re-center map when city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._loaded) return;
    try {
      map.setView([centerLat, centerLng], 11, { animate: true });
    } catch (e) {
      // ignore if map not ready
    }
  }, [centerLat, centerLng]);

  // Update Heatmap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeLayer === 'heatmap' || activeLayer === 'both') {
      if (!heatLayerRef.current) {
        heatLayerRef.current = new CanvasHeatmapLayer(map, filteredPoints, {
          radius: 26,
          opacity: 0.82,
        });
      } else {
        heatLayerRef.current.setPoints(filteredPoints);
      }
    } else {
      if (heatLayerRef.current) {
        heatLayerRef.current.destroy();
        heatLayerRef.current = null;
      }
    }
  }, [filteredPoints, activeLayer]);

  // Update Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    try {
      markersGroup.clearLayers();

      if (activeLayer === 'points' || activeLayer === 'both') {
        const samplePoints = filteredPoints.slice(0, 350);
        samplePoints.forEach((p) => {
          if (!p || p.lat == null || p.lng == null) return;
          const color = SEVERITY_COLORS[p.severity]?.hex || '#3b82f6';
          const marker = L.circleMarker([p.lat, p.lng], {
            radius: p.severity >= 3 ? 6 : 4,
            fillColor: color,
            color: '#ffffff',
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.75,
          });

          marker.bindPopup(`
            <div style="font-family:sans-serif;font-size:12px;line-height:1.4;min-width:170px;">
              <div style="font-weight:700;color:#0f172a;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;">
                <span>Incident Record</span>
                <span style="display:inline-block;padding:2px 6px;border-radius:9999px;font-size:10px;font-weight:800;background:${color};color:white;">Sev ${p.severity}</span>
              </div>
              <div style="color:#475569;font-size:11px;margin-bottom:2px;"><strong>Coordinates:</strong> ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</div>
              <div style="color:#475569;font-size:11px;"><strong>Cluster Hotspot:</strong> ${p.is_hotspot ? '<span style="color:#ef4444;font-weight:bold;">Yes (DBSCAN)</span>' : 'Standard'}</div>
            </div>
          `);
          markersGroup.addLayer(marker);
        });
      }
    } catch (e) {
      console.warn('Marker update error:', e.message);
    }
  }, [filteredPoints, activeLayer]);

  // Update City Center Pulse Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      if (cityMarkerRef.current) {
        map.removeLayer(cityMarkerRef.current);
        cityMarkerRef.current = null;
      }

      const sevColor = SEVERITY_COLORS[predictedSeverity]?.hex || '#f97316';
      const cityIcon = L.divIcon({
        className: 'city-center-pin',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
            <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:${sevColor};opacity:0.35;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;width:26px;height:26px;border-radius:50%;background:${sevColor};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:11px;">${predictedSeverity}</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([centerLat, centerLng], { icon: cityIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:12px;line-height:1.4;padding:2px;">
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:4px;">${cityName}${stateName ? `, ${stateName}` : ''}</div>
          <div style="color:#2563eb;font-weight:700;margin-bottom:6px;">Estimated Severity: Class ${predictedSeverity}</div>
          ${weather ? `
            <div style="border-top:1px solid #e2e8f0;padding-top:4px;font-size:11px;color:#475569;">
              <div><strong>Condition:</strong> ${weather.condition}</div>
              <div><strong>Temperature:</strong> ${weather.temperature_f?.toFixed(1)}°F</div>
              <div><strong>Wind Speed:</strong> ${weather.wind_speed_mph?.toFixed(1)} mph</div>
            </div>
          ` : ''}
        </div>
      `);
      cityMarkerRef.current = marker;
    } catch (e) {
      console.warn('City marker error:', e.message);
    }
  }, [centerLat, centerLng, cityName, stateName, predictedSeverity, weather]);

  const handleRecenter = () => {
    try {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (mapData?.bounds) {
        map.fitBounds(mapData.bounds, { padding: [40, 40], maxZoom: 13 });
      } else {
        map.setView([centerLat, centerLng], 11, { animate: true });
      }
    } catch (e) {
      // ignore
    }
  };

  const totalPoints = mapData?.total_accidents || filteredPoints.length;
  const hotspotCount = mapData?.hotspot_count || 0;
  const highRiskRatio = mapData?.high_risk_ratio || 0;
  const avgSev = mapData?.average_severity || 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header & HUD */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Spatial Severity Heatmap
            </span>
            {mapData?.source === 'synthetic_spatial_projection' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                Spatial Projection
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
            {cityName} {stateName ? <span className="text-slate-400 font-normal">({stateName})</span> : ''}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Historical accident density and severity clusters overlaid on road corridors.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          {[
            { label: 'Incidents', value: totalPoints.toLocaleString(), color: 'text-white' },
            { label: 'Hotspots', value: hotspotCount.toLocaleString(), color: 'text-amber-400' },
            { label: 'High Risk', value: `${highRiskRatio}%`, color: 'text-red-400' },
            { label: 'Avg Severity', value: avgSev > 0 ? avgSev : predictedSeverity, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-center">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</div>
              <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layer Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {[['both', 'Hybrid'], ['heatmap', 'Heatmap'], ['points', 'Pins']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setActiveLayer(val)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeLayer === val ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {[
              ['all', 'All', ''],
              ['2', 'Sev 2', 'bg-blue-500/20 text-blue-300 border border-blue-500/40'],
              ['3', 'Sev 3', 'bg-orange-500/20 text-orange-300 border border-orange-500/40'],
              ['4', 'Sev 4', 'bg-red-500/20 text-red-300 border border-red-500/40'],
              ['high', 'High (3-4)', 'bg-red-600 text-white'],
            ].map(([val, label, activeClass]) => (
              <button
                key={val}
                onClick={() => setSeverityFilter(val)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  severityFilter === val
                    ? activeClass || 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hotspot Toggle & Recenter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHotspotsOnly(!hotspotsOnly)}
            className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 transition-all ${
              hotspotsOnly
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Hotspots Only
          </button>
          <button
            onClick={handleRecenter}
            title="Recenter Map"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend (Bottom-Left) */}
        <div className="absolute bottom-5 left-5 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 shadow-xl text-xs max-w-xs pointer-events-auto">
          <div className="font-bold text-slate-200 mb-2 flex items-center justify-between">
            <span>Severity &amp; Heat Density</span>
            <span className="text-[10px] text-slate-400">Class 1 → 4</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 to-red-600 mb-2.5 shadow-inner" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {[
              ['bg-emerald-500', 'Sev 1 (Minor)'],
              ['bg-blue-500', 'Sev 2 (Moderate)'],
              ['bg-orange-500', 'Sev 3 (Serious)'],
              ['bg-red-500', 'Sev 4 (Critical)'],
            ].map(([bg, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-slate-300">
                <span className={`w-2.5 h-2.5 rounded-full ${bg}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* City Badge (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl text-xs pointer-events-auto flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Analysis Target</div>
            <div className="text-sm font-black text-white">{cityName}</div>
          </div>
          <div className="pl-3 border-l border-slate-800 text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Predicted</div>
            <div className="text-sm font-black text-orange-400">Severity {predictedSeverity}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Heatmap from <strong>{filteredPoints.length.toLocaleString()}</strong> spatial coordinates. Warmer red zones indicate high incident recurrence and elevated severity.
          </span>
        </div>
        <div className="shrink-0 text-slate-500 font-mono text-[11px]">
          Leaflet &bull; DBSCAN &bull; Open-Meteo
        </div>
      </div>
    </div>
  );
}
