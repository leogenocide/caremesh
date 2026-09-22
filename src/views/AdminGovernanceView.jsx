import { useState, useEffect, useCallback } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import api from '../api/client';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Users, 
  Archive, 
  History, 
  Gauge, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  UserX, 
  Trash2, 
  X, 
  Filter,
  Eye,
  Radio,
  Activity
} from 'lucide-react';

export const AdminGovernanceView = () => {
  const { currentUser, showToast } = useCareMesh();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'vault' | 'audit' | 'antispam'

  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    restrictedUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    quarantinedPosts: 0,
    totalAuditLogs: 0
  });

  // Tab 1: Users Governance
  const [usersList, setUsersList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userNeighborhoodFilter, setUserNeighborhoodFilter] = useState('');

  // User Incident Dossier Modal
  const [selectedUserDossier, setSelectedUserDossier] = useState(null);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [isRestricting, setIsRestricting] = useState(false);

  // Tab 2: Master Evidence Vault
  const [vaultPosts, setVaultPosts] = useState([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [vaultSearchTerm, setVaultSearchTerm] = useState('');
  const [vaultTypeFilter, setVaultTypeFilter] = useState('all');
  const [selectedVaultPostForPurge, setSelectedVaultPostForPurge] = useState(null);

  // Tab 3: Platform Audit Trail
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Tab 4: Live Anti-Spam Telemetry
  const [telemetry, setTelemetry] = useState({
    windowSeconds: 60,
    maxWrites: 30,
    totalActiveTrackers: 0,
    throttledCount: 0,
    trackedClients: [],
    restrictedUsers: []
  });
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);
  const [telemetryFilter, setTelemetryFilter] = useState('all'); // 'all' | 'throttled' | 'restricted'
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const isPlatformAdmin = Boolean(
    currentUser?.email === 'caleb.zothansanga@gmail.com' ||
    currentUser?.isAdmin ||
    (currentUser?.role && currentUser.role.toLowerCase().includes('admin'))
  );

  const isSystemAdmin = Boolean(
    currentUser?.email === 'caleb.zothansanga@gmail.com' ||
    currentUser?.role === 'System Administrator'
  );

  const [isTogglingMod, setIsTogglingMod] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.admin.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn('Failed to load admin stats:', err.message);
    }
  }, []);

  // Fetch Users with Multi-Attribute Search & Filter
  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const params = {};
      if (userSearchTerm.trim()) params.search = userSearchTerm.trim();
      if (userRoleFilter) params.role = userRoleFilter;
      if (userStatusFilter) params.status = userStatusFilter;
      if (userNeighborhoodFilter.trim()) params.neighborhood = userNeighborhoodFilter.trim();

      const data = await api.admin.getUsers(params);
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load users:', err.message);
      showToast(err.message || 'Failed to search users', 'error');
    } finally {
      setIsUsersLoading(false);
    }
  }, [userSearchTerm, userRoleFilter, userStatusFilter, userNeighborhoodFilter, showToast]);

  // Fetch User Reports Dossier
  const openUserDossier = async (userId) => {
    try {
      const data = await api.admin.getUserReports(userId);
      setSelectedUserDossier(data);
      setRestrictionReason('');
    } catch (err) {
      showToast(err.message || 'Failed to load user report dossier', 'error');
    }
  };

  // Restrict User
  const handleRestrictUser = async (userId) => {
    if (!restrictionReason.trim()) {
      showToast('Please provide an audit justification reason for restriction.', 'warning');
      return;
    }
    setIsRestricting(true);
    try {
      await api.users.restrict(userId, { reason: restrictionReason.trim() });
      showToast('User account successfully restricted. Write actions blocked.', 'warning', 'Account Restricted');
      fetchUsers();
      fetchStats();
      if (selectedUserDossier?.user?.id === userId) {
        openUserDossier(userId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to restrict user account', 'error');
    } finally {
      setIsRestricting(false);
    }
  };

  // Unrestrict User
  const handleUnrestrictUser = async (userId) => {
    setIsRestricting(true);
    try {
      await api.users.unrestrict(userId, { reason: 'Reinstated after review' });
      showToast('User account reinstated. Write capabilities active.', 'success', 'Account Reinstated');
      fetchUsers();
      fetchStats();
      if (selectedUserDossier?.user?.id === userId) {
        openUserDossier(userId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to unrestrict user account', 'error');
    } finally {
      setIsRestricting(false);
    }
  };

  // Toggle Public Moderator role (System Admin only)
  const handleTogglePublicModerator = async (targetUser) => {
    const isCurrentlyMod = Boolean(targetUser.isPublicModerator || targetUser.is_public_moderator);
    const actionLabel = isCurrentlyMod ? 'Revoke Public Moderator' : 'Promote to Public Moderator';
    const reason = window.prompt(
      `Enter reason / audit note to ${actionLabel.toLowerCase()} for ${targetUser.name}:`,
      isCurrentlyMod ? 'Moderation privileges concluded by system administrator' : 'Elevated to public community moderator'
    );
    if (reason === null) return;

    setIsTogglingMod(true);
    try {
      await api.admin.togglePublicModerator(targetUser.id, {
        isPublicModerator: !isCurrentlyMod,
        reason: reason.trim() || undefined
      });
      showToast(
        `User ${targetUser.name} is ${!isCurrentlyMod ? 'now elevated to Public Moderator' : 'reverted to regular member'}.`,
        'success',
        'Moderator Status Updated'
      );
      fetchUsers();
      if (selectedUserDossier?.user?.id === targetUser.id) {
        openUserDossier(targetUser.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update moderator role', 'error');
    } finally {
      setIsTogglingMod(false);
    }
  };

  // Fetch Master Evidence Vault
  const fetchVault = useCallback(async () => {
    setIsVaultLoading(true);
    try {
      const params = {};
      if (vaultSearchTerm.trim()) params.search = vaultSearchTerm.trim();
      if (vaultTypeFilter && vaultTypeFilter !== 'all') params.itemType = vaultTypeFilter;
      const data = await api.admin.getVault(params);
      setVaultPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load evidence vault:', err.message);
    } finally {
      setIsVaultLoading(false);
    }
  }, [vaultSearchTerm, vaultTypeFilter]);

  // Restore Item from Vault (Universal)
  const handleRestoreItem = async (itemId, itemType = 'post') => {
    try {
      await api.admin.restoreVaultItem(itemId, { itemType, reason: 'Cleared after safety review' });
      showToast('Item restored from Evidence Vault to public view.', 'success', 'Item Restored');
      fetchVault();
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to restore item', 'error');
    }
  };

  // Permanently Purge Item (Universal)
  const handlePurgeItem = async (itemId, itemType = 'post') => {
    try {
      await api.admin.purgeVaultItem(itemId, { itemType, reason: 'Permanent purge of violating material' });
      showToast('Item permanently purged from SQLite database with snapshot logged.', 'info', 'Evidence Purged');
      setSelectedVaultPostForPurge(null);
      fetchVault();
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to purge item', 'error');
    }
  };

  // Fetch Platform Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const params = {};
      if (auditSearchTerm.trim()) params.search = auditSearchTerm.trim();
      if (auditActionFilter) params.actionType = auditActionFilter;
      const data = await api.admin.getAuditLogs(params);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditSearchTerm, auditActionFilter]);

  // Fetch Live Anti-Spam Telemetry
  const fetchTelemetry = useCallback(async () => {
    setIsTelemetryLoading(true);
    try {
      const data = await api.admin.getAntiSpamTelemetry();
      if (data) setTelemetry(data);
    } catch (err) {
      console.warn('Failed to load anti-spam telemetry:', err.message);
    } finally {
      setIsTelemetryLoading(false);
    }
  }, []);

  // Reset Client Rate Limit Quota
  const handleResetClient = async (clientId) => {
    try {
      await api.admin.resetAntiSpamClient(clientId, 'Manual reset by System Administrator');
      showToast(
        clientId === 'all' 
          ? 'All active rate limit quotas have been flushed.' 
          : `Rate limit quota reset for ${clientId}`, 
        'success', 
        'Quota Reset'
      );
      fetchTelemetry();
    } catch (err) {
      showToast(err.message || 'Failed to reset rate limit quota', 'error');
    }
  };

  useEffect(() => {
    let active = true;
    if (!isPlatformAdmin) return;

    const loadData = async () => {
      try {
        const statsData = await api.admin.getStats();
        if (active && statsData) setStats(statsData);
      } catch (err) {
        console.warn('Failed to load admin stats:', err.message);
      }

      if (activeTab === 'users') {
        setIsUsersLoading(true);
        try {
          const params = {};
          if (userSearchTerm.trim()) params.search = userSearchTerm.trim();
          if (userRoleFilter) params.role = userRoleFilter;
          if (userStatusFilter) params.status = userStatusFilter;
          if (userNeighborhoodFilter.trim()) params.neighborhood = userNeighborhoodFilter.trim();
          const data = await api.admin.getUsers(params);
          if (active) setUsersList(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Failed to load users:', err.message);
        } finally {
          if (active) setIsUsersLoading(false);
        }
      } else if (activeTab === 'vault') {
        setIsVaultLoading(true);
        try {
          const params = {};
          if (vaultSearchTerm.trim()) params.search = vaultSearchTerm.trim();
          const data = await api.admin.getVault(params);
          if (active) setVaultPosts(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Failed to load evidence vault:', err.message);
        } finally {
          if (active) setIsVaultLoading(false);
        }
      } else if (activeTab === 'audit') {
        setIsAuditLoading(true);
        try {
          const params = {};
          if (auditSearchTerm.trim()) params.search = auditSearchTerm.trim();
          if (auditActionFilter) params.actionType = auditActionFilter;
          const data = await api.admin.getAuditLogs(params);
          if (active) setAuditLogs(Array.isArray(data) ? data : []);
        } catch (err) {
          console.warn('Failed to load audit logs:', err.message);
        } finally {
          if (active) setIsAuditLoading(false);
        }
      } else if (activeTab === 'antispam') {
        setIsTelemetryLoading(true);
        try {
          const data = await api.admin.getAntiSpamTelemetry();
          if (active && data) setTelemetry(data);
        } catch (err) {
          console.warn('Failed to load anti-spam telemetry:', err.message);
        } finally {
          if (active) setIsTelemetryLoading(false);
        }
      }
    };

    Promise.resolve().then(loadData);

    return () => {
      active = false;
    };
  }, [
    isPlatformAdmin,
    activeTab,
    userSearchTerm,
    userRoleFilter,
    userStatusFilter,
    userNeighborhoodFilter,
    vaultSearchTerm,
    auditSearchTerm,
    auditActionFilter
  ]);

  // Live real-time polling effect when on antispam tab
  useEffect(() => {
    if (activeTab !== 'antispam' || !isPlatformAdmin || !isAutoRefreshing) return;
    const interval = setInterval(() => {
      api.admin.getAntiSpamTelemetry().then(data => {
        if (data) setTelemetry(data);
      }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, isPlatformAdmin, isAutoRefreshing]);

  if (!isPlatformAdmin) {
    return (
      <div className="container py-5 text-center">
        <div className="card p-5 max-w-md mx-auto">
          <ShieldAlert size={54} className="text-amber mx-auto mb-3 opacity-90" />
          <h2 className="font-bold text-lg text-primary mb-2">System Administrator Privileges Required</h2>
          <p className="text-xs text-muted mb-0">
            This governance dashboard is strictly restricted to system administrators with full platform jurisdiction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 d-flex flex-column gap-4">
      {/* Top Banner & Overview KPI Cards */}
      <div 
        className="card p-4 d-flex align-center justify-between gap-3 flex-wrap"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div className="d-flex align-center gap-3">
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(56, 189, 248, 0.2)', 
              color: '#38bdf8',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="d-flex align-center gap-2">
              <h2 className="text-lg font-bold text-white mb-0">System Administrator Governance</h2>
              <span className="badge" style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.7rem' }}>
                Full Platform Control
              </span>
            </div>
            <p className="text-xs mb-0 text-white-50" style={{ opacity: 0.8 }}>
              Accountability ledger, user attribute investigation, evidence vault, and anti-spam traffic monitor.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-xs d-flex align-center gap-1"
          onClick={() => {
            fetchStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'vault') fetchVault();
            if (activeTab === 'audit') fetchAuditLogs();
            if (activeTab === 'antispam') fetchTelemetry();
          }}
        >
          <RotateCcw size={12} />
          Refresh Data
        </button>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="card p-3 d-flex align-center gap-3">
          <div className="p-2.5 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs text-muted d-block">Platform Accounts</span>
            <span className="font-bold text-md text-primary">
              {stats.totalUsers} <span className="text-xs text-muted">({stats.restrictedUsers} restricted)</span>
            </span>
          </div>
        </div>

        <div className="card p-3 d-flex align-center gap-3">
          <div className="p-2.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-xs text-muted d-block">Platform Reports</span>
            <span className="font-bold text-md text-primary">
              {stats.totalReports} <span className="text-xs text-amber font-medium">({stats.pendingReports} pending)</span>
            </span>
          </div>
        </div>

        <div className="card p-3 d-flex align-center gap-3">
          <div className="p-2.5 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Archive size={22} />
          </div>
          <div>
            <span className="text-xs text-muted d-block">Evidence Vault Items</span>
            <span className="font-bold text-md text-primary">
              {stats.quarantinedVaultItems ?? stats.quarantinedPosts} <span className="text-xs text-muted">(Quarantined)</span>
            </span>
          </div>
        </div>

        <div className="card p-3 d-flex align-center gap-3">
          <div className="p-2.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <History size={22} />
          </div>
          <div>
            <span className="text-xs text-muted d-block">Moderation Audit Logs</span>
            <span className="font-bold text-md text-primary">
              {stats.totalAuditLogs} <span className="text-xs text-muted">(Recorded)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="touch-tab-nav border-bottom pb-2">
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} className="mr-1" />
          User Governance & Attribute Search
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'vault' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('vault')}
        >
          <Archive size={15} className="mr-1" />
          Master Evidence Vault ({stats.quarantinedVaultItems ?? stats.quarantinedPosts})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={15} className="mr-1" />
          Platform Audit Trail ({stats.totalAuditLogs})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'antispam' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('antispam')}
        >
          <Gauge size={15} className="mr-1" />
          Anti-Spam & Rate Limiter Monitor
        </button>
      </div>

      {/* TAB 1: USERS GOVERNANCE & ATTRIBUTE SEARCH */}
      {activeTab === 'users' && (
        <div className="d-flex flex-column gap-3">
          {/* Multi-Attribute Search Bar & Filters */}
          <div className="card p-3 d-flex flex-column gap-2.5" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                <Filter size={14} className="text-brand" />
                Multi-Attribute User Search & Filters
              </span>
              <span className="text-xs text-muted">
                Showing {usersList.length} matching member accounts
              </span>
            </div>

            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="position-relative">
                <Search size={13} className="text-muted position-absolute" style={{ left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input text-xs pl-4"
                  placeholder="Search name, handle, email, ID..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-input text-xs"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">System Admin</option>
                <option value="user">Regular User</option>
                <option value="responder">Emergency Responder</option>
                <option value="coordinator">Coordinator</option>
              </select>

              <select
                className="form-input text-xs"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="restricted">Restricted Accounts</option>
              </select>

              <input
                type="text"
                className="form-input text-xs"
                placeholder="Filter by neighborhood..."
                value={userNeighborhoodFilter}
                onChange={(e) => setUserNeighborhoodFilter(e.target.value)}
              />
            </div>
          </div>

          {/* User Results Table */}
          {isUsersLoading ? (
            <div className="card p-5 text-center text-muted">
              <RotateCcw size={28} className="animate-spin mx-auto mb-2 text-brand" />
              <p className="text-xs mb-0">Searching platform user accounts...</p>
            </div>
          ) : usersList.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <Users size={36} className="text-muted mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-primary mb-1">No Accounts Found</h4>
              <p className="text-xs mb-0">No users match the given attribute search criteria.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="table mb-0" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th className="p-3 text-xs font-bold text-muted">User</th>
                      <th className="p-3 text-xs font-bold text-muted">Role</th>
                      <th className="p-3 text-xs font-bold text-muted">Neighborhood</th>
                      <th className="p-3 text-xs font-bold text-muted">Account Status</th>
                      <th className="p-3 text-xs font-bold text-muted text-center">Reports Received</th>
                      <th className="p-3 text-xs font-bold text-muted text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => {
                      const isRestricted = usr.status === 'restricted';
                      const reportCount = usr.reportsReceivedCount || 0;
                      return (
                        <tr key={usr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="p-3">
                            <div className="d-flex align-center gap-2.5">
                              <img
                                src={usr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                alt=""
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <span className="font-bold text-xs text-primary d-block">{usr.name}</span>
                                <span className="text-xs text-muted d-block">{usr.handle || `@user_${usr.id}`}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="badge font-medium" style={{ fontSize: '0.7rem' }}>
                              {usr.role || 'Member'}
                            </span>
                            {Boolean(usr.isPublicModerator) && (
                              <span className="badge ml-1" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem' }}>
                                Public Mod
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {usr.neighborhood || usr.address || 'Unspecified'}
                          </td>
                          <td className="p-3">
                            {isRestricted ? (
                              <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem' }}>
                                ⚠️ Restricted
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem' }}>
                                ✓ Active
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span 
                              className={`badge font-bold ${reportCount > 0 ? 'text-white' : 'text-muted'}`}
                              style={{
                                background: reportCount > 0 ? 'var(--rose-600)' : 'var(--bg-subtle)',
                                fontSize: '0.75rem',
                                minWidth: '24px',
                                display: 'inline-block'
                              }}
                            >
                              {reportCount}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="d-inline-flex align-center gap-1.5 justify-end">
                              {isSystemAdmin && usr.email !== 'caleb.zothansanga@gmail.com' && (
                                <button
                                  type="button"
                                  className={`btn btn-xs d-inline-flex align-center gap-1 ${
                                    usr.isPublicModerator ? 'btn-ghost text-amber' : 'btn-secondary text-primary'
                                  }`}
                                  title={usr.isPublicModerator ? 'Revoke Public Moderator Privileges' : 'Promote to Public Moderator'}
                                  onClick={() => handleTogglePublicModerator(usr)}
                                  disabled={isTogglingMod}
                                >
                                  <ShieldCheck size={12} className={usr.isPublicModerator ? 'text-amber' : 'text-brand'} />
                                  <span>{usr.isPublicModerator ? 'Revoke Mod' : 'Make Mod'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs d-inline-flex align-center gap-1"
                                onClick={() => openUserDossier(usr.id)}
                              >
                                <Eye size={12} />
                                <span>Dossier</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USER INCIDENT DOSSIER MODAL */}
      {selectedUserDossier && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedUserDossier(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content card p-0 animate-scale-in" 
            style={{
              width: '100%',
              maxWidth: '800px',
              height: '85vh',
              maxHeight: '750px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div 
              className="p-4 d-flex align-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div className="d-flex align-center gap-3">
                <img
                  src={selectedUserDossier.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt=""
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }}
                />
                <div>
                  <div className="d-flex align-center gap-2">
                    <h3 className="font-bold text-md text-white mb-0">{selectedUserDossier.user?.name}</h3>
                    <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontSize: '0.68rem', fontWeight: 'bold' }}>
                      {selectedUserDossier.user?.handle || `@user_${selectedUserDossier.user?.id}`}
                    </span>
                  </div>
                  <span className="text-xs text-white-50" style={{ opacity: 0.8 }}>
                    Disciplinary Investigation Dossier • {selectedUserDossier.reportsCount} Reports on Record
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-ghost btn-sm btn-icon text-white" 
                onClick={() => setSelectedUserDossier(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-4 overflow-y-auto flex-1 d-flex flex-column gap-3">
              {/* Account Status Card & Restrict / Reopen Action */}
              <div className="card p-3 border" style={{ background: '#f8fafc' }}>
                <div className="d-flex align-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-xs font-bold text-muted text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                      Account Disciplinary Status
                    </span>
                    <div className="d-flex align-center gap-2">
                      {selectedUserDossier.user?.status === 'restricted' ? (
                        <>
                          <span className="badge font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            ⚠️ Restricted Account
                          </span>
                          <span className="text-xs text-secondary">
                            Reason: {selectedUserDossier.user?.restrictionReason || 'Safety & Anti-Spam Violation'}
                          </span>
                        </>
                      ) : (
                        <span className="badge font-bold" style={{ background: '#dcfce7', color: '#15803d' }}>
                          ✓ Active Account
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Restrict / Unrestrict Control */}
                  <div>
                    {selectedUserDossier.user?.status === 'restricted' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                        style={{ background: 'var(--brand-dark)' }}
                        onClick={() => handleUnrestrictUser(selectedUserDossier.user.id)}
                        disabled={isRestricting}
                      >
                        <UserCheck size={14} />
                        <span>Reinstate Account</span>
                      </button>
                    ) : (
                      <div className="d-flex align-center gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="Audit justification reason for restriction..."
                          className="form-input text-xs"
                          style={{ minWidth: '220px' }}
                          value={restrictionReason}
                          onChange={(e) => setRestrictionReason(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm d-flex align-center gap-1.5"
                          style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)' }}
                          onClick={() => handleRestrictUser(selectedUserDossier.user.id)}
                          disabled={isRestricting}
                        >
                          <UserX size={14} />
                          <span>Restrict Account</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Public Moderator Role Elevation Control */}
              {isSystemAdmin && selectedUserDossier.user?.email !== 'caleb.zothansanga@gmail.com' && (
                <div className="card p-3 border" style={{ background: '#f8fafc' }}>
                  <div className="d-flex align-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-xs font-bold text-muted text-uppercase d-block mb-1" style={{ fontSize: '0.65rem' }}>
                        Platform Moderation Authority
                      </span>
                      <div className="d-flex align-center gap-2">
                        {selectedUserDossier.user?.isPublicModerator ? (
                          <span className="badge font-bold" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            🛡️ Public Moderator Active
                          </span>
                        ) : (
                          <span className="badge font-bold" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            Standard Community Member
                          </span>
                        )}
                        <span className="text-xs text-muted">
                          Can moderate public reports, triage flags, and audit community safety.
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className={`btn btn-sm d-flex align-center gap-1.5 ${
                          selectedUserDossier.user?.isPublicModerator ? 'btn-secondary text-rose' : 'btn-primary'
                        }`}
                        onClick={() => handleTogglePublicModerator(selectedUserDossier.user)}
                        disabled={isTogglingMod}
                      >
                        <ShieldCheck size={14} />
                        <span>
                          {selectedUserDossier.user?.isPublicModerator ? 'Revoke Moderator Role' : 'Promote to Public Moderator'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Reports Received */}
              <div>
                <h4 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose" />
                  Historical Incident Reports Filed Against This User ({selectedUserDossier.reports?.length || 0})
                </h4>

                {!selectedUserDossier.reports || selectedUserDossier.reports.length === 0 ? (
                  <div className="card p-4 text-center text-muted">
                    <CheckCircle2 size={32} className="text-brand mx-auto mb-1 opacity-70" />
                    <p className="text-xs mb-0">No disciplinary safety reports have been filed against this account.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {selectedUserDossier.reports.map((rep) => (
                      <div key={rep.id} className="card p-3 border" style={{ borderLeft: '3px solid var(--rose-500)' }}>
                        <div className="d-flex align-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="d-flex align-center gap-2">
                            <span className="badge font-bold" style={{ fontSize: '0.68rem' }}>{rep.type}</span>
                            <span className="badge" style={{ fontSize: '0.65rem' }}>{rep.status}</span>
                            <span className="text-xs font-bold text-primary">Reason: {rep.reason}</span>
                          </div>
                          <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                            {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {rep.details && (
                          <p className="text-xs text-secondary mb-1" style={{ fontSize: '0.75rem' }}>
                            <strong>Reporter Details:</strong> {rep.details}
                          </p>
                        )}
                        <div className="d-flex align-center justify-between text-xs text-muted" style={{ fontSize: '0.7rem' }}>
                          <span>Reporter: {rep.reporter?.name || 'Community Member'}</span>
                          <span>Resolution: {rep.actionTaken || 'None'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quarantined Posts Authored by This User */}
              {selectedUserDossier.quarantinedPosts?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-1.5">
                    <Archive size={14} className="text-amber" />
                    Quarantined Discussions Authored by This User ({selectedUserDossier.quarantinedPosts.length})
                  </h4>
                  <div className="d-flex flex-column gap-2">
                    {selectedUserDossier.quarantinedPosts.map((qp) => (
                      <div key={qp.id} className="card p-3 border" style={{ background: '#fffbeb', borderLeft: '3px solid var(--amber-500)' }}>
                        <div className="d-flex align-center justify-between text-xs text-muted mb-1">
                          <span>Quarantined post • {qp.timestamp || 'Recently'}</span>
                          <span>Reason: {qp.quarantineReason || 'Safety breach'}</span>
                        </div>
                        <p className="text-xs text-primary mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                          {qp.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER EVIDENCE VAULT */}
      {activeTab === 'vault' && (
        <div className="d-flex flex-column gap-3">
          {/* Vault Search & Category Filter Bar */}
          <div className="card p-3 d-flex flex-column gap-2" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center justify-between gap-3 flex-wrap">
              <div className="position-relative" style={{ minWidth: '240px', flex: '1', maxWidth: '380px' }}>
                <Search size={14} className="text-muted position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input text-xs pl-4"
                  placeholder="Search quarantined content, reasons, authors..."
                  value={vaultSearchTerm}
                  onChange={(e) => setVaultSearchTerm(e.target.value)}
                />
              </div>
              <span className="text-xs text-muted font-semibold">
                {vaultPosts.length} quarantined items preserved securely in evidence vault
              </span>
            </div>

            {/* Type filter tabs */}
            <div className="d-flex align-center gap-1.5 flex-wrap pt-1 border-top">
              <span className="text-xs text-muted mr-1 font-semibold">Filter by Type:</span>
              {[
                { key: 'all', label: 'All Types' },
                { key: 'post', label: 'Posts' },
                { key: 'comment', label: 'Comments' },
                { key: 'request', label: 'Help Requests' },
                { key: 'resource', label: 'Resource Offers' },
                { key: 'observation', label: 'Observations' },
                { key: 'project', label: 'Civic Events' },
                { key: 'plan', label: 'Plans' }
              ].map(tf => (
                <button
                  key={tf.key}
                  type="button"
                  className={`btn btn-xs ${vaultTypeFilter === tf.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => setVaultTypeFilter(tf.key)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vault Items List */}
          {isVaultLoading ? (
            <div className="card p-5 text-center text-muted">
              <RotateCcw size={28} className="animate-spin mx-auto mb-2 text-brand" />
              <p className="text-xs mb-0">Loading master evidence vault...</p>
            </div>
          ) : vaultPosts.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <Archive size={40} className="text-muted mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-primary mb-1">Evidence Vault Empty</h4>
              <p className="text-xs mb-0">No quarantined items found matching current filters.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {vaultPosts.map((item) => (
                <div key={item.id} className="card p-4 border" style={{ borderLeft: '4px solid var(--amber-500)' }}>
                  <div className="d-flex align-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="d-flex align-center gap-2 flex-wrap">
                      <span className="badge font-bold" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem' }}>
                        🔒 Quarantined Evidence
                      </span>
                      <span className="badge font-bold" style={{
                        background: 
                          item.itemType === 'request' ? '#dbeafe' :
                          item.itemType === 'resource' ? '#dcfce7' :
                          item.itemType === 'observation' ? '#fef3c7' :
                          item.itemType === 'project' ? '#f3e8ff' :
                          item.itemType === 'plan' ? '#ccfbf1' :
                          item.itemType === 'comment' ? '#f1f5f9' : '#e0e7ff',
                        color:
                          item.itemType === 'request' ? '#1e40af' :
                          item.itemType === 'resource' ? '#166534' :
                          item.itemType === 'observation' ? '#92400e' :
                          item.itemType === 'project' ? '#6b21a8' :
                          item.itemType === 'plan' ? '#115e59' :
                          item.itemType === 'comment' ? '#475569' : '#3730a3',
                        fontSize: '0.7rem'
                      }}>
                        {item.itemType === 'request' ? 'Help Request' :
                         item.itemType === 'resource' ? 'Resource Offer' :
                         item.itemType === 'project' ? 'Civic Event' :
                         item.itemType === 'plan' ? 'Resilience Plan' :
                         item.itemType === 'observation' ? 'Observation' :
                         item.itemType === 'comment' ? 'Feed Comment' : 'Community Post'}
                      </span>
                      <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                        {item.communityName || 'Platform Global'}
                      </span>
                      <span className="text-xs text-muted">
                        Author: <strong>{item.author?.name || 'Anonymous'}</strong> ({item.author?.handle || `@user_${item.author?.id || 'unknown'}`})
                      </span>
                    </div>

                    <span className="text-xs text-muted d-flex align-center gap-1" style={{ fontSize: '0.72rem' }}>
                      <Clock size={12} />
                      {item.quarantinedAt ? new Date(item.quarantinedAt).toLocaleString() : 'Recently'}
                    </span>
                  </div>

                  <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {item.title && item.itemType !== 'comment' && (
                      <h4 className="font-bold text-xs text-primary mb-1">{item.title}</h4>
                    )}
                    <p className="text-xs text-primary mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {item.content || item.description || '(No text content)'}
                    </p>
                  </div>

                  <div className="d-flex align-center justify-between gap-2 flex-wrap pt-2 border-top">
                    <div className="text-xs text-muted">
                      <span><strong>Quarantine Reason:</strong> {item.quarantineReason || 'Safety review'}</span>
                      <span className="ml-3"><strong>Preserved by:</strong> {item.quarantinedByName || 'Moderator'}</span>
                    </div>

                    <div className="d-flex align-center gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs d-flex align-center gap-1"
                        onClick={() => handleRestoreItem(item.id, item.itemType)}
                      >
                        <RotateCcw size={12} />
                        <span>Restore to Public View</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-xs d-flex align-center gap-1"
                        style={{ background: '#7f1d1d', borderColor: '#7f1d1d' }}
                        onClick={() => setSelectedVaultPostForPurge(item)}
                      >
                        <Trash2 size={12} />
                        <span>Permanently Purge</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONFIRM PERMANENT PURGE MODAL */}
      {selectedVaultPostForPurge && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedVaultPostForPurge(null)}
          style={{ zIndex: 9999 }}
        >
          <div className="modal-content card p-4 animate-scale-in" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="d-flex align-center gap-2 text-rose mb-2">
              <AlertTriangle size={24} />
              <h3 className="text-md font-bold mb-0">Confirm Permanent Purge</h3>
            </div>
            <p className="text-xs text-secondary mb-3">
              Are you sure you want to permanently delete this {selectedVaultPostForPurge.itemType || 'item'} and its associated records from SQLite? An immutable cryptographic audit snapshot will be preserved in the audit log, but the database records will be irrevocably purged.
            </p>
            <div className="p-3 rounded mb-3 bg-subtle border text-xs text-muted" style={{ fontStyle: 'italic' }}>
              &quot;{selectedVaultPostForPurge.title || selectedVaultPostForPurge.content || 'Item'}&quot;
            </div>
            <div className="d-flex align-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedVaultPostForPurge(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: '#7f1d1d', borderColor: '#7f1d1d' }}
                onClick={() => handlePurgeItem(selectedVaultPostForPurge.id, selectedVaultPostForPurge.itemType)}
              >
                Permanently Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="d-flex flex-column gap-3">
          {/* Audit Search Bar & Action Filter */}
          <div className="card p-3 d-flex align-center justify-between gap-3 flex-wrap" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center gap-2 flex-1 flex-wrap">
              <div className="position-relative" style={{ minWidth: '220px', flex: '1', maxWidth: '340px' }}>
                <Search size={14} className="text-muted position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input text-xs pl-4"
                  placeholder="Search audit trail by reason, moderator, notes..."
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-input text-xs"
                style={{ maxWidth: '200px' }}
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
              >
                <option value="">All Action Types</option>
                <option value="quarantine_post">Quarantine Post</option>
                <option value="restore_post">Restore Post</option>
                <option value="purge_post">Purge Post</option>
                <option value="restrict_user">Restrict User</option>
                <option value="unrestrict_user">Unrestrict User</option>
                <option value="kick_member">Kick Member</option>
                <option value="dismiss_report">Dismiss Report</option>
                <option value="remove_observation">Remove Observation</option>
                <option value="remove_request">Remove Request</option>
                <option value="remove_resource">Remove Resource</option>
                <option value="reset_avatar">Reset Avatar</option>
              </select>
            </div>

            <span className="text-xs text-muted">
              {auditLogs.length} immutable ledger actions logged
            </span>
          </div>

          {/* Audit Logs Stream */}
          {isAuditLoading ? (
            <div className="card p-5 text-center text-muted">
              <RotateCcw size={28} className="animate-spin mx-auto mb-2 text-brand" />
              <p className="text-xs mb-0">Loading platform audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="card p-5 text-center text-muted">
              <History size={40} className="text-muted mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-primary mb-1">No Audit Entries Found</h4>
              <p className="text-xs mb-0">No actions match current audit trail filters.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="card p-3 d-flex align-center justify-between gap-3 flex-wrap">
                  <div className="d-flex align-center gap-3">
                    <div 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ShieldCheck size={18} className="text-brand" />
                    </div>
                    <div>
                      <div className="d-flex align-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-primary">{log.action_type}</span>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>{log.target_type}</span>
                        {log.community_name && (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem' }}>
                            {log.community_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                        Moderator: <strong>{log.moderator_name || 'System Admin'}</strong> ({log.moderator_role})
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
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANTI-SPAM & RATE LIMIT TRAFFIC MONITOR */}
      {activeTab === 'antispam' && (
        <div className="d-flex flex-column gap-3">
          {/* Live Monitor Control Bar */}
          <div className="card p-3 d-flex align-center justify-between gap-3 flex-wrap" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-center gap-2 flex-wrap">
              <span 
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isAutoRefreshing ? '#22c55e' : '#94a3b8',
                  display: 'inline-block',
                  boxShadow: isAutoRefreshing ? '0 0 8px #22c55e' : 'none'
                }}
              />
              <span className="font-bold text-xs text-primary">
                {isAutoRefreshing ? 'Live Telemetry Active (Auto-refreshing 4s)' : 'Live Polling Paused'}
              </span>
              <span className="badge text-xs" style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.68rem' }}>
                60s Sliding Window • Max 30 Writes/Min
              </span>
            </div>

            <div className="d-flex align-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              >
                <Radio size={12} className={isAutoRefreshing ? 'text-success' : 'text-muted'} />
                {isAutoRefreshing ? 'Pause Live Polling' : 'Resume Live Polling'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xs d-flex align-center gap-1"
                onClick={fetchTelemetry}
                disabled={isTelemetryLoading}
              >
                <RotateCcw size={12} className={isTelemetryLoading ? 'animate-spin' : ''} />
                Poll Now
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-rose"
                onClick={() => handleResetClient('all')}
                title="Flush all active client rate limit quotas"
              >
                Flush All Quotas
              </button>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="card p-3 d-flex align-center gap-3">
              <div className="p-2.5 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Activity size={22} />
              </div>
              <div>
                <span className="text-xs text-muted d-block">Active Write Clients</span>
                <span className="font-bold text-md text-primary">
                  {telemetry.totalActiveTrackers} <span className="text-xs text-muted">(In 60s Window)</span>
                </span>
              </div>
            </div>

            <div className="card p-3 d-flex align-center gap-3">
              <div 
                className="p-2.5 rounded" 
                style={{ 
                  background: telemetry.throttledCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)', 
                  color: telemetry.throttledCount > 0 ? '#ef4444' : '#10b981' 
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <span className="text-xs text-muted d-block">Throttled Clients (429)</span>
                <span className="font-bold text-md" style={{ color: telemetry.throttledCount > 0 ? '#ef4444' : 'var(--brand-dark)' }}>
                  {telemetry.throttledCount} <span className="text-xs text-muted">({telemetry.throttledCount > 0 ? 'Blocking write requests' : 'Zero blocked'})</span>
                </span>
              </div>
            </div>

            <div className="card p-3 d-flex align-center gap-3">
              <div className="p-2.5 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <UserX size={22} />
              </div>
              <div>
                <span className="text-xs text-muted d-block">Restricted Accounts (403)</span>
                <span className="font-bold text-md text-primary">
                  {telemetry.restrictedUsers?.length || 0} <span className="text-xs text-muted">(Audit Banned)</span>
                </span>
              </div>
            </div>

            <div className="card p-3 d-flex align-center gap-3">
              <div className="p-2.5 rounded" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-xs text-muted d-block">Admin Exemption Status</span>
                <span className="font-bold text-md text-success">
                  Active <span className="text-xs text-muted">(Unlimited writes)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Alert Box for Throttled Clients (429) */}
          {telemetry.throttledCount > 0 && (
            <div className="card p-3 border" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
              <div className="d-flex align-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-rose flex-shrink-0" />
                <h4 className="font-bold text-xs text-primary mb-0">
                  Rate Limit Threshold Exceeded — {telemetry.throttledCount} Client(s) Currently Receiving HTTP 429
                </h4>
              </div>
              <div className="d-flex flex-column gap-2">
                {telemetry.trackedClients.filter(c => c.isThrottled).map(tc => (
                  <div key={tc.clientId} className="p-2.5 bg-white rounded border d-flex align-center justify-between gap-3 flex-wrap">
                    <div className="d-flex align-center gap-2">
                      <span className="badge font-bold" style={{ background: '#ffe4e6', color: '#e11d48', fontSize: '0.7rem' }}>
                        429 BLOCKED
                      </span>
                      <strong className="text-xs">{tc.user?.name || tc.clientId}</strong>
                      {tc.user?.handle && <span className="text-xs text-muted">({tc.user.handle})</span>}
                      <span className="text-xs text-muted">• IP: {tc.ip}</span>
                    </div>
                    <div className="d-flex align-center gap-2">
                      <span className="text-xs font-bold text-rose">
                        {tc.count} writes submitted (Limit: 30)
                      </span>
                      <span className="badge text-xs" style={{ background: '#fef3c7', color: '#b45309' }}>
                        Resets in {tc.remainingSeconds}s
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleResetClient(tc.clientId)}
                      >
                        Unblock / Clear Quota
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tabs / Filter Selector */}
          <div className="d-flex align-center justify-between gap-2 border-bottom pb-2 flex-wrap">
            <div className="d-flex align-center gap-2">
              <button
                type="button"
                className={`btn btn-xs ${telemetryFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTelemetryFilter('all')}
              >
                All Active Trackers ({telemetry.trackedClients?.length || 0})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${telemetryFilter === 'throttled' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTelemetryFilter('throttled')}
              >
                Throttled ({telemetry.throttledCount || 0})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${telemetryFilter === 'restricted' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTelemetryFilter('restricted')}
              >
                Restricted Accounts ({telemetry.restrictedUsers?.length || 0})
              </button>
            </div>

            <span className="text-xs text-muted">
              Live in-memory telemetry
            </span>
          </div>

          {/* Tracked Clients Table (when filter is 'all' or 'throttled') */}
          {telemetryFilter !== 'restricted' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-3 border-bottom d-flex align-center justify-between" style={{ background: '#f8fafc' }}>
                <div className="d-flex align-center gap-2">
                  <Activity size={16} className="text-brand" />
                  <h4 className="font-bold text-xs text-primary mb-0">Active Client Rate Limit Sessions</h4>
                </div>
                <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                  Tracks write load per account or IP over a rolling 60-second window
                </span>
              </div>

              {telemetry.trackedClients?.length === 0 ? (
                <div className="p-5 text-center text-muted">
                  <Activity size={36} className="text-muted mx-auto mb-2 opacity-60" />
                  <h4 className="font-bold text-sm text-primary mb-1">No Active Write Bursts Detected</h4>
                  <p className="text-xs text-muted mb-0">
                    All client quotas are idle at 0/30 writes. As users create posts, requests, or comments, their live frequency will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead>
                      <tr className="border-bottom" style={{ background: '#f8fafc', fontSize: '0.75rem' }}>
                        <th className="p-3 text-left">Client / User</th>
                        <th className="p-3 text-left">Writes Used in Window</th>
                        <th className="p-3 text-center">Remaining Quota</th>
                        <th className="p-3 text-center">Cooldown / Reset</th>
                        <th className="p-3 text-left">Last Activity</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetry.trackedClients
                        .filter(tc => telemetryFilter === 'throttled' ? tc.isThrottled : true)
                        .map((tc) => {
                          const percent = Math.min(100, Math.round((tc.count / tc.maxWrites) * 100));
                          const isNearLimit = tc.count >= 20 && !tc.isThrottled;
                          const barColor = tc.isThrottled ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981';

                          return (
                            <tr key={tc.clientId} className="border-bottom text-xs">
                              <td className="p-3">
                                <div className="d-flex align-center gap-2">
                                  {tc.user ? (
                                    <>
                                      <img
                                        src={tc.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                        alt=""
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                      />
                                      <div>
                                        <span className="font-bold text-primary d-block">{tc.user.name}</span>
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                          {tc.user.handle} • {tc.ip}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div>
                                      <span className="badge font-bold" style={{ background: '#f1f5f9', color: '#475569' }}>
                                        Anonymous IP
                                      </span>
                                      <span className="text-primary font-bold d-block mt-0.5">{tc.ip}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="p-3" style={{ minWidth: '180px' }}>
                                <div className="d-flex align-center justify-between mb-1">
                                  <span className="font-bold" style={{ color: barColor }}>
                                    {tc.count} / {tc.maxWrites} writes
                                  </span>
                                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                                    {percent}%
                                  </span>
                                </div>
                                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ 
                                      height: '100%', 
                                      width: `${percent}%`, 
                                      backgroundColor: barColor, 
                                      transition: 'width 0.3s ease' 
                                    }} 
                                  />
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <span 
                                  className="badge font-bold"
                                  style={{
                                    background: tc.isThrottled ? '#fee2e2' : '#f0fdf4',
                                    color: tc.isThrottled ? '#b91c1c' : '#15803d',
                                    fontSize: '0.72rem'
                                  }}
                                >
                                  {tc.isThrottled ? '0 (429 Throttled)' : `${tc.remainingWrites} writes left`}
                                </span>
                              </td>

                              <td className="p-3 text-center text-muted">
                                <span className="d-inline-flex align-center gap-1">
                                  <Clock size={12} />
                                  Resets in {tc.remainingSeconds}s
                                </span>
                              </td>

                              <td className="p-3">
                                <span className="d-block font-bold text-primary" style={{ fontSize: '0.7rem' }}>
                                  {tc.lastMethod || 'POST'} {tc.lastPath || '/'}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                                  {tc.lastActionAt ? new Date(tc.lastActionAt).toLocaleTimeString() : 'Recently'}
                                </span>
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleResetClient(tc.clientId)}
                                >
                                  Reset Quota
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Restricted Accounts Table (when filter is 'restricted' or list has items) */}
          {telemetryFilter === 'restricted' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-3 border-bottom d-flex align-center justify-between" style={{ background: '#f8fafc' }}>
                <div className="d-flex align-center gap-2">
                  <UserX size={16} className="text-rose" />
                  <h4 className="font-bold text-xs text-primary mb-0">Restricted Accounts (HTTP 403 Write Block)</h4>
                </div>
                <span className="text-xs text-muted" style={{ fontSize: '0.72rem' }}>
                  Accounts permanently disabled from write operations due to administrative enforcement
                </span>
              </div>

              {telemetry.restrictedUsers?.length === 0 ? (
                <div className="p-5 text-center text-muted">
                  <CheckCircle2 size={36} className="text-success mx-auto mb-2 opacity-60" />
                  <h4 className="font-bold text-sm text-primary mb-1">No Restricted Accounts</h4>
                  <p className="text-xs text-muted mb-0">
                    Zero accounts are currently restricted. All platform users in good standing have active write access.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead>
                      <tr className="border-bottom" style={{ background: '#f8fafc', fontSize: '0.75rem' }}>
                        <th className="p-3 text-left">Restricted Member</th>
                        <th className="p-3 text-left">Enforcement Justification</th>
                        <th className="p-3 text-left">Restricted By</th>
                        <th className="p-3 text-left">Date Restricted</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetry.restrictedUsers.map((ru) => (
                        <tr key={ru.id} className="border-bottom text-xs">
                          <td className="p-3">
                            <div className="d-flex align-center gap-2">
                              <img
                                src={ru.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                                alt=""
                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <span className="font-bold text-primary d-block">{ru.name}</span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{ru.handle}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="badge font-bold" style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem' }}>
                              ⚠️ {ru.restriction_reason || 'Violation of community guidelines'}
                            </span>
                          </td>

                          <td className="p-3 text-muted">
                            {ru.restrictedByName || 'System Administrator'}
                          </td>

                          <td className="p-3 text-muted">
                            {ru.restricted_at ? new Date(ru.restricted_at).toLocaleString() : 'Recently'}
                          </td>

                          <td className="p-3 text-right">
                            <div className="d-flex align-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => openUserDossier(ru.id)}
                              >
                                View Dossier
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                                onClick={() => handleUnrestrictUser(ru.id)}
                              >
                                Reinstate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Architecture Reference Cards */}
          <div className="card p-4">
            <h3 className="font-bold text-xs text-primary mb-2 d-flex align-center gap-2">
              <Gauge size={16} className="text-brand" />
              Policy & Technical Specifications Reference
            </h3>
            <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div className="p-3 rounded border" style={{ background: '#f8fafc' }}>
                <span className="font-bold text-xs text-primary d-block mb-1">Maximum Write Frequency</span>
                <span className="text-lg font-bold text-brand d-block mb-1">30 Requests / Min</span>
                <p className="text-xs text-muted mb-0">
                  Enforced on individual accounts or IP addresses. Exceeding returns HTTP 429 with dynamic countdown.
                </p>
              </div>

              <div className="p-3 rounded border" style={{ background: '#f0fdf4' }}>
                <span className="font-bold text-xs text-primary d-block mb-1">System Administrator Exemption</span>
                <span className="text-lg font-bold text-success d-block mb-1">Unlimited (Exempt)</span>
                <p className="text-xs text-muted mb-0">
                  System Administrators and emergency coordinators are exempt to ensure uninterrupted emergency operations.
                </p>
              </div>

              <div className="p-3 rounded border" style={{ background: '#fef2f2' }}>
                <span className="font-bold text-xs text-primary d-block mb-1">Account Restriction Enforcement</span>
                <span className="text-lg font-bold text-rose d-block mb-1">HTTP 403 Forbidden</span>
                <p className="text-xs text-muted mb-0">
                  Restricted accounts have their write privileges disabled while preserving full audit logs and historical evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGovernanceView;
