import { useState, useEffect } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import api from '../../api/client';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  MessageSquare, 
  Image, 
  CheckCircle2,
  Search,
  Archive,
  History,
  Clock,
  RotateCcw
} from 'lucide-react';

export const GroupModerationTab = ({ community }) => {
  const { 
    currentUser, 
    reports, 
    resolveReport, 
    posts, 
    mockUsers
  } = useCareMesh();

  const [activeSubView, setActiveSubView] = useState('reports'); // 'reports' | 'vault' | 'audit'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'post' | 'profile_picture'
  const [actionNotes, setActionNotes] = useState({});
  const [activeActionId, setActiveActionId] = useState(null);

  // Vault state
  const [vaultPosts, setVaultPosts] = useState([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const fetchVault = async () => {
    if (!community?.id) return;
    setIsVaultLoading(true);
    try {
      const data = await api.communities.getModerationVault(community.id, { search: searchTerm });
      setVaultPosts(Array.isArray(data) ? data : []);
    } catch {
      const fallback = (posts || []).filter(p => p.communityId === community.id && p.isQuarantined);
      setVaultPosts(fallback);
    } finally {
      setIsVaultLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!community?.id) return;
    setIsAuditLoading(true);
    try {
      const data = await api.communities.getModerationAuditLogs(community.id, { search: searchTerm });
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (activeSubView === 'vault' && community?.id) {
      Promise.resolve().then(async () => {
        setIsVaultLoading(true);
        try {
          const data = await api.communities.getModerationVault(community.id, { search: searchTerm });
          if (active) setVaultPosts(Array.isArray(data) ? data : []);
        } catch {
          if (active) {
            const fallback = (posts || []).filter(p => p.communityId === community.id && p.isQuarantined);
            setVaultPosts(fallback);
          }
        } finally {
          if (active) setIsVaultLoading(false);
        }
      });
    } else if (activeSubView === 'audit' && community?.id) {
      Promise.resolve().then(async () => {
        setIsAuditLoading(true);
        try {
          const data = await api.communities.getModerationAuditLogs(community.id, { search: searchTerm });
          if (active) setAuditLogs(Array.isArray(data) ? data : []);
        } catch {
          if (active) setAuditLogs([]);
        } finally {
          if (active) setIsAuditLoading(false);
        }
      });
    }
    return () => { active = false; };
  }, [activeSubView, community?.id, searchTerm, posts]);

  // Filter reports for this community
  const communityReports = (reports || []).filter(r => {
    if (!community) return false;
    const isThisCommunity = r.communityId === community.id || (!r.communityId && r.scope === 'community');
    if (!isThisCommunity) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.targetType !== typeFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchReason = r.reason?.toLowerCase().includes(q);
      const matchDetails = r.details?.toLowerCase().includes(q);
      const matchReporter = r.reporter?.name?.toLowerCase().includes(q);
      const matchReported = r.reportedUser?.name?.toLowerCase().includes(q);
      if (!matchReason && !matchDetails && !matchReporter && !matchReported) return false;
    }
    return true;
  });

  const reportsPagination = usePagination(communityReports, 4);

  // Vault pagination & filter
  const filteredVault = vaultPosts.filter(vp => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return vp.content?.toLowerCase().includes(q) ||
      vp.quarantineReason?.toLowerCase().includes(q) ||
      vp.author?.name?.toLowerCase().includes(q);
  });
  const vaultPagination = usePagination(filteredVault, 4);

  // Audit logs pagination & filter
  const filteredAuditLogs = auditLogs.filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return log.action_type?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q) ||
      log.notes?.toLowerCase().includes(q) ||
      log.moderator_name?.toLowerCase().includes(q);
  });
  const auditPagination = usePagination(filteredAuditLogs, 6);

  if (!community) return null;

  const isPlatformAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'admin');
  const isAdmin = Boolean(community.adminIds?.includes(currentUser?.id) || isPlatformAdmin);
  const isModerator = Boolean(community.moderatorIds?.includes(currentUser?.id) || isAdmin);
  const canModerate = isAdmin || isModerator || Boolean(currentUser?.isPublicModerator);

  const handleResolve = async (reportId, action) => {
    const note = actionNotes[reportId] || '';
    await resolveReport(reportId, action, note);
    setActiveActionId(null);
    if (activeSubView === 'vault') fetchVault();
    if (activeSubView === 'audit') fetchAuditLogs();
  };

  if (!canModerate) {
    return (
      <div className="card p-5 text-center">
        <ShieldAlert size={40} className="text-amber mx-auto mb-2 opacity-80" />
        <h4 className="font-bold text-md text-primary mb-1">Moderator Access Required</h4>
        <p className="text-xs text-muted mb-0" style={{ maxWidth: '420px', margin: '0 auto' }}>
          Only elected community moderators and circle admins have access to review reported posts and profile pictures for <strong>{community.name}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div 
        className="card p-4 d-flex align-center justify-between gap-3 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#ffffff', borderRadius: 'var(--radius-xl)' }}
      >
        <div className="d-flex align-center gap-3">
          <div 
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(6px)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <ShieldCheck size={26} className="text-brand" />
          </div>
          <div>
            <div className="d-flex align-center gap-2">
              <h3 className="text-md font-bold text-white mb-0">Community Moderation Center</h3>
              <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.25)', color: '#86efac', fontSize: '0.68rem', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                {isModerator ? 'Elected Moderator' : 'Circle Admin'}
              </span>
            </div>
            <p className="text-xs mb-0 text-white" style={{ opacity: 0.85, fontSize: '0.78rem' }}>
              Enforcing community trust for {community.name} with preserved evidence & audit trails.
            </p>
          </div>
        </div>

        <div className="d-flex align-center gap-2">
          <div className="text-right d-none d-sm-block">
            <span className="font-bold text-sm text-white d-block">
              {reports.filter(r => (r.communityId === community.id || !r.communityId) && r.status === 'pending').length}
            </span>
            <span className="text-xs text-white opacity-70" style={{ fontSize: '0.68rem' }}>Pending Reports</span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="d-flex align-center justify-between gap-2 border-bottom pb-2 flex-wrap">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeSubView === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSubView('reports')}
          >
            <MessageSquare size={14} className="mr-1" />
            Reports Queue ({communityReports.filter(r => r.status === 'pending').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSubView === 'vault' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSubView('vault')}
          >
            <Archive size={14} className="mr-1" />
            Circle Evidence Vault
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeSubView === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveSubView('audit')}
          >
            <History size={14} className="mr-1" />
            Circle Audit Trail
          </button>
        </div>

        {/* Global Live Search Bar */}
        <div className="position-relative" style={{ minWidth: '220px', flex: '1', maxWidth: '320px' }}>
          <Search size={14} className="text-muted position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input text-xs pl-4"
            placeholder={`Search ${activeSubView}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* VIEW 1: REPORTS QUEUE */}
      {activeSubView === 'reports' && (
        <div className="d-flex flex-column gap-3">
          {/* Filter Pills */}
          <div className="d-flex align-center justify-between gap-2 flex-wrap pb-1">
            <div className="d-flex gap-1.5">
              <button
                type="button"
                className={`btn btn-xs ${statusFilter === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({reports.filter(r => (r.communityId === community.id || !r.communityId) && r.status === 'pending').length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusFilter === 'resolved' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter('resolved')}
              >
                Resolved
              </button>
              <button
                type="button"
                className={`btn btn-xs ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
            </div>

            <div className="d-flex gap-1">
              <button
                type="button"
                className={`btn btn-xs ${typeFilter === 'all' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                onClick={() => setTypeFilter('all')}
              >
                All Types
              </button>
              <button
                type="button"
                className={`btn btn-xs ${typeFilter === 'post' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                onClick={() => setTypeFilter('post')}
              >
                Posts
              </button>
              <button
                type="button"
                className={`btn btn-xs ${typeFilter === 'profile_picture' ? 'btn-secondary font-bold' : 'btn-ghost text-muted'}`}
                onClick={() => setTypeFilter('profile_picture')}
              >
                Profile Pictures
              </button>
            </div>
          </div>

          {/* Reports Feed */}
          {communityReports.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <CheckCircle2 size={40} className="text-brand mx-auto mb-2 opacity-80" />
              <h4 className="font-bold text-sm text-primary mb-1">Queue is Clear</h4>
              <p className="text-xs mb-0">No {statusFilter !== 'all' ? statusFilter : ''} reports matching current criteria for this circle.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reportsPagination.paginatedItems.map((report) => {
                const isAvatar = report.targetType === 'profile_picture';
                const isPost = report.targetType === 'post';
                const isResolved = report.status === 'resolved';

                const targetPost = isPost ? posts.find(p => p.id === report.targetId) : null;
                const targetUserId = report.reportedUserId || report.targetId;
                const targetUser = mockUsers.find(u => u.id === targetUserId) || (currentUser?.id === targetUserId ? currentUser : null);

                return (
                  <div 
                    key={report.id}
                    className="card p-4 d-flex flex-column gap-3"
                    style={{
                      border: isResolved ? '1px solid var(--border-light)' : '1px solid #fecdd3',
                      background: isResolved ? 'var(--bg-subtle)' : '#ffffff',
                      boxShadow: isResolved ? 'none' : 'var(--shadow-sm)'
                    }}
                  >
                    <div className="d-flex align-center justify-between gap-2 flex-wrap">
                      <div className="d-flex align-center gap-2">
                        <span 
                          className="badge font-bold d-flex align-center gap-1"
                          style={{
                            background: isAvatar ? '#ffe4e6' : '#fef3c7',
                            color: isAvatar ? '#e11d48' : '#d97706',
                            fontSize: '0.7rem'
                          }}
                        >
                          {isAvatar ? <Image size={12} /> : <MessageSquare size={12} />}
                          <span>{isAvatar ? 'Reported Profile Picture' : 'Reported Post'}</span>
                        </span>

                        <span 
                          className="badge text-xs"
                          style={{
                            background: isResolved ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isResolved ? 'var(--brand-dark)' : 'var(--rose-600)',
                            fontSize: '0.68rem'
                          }}
                        >
                          {isResolved ? `Resolved (${report.resolutionAction || report.actionTaken || 'Dismissed'})` : 'Pending Review'}
                        </span>
                      </div>

                      <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                        {new Date(report.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                      <div className="d-flex align-start gap-2 mb-1">
                        <AlertCircle size={15} className="text-rose flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-primary d-block">
                            Reason: {report.reason}
                          </span>
                          {report.details && (
                            <p className="text-xs text-secondary mb-0 mt-1" style={{ fontSize: '0.76rem', lineHeight: '1.4' }}>
                              <strong>Reporter details:</strong> {report.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded border" style={{ background: '#ffffff' }}>
                      <div className="text-xs font-bold text-muted mb-2 text-uppercase" style={{ fontSize: '0.65rem' }}>
                        Reported Target Content
                      </div>

                      {isAvatar && (
                        <div className="d-flex align-center gap-3">
                          <img 
                            src={targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                            alt="" 
                            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--rose-500)' }}
                          />
                          <div>
                            <span className="font-bold text-sm text-primary d-block">{targetUser?.name || 'Member'}</span>
                            <span className="text-xs text-muted d-block">{targetUser?.handle || `@user_${targetUserId}`}</span>
                          </div>
                        </div>
                      )}

                      {isPost && (
                        <div>
                          {targetPost ? (
                            <div>
                              <div className="d-flex align-center gap-2 mb-1.5">
                                <img 
                                  src={targetPost.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
                                  alt="" 
                                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <span className="font-bold text-xs text-primary">{targetPost.author?.name}</span>
                              </div>
                              <p className="text-xs text-secondary mb-0" style={{ lineHeight: '1.4' }}>
                                {targetPost.content}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted italic">Post is quarantined in Evidence Vault or already archived.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isResolved && (
                      <div className="d-flex flex-column gap-2 pt-2 border-top">
                        {activeActionId === report.id ? (
                          <div className="d-flex flex-column gap-2 p-2 rounded" style={{ background: 'var(--bg-subtle)' }}>
                            <input
                              type="text"
                              placeholder="Optional moderator resolution note (e.g. 'Quarantined post to Evidence Vault')..."
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
                                Dismiss
                              </button>
                              {isPost && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                  onClick={() => handleResolve(report.id, 'remove_post')}
                                >
                                  Quarantine Post to Vault
                                </button>
                              )}
                              {isAvatar && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                                  onClick={() => handleResolve(report.id, 'reset_avatar')}
                                >
                                  Reset Avatar to Default
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                style={{ background: '#7f1d1d', borderColor: '#7f1d1d' }}
                                onClick={() => handleResolve(report.id, 'kick_member')}
                              >
                                Kick Member
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex align-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                              Review target content and select enforcement action
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
                                Take Enforcement Action...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isResolved && (report.resolutionNotes || report.actionTaken) && (
                      <div className="text-xs text-muted italic" style={{ fontSize: '0.72rem' }}>
                        Resolution notes: {report.resolutionNotes || `Action executed: ${report.actionTaken}`}
                      </div>
                    )}
                  </div>
                );
              })}

              {reportsPagination.totalPages > 1 && (
                <Pagination
                  currentPage={reportsPagination.currentPage}
                  totalPages={reportsPagination.totalPages}
                  totalItems={reportsPagination.totalItems}
                  startIndex={reportsPagination.startIndex}
                  endIndex={reportsPagination.endIndex}
                  onPageChange={reportsPagination.setPage}
                  pageSize={reportsPagination.pageSize}
                  onPageSizeChange={reportsPagination.setPageSize}
                  pageSizeOptions={[2, 4, 8, 16]}
                  itemName="reports"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CIRCLE EVIDENCE VAULT */}
      {activeSubView === 'vault' && (
        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded border" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center justify-between gap-2 flex-wrap">
              <div className="d-flex align-center gap-2">
                <Archive size={18} className="text-amber" />
                <div>
                  <h4 className="text-xs font-bold text-primary mb-0">Quarantined Circle Discussions</h4>
                  <p className="text-xs text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                    Harmful posts hidden from public feed but preserved securely with full context for moderator accountability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                onClick={fetchVault}
                disabled={isVaultLoading}
              >
                <RotateCcw size={12} />
                Refresh
              </button>
            </div>
          </div>

          {filteredVault.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <Archive size={36} className="text-muted mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-primary mb-1">Vault is Empty</h4>
              <p className="text-xs mb-0">No quarantined posts found for this community circle.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {vaultPagination.paginatedItems.map((vp) => (
                <div key={vp.id} className="card p-4 border" style={{ borderLeft: '4px solid var(--amber-500)' }}>
                  <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="d-flex align-center gap-2">
                      <span className="badge font-bold" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem' }}>
                        🔒 Quarantined Evidence
                      </span>
                      <span className="text-xs text-muted">
                        Author: <strong>{vp.author?.name || 'Anonymous'}</strong> ({vp.author?.handle || `@user_${vp.author_id}`})
                      </span>
                    </div>
                    <span className="text-xs text-muted d-flex align-center gap-1">
                      <Clock size={12} />
                      {vp.quarantinedAt ? new Date(vp.quarantinedAt).toLocaleString() : 'Recently'}
                    </span>
                  </div>

                  <div className="p-3 rounded mb-2" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <p className="text-xs text-primary mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {vp.content}
                    </p>
                  </div>

                  <div className="d-flex align-center justify-between text-xs text-muted flex-wrap gap-2">
                    <span><strong>Reason:</strong> {vp.quarantineReason || 'Safety violation'}</span>
                    <span><strong>Moderated by:</strong> {vp.quarantinedByName || 'Circle Moderator'}</span>
                  </div>
                </div>
              ))}

              {vaultPagination.totalPages > 1 && (
                <Pagination
                  currentPage={vaultPagination.currentPage}
                  totalPages={vaultPagination.totalPages}
                  totalItems={vaultPagination.totalItems}
                  startIndex={vaultPagination.startIndex}
                  endIndex={vaultPagination.endIndex}
                  onPageChange={vaultPagination.setPage}
                  pageSize={vaultPagination.pageSize}
                  onPageSizeChange={vaultPagination.setPageSize}
                  pageSizeOptions={[2, 4, 8]}
                  itemName="quarantined posts"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: CIRCLE AUDIT TRAIL */}
      {activeSubView === 'audit' && (
        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded border" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center justify-between gap-2 flex-wrap">
              <div className="d-flex align-center gap-2">
                <History size={18} className="text-brand" />
                <div>
                  <h4 className="text-xs font-bold text-primary mb-0">Circle Moderation Audit Log</h4>
                  <p className="text-xs text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                    Immutable ledger of all moderator interventions and disciplinary enforcement actions in this circle.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                onClick={fetchAuditLogs}
                disabled={isAuditLoading}
              >
                <RotateCcw size={12} />
                Refresh
              </button>
            </div>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <History size={36} className="text-muted mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-primary mb-1">No Audit Logs Yet</h4>
              <p className="text-xs mb-0">No moderator actions have been recorded for this circle yet.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {auditPagination.paginatedItems.map((log) => (
                <div key={log.id} className="card p-3 d-flex align-center justify-between gap-3 flex-wrap">
                  <div className="d-flex align-center gap-2.5">
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ShieldCheck size={16} className="text-brand" />
                    </div>
                    <div>
                      <div className="d-flex align-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-primary">{log.action_type}</span>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>{log.target_type}</span>
                      </div>
                      <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                        By <strong>{log.moderator_name || 'Moderator'}</strong> ({log.moderator_role})
                        {log.reason && ` • Reason: ${log.reason}`}
                        {log.notes && ` • Notes: ${log.notes}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recently'}
                  </span>
                </div>
              ))}

              {auditPagination.totalPages > 1 && (
                <Pagination
                  currentPage={auditPagination.currentPage}
                  totalPages={auditPagination.totalPages}
                  totalItems={auditPagination.totalItems}
                  startIndex={auditPagination.startIndex}
                  endIndex={auditPagination.endIndex}
                  onPageChange={auditPagination.setPage}
                  pageSize={auditPagination.pageSize}
                  onPageSizeChange={auditPagination.setPageSize}
                  pageSizeOptions={[4, 6, 12]}
                  itemName="audit actions"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupModerationTab;
