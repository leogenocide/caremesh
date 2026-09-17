import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useCareMesh } from '../context/useCareMesh';
import { CareMeshMap } from '../components/map/CareMeshMap';
import { UrgencyBadge, SeverityBadge, ResourceTypeBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { 
  MapPin, 
  Layers, 
  List, 
  Map as MapIcon, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  X, 
  Eye, 
  Share2, 
  ShieldAlert,
  Lock, 
  Globe,
  Filter,
  SlidersHorizontal,
  Plus,
  Flame,
  ShieldCheck,
  Check,
  Tag,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Package,
  HandHeart
} from 'lucide-react';

export const ExploreView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isWorldView = Boolean(
    location.state?.initialWorldView || searchParams.get('view') === 'world'
  );

  const {
    observations,
    safetyReports,
    requests,
    resources,
    communities,
    currentUser,
    isRequestVisibleToUser,
    openCreateModal,
    openShareSocialModal,
    inspectEntity,
    highlightedEntityId
  } = useCareMesh();

  const [selectedEntityState, setSelectedEntityState] = useState(null); // { item, type }
  const [selectedGroup, setSelectedGroup] = useState(null); // { id, groupType, title, address, coordinate, items, hasHazard, hazardCount }
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'observations' | 'requests' | 'resources' | 'safety'
  const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all' | 'critical' | 'urgent_only' | 'high' | 'moderate' | 'low'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active_open' | 'in_progress' | 'resolved'
  const [locationFilter, setLocationFilter] = useState('all'); // 'all' | string
  const [evidenceFilter, setEvidenceFilter] = useState('all'); // 'all' | 'has_evidence' | 'verified' | 'has_disputes'
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | string
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'urgency' | 'title'

  // Popover and Drawer toggles
  const [isAddFilterMenuOpen, setIsAddFilterMenuOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null); // null | 'urgency' | 'status' | 'location' | 'evidence' | 'topic' | 'time' | 'sort'
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map_only' | 'list_only'

  const visibleRequests = requests.filter(r => 
    isRequestVisibleToUser ? isRequestVisibleToUser(r, currentUser) : (r.visibility !== 'group_only')
  );

  // Combine items for the list
  const allItems = useMemo(() => [
    ...safetyReports.map(s => ({ ...s, entityType: 'safety' })),
    ...visibleRequests.map(r => ({ ...r, entityType: 'request' })),
    ...resources.map(res => ({ ...res, entityType: 'resource' })),
    ...observations.map(o => ({ ...o, entityType: 'observation' }))
  ], [safetyReports, visibleRequests, resources, observations]);

  // Derive active selected entity: manual user selection takes precedence, fallback to highlightedEntityId
  const selectedEntity = selectedEntityState || (highlightedEntityId ? (() => {
    const match = allItems.find(item => item.id === highlightedEntityId);
    return match ? { item: match, type: match.entityType } : null;
  })() : null);
  const setSelectedEntity = setSelectedEntityState;

  // Derive other mutual aid activities sharing the exact coordinates with the selected entity
  const coLocatedWithSelected = useMemo(() => {
    if (!selectedEntity?.item?.location?.lat || !selectedEntity?.item?.location?.lng) return [];
    const { lat, lng } = selectedEntity.item.location;
    return allItems.filter(other => 
      other.id !== selectedEntity.item.id &&
      other.location?.lat &&
      other.location?.lng &&
      Math.abs(other.location.lat - lat) < 0.0001 &&
      Math.abs(other.location.lng - lng) < 0.0001
    );
  }, [selectedEntity, allItems]);

  const categoryMap = useMemo(() => ({
    safety: 'safety',
    requests: 'request',
    resources: 'resource',
    observations: 'observation'
  }), []);

  // Dynamically extract distinct neighborhood areas across all data
  const distinctNeighborhoods = useMemo(() => {
    const set = new Set();
    allItems.forEach(item => {
      const hood = item.location?.neighborhood;
      if (hood) set.add(hood.trim());
      const addr = item.location?.address || item.address;
      if (addr && addr.includes(',')) {
        const firstPart = addr.split(',')[0]?.trim();
        if (firstPart && firstPart.length < 30) set.add(firstPart);
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allItems]);

  // Dynamically extract distinct topics / categories
  const distinctTopics = useMemo(() => {
    const set = new Set();
    allItems.forEach(item => {
      if (item.category) set.add(item.category.trim());
      if (item.contributionType) set.add(item.contributionType.trim());
      if (item.hazardType) set.add(item.hazardType.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allItems]);

  // Unified filter predicate across list and map
  const matchesItemFilter = useCallback((item, entityType) => {
    const type = entityType || item.entityType;

    // 1. Entity Category Filter
    if (categoryFilter !== 'all') {
      const targetType = categoryMap[categoryFilter];
      if (type !== targetType) return false;
    }

    // 2. Keyword Query Filter (title, description, address, category, entity type)
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = (item.location?.address || item.address || '')?.toLowerCase().includes(q);
      const matchType = type?.toLowerCase().includes(q) || (item.category || '')?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchType) return false;
    }

    // 3. Urgency & Severity Filter
    if (urgencyFilter !== 'all') {
      const itemUrgency = item.severity || item.urgency;
      if (urgencyFilter === 'critical') {
        if (itemUrgency !== 'critical') return false;
      } else if (urgencyFilter === 'urgent_only') {
        if (itemUrgency !== 'critical' && itemUrgency !== 'urgent' && itemUrgency !== 'high') return false;
      } else if (urgencyFilter === 'high') {
        if (itemUrgency !== 'high' && itemUrgency !== 'urgent') return false;
      } else if (urgencyFilter === 'moderate') {
        if (itemUrgency !== 'moderate' && itemUrgency !== 'standard') return false;
      } else if (urgencyFilter === 'low') {
        if (itemUrgency !== 'low') return false;
      }
    }

    // 4. Status Filter
    if (statusFilter !== 'all') {
      const s = (item.status || '').toLowerCase();
      if (statusFilter === 'active_open') {
        const isOpen = s === 'open' || s === 'active' || s === 'action_underway' || s === 'active_need' || s === 'available';
        if (!isOpen) return false;
      } else if (statusFilter === 'in_progress') {
        const isProgress = s === 'in_progress' || s === 'matched' || s === 'investigating' || s === 'coordinating' || s === 'on_loan';
        if (!isProgress) return false;
      } else if (statusFilter === 'resolved') {
        const isResolved = s === 'resolved' || s === 'fulfilled' || s === 'closed' || s === 'contained';
        if (!isResolved) return false;
      }
    }

    // 5. Neighborhood / Location Filter
    if (locationFilter !== 'all') {
      const locStr = `${item.location?.neighborhood || ''} ${item.location?.address || ''} ${item.address || ''}`.toLowerCase();
      if (!locStr.includes(locationFilter.toLowerCase())) return false;
    }

    // 6. Evidence & Verification Filter
    if (evidenceFilter !== 'all') {
      const hasEv = Boolean((item.evidenceIds && item.evidenceIds.length > 0) || (item.evidence && item.evidence.length > 0));
      const hasDisp = Boolean((item.disputeIds && item.disputeIds.length > 0) || item.status === 'disputed' || item.hasDisputes);
      const isVer = Boolean(item.isVerified || item.status === 'verified' || item.provenanceChain?.length > 0);

      if (evidenceFilter === 'has_evidence' && !hasEv) return false;
      if (evidenceFilter === 'verified' && !isVer) return false;
      if (evidenceFilter === 'has_disputes' && !hasDisp) return false;
    }

    // 7. Topic / Specific Domain Filter
    if (topicFilter !== 'all') {
      const cat = (item.category || item.contributionType || item.hazardType || '').toLowerCase();
      if (cat !== topicFilter.toLowerCase()) return false;
    }

    // 8. Time / Recency Filter
    if (timeFilter !== 'all') {
      const timeStr = (item.timestamp || item.created_at || item.createdAt || item.date || '').toLowerCase();
      if (timeFilter === 'today') {
        const isToday = timeStr.includes('min') || timeStr.includes('hour') || timeStr.includes('today') || timeStr.includes('just now');
        if (!isToday) return false;
      } else if (timeFilter === 'week') {
        const isWeek = timeStr.includes('min') || timeStr.includes('hour') || timeStr.includes('day') || timeStr.includes('yesterday') || timeStr.includes('today');
        if (!isWeek) return false;
      }
    }

    return true;
  }, [categoryFilter, categoryMap, filterQuery, urgencyFilter, statusFilter, locationFilter, evidenceFilter, topicFilter, timeFilter]);

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    const list = allItems.filter(item => matchesItemFilter(item, item.entityType));

    if (sortBy === 'urgency') {
      const urgencyRank = { critical: 4, urgent: 3, high: 3, moderate: 2, standard: 1, low: 0 };
      list.sort((a, b) => {
        const rankA = urgencyRank[a.severity] || urgencyRank[a.urgency] || 0;
        const rankB = urgencyRank[b.severity] || urgencyRank[b.urgency] || 0;
        return rankB - rankA;
      });
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [allItems, matchesItemFilter, sortBy]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (filterQuery.trim()) count++;
    if (urgencyFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (locationFilter !== 'all') count++;
    if (evidenceFilter !== 'all') count++;
    if (topicFilter !== 'all') count++;
    if (timeFilter !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [categoryFilter, filterQuery, urgencyFilter, statusFilter, locationFilter, evidenceFilter, topicFilter, timeFilter, sortBy]);

  const resetAllFilters = () => {
    setCategoryFilter('all');
    setFilterQuery('');
    setUrgencyFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setEvidenceFilter('all');
    setTopicFilter('all');
    setTimeFilter('all');
    setSortBy('newest');
    setActiveSubMenu(null);
  };

  // Quick Preset Toggles
  const isUrgentOnly = urgencyFilter === 'urgent_only';
  const toggleUrgentOnly = () => setUrgencyFilter(prev => prev === 'urgent_only' ? 'all' : 'urgent_only');

  const hasEvidenceOnly = evidenceFilter === 'has_evidence';
  const toggleEvidenceOnly = () => setEvidenceFilter(prev => prev === 'has_evidence' ? 'all' : 'has_evidence');

  const isOpenNeedsOnly = statusFilter === 'active_open';
  const toggleOpenNeeds = () => setStatusFilter(prev => prev === 'active_open' ? 'all' : 'active_open');

  const isVerifiedOnly = evidenceFilter === 'verified';
  const toggleVerifiedOnly = () => setEvidenceFilter(prev => prev === 'verified' ? 'all' : 'verified');

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems,
    setPage,
    setPageSize,
    resetPage
  } = usePagination(filteredAndSortedItems, 6);

  // Reset page to 1 whenever any filter or sort changes
  useEffect(() => {
    resetPage();
  }, [categoryFilter, filterQuery, urgencyFilter, statusFilter, locationFilter, evidenceFilter, topicFilter, timeFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectFromMap = useCallback((item, type, group = null) => {
    setSelectedEntity({ item, type });
    if (group) {
      setSelectedGroup(group);
    } else {
      setSelectedGroup(prev => {
        if (prev?.items?.some(x => x.item?.id === item?.id)) return prev;
        return null;
      });
    }
  }, [setSelectedEntity]);

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
    if (group?.items?.length > 0) {
      setSelectedEntity(group.items[0]);
    }
  }, [setSelectedEntity]);

  const selectedGroupIndex = useMemo(() => {
    if (!selectedGroup?.items?.length || !selectedEntity?.item?.id) return 0;
    const idx = selectedGroup.items.findIndex(x => x.item?.id === selectedEntity.item.id);
    return idx >= 0 ? idx : 0;
  }, [selectedGroup, selectedEntity]);

  const handleNextInSelectedGroup = useCallback(() => {
    if (!selectedGroup?.items?.length) return;
    const nextIdx = (selectedGroupIndex + 1) % selectedGroup.items.length;
    const nextItem = selectedGroup.items[nextIdx];
    if (nextItem) {
      setSelectedEntity(nextItem);
    }
  }, [selectedGroup, selectedGroupIndex, setSelectedEntity]);

  const handlePrevInSelectedGroup = useCallback(() => {
    if (!selectedGroup?.items?.length) return;
    const prevIdx = (selectedGroupIndex - 1 + selectedGroup.items.length) % selectedGroup.items.length;
    const prevItem = selectedGroup.items[prevIdx];
    if (prevItem) {
      setSelectedEntity(prevItem);
    }
  }, [selectedGroup, selectedGroupIndex, setSelectedEntity]);

  const getEntityIcon = (type) => {
    switch (type) {
      case 'safety':
        return <ShieldAlert size={14} className="text-rose" />;
      case 'request':
        return <HandHeart size={14} className="text-amber" />;
      case 'resource':
        return <Package size={14} className="text-brand" />;
      case 'observation':
      default:
        return <Eye size={14} className="text-blue-500" />;
    }
  };

  const getEntityTypeBadgeClass = (type) => {
    switch (type) {
      case 'safety':
        return 'badge-rose';
      case 'request':
        return 'badge-amber';
      case 'resource':
        return 'badge-brand';
      case 'observation':
      default:
        return 'badge-primary';
    }
  };

  const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'list'

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header & Controls */}
      <div className="d-flex align-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">Explore World & Local Situations</h2>
          <p className="text-xs text-muted d-none d-sm-block">
            The real-world information layer: People + Places + Observations + Evidence + Challenges + Resources + Actions
          </p>
        </div>

        {/* Desktop View Mode Toggle */}
        <div className="d-flex gap-2 align-center flex-wrap">
          {/* Mobile Segmented Toggle (Only visible on mobile screens <= 768px) */}
          <div className="d-flex d-md-none p-1 card w-100" style={{ borderRadius: 'var(--radius-full)', background: 'var(--bg-muted)' }}>
            <button
              type="button"
              className={`btn btn-sm flex-1 ${mobileTab === 'map' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', padding: '0.4rem' }}
              onClick={() => setMobileTab('map')}
            >
              <MapIcon size={14} />
              <span>Map View</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm flex-1 ${mobileTab === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem', padding: '0.4rem' }}
              onClick={() => setMobileTab('list')}
            >
              <List size={14} />
              <span>List ({filteredAndSortedItems.length})</span>
            </button>
          </div>

          {/* Desktop/Tablet Segmented Toggle */}
          <div className="d-none d-md-flex p-1 card" style={{ borderRadius: 'var(--radius-md)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('split')}
              title="Split Map and List"
            >
              <Layers size={14} />
              <span>Split View</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'map_only' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('map_only')}
              title="Full Map"
            >
              <MapIcon size={14} />
              <span>Map Only</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list_only' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list_only')}
              title="List Directory"
            >
              <List size={14} />
              <span>List Only</span>
            </button>
          </div>

          <button
            className="btn btn-primary btn-sm d-none d-md-flex"
            onClick={() => openCreateModal('observation')}
          >
            <Eye size={14} />
            <span>Pin Report</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout */}
      <div className="explore-layout-grid">
        {/* Map Column (Hidden on mobile if user switched to List tab) */}
        {viewMode !== 'list_only' && (
          <div className={`d-flex flex-column gap-2 ${mobileTab === 'list' ? 'd-none d-md-flex' : ''}`} style={{ position: 'sticky', top: '72px' }}>
            <CareMeshMap 
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectFromMap}
              selectedGroup={selectedGroup}
              onSelectGroup={handleSelectGroup}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              filterQuery={filterQuery}
              filterPredicate={matchesItemFilter}
              initialWorldView={isWorldView}
              height={viewMode === 'map_only' ? '750px' : '600px'}
            />
          </div>
        )}

        {/* List / Context Inspector Column */}
        {viewMode !== 'map_only' && (
          <div className={`d-flex flex-column gap-3 ${mobileTab === 'map' ? 'd-none d-md-flex' : ''}`}>
            {/* Category Filter Pills (when Map is hidden in list_only mode) */}
            {viewMode === 'list_only' && (
              <div className="d-flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'safety', label: 'Safety Hazards' },
                  { id: 'requests', label: 'Help Requests' },
                  { id: 'resources', label: 'Available Resources' },
                  { id: 'observations', label: 'Observations' }
                ].map(b => (
                  <button
                    key={b.id}
                    className={`btn btn-sm ${categoryFilter === b.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCategoryFilter(b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            {/* Filter Search & Add Filter Toolbar */}
            <div className="d-flex flex-column gap-2">
              <div className="d-flex gap-2 align-center flex-wrap">
                {/* Search Text Input */}
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Search size={15} className="text-muted" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="text"
                    placeholder="Filter situations & pins by keyword, place, or type..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '34px', paddingRight: filterQuery ? '34px' : '12px', fontSize: '0.85rem' }}
                  />
                  {filterQuery && (
                    <button
                      type="button"
                      className="btn-icon btn-sm text-muted"
                      onClick={() => setFilterQuery('')}
                      style={{ position: 'absolute', right: '8px', top: '7px' }}
                      title="Clear search text"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* + Add Filter Popover Menu Container */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${isAddFilterMenuOpen ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1.5`}
                    onClick={() => {
                      setIsAddFilterMenuOpen(!isAddFilterMenuOpen);
                      setActiveSubMenu(null);
                    }}
                    title="Add more filters (Urgency, Status, Area, Evidence, Topic, Recency, Sort)"
                  >
                    <Plus size={14} />
                    <span>Add Filter</span>
                    <ChevronDown size={13} style={{ transform: isAddFilterMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {/* Popover Dropdown */}
                  {isAddFilterMenuOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                        onClick={() => {
                          setIsAddFilterMenuOpen(false);
                          setActiveSubMenu(null);
                        }} 
                      />
                      <div 
                        className="card p-2 shadow-lg animate-fade-in"
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          right: 0,
                          width: '280px',
                          maxHeight: '380px',
                          overflowY: 'auto',
                          zIndex: 999,
                          border: '1px solid var(--border-light)',
                          boxShadow: 'var(--shadow-lg)',
                          background: 'var(--bg-card, #ffffff)'
                        }}
                      >
                        {activeSubMenu === null ? (
                          <div className="d-flex flex-column gap-1">
                            <div className="px-2 py-1 text-xs font-bold text-muted border-bottom text-uppercase">
                              Select Filter Dimension
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('urgency')}
                            >
                              <span className="d-flex align-center gap-2">
                                <Flame size={14} className="text-rose" />
                                <span>Urgency & Severity</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('status')}
                            >
                              <span className="d-flex align-center gap-2">
                                <Check size={14} className="text-amber" />
                                <span>Status & Progress</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('location')}
                            >
                              <span className="d-flex align-center gap-2">
                                <MapPin size={14} className="text-brand" />
                                <span>Neighborhood / District</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('evidence')}
                            >
                              <span className="d-flex align-center gap-2">
                                <ShieldCheck size={14} className="text-purple" />
                                <span>Evidence & Proof</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('topic')}
                            >
                              <span className="d-flex align-center gap-2">
                                <Tag size={14} className="text-primary" />
                                <span>Domain / Topic</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('time')}
                            >
                              <span className="d-flex align-center gap-2">
                                <Clock size={14} className="text-muted" />
                                <span>Timeframe / Recency</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-left d-flex align-center justify-between w-100 py-1.5"
                              onClick={() => setActiveSubMenu('sort')}
                            >
                              <span className="d-flex align-center gap-2">
                                <ArrowUpDown size={14} className="text-primary" />
                                <span>Sort Order</span>
                              </span>
                              <ChevronRight size={14} className="text-muted" />
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-brand d-flex align-center gap-1 mb-1 font-semibold"
                              onClick={() => setActiveSubMenu(null)}
                            >
                              <span>← Back to all filters</span>
                            </button>

                            {/* Urgency Submenu */}
                            {activeSubMenu === 'urgency' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Urgency</div>
                                {[
                                  { id: 'urgent_only', label: '🚨 Critical & Urgent' },
                                  { id: 'critical', label: '🔴 Critical Only' },
                                  { id: 'high', label: '🟠 High Only' },
                                  { id: 'moderate', label: '🟡 Moderate Only' },
                                  { id: 'low', label: '🟢 Standard / Low' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm text-left py-1.5 ${urgencyFilter === opt.id ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => {
                                      setUrgencyFilter(opt.id);
                                      setIsAddFilterMenuOpen(false);
                                      setActiveSubMenu(null);
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* Status Submenu */}
                            {activeSubMenu === 'status' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Status</div>
                                {[
                                  { id: 'active_open', label: '🟢 Open & Active Needs' },
                                  { id: 'in_progress', label: '🟡 In Progress / Matched' },
                                  { id: 'resolved', label: '🔵 Resolved / Fulfilled' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm text-left py-1.5 ${statusFilter === opt.id ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => {
                                      setStatusFilter(opt.id);
                                      setIsAddFilterMenuOpen(false);
                                      setActiveSubMenu(null);
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* Location Submenu */}
                            {activeSubMenu === 'location' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Neighborhood / Area</div>
                                {distinctNeighborhoods.length === 0 ? (
                                  <span className="text-xs text-muted p-2">No locations recorded yet</span>
                                ) : (
                                  distinctNeighborhoods.map(hood => (
                                    <button
                                      key={hood}
                                      type="button"
                                      className={`btn btn-sm text-left py-1.5 ${locationFilter === hood ? 'btn-primary' : 'btn-ghost'}`}
                                      onClick={() => {
                                        setLocationFilter(hood);
                                        setIsAddFilterMenuOpen(false);
                                        setActiveSubMenu(null);
                                      }}
                                    >
                                      📍 {hood}
                                    </button>
                                  ))
                                )}
                              </>
                            )}

                            {/* Evidence Submenu */}
                            {activeSubMenu === 'evidence' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Evidence State</div>
                                {[
                                  { id: 'has_evidence', label: '🔬 Has Attached Evidence' },
                                  { id: 'verified', label: '🛡️ Verified by Community' },
                                  { id: 'has_disputes', label: '⚖️ Has Active Deliberations' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm text-left py-1.5 ${evidenceFilter === opt.id ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => {
                                      setEvidenceFilter(opt.id);
                                      setIsAddFilterMenuOpen(false);
                                      setActiveSubMenu(null);
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* Topic Submenu */}
                            {activeSubMenu === 'topic' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Domain Topic</div>
                                {distinctTopics.length === 0 ? (
                                  <span className="text-xs text-muted p-2">No topics recorded yet</span>
                                ) : (
                                  distinctTopics.map(topic => (
                                    <button
                                      key={topic}
                                      type="button"
                                      className={`btn btn-sm text-left py-1.5 text-capitalize ${topicFilter === topic ? 'btn-primary' : 'btn-ghost'}`}
                                      onClick={() => {
                                        setTopicFilter(topic);
                                        setIsAddFilterMenuOpen(false);
                                        setActiveSubMenu(null);
                                      }}
                                    >
                                      🏷️ {topic.replace(/_/g, ' ')}
                                    </button>
                                  ))
                                )}
                              </>
                            )}

                            {/* Time Submenu */}
                            {activeSubMenu === 'time' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Timeframe</div>
                                {[
                                  { id: 'today', label: '⏱️ Past 24 Hours' },
                                  { id: 'week', label: '⏱️ Past 7 Days' },
                                  { id: 'month', label: '⏱️ Past 30 Days' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm text-left py-1.5 ${timeFilter === opt.id ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => {
                                      setTimeFilter(opt.id);
                                      setIsAddFilterMenuOpen(false);
                                      setActiveSubMenu(null);
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* Sort Submenu */}
                            {activeSubMenu === 'sort' && (
                              <>
                                <div className="px-2 py-1 text-xs font-bold text-muted border-bottom">Choose Sort Order</div>
                                {[
                                  { id: 'newest', label: '🕒 Most Recent First' },
                                  { id: 'urgency', label: '🚨 Highest Urgency First' },
                                  { id: 'title', label: '🔤 Title (A–Z)' }
                                ].map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`btn btn-sm text-left py-1.5 ${sortBy === opt.id ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => {
                                      setSortBy(opt.id);
                                      setIsAddFilterMenuOpen(false);
                                      setActiveSubMenu(null);
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Multi-Filter Drawer Toggle Button */}
                <button
                  type="button"
                  className={`btn btn-sm ${isFilterPanelExpanded ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1.5`}
                  onClick={() => setIsFilterPanelExpanded(!isFilterPanelExpanded)}
                  title="Toggle all filter controls panel"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span 
                      className="badge text-xs" 
                      style={{ 
                        background: isFilterPanelExpanded ? '#ffffff' : 'var(--primary-600)', 
                        color: isFilterPanelExpanded ? 'var(--primary-700)' : '#ffffff',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.72rem'
                      }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick 1-Click Preset Filter Pills */}
              <div className="touch-scroll-x gap-1.5 py-1">
                <button
                  type="button"
                  className={`btn btn-xs ${isUrgentOnly ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={toggleUrgentOnly}
                  title="Filter by critical and urgent situations"
                >
                  <Flame size={12} className={isUrgentOnly ? 'text-white' : 'text-rose'} />
                  <span>Critical / Urgent</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${hasEvidenceOnly ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={toggleEvidenceOnly}
                  title="Filter for situations with attached field evidence"
                >
                  <ShieldCheck size={12} className={hasEvidenceOnly ? 'text-white' : 'text-brand'} />
                  <span>With Evidence</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${isOpenNeedsOnly ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={toggleOpenNeeds}
                  title="Filter for active, open needs awaiting response"
                >
                  <Check size={12} />
                  <span>Open Needs</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${isVerifiedOnly ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={toggleVerifiedOnly}
                  title="Filter for community verified records"
                >
                  <ShieldCheck size={12} />
                  <span>Verified Records</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${categoryFilter === 'safety' ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={() => setCategoryFilter(prev => prev === 'safety' ? 'all' : 'safety')}
                  title="Show safety hazard alerts"
                >
                  <ShieldAlert size={12} />
                  <span>Safety Alerts</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${categoryFilter === 'resources' ? 'btn-primary' : 'btn-secondary'} d-flex align-center gap-1`}
                  onClick={() => setCategoryFilter(prev => prev === 'resources' ? 'all' : 'resources')}
                  title="Show available community resources"
                >
                  <Package size={12} />
                  <span>Resources</span>
                </button>
              </div>

              {/* Expandable Detailed Filter Controls Panel */}
              {isFilterPanelExpanded && (
                <div className="card p-3 animate-fade-in" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                  <div className="d-flex align-center justify-between mb-2">
                    <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                      <SlidersHorizontal size={13} />
                      <span>Detailed Filter Controls</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-muted d-flex align-center gap-1"
                      onClick={() => setIsFilterPanelExpanded(false)}
                    >
                      <X size={13} />
                      <span>Hide Panel</span>
                    </button>
                  </div>

                  <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.65rem' }}>
                    {/* 1. Entity Type */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Entity Type</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Situations</option>
                        <option value="safety">Safety Hazards</option>
                        <option value="requests">Help Requests</option>
                        <option value="resources">Available Resources</option>
                        <option value="observations">Observations</option>
                      </select>
                    </div>

                    {/* 2. Urgency */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Urgency / Severity</label>
                      <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Urgencies</option>
                        <option value="urgent_only">Critical & Urgent</option>
                        <option value="critical">Critical Only</option>
                        <option value="high">High</option>
                        <option value="moderate">Moderate</option>
                        <option value="low">Standard / Low</option>
                      </select>
                    </div>

                    {/* 3. Status */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Status / Progress</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active_open">Open & Active</option>
                        <option value="in_progress">In Progress / Matched</option>
                        <option value="resolved">Resolved / Fulfilled</option>
                      </select>
                    </div>

                    {/* 4. Neighborhood */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Neighborhood / Area</label>
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Neighborhoods</option>
                        {distinctNeighborhoods.map(hood => (
                          <option key={hood} value={hood}>{hood}</option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Evidence */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Evidence & Proof</label>
                      <select
                        value={evidenceFilter}
                        onChange={(e) => setEvidenceFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Evidence States</option>
                        <option value="has_evidence">Has Attached Evidence</option>
                        <option value="verified">Verified by Community</option>
                        <option value="has_disputes">Has Deliberations</option>
                      </select>
                    </div>

                    {/* 6. Topic */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Topic / Domain</label>
                      <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1 text-capitalize"
                      >
                        <option value="all">All Topics</option>
                        {distinctTopics.map(topic => (
                          <option key={topic} value={topic}>{topic.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {/* 7. Timeframe */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Timeframe</label>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Past 24 Hours</option>
                        <option value="week">Past 7 Days</option>
                        <option value="month">Past 30 Days</option>
                      </select>
                    </div>

                    {/* 8. Sort */}
                    <div>
                      <label className="text-xs text-muted font-semibold d-block mb-1">Sort Order</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-select w-100 text-xs py-1"
                      >
                        <option value="newest">Most Recent</option>
                        <option value="urgency">Highest Urgency</option>
                        <option value="title">Title (A–Z)</option>
                      </select>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="d-flex justify-end pt-2 mt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
                        onClick={resetAllFilters}
                      >
                        <RotateCcw size={12} />
                        <span>Reset All Filters</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Filter Chips Bar */}
              {activeFiltersCount > 0 && (
                <div className="d-flex align-center gap-1.5 flex-wrap text-xs p-2 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                  <span className="text-muted font-bold d-flex align-center gap-1 mr-1">
                    <Filter size={12} />
                    <span>Active Filters ({activeFiltersCount}):</span>
                  </span>

                  {categoryFilter !== 'all' && (
                    <span className="badge badge-primary d-flex align-center gap-1 text-capitalize">
                      <span>Type: {categoryFilter}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setCategoryFilter('all')} title="Remove category filter" />
                    </span>
                  )}

                  {urgencyFilter !== 'all' && (
                    <span className="badge badge-rose d-flex align-center gap-1">
                      <Flame size={10} />
                      <span>Urgency: {urgencyFilter.replace('_', ' ')}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setUrgencyFilter('all')} title="Remove urgency filter" />
                    </span>
                  )}

                  {statusFilter !== 'all' && (
                    <span className="badge badge-amber d-flex align-center gap-1 text-capitalize">
                      <Check size={10} />
                      <span>Status: {statusFilter.replace('_', ' ')}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setStatusFilter('all')} title="Remove status filter" />
                    </span>
                  )}

                  {locationFilter !== 'all' && (
                    <span className="badge badge-secondary d-flex align-center gap-1">
                      <MapPin size={10} />
                      <span>Area: {locationFilter}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setLocationFilter('all')} title="Remove location filter" />
                    </span>
                  )}

                  {evidenceFilter !== 'all' && (
                    <span className="badge badge-purple d-flex align-center gap-1 text-capitalize">
                      <ShieldCheck size={10} />
                      <span>Evidence: {evidenceFilter.replace('_', ' ')}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setEvidenceFilter('all')} title="Remove evidence filter" />
                    </span>
                  )}

                  {topicFilter !== 'all' && (
                    <span className="badge badge-gray d-flex align-center gap-1 text-capitalize">
                      <Tag size={10} />
                      <span>Topic: {topicFilter.replace(/_/g, ' ')}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setTopicFilter('all')} title="Remove topic filter" />
                    </span>
                  )}

                  {timeFilter !== 'all' && (
                    <span className="badge badge-gray d-flex align-center gap-1 text-capitalize">
                      <Clock size={10} />
                      <span>Time: {timeFilter === 'today' ? 'Past 24h' : timeFilter === 'week' ? 'Past 7 Days' : 'Past 30 Days'}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setTimeFilter('all')} title="Remove time filter" />
                    </span>
                  )}

                  {filterQuery && (
                    <span className="badge badge-secondary d-flex align-center gap-1">
                      <span>Query: &quot;{filterQuery}&quot;</span>
                      <X size={12} className="cursor-pointer" onClick={() => setFilterQuery('')} title="Remove search query" />
                    </span>
                  )}

                  {sortBy !== 'newest' && (
                    <span className="badge badge-gray d-flex align-center gap-1 text-capitalize">
                      <ArrowUpDown size={10} />
                      <span>Sort: {sortBy}</span>
                      <X size={12} className="cursor-pointer" onClick={() => setSortBy('newest')} title="Reset sort order" />
                    </span>
                  )}

                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1 ml-auto font-medium"
                    onClick={resetAllFilters}
                    title="Reset all filters"
                  >
                    <RotateCcw size={11} />
                    <span>Reset All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selected Group Context Drawer (When cluster or co-located group clicked) */}
            {selectedGroup && (
              <div 
                className="card p-2.5 p-md-3 animate-fade-in"
                style={{ 
                  border: '1.5px solid var(--primary-500)', 
                  background: 'rgba(2, 132, 199, 0.04)',
                  position: 'relative',
                  borderRadius: '10px'
                }}
              >
                {/* Header */}
                <div className="d-flex align-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="d-flex align-center gap-1.5 flex-wrap">
                    <span className="badge badge-brand text-xs font-bold d-flex align-center gap-1" style={{ padding: '2px 7px', fontSize: '0.68rem' }}>
                      <Layers size={11} />
                      <span>Group: {selectedGroup.groupType === 'cluster' ? 'Cluster' : 'Co-located Site'} ({selectedGroup.items?.length || 0})</span>
                    </span>
                    {selectedGroup.hasHazard && (
                      <span className="badge badge-rose text-xs font-bold d-flex align-center gap-1" style={{ padding: '2px 7px', fontSize: '0.68rem' }}>
                        <ShieldAlert size={11} />
                        <span>Hazard Included</span>
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-center gap-1">
                    {/* Stepper buttons */}
                    {selectedGroup.items?.length > 1 && (
                      <div className="d-flex align-center gap-1 mr-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '1px 5px' }}>
                        <button 
                          type="button"
                          className="btn btn-ghost btn-xs p-0.5"
                          onClick={handlePrevInSelectedGroup}
                          title="Previous activity in group"
                          style={{ padding: '1px 3px' }}
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <span className="text-xs font-bold text-muted" style={{ minWidth: '32px', textAlign: 'center', fontSize: '0.68rem' }}>
                          {selectedGroupIndex + 1} / {selectedGroup.items.length}
                        </span>
                        <button 
                          type="button"
                          className="btn btn-ghost btn-xs p-0.5"
                          onClick={handleNextInSelectedGroup}
                          title="Next activity in group"
                          style={{ padding: '1px 3px' }}
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="btn-icon btn-xs text-muted" 
                      onClick={() => setSelectedGroup(null)}
                      title="Dismiss group"
                      style={{ width: '20px', height: '20px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-primary mb-0.5 text-truncate" title={selectedGroup.title}>
                  {selectedGroup.title || 'Clustered Mutual Aid Activities'}
                </h3>
                {selectedGroup.address && (
                  <p className="text-xs text-muted mb-2 d-flex align-center gap-1 text-truncate" style={{ fontSize: '0.72rem' }}>
                    <MapPin size={11} /> <span className="text-truncate">{selectedGroup.address}</span>
                  </p>
                )}

                {/* List of Mutual Aid Activities clustered in this group */}
                <div className="d-flex flex-column gap-1" style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '2px' }}>
                  {selectedGroup.items?.map((entry, idx) => {
                    const item = entry.item;
                    const type = entry.type;
                    if (!item) return null;
                    const isItemActive = selectedEntity?.item?.id === item.id;

                    return (
                      <div 
                        key={`grp_item_${item.id || idx}`}
                        className="p-1.5 px-2 rounded card-interactive cursor-pointer d-flex align-center justify-between gap-2"
                        style={{
                          background: isItemActive ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
                          border: isItemActive ? '1.5px solid var(--primary-500)' : '1px solid var(--border-light)',
                          borderRadius: '6px'
                        }}
                        onClick={() => setSelectedEntity({ item, type })}
                      >
                        <div className="d-flex align-center gap-1.5 text-truncate flex-1">
                          <span className="d-flex align-center">
                            {getEntityIcon(type)}
                          </span>
                          <span className={`badge ${getEntityTypeBadgeClass(type)} text-xs font-bold text-uppercase`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                            {type}
                          </span>
                          <span className="font-semibold text-xs text-primary text-truncate" style={{ fontSize: '0.74rem', maxWidth: '170px' }} title={item.title}>
                            {item.title}
                          </span>
                          {item.urgency && <UrgencyBadge urgency={item.urgency} />}
                          {item.severity && <SeverityBadge severity={item.severity} />}
                        </div>

                        <div className="d-flex align-center gap-1 ml-auto flex-shrink-0">
                          {isItemActive ? (
                            <span className="badge badge-primary text-xs font-bold" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                              Active Pin
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-brand font-medium"
                              style={{ fontSize: '0.68rem', padding: '2px 5px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntity({ item, type });
                              }}
                            >
                              Select Pin
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            style={{ fontSize: '0.68rem', padding: '2px 5px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              inspectEntity(item, type);
                            }}
                            title="Inspect details"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Pin Context Drawer (Detail card for currently selected individual pin) */}
            {selectedEntity && (
              <div 
                className="card p-2.5 p-md-3 animate-fade-in" 
                style={{ 
                  border: '1.5px solid var(--primary-500)', 
                  background: 'var(--primary-50)',
                  position: 'relative',
                  borderRadius: '10px'
                }}
              >
                <div className="d-flex align-center justify-between mb-1.5">
                  <div className="d-flex align-center gap-1.5 flex-wrap">
                    <span className="badge badge-primary text-xs text-uppercase font-bold" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      Selected Pin: {selectedEntity.type}
                    </span>
                    {selectedEntity.item.isContradiction && (
                      <span className="badge badge-rose text-xs font-bold" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>Contradictory Report</span>
                    )}
                    {selectedEntity.item.urgency && <UrgencyBadge urgency={selectedEntity.item.urgency} />}
                    {selectedEntity.item.severity && <SeverityBadge severity={selectedEntity.item.severity} />}
                  </div>
                  <button 
                    type="button" 
                    className="btn-icon btn-xs text-muted" 
                    onClick={() => {
                      setSelectedEntity(null);
                      if (!selectedGroup) setSelectedGroup(null);
                    }}
                    title="Dismiss selected pin"
                    style={{ width: '20px', height: '20px' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-primary mb-1 text-truncate" title={selectedEntity.item.title}>
                  {selectedEntity.item.title}
                </h3>
                <p 
                  className="text-xs text-secondary mb-2"
                  style={{
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {selectedEntity.item.description}
                </p>

                <div className="d-flex align-center gap-2 text-xs text-muted mb-2 flex-wrap" style={{ fontSize: '0.72rem' }}>
                  <span className="d-flex align-center gap-1 text-truncate">
                    <MapPin size={11} /> <span className="text-truncate">{selectedEntity.item.location?.address || 'Site coordinate'}</span>
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-xs flex-1"
                    style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                    onClick={() => inspectEntity(selectedEntity.item, selectedEntity.type)}
                  >
                    <span>Inspect Provenance & Context</span>
                    <ChevronRight size={13} />
                  </button>
                  {selectedEntity.type === 'observation' && (
                    <button
                      className="btn btn-secondary btn-xs"
                      style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                      onClick={() => openShareSocialModal(selectedEntity.item, 'observation')}
                    >
                      <Share2 size={12} />
                      <span>Share</span>
                    </button>
                  )}
                </div>

                {/* Co-located Activities list: When multiple activities share exact coordinates AND group drawer is not already open */}
                {!selectedGroup && coLocatedWithSelected.length > 0 && (
                  <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px dashed rgba(2, 132, 199, 0.3)' }}>
                    <div className="d-flex align-center justify-between mb-1.5 flex-wrap gap-1">
                      <span className="font-bold text-xs text-primary d-flex align-center gap-1" style={{ fontSize: '0.72rem' }}>
                        <span>📍</span>
                        <span>{coLocatedWithSelected.length} Other Activities at site</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs font-medium text-brand"
                        style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                        onClick={() => {
                          const allGroupItems = [
                            { item: selectedEntity.item, type: selectedEntity.type },
                            ...coLocatedWithSelected.map(c => ({ item: c, type: c.entityType }))
                          ];
                          handleSelectGroup({
                            id: `colocated_${selectedEntity.item.id}`,
                            groupType: 'co_located',
                            title: `Site Group: ${allGroupItems.length} Activities`,
                            address: selectedEntity.item.location?.address || 'Shared location',
                            coordinate: [selectedEntity.item.location?.lat, selectedEntity.item.location?.lng],
                            items: allGroupItems,
                            hasHazard: allGroupItems.some(x => x.type === 'safety' || x.item?.severity === 'critical'),
                            hazardCount: allGroupItems.filter(x => x.type === 'safety').length
                          });
                        }}
                      >
                        View All as Group ({coLocatedWithSelected.length + 1})
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-1" style={{ maxHeight: '130px', overflowY: 'auto' }}>
                      {coLocatedWithSelected.map(coItem => (
                        <div 
                          key={`coloc_${coItem.id}`}
                          className="d-flex align-center justify-between gap-1.5 p-1.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid var(--border-light)' }}
                        >
                          <div className="d-flex align-center gap-1.5 text-truncate flex-1">
                            {getEntityIcon(coItem.entityType)}
                            <span className={`badge ${getEntityTypeBadgeClass(coItem.entityType)} text-xs font-bold text-uppercase`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                              {coItem.entityType}
                            </span>
                            <span className="text-xs font-medium text-truncate" style={{ fontSize: '0.72rem', maxWidth: '160px' }} title={coItem.title}>
                              {coItem.title}
                            </span>
                          </div>
                          <div className="d-flex align-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-brand font-medium"
                              style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                              onClick={() => setSelectedEntity({ item: coItem, type: coItem.entityType })}
                            >
                              Switch Pin
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                              onClick={() => inspectEntity(coItem, coItem.entityType)}
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            <div className="d-flex align-center justify-between text-xs text-muted">
              <span>
                Showing <b>{totalItems > 0 ? `${startIndex}–${endIndex}` : '0'}</b> of <b>{totalItems}</b> {categoryFilter !== 'all' ? categoryFilter : 'records'}
              </span>
              <span className="text-brand font-medium">1:1 synchronized with map</span>
            </div>

            <div className="d-flex flex-column gap-2" style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
              {paginatedItems.length === 0 ? (
                <div className="card p-4 text-center text-muted d-flex flex-column align-center justify-center gap-2" style={{ background: 'var(--bg-subtle)' }}>
                  <Filter size={24} className="text-muted" />
                  <span className="font-semibold text-sm text-primary">No situations match your current filter criteria</span>
                  <span className="text-xs">Try adjusting your keyword query, clearing some filter dimensions, or resetting filters.</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-1"
                    onClick={resetAllFilters}
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                paginatedItems.map(item => {
                const contraCount = item.contradictoryObservationIds?.length || 0;
                const isSelected = selectedEntity?.item?.id === item.id;

                return (
                  <div
                    key={`${item.entityType}_${item.id}`}
                    className="card p-2 card-interactive cursor-pointer"
                    style={{
                      borderLeft: item.isContradiction ? '4px solid var(--rose-600)' :
                                  item.entityType === 'safety' ? '4px solid var(--rose-600)' :
                                  item.entityType === 'request' ? '4px solid var(--amber-500)' :
                                  item.entityType === 'resource' ? '4px solid var(--primary-500)' : '4px solid var(--blue-500)',
                      background: isSelected ? 'var(--primary-50, #f0f9ff)' : (item.isContradiction ? '#fff9f9' : '#ffffff'),
                      boxShadow: isSelected ? '0 0 0 2px var(--primary-500), var(--shadow-sm)' : 'var(--shadow-sm)',
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedEntity({ item, type: item.entityType })}
                  >
                    <div className="d-flex align-center justify-between mb-1 flex-wrap gap-1">
                      <div className="d-flex align-center gap-1.5 flex-wrap">
                        <span className="badge badge-gray text-xs text-uppercase font-semibold" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                          {item.entityType}
                        </span>
                        {item.isContradiction && (
                          <span className="badge badge-rose text-xs font-bold" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>Contradictory Report</span>
                        )}
                        {item.urgency && <UrgencyBadge urgency={item.urgency} />}
                        {item.severity && <SeverityBadge severity={item.severity} />}
                        {item.contributionType && <ResourceTypeBadge type={item.contributionType} />}
                        {item.communityId && item.entityType === 'request' && (() => {
                          const comm = communities?.find(c => c.id === item.communityId);
                          return (
                            <span 
                              className={`badge text-xs d-inline-flex align-center gap-1 ${item.visibility === 'group_only' ? 'badge-primary' : 'badge-gray'}`}
                              style={{
                                fontSize: '0.62rem',
                                padding: '1px 5px',
                                ...(item.visibility === 'group_only' ? { backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : {})
                              }}
                              title={item.visibility === 'group_only' ? `Visible only to members of ${comm?.name || 'Group'}` : `Linked to ${comm?.name || 'Group'}`}
                            >
                              {item.visibility === 'group_only' ? <Lock size={9} /> : <Globe size={9} />}
                              {comm ? comm.name : 'Community'}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>{item.timestamp || item.createdAt || item.date}</span>
                    </div>

                    <h4 className="font-bold text-xs text-primary mb-0.5 text-truncate" title={item.title}>{item.title}</h4>
                    <p 
                      className="text-xs text-secondary mb-1.5" 
                      style={{ 
                        fontSize: '0.74rem', 
                        lineHeight: '1.35', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}
                    >
                      {item.description}
                    </p>

                    {contraCount > 0 && (
                      <div className="mb-1.5">
                        <span className="badge badge-rose text-xs d-flex align-center gap-1 font-bold" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                          <ShieldAlert size={10} />
                          <span>{contraCount} Contradictory {contraCount === 1 ? 'Report' : 'Reports'} on Record</span>
                        </span>
                      </div>
                    )}

                    <div className="d-flex align-center justify-between text-xs text-muted pt-1.5 border-top" style={{ fontSize: '0.7rem' }}>
                      <span className="d-flex align-center gap-1 text-truncate" style={{ maxWidth: '200px' }}>
                        <MapPin size={10} /> <span className="text-truncate">{item.location?.address}</span>
                      </span>
                      <button
                        className="btn btn-ghost btn-xs text-brand text-xs font-semibold p-0"
                        style={{ fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          inspectEntity(item, item.entityType);
                        }}
                      >
                        Inspect Context →
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[4, 6, 10, 20]}
                itemName={categoryFilter !== 'all' ? categoryFilter : 'records'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
