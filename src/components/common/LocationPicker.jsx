import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Modal } from './Modal';
import { 
  MapPin, 
  Map as MapIcon, 
  Navigation, 
  Check, 
  Crosshair, 
  X, 
  Sparkles,
  Info,
  Layers,
  Globe
} from 'lucide-react';

const PICKER_TILES = {
  voyager: {
    label: 'Street View',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

const PRESETS = [
  { name: 'Maplewood Center', lat: 37.7749, lng: -122.4194 },
  { name: 'Willow Creek Bridge', lat: 37.7812, lng: -122.4285 },
  { name: 'Pine Crest Heights', lat: 37.7680, lng: -122.4110 },
  { name: 'Upper Ridge Trailhead', lat: 37.7890, lng: -122.4350 },
  { name: 'Eastside Hub', lat: 37.7710, lng: -122.4250 },
  { name: 'Seattle Hub', lat: 47.6062, lng: -122.3321 },
  { name: 'Valencia Hub', lat: 39.4699, lng: -0.3763 },
  { name: 'Tokyo Hub', lat: 35.6762, lng: 139.6503 }
];

export const LocationPicker = ({
  value = { address: '', lat: null, lng: null },
  onChange,
  label = 'Location & Geographic Coordinates',
  placeholder = 'e.g. Elm St Bridge, Maplewood',
  required = false,
  showCoordinatesInputs = true,
  compact = false
}) => {
  // Pure controlled values
  const address = typeof value === 'object' 
    ? (value?.address ?? value?.locationAddress ?? '') 
    : (value || '');
  const lat = typeof value === 'object' 
    ? (value?.lat !== null && value?.lat !== undefined ? String(value.lat) : '')
    : '';
  const lng = typeof value === 'object' 
    ? (value?.lng !== null && value?.lng !== undefined ? String(value.lng) : '')
    : '';

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null); // { type: 'loading' | 'success' | 'error', message: string }
  const [mapLayer, setMapLayer] = useState('voyager'); // 'voyager' | 'satellite'

  // Modal map coordinates state
  const [tempLat, setTempLat] = useState(37.7780);
  const [tempLng, setTempLng] = useState(-122.4200);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const modalCenterRef = useRef([37.7780, -122.4200]);

  // Propagate changes upwards
  const notifyChange = (newAddr, newLatStr, newLngStr) => {
    if (!onChange) return;
    const parsedLat = newLatStr !== '' && !isNaN(Number(newLatStr)) ? Number(newLatStr) : null;
    const parsedLng = newLngStr !== '' && !isNaN(Number(newLngStr)) ? Number(newLngStr) : null;
    onChange({
      address: newAddr,
      locationAddress: newAddr,
      lat: parsedLat,
      lng: parsedLng
    });
  };

  const handleAddressChange = (e) => {
    notifyChange(e.target.value, lat, lng);
  };

  const handleLatChange = (e) => {
    notifyChange(address, e.target.value, lng);
  };

  const handleLngChange = (e) => {
    notifyChange(address, lat, e.target.value);
  };

  // GPS Geolocation Handler
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setGpsStatus({ type: 'loading', message: 'Detecting device GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pLat = parseFloat(position.coords.latitude.toFixed(4));
        const pLng = parseFloat(position.coords.longitude.toFixed(4));
        setGpsStatus({ type: 'success', message: `GPS fixed: ${pLat}, ${pLng}` });

        const newAddr = address.trim() ? address : `GPS Pin (${pLat}, ${pLng})`;
        notifyChange(newAddr, String(pLat), String(pLng));

        setTimeout(() => setGpsStatus(null), 4000);
      },
      (err) => {
        let msg = 'Could not acquire location. Setting Maplewood default coordinates.';
        if (err.code === 1) msg = 'Location permission denied. Setting Maplewood default coordinates.';
        setGpsStatus({ type: 'error', message: msg });

        const defLat = 37.7749;
        const defLng = -122.4194;
        notifyChange(address, String(defLat), String(defLng));

        setTimeout(() => setGpsStatus(null), 5000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Open interactive map pin modal
  const handleOpenMap = () => {
    const numLat = lat !== '' && !isNaN(Number(lat)) ? Number(lat) : 37.7780;
    const numLng = lng !== '' && !isNaN(Number(lng)) ? Number(lng) : -122.4200;
    modalCenterRef.current = [numLat, numLng];
    setTempLat(numLat);
    setTempLng(numLng);
    setIsMapModalOpen(true);
  };

  // Leaflet map initialization in modal
  useEffect(() => {
    if (!isMapModalOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    // Delay slight tick to allow modal DOM animation to mount
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialCenter = modalCenterRef.current || [37.7780, -122.4200];

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 14,
          minZoom: 2,
          maxZoom: 19,
          worldCopyJump: true,
          zoomControl: false
        });

        const tileLayer = L.tileLayer(PICKER_TILES.voyager.url, {
          attribution: PICKER_TILES.voyager.attribution,
          maxZoom: 19
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Custom marker pin icon
        const pinIcon = L.divIcon({
          className: 'caremesh-pin-picker-marker',
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-600, #2563eb); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2px solid #ffffff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 34]
        });

        const marker = L.marker(initialCenter, {
          draggable: true,
          icon: pinIcon
        }).addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Click anywhere to move marker
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          const roundedLat = parseFloat(clickLat.toFixed(4));
          const roundedLng = parseFloat(clickLng.toFixed(4));
          marker.setLatLng([roundedLat, roundedLng]);
          setTempLat(roundedLat);
          setTempLng(roundedLng);
        });

        // Drag marker
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const roundedLat = parseFloat(pos.lat.toFixed(4));
          const roundedLng = parseFloat(pos.lng.toFixed(4));
          setTempLat(roundedLat);
          setTempLng(roundedLng);
        });
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isMapModalOpen]);

  // Synchronize tile layer changes in modal map
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = PICKER_TILES[mapLayer] || PICKER_TILES.voyager;
    tileLayerRef.current.setUrl(config.url);
  }, [mapLayer]);

  // Preset location selection in map modal
  const handleSelectPreset = (preset) => {
    setTempLat(preset.lat);
    setTempLng(preset.lng);
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng]);
      mapInstanceRef.current.setView([preset.lat, preset.lng], 15);
    }
  };

  // Confirm pinned coordinates from modal
  const handleConfirmPin = () => {
    const latStr = String(tempLat);
    const lngStr = String(tempLng);
    const newAddr = address.trim() ? address : `Pinned Location (${tempLat}, ${tempLng})`;
    notifyChange(newAddr, latStr, lngStr);
    setIsMapModalOpen(false);
  };

  const handleClearCoordinates = () => {
    notifyChange(address, '', '');
  };

  const hasCoords = lat !== '' && lng !== '' && !isNaN(Number(lat)) && !isNaN(Number(lng));

  return (
    <div className="d-flex flex-column gap-2">
      {/* Label and GPS Quick Helper */}
      <div className="d-flex align-center justify-between gap-2">
        <label className="form-label mb-0 font-semibold text-xs text-primary d-flex align-center gap-1.5">
          <MapPin size={14} className="text-primary" />
          <span>{label}</span>
          {required && <span className="text-rose">*</span>}
        </label>
        
        {hasCoords && (
          <span className="badge badge-success text-xs d-inline-flex align-center gap-1" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
            <Check size={11} />
            <span>Coordinates Set ({Number(lat).toFixed(3)}, {Number(lng).toFixed(3)})</span>
          </span>
        )}
      </div>

      {/* Row 1: Address Name Input with Pin on Map & GPS Buttons */}
      <div className="d-flex gap-2">
        <div className="d-flex align-center flex-1" style={{ position: 'relative' }}>
          <MapPin size={15} className="text-muted" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder={placeholder}
            className="form-input"
            style={{ paddingLeft: '32px' }}
            required={required}
          />
        </div>

        {/* Pin on Map Interactive Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm d-flex align-center gap-1.5 flex-shrink-0"
          onClick={handleOpenMap}
          title="Open interactive map to pin location"
          style={{ whiteSpace: 'nowrap' }}
        >
          <MapIcon size={14} className="text-brand" />
          <span className="d-none d-sm-inline">Pin on Map</span>
        </button>

        {/* Device GPS Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm d-flex align-center gap-1.5 flex-shrink-0"
          onClick={handleGetGpsLocation}
          title="Use my current device GPS coordinates"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Navigation size={13} className="text-emerald" />
          <span className="d-none d-sm-inline">Use GPS</span>
        </button>
      </div>

      {/* Geolocation Feedback Message */}
      {gpsStatus && (
        <div 
          className="text-xs p-1.5 rounded animate-fade-in d-flex align-center gap-1.5"
          style={{
            background: gpsStatus.type === 'error' ? 'rgba(225, 29, 72, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            color: gpsStatus.type === 'error' ? 'var(--rose-600)' : 'var(--emerald-700)',
            fontSize: '0.72rem'
          }}
        >
          {gpsStatus.type === 'loading' && <Crosshair size={12} className="animate-spin" />}
          {gpsStatus.type === 'success' && <Check size={12} />}
          {gpsStatus.type === 'error' && <Info size={12} />}
          <span>{gpsStatus.message}</span>
        </div>
      )}

      {/* Row 2: Direct Latitude & Longitude Numeric Inputs */}
      {showCoordinatesInputs && (
        <div 
          className="p-2 rounded card" 
          style={{ 
            background: 'var(--bg-subtle)', 
            border: '1px solid var(--border-light)',
            padding: compact ? '0.35rem 0.5rem' : '0.5rem'
          }}
        >
          <div className="d-flex align-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted text-uppercase d-flex align-center gap-1" style={{ letterSpacing: '0.03em', fontSize: '0.65rem' }}>
              <Crosshair size={11} className="text-primary" /> GPS Latitude & Longitude
            </span>
            {hasCoords && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-muted p-0 d-flex align-center gap-1"
                onClick={handleClearCoordinates}
                title="Clear coordinates"
                style={{ fontSize: '0.68rem' }}
              >
                <X size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid-2 gap-2">
            <div>
              <div className="d-flex align-center justify-between mb-0.5">
                <label className="text-xs text-secondary mb-0" style={{ fontSize: '0.7rem' }}>Latitude</label>
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>[-90 to 90]</span>
              </div>
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={lat}
                onChange={handleLatChange}
                placeholder="e.g. 37.7749"
                className="form-input text-xs"
                style={{ height: '32px', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <div className="d-flex align-center justify-between mb-0.5">
                <label className="text-xs text-secondary mb-0" style={{ fontSize: '0.7rem' }}>Longitude</label>
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>[-180 to 180]</span>
              </div>
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={lng}
                onChange={handleLngChange}
                placeholder="e.g. -122.4194"
                className="form-input text-xs"
                style={{ height: '32px', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Leaflet Map Pin Modal */}
      <Modal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        title="Pin Location on Interactive Map"
        subtitle="Click anywhere on the map or drag the pin to set precise coordinates."
        maxWidth="760px"
        zIndex={1250}
        footer={
          <div className="d-flex align-center justify-between w-100 gap-2 flex-wrap">
            <div className="d-flex align-center gap-2">
              <span className="badge badge-primary text-xs d-flex align-center gap-1" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                <Crosshair size={13} />
                <span>Pinned: {tempLat.toFixed(4)}, {tempLng.toFixed(4)}</span>
              </span>
            </div>

            <div className="d-flex align-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsMapModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                onClick={handleConfirmPin}
              >
                <Check size={14} />
                <span>Confirm Location Pin</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3">
          {/* Preset Location Chips */}
          <div>
            <span className="text-xs font-bold text-muted text-uppercase d-block mb-1.5" style={{ letterSpacing: '0.03em', fontSize: '0.68rem' }}>
              Quick Presets & Hotspots
            </span>
            <div className="d-flex align-center gap-1.5 flex-wrap">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => handleSelectPreset(p)}
                  style={{ fontSize: '0.72rem', borderRadius: 'var(--radius-full)' }}
                >
                  <MapPin size={11} className="text-brand" />
                  <span>{p.name}</span>
                </button>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleGetGpsLocation}
                style={{ fontSize: '0.72rem', borderRadius: 'var(--radius-full)' }}
                title="Detect current device coordinates"
              >
                <Navigation size={11} className="text-emerald" />
                <span>Use My GPS</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '380px', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%' }} 
            />

            {/* Helper Floating Card */}
            <div 
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(6px)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-light)',
                maxWidth: '260px'
              }}
            >
              <div className="font-bold text-xs text-primary d-flex align-center gap-1">
                <Sparkles size={12} className="text-brand" />
                <span>Interactive Pin</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>
                Click anywhere to drop marker, or drag the blue pin.
              </div>
            </div>

            {/* Basemap & Global Nav Controls */}
            <div 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                display: 'flex',
                gap: '6px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1 shadow-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.6rem'
                }}
                onClick={() => setMapLayer(prev => prev === 'voyager' ? 'satellite' : 'voyager')}
                title="Toggle Satellite vs Street Map"
              >
                <Layers size={12} className="text-brand" />
                <span>{mapLayer === 'voyager' ? 'Satellite' : 'Street'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1 shadow-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.6rem'
                }}
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([20, 0], 2);
                  }
                }}
                title="Zoom out to Global View"
              >
                <Globe size={12} className="text-primary" />
                <span>World</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
