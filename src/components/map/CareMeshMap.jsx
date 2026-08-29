import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Eye, 
  HandHeart, 
  Package, 
  Calendar, 
  ShieldAlert, 
  MapPin, 
  Compass, 
  Layers,
  X
} from 'lucide-react';

// Text escape helper to prevent unsanitized HTML insertion into map markers/tooltips
const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const CareMeshMap = ({ onSelectEntity, height = '560px' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const tempPinMarkerRef = useRef(null);

  const {
    observations,
    requests,
    resources,
    safetyReports,
    events,
    openCreateModal,
    inspectEntity
  } = useCareMesh();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'observations' | 'requests' | 'resources' | 'safety' | 'events'
  const [clickedLocation, setClickedLocation] = useState(null); // { lat, lng, address }

  // Marker creation helper
  const createCustomIcon = (type, severityOrUrgency = 'normal') => {
    let bgColor = '#059669'; // default emerald
    let iconChar = '📦';
    let pulseClass = '';

    if (type === 'safety') {
      bgColor = '#e11d48'; // crimson
      iconChar = '⚠️';
      pulseClass = '<div class="marker-pulse" style="background: #e11d48"></div>';
    } else if (type === 'request') {
      bgColor = severityOrUrgency === 'critical' ? '#be123c' : '#d97706'; // amber/red
      iconChar = '🤝';
    } else if (type === 'observation') {
      bgColor = '#0284c7'; // ocean blue
      iconChar = '👁️';
    } else if (type === 'event') {
      bgColor = '#9333ea'; // purple
      iconChar = '📅';
    } else if (type === 'resource') {
      bgColor = '#059669'; // emerald
      iconChar = '🎁';
    }

    return L.divIcon({
      className: 'custom-leaflet-marker-wrapper',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${pulseClass}
          <div class="caremesh-marker" style="width: 32px; height: 32px; background-color: ${bgColor}; font-size: 14px; position: relative; z-index: 2;">
            ${iconChar}
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on Maplewood coordinates
      const map = L.map(mapContainerRef.current, {
        center: [37.7780, -122.4200],
        zoom: 13,
        zoomControl: false
      });

      // Add clean CartoDB / OSM tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map click to drop coordinate pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setClickedLocation({
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4)),
          address: `Pinned Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        });
      });
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      // Cleanup
    };
  }, []);

  // Update temp pinned location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tempPinMarkerRef.current) {
      tempPinMarkerRef.current.remove();
      tempPinMarkerRef.current = null;
    }

    if (clickedLocation) {
      const pinIcon = L.divIcon({
        className: 'temp-pin',
        html: `
          <div style="background: #0f172a; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([clickedLocation.lat, clickedLocation.lng], { icon: pinIcon })
        .addTo(mapInstanceRef.current);
      tempPinMarkerRef.current = marker;
    }
  }, [clickedLocation]);

  // Render all active markers according to filter with sanitized tooltips
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Observations
    if (activeFilter === 'all' || activeFilter === 'observations') {
      observations.forEach(obs => {
        if (obs.location?.lat && obs.location?.lng) {
          const marker = L.marker([obs.location.lat, obs.location.lng], {
            icon: createCustomIcon('observation')
          });
          const safeTitle = escapeHtml(obs.title);
          marker.bindTooltip(`<b>Observation:</b> ${safeTitle}`, { direction: 'top', offset: [0, -10] });
          marker.on('click', () => {
            if (onSelectEntity) onSelectEntity(obs, 'observation');
            else inspectEntity(obs, 'observation');
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    }

    // 2. Safety Reports
    if (activeFilter === 'all' || activeFilter === 'safety') {
      safetyReports.forEach(rep => {
        if (rep.location?.lat && rep.location?.lng) {
          const marker = L.marker([rep.location.lat, rep.location.lng], {
            icon: createCustomIcon('safety', rep.severity)
          });
          const safeTitle = escapeHtml(rep.title);
          marker.bindTooltip(`<b>⚠️ Safety Alert:</b> ${safeTitle}`, { direction: 'top', offset: [0, -10] });
          marker.on('click', () => {
            if (onSelectEntity) onSelectEntity(rep, 'safety');
            else inspectEntity(rep, 'safety');
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    }

    // 3. Requests
    if (activeFilter === 'all' || activeFilter === 'requests') {
      requests.forEach(req => {
        if (req.location?.lat && req.location?.lng) {
          const marker = L.marker([req.location.lat, req.location.lng], {
            icon: createCustomIcon('request', req.urgency)
          });
          const safeTitle = escapeHtml(req.title);
          marker.bindTooltip(`<b>Need Help:</b> ${safeTitle}`, { direction: 'top', offset: [0, -10] });
          marker.on('click', () => {
            if (onSelectEntity) onSelectEntity(req, 'request');
            else inspectEntity(req, 'request');
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    }

    // 4. Resources
    if (activeFilter === 'all' || activeFilter === 'resources') {
      resources.forEach(res => {
        if (res.location?.lat && res.location?.lng) {
          const marker = L.marker([res.location.lat, res.location.lng], {
            icon: createCustomIcon('resource')
          });
          const safeTitle = escapeHtml(res.title);
          marker.bindTooltip(`<b>Available Resource:</b> ${safeTitle}`, { direction: 'top', offset: [0, -10] });
          marker.on('click', () => {
            if (onSelectEntity) onSelectEntity(res, 'resource');
            else inspectEntity(res, 'resource');
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    }

    // 5. Events
    if (activeFilter === 'all' || activeFilter === 'events') {
      events.forEach(evt => {
        if (evt.location?.lat && evt.location?.lng) {
          const marker = L.marker([evt.location.lat, evt.location.lng], {
            icon: createCustomIcon('event')
          });
          const safeTitle = escapeHtml(evt.title);
          marker.bindTooltip(`<b>Activity:</b> ${safeTitle}`, { direction: 'top', offset: [0, -10] });
          marker.on('click', () => {
            if (onSelectEntity) onSelectEntity(evt, 'event');
            else inspectEntity(evt, 'event');
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    }
  }, [activeFilter, observations, safetyReports, requests, resources, events, onSelectEntity, inspectEntity]);

  const filterButtons = [
    { id: 'all', label: 'All Items', icon: <Layers size={14} /> },
    { id: 'safety', label: 'Safety Hazards', icon: <ShieldAlert size={14} className="text-rose" /> },
    { id: 'requests', label: 'Help Requests', icon: <HandHeart size={14} className="text-amber" /> },
    { id: 'resources', label: 'Available Resources', icon: <Package size={14} className="text-brand" /> },
    { id: 'observations', label: 'Observations', icon: <Eye size={14} /> },
    { id: 'events', label: 'Events & Actions', icon: <Calendar size={14} /> }
  ];

  return (
    <div className="d-flex flex-column gap-2" style={{ width: '100%' }}>
      {/* Filter Chips Bar */}
      <div className="d-flex align-center justify-between gap-2 flex-wrap">
        <div className="d-flex gap-2 flex-wrap">
          {filterButtons.map(fb => (
            <button
              key={fb.id}
              className={`btn btn-sm ${activeFilter === fb.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveFilter(fb.id)}
            >
              {fb.icon}
              <span>{fb.label}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-muted d-flex align-center gap-1">
          <Compass size={14} />
          <span>Click map to pin coordinate & report</span>
        </div>
      </div>

      {/* Map Surface */}
      <div style={{ position: 'relative', width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Temporary Pin Quick Action Banner */}
        {clickedLocation && (
          <div 
            className="card p-3 animate-fade-in" 
            style={{ 
              position: 'absolute', 
              bottom: '16px', 
              left: '16px', 
              right: '16px', 
              zIndex: 1000, 
              background: 'rgba(255, 255, 255, 0.98)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--primary-300)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div className="d-flex align-center justify-between gap-2 mb-2">
              <div className="d-flex align-center gap-2">
                <MapPin size={16} className="text-brand" />
                <span className="font-bold text-sm text-primary">
                  Pinned Coordinate: {clickedLocation.lat}, {clickedLocation.lng}
                </span>
              </div>
              <button 
                type="button" 
                className="btn-icon btn-sm text-muted" 
                onClick={() => setClickedLocation(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="d-flex gap-2 flex-wrap align-center">
              <span className="text-xs text-muted">Create at coordinate:</span>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  openCreateModal('observation', {
                    lat: clickedLocation.lat,
                    lng: clickedLocation.lng,
                    locationAddress: clickedLocation.address
                  });
                  setClickedLocation(null);
                }}
              >
                <Eye size={13} />
                <span>Log Observation</span>
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  openCreateModal('request', {
                    lat: clickedLocation.lat,
                    lng: clickedLocation.lng,
                    locationAddress: clickedLocation.address
                  });
                  setClickedLocation(null);
                }}
              >
                <HandHeart size={13} />
                <span>Request Help</span>
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  openCreateModal('resource', {
                    lat: clickedLocation.lat,
                    lng: clickedLocation.lng,
                    locationAddress: clickedLocation.address
                  });
                  setClickedLocation(null);
                }}
              >
                <Package size={13} />
                <span>Offer Resource</span>
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  openCreateModal('safety', {
                    lat: clickedLocation.lat,
                    lng: clickedLocation.lng,
                    locationAddress: clickedLocation.address
                  });
                  setClickedLocation(null);
                }}
              >
                <ShieldAlert size={13} className="text-rose" />
                <span>Report Hazard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
