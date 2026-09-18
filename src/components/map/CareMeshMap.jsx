import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Eye, 
  HandHeart, 
  Package, 
  ShieldAlert, 
  MapPin, 
  Compass, 
  Layers, 
  X,
  Globe,
  Navigation,
  Sparkles,
  User,
  Tag,
  ChevronDown,
  ChevronLeft,
  ChevronRight
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

// Available Basemap Tile Providers (100% Free, zero-API-key)
const TILE_LAYERS = {
  osm: {
    id: 'osm',
    name: 'Street View',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, Maxar'
  },
  humanitarian: {
    id: 'humanitarian',
    name: 'Humanitarian',
    icon: '🤝',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, HOT'
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

// Standard preset categories to distinguish custom user-created categories
const STANDARD_CATEGORIES = new Set([
  'environmental',
  'community_need',
  'food_security',
  'safety_concern',
  'supplies',
  'transport',
  'labor',
  'infrastructure',
  'health_wellness',
  'general',
  'medical',
  'shelter',
  'equipment',
  'skills',
  'food',
  'other',
  'hazard',
  'flood',
  'fire',
  'weather',
  'mutual_aid',
  'discussion',
  'event',
  'update',
  'tool_lending',
  'safety'
]);

export const CareMeshMap = ({
  onSelectEntity,
  selectedEntity = null,
  selectedGroup = null,
  onSelectGroup = null,
  categoryFilter = 'all',
  onCategoryFilterChange = null,
  filterQuery = '',
  filterPredicate = null,
  height = '560px',
  initialWorldView = false,
  customPinFilter = null,
  onCustomPinFilterChange = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const activeTileLayerRef = useRef(null);
  const tempPinMarkerRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const clusterIndexRef = useRef(null);

  const {
    observations,
    requests,
    resources,
    safetyReports,
    currentUser,
    isRequestVisibleToUser,
    openCreateModal,
    inspectEntity
  } = useCareMesh();

  const [internalFilter, setInternalFilter] = useState('all');
  const activeFilter = onCategoryFilterChange ? categoryFilter : internalFilter;
  const setActiveFilter = (val) => {
    if (onCategoryFilterChange) {
      onCategoryFilterChange(val);
    } else {
      setInternalFilter(val);
    }
  };

  const [activeBasemap, setActiveBasemap] = useState('osm');
  const [clickedLocation, setClickedLocation] = useState(null); // { lat, lng, address }
  const [isLocating, setIsLocating] = useState(false);
  const [isBasemapMenuOpen, setIsBasemapMenuOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(initialWorldView ? 2 : 13);

  // Selected Group State (Cluster Group or Co-located Pin Group)
  const [internalSelectedGroup, setInternalSelectedGroup] = useState(null);
  const activeGroup = onSelectGroup && selectedGroup !== undefined ? selectedGroup : internalSelectedGroup;
  const setActiveGroup = useCallback((grp) => {
    if (onSelectGroup) {
      onSelectGroup(grp);
    } else {
      setInternalSelectedGroup(grp);
    }
  }, [onSelectGroup]);

  // Stepper index for cycling stacked activities in active group
  const currentGroupIndex = useMemo(() => {
    if (!activeGroup?.items?.length || !selectedEntity?.item?.id) return 0;
    const idx = activeGroup.items.findIndex(x => x.item?.id === selectedEntity.item.id);
    return idx >= 0 ? idx : 0;
  }, [activeGroup, selectedEntity]);

  const handleNextInGroup = useCallback(() => {
    if (!activeGroup?.items?.length) return;
    const nextIdx = (currentGroupIndex + 1) % activeGroup.items.length;
    const target = activeGroup.items[nextIdx];
    if (target && onSelectEntity) {
      onSelectEntity(target.item, target.type, activeGroup);
    } else if (target) {
      inspectEntity(target.item, target.type);
    }
  }, [activeGroup, currentGroupIndex, onSelectEntity, inspectEntity]);

  const handlePrevInGroup = useCallback(() => {
    if (!activeGroup?.items?.length) return;
    const prevIdx = (currentGroupIndex - 1 + activeGroup.items.length) % activeGroup.items.length;
    const target = activeGroup.items[prevIdx];
    if (target && onSelectEntity) {
      onSelectEntity(target.item, target.type, activeGroup);
    } else if (target) {
      inspectEntity(target.item, target.type);
    }
  }, [activeGroup, currentGroupIndex, onSelectEntity, inspectEntity]);

  // Custom Pin Shower State & Dropdown Management
  const [internalCustomPinMode, setInternalCustomPinMode] = useState('none');
  const customPinMode = onCustomPinFilterChange && customPinFilter !== null ? customPinFilter : internalCustomPinMode;
  const setCustomPinMode = useCallback((val) => {
    if (onCustomPinFilterChange) {
      onCustomPinFilterChange(val);
    } else {
      setInternalCustomPinMode(val);
    }
  }, [onCustomPinFilterChange]);

  const [isCustomPinMenuOpen, setIsCustomPinMenuOpen] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const customPinDropdownRef = useRef(null);
  const basemapDropdownRef = useRef(null);

  // Click-outside listener for floating control popover menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customPinDropdownRef.current && !customPinDropdownRef.current.contains(event.target)) {
        setIsCustomPinMenuOpen(false);
      }
      if (basemapDropdownRef.current && !basemapDropdownRef.current.contains(event.target)) {
        setIsBasemapMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if item has a custom category
  const isCustomCategoryItem = useCallback((item) => {
    if (!item) return false;
    if (item.isCustomCategory || item.isCustom || item.customCategory) return true;
    const cat = (item.category || '').toLowerCase().trim();
    if (!cat) return false;
    return !STANDARD_CATEGORIES.has(cat);
  }, []);

  // Relationship & custom-creation evaluator for any entity
  const getItemRelationship = useCallback((item) => {
    if (!item || !currentUser) {
      return { isAuthor: false, isResp: false, isCustom: false, isSpecial: false, customCategoryName: null };
    }
    const myId = currentUser.id;
    const myName = currentUser.name?.toLowerCase();

    // 1. Author / Creator Check
    let isAuthor = Boolean(
      item.authorId === myId ||
      item.author?.id === myId ||
      item.requesterId === myId ||
      item.requester?.id === myId ||
      item.providerId === myId ||
      item.provider?.id === myId ||
      item.reporterId === myId ||
      item.reporter?.id === myId ||
      item.organizerId === myId ||
      item.organizer?.id === myId ||
      item.proposerId === myId ||
      item.proposer?.id === myId ||
      item.createdBy === myId ||
      item.userId === myId ||
      item.ownerId === myId
    );

    if (!isAuthor && myName) {
      if (typeof item.author === 'string' && item.author.toLowerCase() === myName) isAuthor = true;
      else if (item.author?.name && item.author.name.toLowerCase() === myName) isAuthor = true;
      else if (typeof item.requester === 'string' && item.requester.toLowerCase() === myName) isAuthor = true;
      else if (item.requester?.name && item.requester.name.toLowerCase() === myName) isAuthor = true;
      else if (typeof item.provider === 'string' && item.provider.toLowerCase() === myName) isAuthor = true;
      else if (item.provider?.name && item.provider.name.toLowerCase() === myName) isAuthor = true;
      else if (typeof item.reporter === 'string' && item.reporter.toLowerCase() === myName) isAuthor = true;
      else if (item.reporter?.name && item.reporter.name.toLowerCase() === myName) isAuthor = true;
    }

    // 2. Active User Response / Volunteer / Contribution Check
    let isResp = false;
    if (!isAuthor) {
      if (Array.isArray(item.responses) && item.responses.some(r =>
        r.userId === myId || r.authorId === myId || r.author?.id === myId || r.user?.id === myId ||
        (r.author && typeof r.author === 'string' && r.author.toLowerCase() === myName) ||
        (r.author?.name && r.author.name.toLowerCase() === myName)
      )) {
        isResp = true;
      } else if (Array.isArray(item.volunteers) && item.volunteers.some(v =>
        v === myId || v?.id === myId || v?.userId === myId ||
        (typeof v === 'string' && v.toLowerCase() === myName) ||
        (v?.name && v.name.toLowerCase() === myName)
      )) {
        isResp = true;
      } else if (Array.isArray(item.participants) && item.participants.some(p =>
        p === myId || p?.id === myId || p?.userId === myId ||
        (typeof p === 'string' && p.toLowerCase() === myName) ||
        (p?.name && p.name.toLowerCase() === myName)
      )) {
        isResp = true;
      } else if (item.assignedTo === myId || (typeof item.assignedTo === 'string' && item.assignedTo.toLowerCase() === myName)) {
        isResp = true;
      } else if (item.offeredBy === myId || (typeof item.offeredBy === 'string' && item.offeredBy.toLowerCase() === myName)) {
        isResp = true;
      }
    }

    // 3. Custom Category / Custom Creation Check
    const isCustom = isCustomCategoryItem(item);
    const customCategoryName = isCustom ? (item.customCategory || item.category) : null;

    return {
      isAuthor,
      isResp,
      isCustom,
      isSpecial: isAuthor || isResp || isCustom,
      customCategoryName
    };
  }, [currentUser, isCustomCategoryItem]);

  // Match item against custom pin mode
  const matchesCustomPinMode = useCallback((item, mode) => {
    if (!mode || mode === 'none') return true;
    const rel = getItemRelationship(item);

    if (mode === 'all_custom') {
      return rel.isSpecial;
    }
    if (mode === 'created_by_me') {
      return rel.isAuthor;
    }
    if (mode === 'my_responses') {
      return rel.isResp;
    }
    if (mode === 'custom_categories') {
      return rel.isCustom;
    }
    if (mode.startsWith('cat:')) {
      const targetCat = mode.replace('cat:', '').toLowerCase().trim();
      const itemCat = (item.category || item.customCategory || '').toLowerCase().trim();
      return itemCat === targetCat;
    }
    return true;
  }, [getItemRelationship]);

  // Query / predicate matcher helper for filtering pins by search keyword and custom filters
  const matchesQuery = useCallback((item, type) => {
    if (filterPredicate) {
      return filterPredicate(item, type);
    }
    if (!filterQuery || !filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    const matchTitle = item.title?.toLowerCase().includes(q);
    const matchDesc = item.description?.toLowerCase().includes(q);
    const matchLoc = (item.location?.address || item.address || '')?.toLowerCase().includes(q);
    const matchType = type?.toLowerCase().includes(q) || (item.category || '')?.toLowerCase().includes(q) || (item.entityType || '')?.toLowerCase().includes(q);
    return Boolean(matchTitle || matchDesc || matchLoc || matchType);
  }, [filterPredicate, filterQuery]);

  // Single entity marker icon creator with custom pin creation indicators
  const createCustomIcon = useCallback((type, severityOrUrgency = 'normal', isSelected = false, specialBadge = null) => {
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

    const size = isSelected ? 42 : (specialBadge ? 38 : 34);
    const innerSize = isSelected ? 38 : (specialBadge ? 34 : 32);
    const fontSize = isSelected ? 16 : 14;

    let border = isSelected ? '3px solid #ffffff' : '2px solid white';
    let shadow = isSelected ? '0 0 14px rgba(0,0,0,0.45)' : 'var(--shadow-sm)';
    let badgeHtml = '';

    if (specialBadge) {
      if (specialBadge.isAuthor) {
        border = isSelected ? '3.5px solid #38bdf8' : '2.5px solid #0284c7';
        shadow = '0 0 12px rgba(2, 132, 199, 0.55), 0 2px 6px rgba(0,0,0,0.2)';
        badgeHtml = `<span style="position: absolute; top: -5px; right: -5px; background: #0284c7; color: #ffffff; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; z-index: 10;" title="Created by you">✨</span>`;
        if (!pulseClass) {
          pulseClass = '<div class="marker-pulse" style="background: #0284c7; opacity: 0.6;"></div>';
        }
      } else if (specialBadge.isResp) {
        border = isSelected ? '3.5px solid #34d399' : '2.5px solid #059669';
        shadow = '0 0 12px rgba(5, 150, 105, 0.55), 0 2px 6px rgba(0,0,0,0.2)';
        badgeHtml = `<span style="position: absolute; top: -5px; right: -5px; background: #059669; color: #ffffff; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; z-index: 10;" title="Your active response">🤝</span>`;
      } else if (specialBadge.isCustom) {
        border = isSelected ? '3.5px solid #c084fc' : '2.5px solid #9333ea';
        shadow = '0 0 12px rgba(147, 51, 234, 0.55), 0 2px 6px rgba(0,0,0,0.2)';
        badgeHtml = `<span style="position: absolute; top: -5px; right: -5px; background: #9333ea; color: #ffffff; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; z-index: 10;" title="Custom Category: ${escapeHtml(specialBadge.customCategoryName || '')}">🏷️</span>`;
      }
    }

    return L.divIcon({
      className: 'custom-leaflet-marker-wrapper',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: all 0.2s ease;">
          ${pulseClass || (isSelected ? '<div class="marker-pulse" style="background: #0284c7"></div>' : '')}
          <div class="caremesh-marker" style="width: ${innerSize}px; height: ${innerSize}px; background-color: ${bgColor}; font-size: ${fontSize}px; position: relative; z-index: ${isSelected ? 99 : 2}; border: ${border}; box-shadow: ${shadow};">
            ${iconChar}
          </div>
          ${badgeHtml}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }, []);

  // Clustered pin icon creator
  const createClusterIcon = useCallback((count, hasHazard, hazardCount) => {
    let size = 38;
    let fontSize = 13;
    if (count >= 50) {
      size = 52;
      fontSize = 16;
    } else if (count >= 10) {
      size = 44;
      fontSize = 14;
    }

    const bgGradient = hasHazard
      ? 'linear-gradient(135deg, #e11d48, #be123c)'
      : 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    const ringColor = hasHazard ? '#e11d48' : '#3b82f6';
    const pulseHtml = hasHazard
      ? `<div class="cluster-pulse" style="background: ${ringColor};"></div>`
      : '';

    return L.divIcon({
      className: 'custom-leaflet-cluster-wrapper',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${pulseHtml}
          <div class="caremesh-cluster-inner" style="width: ${size - 4}px; height: ${size - 4}px; border-radius: 50%; background: ${bgGradient}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${fontSize}px; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.35); position: relative; z-index: 5;">
            ${hasHazard ? `<span style="position: absolute; top: -5px; right: -5px; font-size: 11px; background: #ffffff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.35);" title="${hazardCount} urgent hazard(s)">⚠️</span>` : ''}
            ${count}
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }, []);

  // Basemap switcher helper
  const switchBasemap = useCallback((layerKey) => {
    const target = TILE_LAYERS[layerKey];
    if (!target || !mapInstanceRef.current) return;
    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }
    const newLayer = L.tileLayer(target.url, {
      attribution: target.attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    newLayer.bringToBack();
    activeTileLayerRef.current = newLayer;
    setActiveBasemap(layerKey);
    setIsBasemapMenuOpen(false);
  }, []);

  // Quick navigation handlers
  const handleWorldView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([20, 0], 2, {
      animate: true,
      duration: 1.2
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current.flyTo([latitude, longitude], 15, {
          animate: true,
          duration: 1.0
        });
        setClickedLocation({
          lat: parseFloat(latitude.toFixed(4)),
          lng: parseFloat(longitude.toFixed(4)),
          address: 'Your GPS Location'
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filter visible requests taking privacy into account
  const visibleRequests = useMemo(() => {
    return requests.filter(r => isRequestVisibleToUser ? isRequestVisibleToUser(r, currentUser) : (r.visibility !== 'group_only'));
  }, [requests, isRequestVisibleToUser, currentUser]);

  // Consolidated items with coordinates for quick custom pin shower metrics and zoom fitting
  const allLoadedItems = useMemo(() => {
    return [
      ...observations.map(o => ({ ...o, _entityType: 'observation' })),
      ...safetyReports.map(s => ({ ...s, _entityType: 'safety' })),
      ...visibleRequests.map(r => ({ ...r, _entityType: 'request' })),
      ...resources.map(res => ({ ...res, _entityType: 'resource' }))
    ].filter(item => item.location?.lat && item.location?.lng);
  }, [observations, safetyReports, visibleRequests, resources]);

  // Pre-calculated counts for Custom Pin Shower menu options
  const customCounts = useMemo(() => {
    let authored = 0;
    let responses = 0;
    let customCategories = 0;
    let all = 0;

    allLoadedItems.forEach(item => {
      const rel = getItemRelationship(item);
      if (rel.isAuthor) authored++;
      if (rel.isResp) responses++;
      if (rel.isCustom) customCategories++;
      if (rel.isSpecial) all++;
    });

    return { authored, responses, customCategories, all };
  }, [allLoadedItems, getItemRelationship]);

  // Detected unique custom categories and their counts across active items
  const availableCustomCategories = useMemo(() => {
    const catCounts = new Map();
    allLoadedItems.forEach(item => {
      const rel = getItemRelationship(item);
      if (rel.isCustom && rel.customCategoryName) {
        const key = rel.customCategoryName;
        catCounts.set(key, (catCounts.get(key) || 0) + 1);
      }
    });
    return Array.from(catCounts.entries()).map(([name, count]) => ({ name, count }));
  }, [allLoadedItems, getItemRelationship]);

  // Quick navigation handler when picking a custom pin shower mode
  const handleSelectCustomPinMode = useCallback((mode) => {
    setCustomPinMode(mode);
    setIsCustomPinMenuOpen(false);

    if (!mapInstanceRef.current) return;

    if (mode === 'none') {
      mapInstanceRef.current.flyTo([37.7780, -122.4200], 13.5, {
        animate: true,
        duration: 0.8
      });
      return;
    }

    // Find all pins matching the custom mode & current query
    const matching = allLoadedItems.filter(item => 
      matchesQuery(item, item._entityType) && matchesCustomPinMode(item, mode)
    );

    if (matching.length > 0) {
      const latLngs = matching.map(m => [m.location.lat, m.location.lng]);
      if (latLngs.length === 1) {
        mapInstanceRef.current.flyTo(latLngs[0], 15, {
          animate: true,
          duration: 0.8
        });
      } else {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [allLoadedItems, matchesQuery, matchesCustomPinMode, setCustomPinMode]);

  // Convert all items into GeoJSON Features for Supercluster
  const geojsonPoints = useMemo(() => {
    const points = [];

    // 1. Observations
    if (activeFilter === 'all' || activeFilter === 'observations') {
      observations.forEach(obs => {
        if (obs.location?.lat && obs.location?.lng && matchesQuery(obs, 'observation') && matchesCustomPinMode(obs, customPinMode)) {
          const rel = getItemRelationship(obs);
          points.push({
            type: 'Feature',
            properties: {
              id: obs.id,
              type: 'observation',
              title: obs.title,
              severityOrUrgency: 'normal',
              specialBadge: rel.isSpecial ? rel : null,
              rawItem: obs
            },
            geometry: {
              type: 'Point',
              coordinates: [obs.location.lng, obs.location.lat]
            }
          });
        }
      });
    }

    // 2. Safety Reports
    if (activeFilter === 'all' || activeFilter === 'safety') {
      safetyReports.forEach(rep => {
        if (rep.location?.lat && rep.location?.lng && matchesQuery(rep, 'safety') && matchesCustomPinMode(rep, customPinMode)) {
          const rel = getItemRelationship(rep);
          points.push({
            type: 'Feature',
            properties: {
              id: rep.id,
              type: 'safety',
              title: rep.title,
              severityOrUrgency: rep.severity || 'high',
              specialBadge: rel.isSpecial ? rel : null,
              rawItem: rep
            },
            geometry: {
              type: 'Point',
              coordinates: [rep.location.lng, rep.location.lat]
            }
          });
        }
      });
    }

    // 3. Requests
    if (activeFilter === 'all' || activeFilter === 'requests') {
      visibleRequests.forEach(req => {
        if (req.location?.lat && req.location?.lng && matchesQuery(req, 'request') && matchesCustomPinMode(req, customPinMode)) {
          const rel = getItemRelationship(req);
          points.push({
            type: 'Feature',
            properties: {
              id: req.id,
              type: 'request',
              title: req.title,
              severityOrUrgency: req.urgency || 'normal',
              specialBadge: rel.isSpecial ? rel : null,
              rawItem: req
            },
            geometry: {
              type: 'Point',
              coordinates: [req.location.lng, req.location.lat]
            }
          });
        }
      });
    }

    // 4. Resources
    if (activeFilter === 'all' || activeFilter === 'resources') {
      resources.forEach(res => {
        if (res.location?.lat && res.location?.lng && matchesQuery(res, 'resource') && matchesCustomPinMode(res, customPinMode)) {
          const rel = getItemRelationship(res);
          points.push({
            type: 'Feature',
            properties: {
              id: res.id,
              type: 'resource',
              title: res.title,
              severityOrUrgency: 'normal',
              specialBadge: rel.isSpecial ? rel : null,
              rawItem: res
            },
            geometry: {
              type: 'Point',
              coordinates: [res.location.lng, res.location.lat]
            }
          });
        }
      });
    }

    return points;
  }, [activeFilter, matchesQuery, matchesCustomPinMode, customPinMode, getItemRelationship, observations, safetyReports, visibleRequests, resources]);

  // Function to render clustered & individual markers based on current viewport
  const renderClusters = useCallback(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !clusterIndexRef.current) return;

    const map = mapInstanceRef.current;
    const zoom = Math.floor(map.getZoom());
    setCurrentZoom(zoom);
    const bounds = map.getBounds();

    // Clamp bounding box to valid world latitude/longitude [-180, -85, 180, 85]
    const west = Math.max(-180, Math.min(180, bounds.getWest()));
    const east = Math.max(-180, Math.min(180, bounds.getEast()));
    const south = Math.max(-85, Math.min(85, bounds.getSouth()));
    const north = Math.max(-85, Math.min(85, bounds.getNorth()));

    let bbox;
    if (bounds.getEast() - bounds.getWest() >= 360 || west >= east) {
      bbox = [-180, -85, 180, 85];
    } else {
      bbox = [west, south, east, north];
    }

    const clusters = clusterIndexRef.current.getClusters(bbox, zoom);

    markersLayerRef.current.clearLayers();
    markerMapRef.current.clear();

    const selectedId = selectedEntity?.item?.id;

    // Separate clusters and individual items
    const clusterFeatures = [];
    const individualFeatures = [];

    clusters.forEach(feat => {
      if (feat.properties.cluster) {
        clusterFeatures.push(feat);
      } else {
        individualFeatures.push(feat);
      }
    });

    // 1. Render Clustered Hub Markers
    clusterFeatures.forEach(feat => {
      const [lng, lat] = feat.geometry.coordinates;
      const { cluster_id, point_count, point_count_abbreviated, hasHazard, hazardCount } = feat.properties;
      const clusterIcon = createClusterIcon(point_count_abbreviated || point_count, hasHazard, hazardCount || 0);

      const clusterMarker = L.marker([lat, lng], {
        icon: clusterIcon,
        zIndexOffset: hasHazard ? 800 : 500
      });

      const tooltipContent = hasHazard
        ? `<b>Cluster: ${point_count} mutual aid activities</b><br/><span class="text-rose font-semibold">⚠️ Includes ${hazardCount || 1} critical hazard(s)</span><br/><span style="font-size: 11px; opacity: 0.85">Click to zoom into this region</span>`
        : `<b>Cluster: ${point_count} mutual aid activities</b><br/><span style="font-size: 11px; opacity: 0.85">Click to zoom into this region</span>`;

      clusterMarker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -10] });

      clusterMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const expansionZoom = clusterIndexRef.current.getClusterExpansionZoom(cluster_id);
        const targetZoom = Math.min(Math.max(zoom + 2, expansionZoom), 18);
        map.flyTo([lat, lng], targetZoom, {
          animate: true,
          duration: 0.7
        });

        // Retrieve all leaves in this cluster
        let leaves;
        try {
          leaves = clusterIndexRef.current.getLeaves(cluster_id, Infinity);
        } catch {
          leaves = [];
        }

        const clusterItems = leaves.map(leaf => ({
          item: leaf.properties.rawItem,
          type: leaf.properties.type
        })).filter(x => x.item);

        const groupData = {
          id: `cluster_${cluster_id}`,
          groupType: 'cluster',
          title: `Cluster: ${point_count} Mutual Aid Activities`,
          coordinate: [lat, lng],
          hasHazard,
          hazardCount,
          items: clusterItems
        };

        setActiveGroup(groupData);

        if (clusterItems.length > 0) {
          if (onSelectEntity) {
            onSelectEntity(clusterItems[0].item, clusterItems[0].type, groupData);
          } else {
            inspectEntity(clusterItems[0].item, clusterItems[0].type);
          }
        }
      });

      markersLayerRef.current.addLayer(clusterMarker);
    });

    // 2. Render Individual Item Markers with Coincident Point Spiderfying
    const COLLISION_DISTANCE_PX = 24;
    const locationGroups = [];

    individualFeatures.forEach(feat => {
      const [lng, lat] = feat.geometry.coordinates;
      const point = map.latLngToLayerPoint([lat, lng]);

      let group = null;
      for (const g of locationGroups) {
        const dist = Math.hypot(point.x - g.point.x, point.y - g.point.y);
        if (dist < COLLISION_DISTANCE_PX) {
          group = g;
          break;
        }
      }

      if (group) {
        group.items.push(feat);
      } else {
        locationGroups.push({
          point,
          latLng: [lat, lng],
          items: [feat]
        });
      }
    });

    const typeLabels = {
      safety: '⚠️ Safety Hazard',
      request: '🤝 Need Help',
      resource: '🎁 Available Resource',
      observation: '👁️ Field Observation',
      event: '📅 Action Event'
    };

    locationGroups.forEach(group => {
      const count = group.items.length;

      if (count === 1) {
        // Individual uncollided marker
        const feat = group.items[0];
        const [lng, lat] = feat.geometry.coordinates;
        const { id, type, title, severityOrUrgency, rawItem, specialBadge } = feat.properties;
        const isSelected = selectedId === id;
        const singleIcon = createCustomIcon(type, severityOrUrgency, isSelected, specialBadge);

        const marker = L.marker([lat, lng], {
          icon: singleIcon,
          zIndexOffset: isSelected ? 2500 : (specialBadge ? 200 : 100)
        });

        const safeTitle = escapeHtml(title);
        let specialNotice = '';
        if (specialBadge?.isAuthor) {
          specialNotice = `<br/><span style="font-size: 11px; color: #0284c7; font-weight: 700;">✨ Created by you</span>`;
        } else if (specialBadge?.isResp) {
          specialNotice = `<br/><span style="font-size: 11px; color: #059669; font-weight: 700;">🤝 Your active response</span>`;
        } else if (specialBadge?.isCustom) {
          specialNotice = `<br/><span style="font-size: 11px; color: #9333ea; font-weight: 700;">🏷️ Custom: ${escapeHtml(specialBadge.customCategoryName || 'Community Tag')}</span>`;
        }

        marker.bindTooltip(`<b>${typeLabels[type] || 'Activity'}:</b> ${safeTitle}${specialNotice}`, {
          direction: 'top',
          offset: [0, -10]
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectEntity) onSelectEntity(rawItem, type);
          else inspectEntity(rawItem, type);
        });

        markersLayerRef.current.addLayer(marker);
        markerMapRef.current.set(`${type}_${id}`, marker);
        markerMapRef.current.set(id, marker);
      } else {
        // Coincident markers: Multiple mutual aid activities at this ground coordinate
        const coLocatedItems = group.items.map(f => ({
          item: f.properties.rawItem,
          type: f.properties.type
        }));
        const firstItem = group.items[0]?.properties?.rawItem;
        const siteAddress = firstItem?.location?.address || firstItem?.address || 'Site Coordinate';

        const groupData = {
          id: `colocated_${group.latLng[0] || group.latLng.lat}_${group.latLng[1] || group.latLng.lng}`,
          groupType: 'co_located',
          title: `Co-located Site (${count} Activities)`,
          address: siteAddress,
          coordinate: [group.latLng.lat || group.latLng[0], group.latLng.lng || group.latLng[1]],
          items: coLocatedItems
        };

        // Interactive ground hub icon with count badge
        const centerIcon = L.divIcon({
          className: 'caremesh-coincident-hub-icon',
          html: `
            <div style="cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="background: #0f172a; color: #ffffff; border-radius: 12px; padding: 2px 7px; font-size: 11px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 3px; transition: transform 0.15s ease;">
                <span>📍</span>
                <span>${count}</span>
              </div>
            </div>
          `,
          iconSize: [38, 24],
          iconAnchor: [19, 12]
        });

        const centerPin = L.marker(group.latLng, {
          icon: centerIcon,
          zIndexOffset: 400
        });

        centerPin.bindTooltip(`<b>📍 Co-located Site: ${count} mutual aid activities</b><br/><span style="font-size: 11px; color: #38bdf8;">Click to show all ${count} activities in the right-side list</span>`, {
          direction: 'bottom',
          offset: [0, 10]
        });

        centerPin.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveGroup(groupData);
          if (coLocatedItems.length > 0) {
            if (onSelectEntity) onSelectEntity(coLocatedItems[0].item, coLocatedItems[0].type, groupData);
            else inspectEntity(coLocatedItems[0].item, coLocatedItems[0].type);
          }
        });

        markersLayerRef.current.addLayer(centerPin);

        // Calculate dynamic fan radius giving ample room so pins never overlap
        const fanRadius = Math.max(36, 24 + count * 5.5);

        group.items.forEach((feat, index) => {
          const { id, type, title, severityOrUrgency, rawItem, specialBadge } = feat.properties;
          const isSelected = selectedId === id;
          const singleIcon = createCustomIcon(type, severityOrUrgency, isSelected, specialBadge);

          const angle = (2 * Math.PI * index) / count - Math.PI / 2;
          const targetPoint = L.point(
            group.point.x + fanRadius * Math.cos(angle),
            group.point.y + fanRadius * Math.sin(angle)
          );
          const targetLatLng = map.layerPointToLatLng(targetPoint);

          const leaderLine = L.polyline([group.latLng, [targetLatLng.lat, targetLatLng.lng]], {
            color: '#0284c7',
            weight: 1.5,
            dashArray: '3, 4',
            opacity: 0.55,
            interactive: false
          });
          markersLayerRef.current.addLayer(leaderLine);

          const marker = L.marker([targetLatLng.lat, targetLatLng.lng], {
            icon: singleIcon,
            zIndexOffset: isSelected ? 2500 : (specialBadge ? 220 + index : 150 + index)
          });

          // Hover elevation so hovering brings pin to front and avoids any overlap
          marker.on('mouseover', () => {
            marker.setZIndexOffset(2600);
          });
          marker.on('mouseout', () => {
            marker.setZIndexOffset(isSelected ? 2500 : (specialBadge ? 220 + index : 150 + index));
          });

          const safeTitle = escapeHtml(title);
          let specialNotice = '';
          if (specialBadge?.isAuthor) {
            specialNotice = `<br/><span style="font-size: 11px; color: #0284c7; font-weight: 700;">✨ Created by you</span>`;
          } else if (specialBadge?.isResp) {
            specialNotice = `<br/><span style="font-size: 11px; color: #059669; font-weight: 700;">🤝 Your active response</span>`;
          } else if (specialBadge?.isCustom) {
            specialNotice = `<br/><span style="font-size: 11px; color: #9333ea; font-weight: 700;">🏷️ Custom: ${escapeHtml(specialBadge.customCategoryName || 'Community Tag')}</span>`;
          }
          const stackNotice = `<br/><span style="font-size: 11px; opacity: 0.85; color: #0284c7; font-weight: 600;">📍 Co-located (${index + 1} of ${count} activities at this site)</span>`;
          marker.bindTooltip(`<b>${typeLabels[type] || 'Activity'}:</b> ${safeTitle}${specialNotice}${stackNotice}`, {
            direction: 'top',
            offset: [0, -10]
          });

          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setActiveGroup(groupData);
            if (onSelectEntity) onSelectEntity(rawItem, type, groupData);
            else inspectEntity(rawItem, type);
          });

          markersLayerRef.current.addLayer(marker);
          markerMapRef.current.set(`${type}_${id}`, marker);
          markerMapRef.current.set(id, marker);
        });
      }
    });
  }, [selectedEntity?.item?.id, createClusterIcon, createCustomIcon, onSelectEntity, inspectEntity, setActiveGroup]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: [20, 0] if initialWorldView else Maplewood coordinates
      const initialCenter = initialWorldView ? [20, 0] : [37.7780, -122.4200];
      const initialZoom = initialWorldView ? 2 : 13;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 2,
        maxZoom: 19,
        worldCopyJump: true,
        zoomControl: false
      });

      // Initialize base tile layer (OpenStreetMap by default)
      const baseLayer = L.tileLayer(TILE_LAYERS.osm.url, {
        attribution: TILE_LAYERS.osm.attribution,
        maxZoom: 19
      }).addTo(map);
      activeTileLayerRef.current = baseLayer;

      // Position standard zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer for markers
      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Click to drop coordinate pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setClickedLocation({
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4)),
          address: `Pinned Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        });
      });

      // Recalculate clusters whenever map viewport moves or zooms
      map.on('moveend zoomend', () => {
        renderClusters();
      });
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        activeTileLayerRef.current = null;
        tempPinMarkerRef.current = null;
        markerMapRef.current = new Map();
        clusterIndexRef.current = null;
      }
    };
  }, [renderClusters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger flight to world view when initialWorldView prop activates or changes
  useEffect(() => {
    if (initialWorldView && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2, {
        animate: true,
        duration: 0.8
      });
    }
  }, [initialWorldView]);

  // Re-index Supercluster whenever GeoJSON points change
  useEffect(() => {
    clusterIndexRef.current = new Supercluster({
      radius: 52,
      maxZoom: 15,
      map: (props) => ({
        hasHazard: props.type === 'safety',
        hasRequest: props.type === 'request',
        hasResource: props.type === 'resource',
        hasObservation: props.type === 'observation',
        hazardCount: props.type === 'safety' ? 1 : 0
      }),
      reduce: (acc, props) => {
        acc.hasHazard = acc.hasHazard || props.hasHazard;
        acc.hasRequest = acc.hasRequest || props.hasRequest;
        acc.hasResource = acc.hasResource || props.hasResource;
        acc.hasObservation = acc.hasObservation || props.hasObservation;
        acc.hazardCount += props.hazardCount;
      }
    });

    clusterIndexRef.current.load(geojsonPoints);
    renderClusters();
  }, [geojsonPoints, renderClusters]);

  // Update temporary drop pin marker
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

  // Center map on selected entity when clicked from list or drawer
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEntity?.item?.location) return;
    const { lat, lng } = selectedEntity.item.location;
    if (lat && lng) {
      mapInstanceRef.current.flyTo([lat, lng], 15, {
        animate: true,
        duration: 0.6
      });
      const key = selectedEntity.type ? `${selectedEntity.type}_${selectedEntity.item.id}` : selectedEntity.item.id;
      const marker = markerMapRef.current.get(key) || markerMapRef.current.get(selectedEntity.item.id);
      if (marker && marker.openTooltip) {
        marker.openTooltip();
      }
    }
  }, [selectedEntity]);

  const filteredCounts = useMemo(() => {
    let obs = 0;
    let safe = 0;
    let req = 0;
    let res = 0;

    observations.forEach(o => {
      if (o.location?.lat && o.location?.lng && matchesQuery(o, 'observation') && matchesCustomPinMode(o, customPinMode)) obs++;
    });
    safetyReports.forEach(s => {
      if (s.location?.lat && s.location?.lng && matchesQuery(s, 'safety') && matchesCustomPinMode(s, customPinMode)) safe++;
    });
    visibleRequests.forEach(r => {
      if (r.location?.lat && r.location?.lng && matchesQuery(r, 'request') && matchesCustomPinMode(r, customPinMode)) req++;
    });
    resources.forEach(r => {
      if (r.location?.lat && r.location?.lng && matchesQuery(r, 'resource') && matchesCustomPinMode(r, customPinMode)) res++;
    });

    return {
      all: obs + safe + req + res,
      observations: obs,
      safety: safe,
      requests: req,
      resources: res
    };
  }, [observations, safetyReports, visibleRequests, resources, matchesQuery, matchesCustomPinMode, customPinMode]);

  const filterButtons = [
    { id: 'all', label: 'All Items', icon: <Layers size={14} />, count: filteredCounts.all },
    { id: 'safety', label: 'Safety Hazards', icon: <ShieldAlert size={14} className="text-rose" />, count: filteredCounts.safety },
    { id: 'requests', label: 'Help Requests', icon: <HandHeart size={14} className="text-amber" />, count: filteredCounts.requests },
    { id: 'resources', label: 'Available Resources', icon: <Package size={14} className="text-brand" />, count: filteredCounts.resources },
    { id: 'observations', label: 'Observations', icon: <Eye size={14} />, count: filteredCounts.observations }
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {fb.icon}
              <span>{fb.label}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: activeFilter === fb.id ? 'rgba(255, 255, 255, 0.28)' : 'var(--bg-muted, #f1f5f9)',
                  color: activeFilter === fb.id ? '#ffffff' : 'var(--text-secondary, #64748b)'
                }}
              >
                {fb.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-muted d-flex align-center gap-2">
          {currentZoom <= 11 && (
            <span 
              className="badge badge-brand animate-fade-in"
              style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '12px' }}
            >
              🌐 Clustered Macro View Active
            </span>
          )}
          <Compass size={14} />
          <span>Click map to pin coordinate & report</span>
        </div>
      </div>

      {/* Map Surface */}
      <div className="caremesh-map-wrapper" style={{ position: 'relative', width: '100%', height: height || undefined, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Active Custom Pin Shower Status Banner */}
        {customPinMode !== 'none' && (
          <div 
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>
              {customPinMode === 'all_custom' && `Showing ${geojsonPoints.length} pins (My & Custom Creations)`}
              {customPinMode === 'created_by_me' && `Showing ${geojsonPoints.length} pins created by you`}
              {customPinMode === 'my_responses' && `Showing ${geojsonPoints.length} pins with your active responses`}
              {customPinMode === 'custom_categories' && `Showing ${geojsonPoints.length} custom-categorized pins`}
              {customPinMode.startsWith('cat:') && `Showing ${geojsonPoints.length} pins tagged "${customPinMode.replace('cat:', '')}"`}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-white"
              style={{ padding: '2px 6px', fontSize: '0.72rem', background: 'rgba(255,255,255,0.18)', borderRadius: '12px', marginLeft: '4px' }}
              onClick={() => handleSelectCustomPinMode('none')}
              title="Clear custom pin filter"
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Empty State when no custom pins match current filter */}
        {customPinMode !== 'none' && geojsonPoints.length === 0 && (
          <div 
            className="card p-4 animate-fade-in text-center shadow-lg"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              maxWidth: '320px',
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📍✨</div>
            <h4 className="font-bold text-sm mb-1 text-primary">No Custom Pins Found</h4>
            <p className="text-xs text-muted mb-3">
              No pins match your custom creation filter in this category view.
            </p>
            <div className="d-flex gap-2 justify-center">
              <button 
                type="button" 
                className="btn btn-primary btn-xs"
                onClick={() => openCreateModal('observation')}
              >
                + Pin New Creation
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs"
                onClick={() => handleSelectCustomPinMode('none')}
              >
                Show All Pins
              </button>
            </div>
          </div>
        )}

        {/* Floating Controls: World View, Custom Pin Shower, My Location & Basemap Switcher */}
        <div className="map-floating-panel">
          {/* Quick Views */}
          <button 
            type="button"
            className="map-control-btn" 
            onClick={handleWorldView}
            title="Zoom out to Global World View"
            style={{ padding: '4px 6px' }}
          >
            <Globe size={13} className="text-blue-600" />
            <span className="d-none d-md-inline" style={{ fontSize: '0.72rem' }}>World</span>
          </button>

          {/* Custom Pin Shower Control (Replaces Local Hub) */}
          <div style={{ position: 'relative' }} ref={customPinDropdownRef}>
            <button 
              type="button"
              className={`map-control-btn ${customPinMode !== 'none' ? 'active' : ''}`} 
              onClick={() => setIsCustomPinMenuOpen(prev => !prev)}
              title="Custom Pin Shower: Filter map to your pins and custom creations"
              style={{
                padding: '4px 7px',
                fontSize: '0.72rem',
                ...(customPinMode !== 'none' ? {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                  color: '#ffffff',
                  borderColor: '#4338ca',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)'
                } : {})
              }}
            >
              <Sparkles size={13} className={customPinMode !== 'none' ? 'text-amber-300' : 'text-indigo-600'} />
              <span>
                {customPinMode === 'none'
                  ? 'Custom Pins'
                  : `Custom Pins (${geojsonPoints.length})`}
              </span>
              <ChevronDown size={11} style={{ opacity: 0.8, transform: isCustomPinMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {isCustomPinMenuOpen && (
              <div 
                className="card p-2 shadow-lg animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  zIndex: 1010,
                  minWidth: '250px',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="d-flex align-center justify-between pb-1.5 mb-1.5" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div className="d-flex align-center gap-1.5 font-bold text-xs text-primary">
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>Custom Pin Shower</span>
                  </div>
                  {customPinMode !== 'none' && (
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-xs text-muted" 
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                      onClick={() => handleSelectCustomPinMode('none')}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="d-flex flex-column gap-1">
                  {/* Option 1: All My & Custom Pins */}
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm w-100 justify-between text-xs ${customPinMode === 'all_custom' ? 'font-bold bg-indigo-50 text-indigo-700' : ''}`}
                    style={{ padding: '6px 8px', borderRadius: '6px' }}
                    onClick={() => handleSelectCustomPinMode('all_custom')}
                  >
                    <div className="d-flex align-center gap-2">
                      <span>✨</span>
                      <span>All My & Custom Pins</span>
                    </div>
                    <span className="badge badge-gray text-xs" style={{ fontSize: '0.7rem' }}>
                      {customCounts.all}
                    </span>
                  </button>

                  {/* Option 2: Created by Me */}
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm w-100 justify-between text-xs ${customPinMode === 'created_by_me' ? 'font-bold bg-blue-50 text-blue-700' : ''}`}
                    style={{ padding: '6px 8px', borderRadius: '6px' }}
                    onClick={() => handleSelectCustomPinMode('created_by_me')}
                  >
                    <div className="d-flex align-center gap-2">
                      <User size={13} className="text-blue-600" />
                      <span>Created by Me</span>
                    </div>
                    <span className="badge badge-gray text-xs" style={{ fontSize: '0.7rem' }}>
                      {customCounts.authored}
                    </span>
                  </button>

                  {/* Option 3: My Active Responses */}
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm w-100 justify-between text-xs ${customPinMode === 'my_responses' ? 'font-bold bg-emerald-50 text-emerald-700' : ''}`}
                    style={{ padding: '6px 8px', borderRadius: '6px' }}
                    onClick={() => handleSelectCustomPinMode('my_responses')}
                  >
                    <div className="d-flex align-center gap-2">
                      <span>🤝</span>
                      <span>My Active Responses</span>
                    </div>
                    <span className="badge badge-gray text-xs" style={{ fontSize: '0.7rem' }}>
                      {customCounts.responses}
                    </span>
                  </button>

                  {/* Option 4: Custom Categories / Community Tags */}
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm w-100 justify-between text-xs ${customPinMode === 'custom_categories' ? 'font-bold bg-purple-50 text-purple-700' : ''}`}
                    style={{ padding: '6px 8px', borderRadius: '6px' }}
                    onClick={() => handleSelectCustomPinMode('custom_categories')}
                  >
                    <div className="d-flex align-center gap-2">
                      <Tag size={13} className="text-purple-600" />
                      <span>Custom Categories</span>
                    </div>
                    <span className="badge badge-gray text-xs" style={{ fontSize: '0.7rem' }}>
                      {customCounts.customCategories}
                    </span>
                  </button>

                  {/* Detected Custom Categories Sub-List if any exist */}
                  {availableCustomCategories.length > 0 && (
                    <div className="pt-1.5 mt-1 d-flex flex-column gap-1" style={{ borderTop: '1px dashed var(--border-light)' }}>
                      <div className="text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: '4px' }}>
                        Custom Community Topics
                      </div>
                      {availableCustomCategories.map(cat => (
                        <button
                          key={cat.name}
                          type="button"
                          className={`btn btn-ghost btn-sm w-100 justify-between text-xs ${customPinMode === `cat:${cat.name}` ? 'font-bold bg-purple-50 text-purple-700' : ''}`}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                          onClick={() => handleSelectCustomPinMode(`cat:${cat.name}`)}
                        >
                          <div className="d-flex align-center gap-1.5 text-truncate" style={{ maxWidth: '170px' }}>
                            <span style={{ fontSize: '10px' }}>🏷️</span>
                            <span className="text-truncate">{cat.name}</span>
                          </div>
                          <span className="badge badge-gray text-xs" style={{ fontSize: '0.68rem' }}>
                            {cat.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Inline Custom Filter / Tag Input */}
                  <div className="pt-2 mt-1" style={{ borderTop: '1px dashed var(--border-light)' }}>
                    <div className="d-flex align-center justify-between mb-1">
                      <label className="text-xs font-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                        Filter by Custom Tag
                      </label>
                      {customCategoryInput && (
                        <button 
                          type="button" 
                          className="btn btn-ghost btn-xs text-muted p-0"
                          style={{ fontSize: '0.68rem' }}
                          onClick={() => setCustomCategoryInput('')}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customCategoryInput.trim()) {
                          handleSelectCustomPinMode(`cat:${customCategoryInput.trim()}`);
                        }
                      }}
                      className="d-flex gap-1"
                    >
                      <input 
                        type="text"
                        placeholder="e.g. solar, flood, mutual_aid..."
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="form-input text-xs"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
                      />
                      <button 
                        type="submit" 
                        disabled={!customCategoryInput.trim()}
                        className="btn btn-primary btn-xs"
                        style={{ padding: '0 8px', height: '28px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                      >
                        Apply
                      </button>
                    </form>
                  </div>

                  {/* Option 5: Show All (Reset) */}
                  <div className="pt-1 mt-1" style={{ borderTop: '1px solid var(--border-light)' }}>
                    <button
                      type="button"
                      className={`btn btn-ghost btn-sm w-100 justify-start text-xs ${customPinMode === 'none' ? 'font-bold text-brand bg-slate-50' : 'text-muted'}`}
                      style={{ padding: '6px 8px', borderRadius: '6px' }}
                      onClick={() => handleSelectCustomPinMode('none')}
                    >
                      <Globe size={13} className="mr-1.5 text-slate-500" />
                      <span>Show All Community Pins</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="button"
            className="map-control-btn" 
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Fly to your physical GPS location"
            style={{ padding: '4px 7px', fontSize: '0.72rem' }}
          >
            <Navigation size={13} className={isLocating ? 'animate-spin text-amber' : 'text-slate-600'} />
            <span>{isLocating ? 'Locating...' : 'My Location'}</span>
          </button>

          <div className="map-control-divider" />

          {/* Basemap Switcher */}
          <div style={{ position: 'relative' }} ref={basemapDropdownRef}>
            <button
              type="button"
              className="map-control-btn active"
              onClick={() => setIsBasemapMenuOpen(prev => !prev)}
              title="Toggle Map Imagery"
              style={{ padding: '4px 7px', fontSize: '0.72rem' }}
            >
              <span>{TILE_LAYERS[activeBasemap]?.icon}</span>
              <span>{TILE_LAYERS[activeBasemap]?.name}</span>
              <ChevronDown size={11} style={{ opacity: 0.8, transform: isBasemapMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {isBasemapMenuOpen && (
              <div
                className="card p-1 shadow-lg animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 1005,
                  minWidth: '150px',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {Object.values(TILE_LAYERS).map(layer => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`btn btn-ghost btn-sm w-100 justify-start text-xs ${activeBasemap === layer.id ? 'font-bold text-brand bg-slate-50' : ''}`}
                    style={{ padding: '6px 10px', borderRadius: '6px' }}
                    onClick={() => switchBasemap(layer.id)}
                  >
                    <span style={{ marginRight: '6px' }}>{layer.icon}</span>
                    <span>{layer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Co-Located / Cluster Stepper Toolbar */}
        {activeGroup && activeGroup.items?.length > 1 && !clickedLocation && (
          <div 
            className="animate-fade-in" 
            style={{ 
              position: 'absolute', 
              bottom: '18px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 1002, 
              background: 'rgba(15, 23, 42, 0.92)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '6px 14px',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div className="d-flex align-center gap-1.5 font-bold">
              <span>📍</span>
              <span className="text-truncate" style={{ maxWidth: '170px' }}>
                {activeGroup.groupType === 'cluster' ? 'Cluster Group' : 'Co-located Site'}:
              </span>
            </div>

            <span className="badge badge-brand text-xs" style={{ background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
              {currentGroupIndex + 1} of {activeGroup.items.length}
            </span>

            <span className="text-truncate d-none d-sm-inline" style={{ maxWidth: '160px', color: '#93c5fd', fontWeight: 600 }}>
              {activeGroup.items[currentGroupIndex]?.item?.title}
            </span>

            <div className="d-flex align-center gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-xs text-white"
                style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.16)', borderRadius: '12px', fontSize: '0.74rem' }}
                onClick={handlePrevInGroup}
                title="Browse to previous pin in this group"
              >
                <ChevronLeft size={13} style={{ marginRight: '2px' }} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-white"
                style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.16)', borderRadius: '12px', fontSize: '0.74rem' }}
                onClick={handleNextInGroup}
                title="Browse to next pin in this group"
              >
                <span>Next</span>
                <ChevronRight size={13} style={{ marginLeft: '2px' }} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-xs text-muted ml-1"
              style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px 6px', fontSize: '0.7rem' }}
              onClick={() => setActiveGroup(null)}
              title="Close stacked pin browser"
            >
              ✕
            </button>
          </div>
        )}

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

