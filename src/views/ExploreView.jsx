import { useState } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { CareMeshMap } from '../components/map/CareMeshMap';
import { UrgencyBadge, SeverityBadge, ResourceTypeBadge } from '../components/common/Badge';
import { 
  MapPin, 
  Layers, 
  List, 
  Map as MapIcon, 
  Search, 
  ChevronRight, 
  X, 
  Eye, 
  Share2, 
  ShieldAlert 
} from 'lucide-react';

export const ExploreView = () => {
  const {
    observations,
    safetyReports,
    requests,
    resources,
    events,
    openCreateModal,
    openShareSocialModal,
    inspectEntity
  } = useCareMesh();

  const [selectedEntity, setSelectedEntity] = useState(null); // { item, type }
  const [filterQuery, setFilterQuery] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map_only' | 'list_only'

  // Combine items for the list
  const allItems = [
    ...safetyReports.map(s => ({ ...s, entityType: 'safety' })),
    ...requests.map(r => ({ ...r, entityType: 'request' })),
    ...resources.map(res => ({ ...res, entityType: 'resource' })),
    ...observations.map(o => ({ ...o, entityType: 'observation' })),
    ...events.map(e => ({ ...e, entityType: 'event' }))
  ];

  const filteredItems = allItems.filter(item => {
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = item.location?.address?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc;
    }
    return true;
  });

  const handleSelectFromMap = (item, type) => {
    setSelectedEntity({ item, type });
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
              <span>List ({filteredItems.length})</span>
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
              onSelectEntity={handleSelectFromMap}
              height={viewMode === 'map_only' ? '700px' : '520px'}
            />
          </div>
        )}

        {/* List / Context Inspector Column */}
        {viewMode !== 'map_only' && (
          <div className={`d-flex flex-column gap-3 ${mobileTab === 'map' ? 'd-none d-md-flex' : ''}`}>
            {/* Filter Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} className="text-muted" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder="Filter map entities by keyword or place..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Selected Entity Context Drawer (If any marker clicked) */}
            {selectedEntity && (
              <div 
                className="card p-4 animate-fade-in" 
                style={{ 
                  border: '2px solid var(--primary-500)', 
                  background: 'var(--primary-50)',
                  position: 'relative'
                }}
              >
                <div className="d-flex align-center justify-between mb-2">
                  <div className="d-flex align-center gap-2 flex-wrap">
                    <span className="badge badge-primary text-xs text-uppercase font-bold">
                      Selected: {selectedEntity.type}
                    </span>
                    {selectedEntity.item.isContradiction && (
                      <span className="badge badge-rose text-xs font-bold">Contradictory Report</span>
                    )}
                    {selectedEntity.item.urgency && <UrgencyBadge urgency={selectedEntity.item.urgency} />}
                    {selectedEntity.item.severity && <SeverityBadge severity={selectedEntity.item.severity} />}
                  </div>
                  <button 
                    type="button" 
                    className="btn-icon btn-sm text-muted" 
                    onClick={() => setSelectedEntity(null)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-md text-primary mb-1">
                  {selectedEntity.item.title}
                </h3>
                <p className="text-xs text-secondary mb-3">
                  {selectedEntity.item.description}
                </p>

                <div className="d-flex align-center gap-3 text-xs text-muted mb-3 flex-wrap">
                  <span className="d-flex align-center gap-1">
                    <MapPin size={12} /> {selectedEntity.item.location?.address}
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => inspectEntity(selectedEntity.item, selectedEntity.type)}
                  >
                    <span>Inspect Provenance & Context</span>
                    <ChevronRight size={14} />
                  </button>
                  {selectedEntity.type === 'observation' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openShareSocialModal(selectedEntity.item, 'observation')}
                    >
                      <Share2 size={13} />
                      <span>Share</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="d-flex align-center justify-between text-xs text-muted">
              <span>Showing {filteredItems.length} locations & reports</span>
              <span>Challengeable peer records</span>
            </div>

            <div className="d-flex flex-column gap-3" style={{ maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredItems.map(item => {
                const contraCount = item.contradictoryObservationIds?.length || 0;

                return (
                  <div
                    key={`${item.entityType}_${item.id}`}
                    className="card p-3 card-interactive cursor-pointer"
                    style={{
                      borderLeft: item.isContradiction ? '4px solid var(--rose-600)' :
                                  item.entityType === 'safety' ? '4px solid var(--rose-600)' :
                                  item.entityType === 'request' ? '4px solid var(--amber-500)' :
                                  item.entityType === 'resource' ? '4px solid var(--primary-500)' :
                                  item.entityType === 'event' ? '4px solid var(--purple-500)' : '4px solid var(--blue-500)',
                      background: item.isContradiction ? '#fff9f9' : '#ffffff'
                    }}
                    onClick={() => setSelectedEntity({ item, type: item.entityType })}
                  >
                    <div className="d-flex align-center justify-between mb-1 flex-wrap gap-1">
                      <div className="d-flex align-center gap-2 flex-wrap">
                        <span className="badge badge-gray text-xs text-uppercase font-semibold">
                          {item.entityType}
                        </span>
                        {item.isContradiction && (
                          <span className="badge badge-rose text-xs font-bold">Contradictory Report</span>
                        )}
                        {item.urgency && <UrgencyBadge urgency={item.urgency} />}
                        {item.severity && <SeverityBadge severity={item.severity} />}
                        {item.contributionType && <ResourceTypeBadge type={item.contributionType} />}
                      </div>
                      <span className="text-xs text-muted">{item.timestamp || item.createdAt || item.date}</span>
                    </div>

                    <h4 className="font-bold text-sm text-primary mb-1">{item.title}</h4>
                    <p className="text-xs text-secondary mb-2" style={{ lineHeight: '1.4' }}>{item.description}</p>

                    {contraCount > 0 && (
                      <div className="mb-2">
                        <span className="badge badge-rose text-xs d-flex align-center gap-1 font-bold">
                          <ShieldAlert size={12} />
                          <span>{contraCount} Contradictory {contraCount === 1 ? 'Report' : 'Reports'} on Record</span>
                        </span>
                      </div>
                    )}

                    <div className="d-flex align-center justify-between text-xs text-muted pt-2 border-top">
                      <span className="d-flex align-center gap-1">
                        <MapPin size={12} /> {item.location?.address}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm text-brand text-xs font-semibold p-0"
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
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
