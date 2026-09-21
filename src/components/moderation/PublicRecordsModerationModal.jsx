import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import api from '../../api/client';
import { 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  Eye, 
  HandHeart, 
  Package, 
  CheckCircle2, 
  Image,
  Search,
  Archive,
  Clock,
  RotateCcw,
  FileText
} from 'lucide-react';

export const PublicRecordsModerationModal = () => {
  const {
    isPublicRecordsModModalOpen,
    closePublicRecordsModModal,
    currentUser,
    reports,
    resolveReport,
    observations,
    requests,
    resources
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'vault'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'observation' | 'request' | 'resource' | 'profile_picture' | 'post'
  const [actionNotes, setActionNotes] = useState({});
  const [activeActionId, setActiveActionId] = useState(null);

  // Evidence Vault state for Public Moderator
  const [vaultItems, setVaultItems] = useState([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);

  const fetchVaultItems = async () => {
    setIsVaultLoading(true);
    try {
      const data = await api.admin.getVault({ search: searchTerm });
      setVaultItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load evidence vault for public moderator:', err.message);
      setVaultItems([]);
    } finally {
      setIsVaultLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (activeTab === 'vault' && isPublicRecordsModModalOpen) {
      Promise.resolve().then(async () => {
        setIsVaultLoading(true);
        try {
          const data = await api.admin.getVault({ search: searchTerm });
          if (active) setVaultItems(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Failed to load evidence vault for public moderator:', err.message);
          if (active) setVaultItems([]);
        } finally {
          if (active) setIsVaultLoading(false);
        }
      });
    }
    return () => { active = false; };
  }, [activeTab, isPublicRecordsModModalOpen, searchTerm]);

  useEffect(() => {
    if (!isPublicRecordsModModalOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closePublicRecordsModModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isPublicRecordsModModalOpen, closePublicRecordsModModal]);

  if (!isPublicRecordsModModalOpen) return null;

  // Filter for public records reports
  const publicReports = reports.filter(r => {
    const isPublic = r.scope === 'public_records' || !r.communityId;
    if (!isPublic) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.targetType !== typeFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchReason = r.reason?.toLowerCase().includes(q);
      const matchDetails = r.details?.toLowerCase().includes(q);
      const matchReporter = r.reporter?.name?.toLowerCase().includes(q);
      const matchReported = r.reportedUser?.name?.toLowerCase().includes(q);
      const matchTitle = r.targetTitle?.toLowerCase().includes(q);
      if (!matchReason && !matchDetails && !matchReporter && !matchReported && !matchTitle) return false;
    }
    return true;
  });

  const handleResolve = async (reportId, action) => {
    const note = actionNotes[reportId] || '';
    await resolveReport(reportId, action, note);
    setActiveActionId(null);
    if (activeTab === 'vault') fetchVaultItems();
  };

  const isPublicMod = Boolean(currentUser?.isPublicModerator || currentUser?.isAdmin || currentUser?.role === 'admin');

  return (
    <div 
      className="modal-overlay" 
      onClick={closePublicRecordsModModal}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="modal-content card p-0 animate-scale-in" 
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 d-flex align-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div className="d-flex align-center gap-3">
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <div className="d-flex align-center gap-2">
                <h3 className="font-bold text-md text-white mb-0">Public Records & Integrity Moderation</h3>
                <span className="badge" style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.68rem' }}>
                  Platform Records
                </span>
              </div>
              <p className="text-xs text-white-50 mb-0" style={{ opacity: 0.75 }}>
                Adjudicate public disputes, veracity claims, and inspect community circle quarantined discussions
              </p>
            </div>
          </div>

          <div className="d-flex align-center gap-2">
            {isPublicMod && (
              <span
                className="badge btn-xs d-inline-flex align-center gap-1 font-semibold"
                style={{ fontSize: '0.72rem', background: '#0284c7', color: '#ffffff', padding: '0.25rem 0.5rem' }}
              >
                <ShieldCheck size={12} />
                <span>Moderator Active</span>
              </span>
            )}

            <button 
              type="button" 
              className="btn btn-ghost btn-sm btn-icon text-white" 
              onClick={closePublicRecordsModModal}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Access Warning if not Public Moderator */}
        {!isPublicMod ? (
          <div className="p-5 text-center d-flex flex-column align-center gap-2 my-auto">
            <ShieldAlert size={48} className="text-amber mx-auto opacity-80" />
            <h4 className="font-bold text-md text-primary mt-2 mb-1">Public Records Moderator Privilege Required</h4>
            <p className="text-xs text-muted mb-3" style={{ maxWidth: '440px' }}>
              Public Records Moderators oversee verified claims, environmental observations, and inspect quarantined evidence across community circles platform-wide.
            </p>
            <div className="p-3 bg-subtle rounded text-xs text-secondary border d-inline-flex align-center gap-2" style={{ maxWidth: '440px' }}>
              <ShieldCheck size={16} className="text-brand flex-shrink-0" />
              <span>Public Records Moderator status can only be granted by the platform System Administrator.</span>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Navigation Tabs & Global Search Bar */}
            <div className="p-3 border-bottom d-flex align-center justify-between gap-3 flex-wrap flex-shrink-0" style={{ background: 'var(--bg-subtle)' }}>
              <div className="touch-tab-nav">
                <button
                  type="button"
                  className={`btn btn-xs ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <FileText size={13} className="mr-1" />
                  Public Queue ({publicReports.filter(r => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${activeTab === 'vault' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('vault')}
                >
                  <Archive size={13} className="mr-1" />
                  Evidence Vault (Circle Quarantined Posts)
                </button>
              </div>

              {/* Search Bar */}
              <div className="position-relative" style={{ minWidth: '220px', flex: '1', maxWidth: '300px' }}>
                <Search size={13} className="text-muted position-absolute" style={{ left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input text-xs pl-4"
                  placeholder={`Search ${activeTab === 'reports' ? 'public reports' : 'evidence vault'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* TAB 1: PUBLIC REPORTS QUEUE */}
            {activeTab === 'reports' && (
              <div className="d-flex flex-column flex-1 overflow-hidden">
                {/* Filters */}
                <div className="px-3 py-2 border-bottom d-flex align-center justify-between gap-2 flex-wrap flex-shrink-0" style={{ background: '#f8fafc' }}>
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className={`btn btn-xs ${statusFilter === 'pending' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                      onClick={() => setStatusFilter('pending')}
                    >
                      Pending ({reports.filter(r => (r.scope === 'public_records' || !r.communityId) && r.status === 'pending').length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${statusFilter === 'resolved' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                      onClick={() => setStatusFilter('resolved')}
                    >
                      Resolved
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${statusFilter === 'all' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </button>
                  </div>

                  <div className="d-flex gap-1 flex-wrap">
                    <button
                      type="button"
                      className={`btn btn-xs ${typeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTypeFilter('all')}
                    >
                      All Types
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${typeFilter === 'observation' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTypeFilter('observation')}
                    >
                      Observations
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${typeFilter === 'request' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTypeFilter('request')}
                    >
                      Requests
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${typeFilter === 'resource' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTypeFilter('resource')}
                    >
                      Resources
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${typeFilter === 'profile_picture' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTypeFilter('profile_picture')}
                    >
                      Avatars
                    </button>
                  </div>
                </div>

                {/* Queue Content */}
                <div className="p-4 overflow-y-auto flex-1 d-flex flex-column gap-3">
                  {publicReports.length === 0 ? (
                    <div className="p-5 text-center text-muted my-auto">
                      <CheckCircle2 size={40} className="text-brand mx-auto mb-2 opacity-80" />
                      <h4 className="font-bold text-sm text-primary mb-1">Public Records Clean</h4>
                      <p className="text-xs mb-0">No public integrity reports match the selected filters.</p>
                    </div>
                  ) : (
                    publicReports.map((report) => {
                      const isObs = report.targetType === 'observation';
                      const isReq = report.targetType === 'request';
                      const isRes = report.targetType === 'resource';
                      const isAvatar = report.targetType === 'profile_picture';
                      const isResolved = report.status === 'resolved';

                      let targetEntity = null;
                      if (isObs) targetEntity = observations.find(o => o.id === report.targetId);
                      if (isReq) targetEntity = requests.find(r => r.id === report.targetId);
                      if (isRes) targetEntity = resources.find(r => r.id === report.targetId);

                      return (
                        <div 
                          key={report.id}
                          className="card p-4 d-flex flex-column gap-3"
                          style={{
                            border: isResolved ? '1px solid var(--border-light)' : '1px solid #fed7aa',
                            background: isResolved ? 'var(--bg-subtle)' : '#ffffff'
                          }}
                        >
                          <div className="d-flex align-center justify-between gap-2 flex-wrap">
                            <div className="d-flex align-center gap-2">
                              <span 
                                className="badge font-bold d-flex align-center gap-1"
                                style={{
                                  background: isObs ? '#dbeafe' : isReq ? '#fef3c7' : isRes ? '#e0e7ff' : '#ffe4e6',
                                  color: isObs ? '#1d4ed8' : isReq ? '#b45309' : isRes ? '#4338ca' : '#e11d48',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {isObs && <Eye size={12} />}
                                {isReq && <HandHeart size={12} />}
                                {isRes && <Package size={12} />}
                                {isAvatar && <Image size={12} />}
                                <span className="text-capitalize">{report.targetType} Report</span>
                              </span>

                              <span 
                                className="badge text-xs"
                                style={{
                                  background: isResolved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.15)',
                                  color: isResolved ? 'var(--brand-dark)' : 'var(--amber-700)',
                                  fontSize: '0.68rem'
                                }}
                              >
                                {isResolved ? `Resolved (${report.resolutionAction || report.actionTaken || 'Closed'})` : 'Pending Adjudication'}
                              </span>
                            </div>

                            <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="p-3 rounded" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
                            <div className="d-flex align-start gap-2">
                              <AlertTriangle size={16} className="text-amber flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-xs text-primary d-block">
                                  Flagged Reason: {report.reason}
                                </span>
                                {report.details && (
                                  <p className="text-xs text-secondary mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                                    <strong>Evidence Notes:</strong> {report.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Target snippet */}
                          <div className="p-3 rounded border" style={{ background: '#ffffff' }}>
                            <div className="text-xs font-bold text-muted mb-1 text-uppercase" style={{ fontSize: '0.65rem' }}>
                              Public Record Under Review
                            </div>
                            <h5 className="text-xs font-bold text-primary mb-1">
                              {targetEntity?.title || report.targetTitle || `Target ID: ${report.targetId}`}
                            </h5>
                            <p className="text-xs text-secondary mb-0" style={{ fontSize: '0.75rem' }}>
                              {targetEntity?.description || targetEntity?.notes || report.targetContent || 'No additional content provided.'}
                            </p>
                          </div>

                          {/* Actions */}
                          {!isResolved && (
                            <div className="d-flex flex-column gap-2 pt-2 border-top">
                              {activeActionId === report.id ? (
                                <div className="d-flex flex-column gap-2 p-2 rounded" style={{ background: 'var(--bg-subtle)' }}>
                                  <input
                                    type="text"
                                    placeholder="Add adjudicator resolution note (recorded permanently in audit ledger)..."
                                    className="form-input text-xs"
                                    value={actionNotes[report.id] || ''}
                                    onChange={(e) => setActionNotes({ ...actionNotes, [report.id]: e.target.value })}
                                  />
                                  <div className="d-flex align-center justify-end gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-xs"
                                      onClick={() => setActiveActionId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs text-muted"
                                      onClick={() => handleResolve(report.id, 'dismiss')}
                                    >
                                      Dismiss (No Violation)
                                    </button>
                                    {isObs && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                        onClick={() => handleResolve(report.id, 'remove_observation')}
                                      >
                                        Remove Observation
                                      </button>
                                    )}
                                    {isReq && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                        onClick={() => handleResolve(report.id, 'remove_request')}
                                      >
                                        Remove Request
                                      </button>
                                    )}
                                    {isRes && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                        onClick={() => handleResolve(report.id, 'remove_resource')}
                                      >
                                        Remove Resource
                                      </button>
                                    )}
                                    {isAvatar && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                        onClick={() => handleResolve(report.id, 'reset_avatar')}
                                      >
                                        Reset Avatar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="d-flex align-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                                    Adjudicate public record veracity and safety
                                  </span>
                                  <div className="d-flex align-center gap-1.5">
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-xs"
                                      onClick={() => handleResolve(report.id, 'dismiss')}
                                    >
                                      Dismiss
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-xs"
                                      onClick={() => setActiveActionId(report.id)}
                                    >
                                      Adjudicate Record...
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {isResolved && report.resolutionNotes && (
                            <div className="text-xs text-muted italic" style={{ fontSize: '0.72rem' }}>
                              Adjudication notes: {report.resolutionNotes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EVIDENCE VAULT (QUARANTINED POSTS ACROSS PLATFORM) */}
            {activeTab === 'vault' && (
              <div className="p-4 overflow-y-auto flex-1 d-flex flex-column gap-3">
                <div className="p-3 rounded border" style={{ background: '#f8fafc' }}>
                  <div className="d-flex align-center justify-between gap-2 flex-wrap">
                    <div className="d-flex align-center gap-2">
                      <Archive size={18} className="text-amber" />
                      <div>
                        <h4 className="text-xs font-bold text-primary mb-0">Platform Evidence Vault (Inspect Only)</h4>
                        <p className="text-xs text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                          As a Public Records Moderator, you can inspect quarantined discussions across community circles to corroborate evidence, investigate patterns, and preserve accountability.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs d-flex align-center gap-1"
                      onClick={fetchVaultItems}
                      disabled={isVaultLoading}
                    >
                      <RotateCcw size={12} />
                      Refresh Vault
                    </button>
                  </div>
                </div>

                {vaultItems.length === 0 ? (
                  <div className="p-5 text-center text-muted my-auto">
                    <Archive size={40} className="text-muted mx-auto mb-2 opacity-60" />
                    <h4 className="font-bold text-sm text-primary mb-1">Evidence Vault Empty</h4>
                    <p className="text-xs mb-0">No quarantined circle posts found matching criteria.</p>
                  </div>
                ) : (
                  vaultItems.map((item) => (
                    <div key={item.id} className="card p-4 border" style={{ borderLeft: '4px solid var(--amber-500)' }}>
                      <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="d-flex align-center gap-2">
                          <span className="badge font-bold" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem' }}>
                            🔒 Quarantined Circle Post
                          </span>
                          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.68rem' }}>
                            {item.communityName} ({item.communityHandle || 'Circle'})
                          </span>
                          <span className="text-xs text-muted">
                            Author: <strong>{item.author?.name || 'Anonymous'}</strong>
                          </span>
                        </div>
                        <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <Clock size={12} />
                          {item.quarantinedAt ? new Date(item.quarantinedAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>

                      <div className="p-3 rounded mb-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <p className="text-xs text-primary mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                          {item.content}
                        </p>
                      </div>

                      <div className="d-flex align-center justify-between text-xs text-muted flex-wrap gap-2">
                        <span><strong>Quarantine Reason:</strong> {item.quarantineReason || 'Safety breach'}</span>
                        <span><strong>Preserved by:</strong> {item.quarantinedByName || 'Moderator'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRecordsModerationModal;
