import { useState } from 'react';
import { Modal } from '../common/Modal';
import { SeverityBadge } from '../common/Badge';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Eye,
  Trash2,
  Share2
} from 'lucide-react';

export const SafetyDetailModal = ({ isOpen, onClose, report }) => {
  const { 
    currentUser, 
    observations, 
    evidence, 
    inspectEntity,
    deleteSafetyReport,
    canUserManage,
    openShareSocialModal,
    viewUserProfile
  } = useCareMesh();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'mitigation'
  const [updateNote, setUpdateNote] = useState('');
  const [localUpdates, setLocalUpdates] = useState(report?.updatesLog || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  if (!report) return null;

  const reporterUser = (typeof report.reporter === 'object' && report.reporter !== null)
    ? report.reporter
    : (report.reporter || report.reporterId || report.reporter_id ? {
        id: report.reporterId || report.reporter_id || report.reporter,
        name: report.reporterName || 'Field Reporter',
        avatar: report.reporterAvatar,
        handle: report.reporterHandle || '@reporter'
      } : null);

  const linkedObs = (observations || []).filter(obs => 
    report.relatedObservationIds?.includes(obs.id)
  );

  const linkedEv = (evidence || []).filter(ev => 
    report.evidenceIds?.includes(ev.id)
  );

  const handleAddUpdate = (e) => {
    e.preventDefault();
    if (!updateNote.trim()) return;

    setIsSubmitting(true);
    const newEntry = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: `${updateNote.trim()} (Logged by ${currentUser.name})`
    };

    setLocalUpdates(prev => [...prev, newEntry]);
    setFeedbackNotice('Safety update note recorded to the emergency audit log.');
    setUpdateNote('');
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Critical Incident & Safety Hazard Report"
      maxWidth="680px"
    >
      <div className="d-flex flex-column gap-3.5">
        {/* Header Ribbon */}
        <div className="d-flex align-start justify-between flex-wrap gap-2 p-3 rounded" style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)' }}>
          <div className="d-flex flex-column gap-1.5 min-w-0">
            <div className="d-flex align-center gap-2 flex-wrap">
              <SeverityBadge severity={report.severity} />
              <span className="badge badge-gray text-xs text-uppercase font-semibold">{report.status || 'Active Hazard'}</span>
              <button
                type="button"
                className="btn btn-secondary btn-xs d-inline-flex align-center gap-1 ml-auto"
                onClick={() => openShareSocialModal(report, 'safety')}
                title="Share this safety report"
              >
                <Share2 size={12} />
                <span>Share Alert</span>
              </button>
            </div>
            <h3 className="font-bold text-lg text-primary mb-0">{report.title}</h3>
            <div className="d-flex align-center gap-3 text-xs text-muted flex-wrap">
              <span className="d-flex align-center gap-1 text-secondary font-medium">
                <MapPin size={12} className="text-rose" /> {report.location?.address || 'Maplewood Corridor'}
              </span>
              <span className="d-flex align-center gap-1">
                <Clock size={12} /> Reported {report.timestamp || 'Recently'}
              </span>
            </div>
          </div>

          {/* Reporter Card */}
          {reporterUser && (
            <div 
              className="d-flex align-center gap-2 p-2 rounded bg-white border flex-shrink-0 cursor-pointer card-interactive user-profile-trigger"
              onClick={() => {
                if (viewUserProfile) {
                  viewUserProfile(reporterUser);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (viewUserProfile) {
                    viewUserProfile(reporterUser);
                  }
                }
              }}
              title={`View ${reporterUser.name}'s profile`}
            >
              <img
                src={reporterUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={reporterUser.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="min-w-0">
                <div className="d-flex align-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-primary d-block text-truncate user-profile-name" style={{ maxWidth: '120px' }}>
                    {reporterUser.name}
                  </span>
                  <span className="badge badge-rose text-xs" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    Reporter
                  </span>
                </div>
                <span className="text-xs text-brand font-semibold d-block">{reporterUser.handle || '@reporter'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="touch-tab-nav flex-wrap border-bottom pb-1 gap-2">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('overview')}
          >
            Hazard Overview
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('timeline')}
          >
            Updates Timeline ({localUpdates.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'mitigation' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab('mitigation')}
          >
            Mitigation Actions ({report.mitigationActions?.length || 0})
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald d-flex align-center gap-2 text-xs">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* TAB 1: HAZARD OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label text-xs font-bold text-secondary mb-1">
                Hazard & Incident Description
              </label>
              <p className="text-xs text-primary p-3 rounded" style={{ background: 'var(--bg-subtle)', lineHeight: '1.6', border: '1px solid var(--border-light)' }}>
                {report.description}
              </p>
            </div>

            {/* Linked Observations */}
            {linkedObs.length > 0 && (
              <div>
                <span className="font-bold text-xs text-secondary d-block mb-1.5">
                  Linked Field Observations & Measurements ({linkedObs.length})
                </span>
                <div className="d-flex flex-column gap-1.5">
                  {linkedObs.map(obs => (
                    <div 
                      key={obs.id}
                      className="d-flex align-center justify-between p-2.5 rounded border bg-white card-interactive cursor-pointer"
                      onClick={() => inspectEntity(obs, 'observation')}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-primary d-block text-truncate">{obs.title}</span>
                        <span className="text-xs text-muted">{obs.location?.address} • {obs.timestamp}</span>
                      </div>
                      <span className="badge badge-primary text-xs d-flex align-center gap-1">
                        <Eye size={11} /> View
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Evidence */}
            {linkedEv.length > 0 && (
              <div>
                <span className="font-bold text-xs text-secondary d-block mb-1.5">
                  Attached Evidence & Photos ({linkedEv.length})
                </span>
                <div className="d-flex flex-column gap-1.5">
                  {linkedEv.map(ev => (
                    <div 
                      key={ev.id}
                      className="d-flex align-center justify-between p-2.5 rounded border bg-white card-interactive cursor-pointer"
                      onClick={() => inspectEntity(ev, 'evidence')}
                      title={`Inspect evidence: ${ev.title}`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-primary d-block text-truncate">{ev.title}</span>
                        <span className="text-xs text-muted">{ev.type} • {ev.timestamp}</span>
                      </div>
                      <span className="badge badge-primary text-xs d-flex align-center gap-1">
                        <Eye size={11} /> View Evidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPDATES TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="d-flex flex-column gap-3">
            {/* Add Update Note Form */}
            <form onSubmit={handleAddUpdate} className="p-3 rounded border d-flex flex-column gap-2" style={{ background: 'var(--bg-subtle)' }}>
              <span className="font-bold text-xs text-primary d-flex align-center gap-1.5">
                <Plus size={14} className="text-brand" />
                <span>Post Safety Status Update</span>
              </span>
              <textarea
                className="form-input text-xs"
                rows={2}
                placeholder="Log field update, emergency crew arrival, containment steps, or hazard clearance..."
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                required
              />
              <div className="d-flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-xs d-flex align-center gap-1"
                  disabled={isSubmitting}
                >
                  <Plus size={12} />
                  <span>Log Update</span>
                </button>
              </div>
            </form>

            {/* Chronological Log */}
            <div>
              <span className="font-bold text-xs text-secondary d-block mb-2">
                Emergency Actions & Updates Log
              </span>
              <div className="d-flex flex-column gap-2">
                {localUpdates.map((upd, idx) => (
                  <div key={idx} className="d-flex gap-2.5 p-2.5 rounded border bg-white align-start">
                    <span className="badge badge-primary text-xs font-semibold flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                      {upd.time}
                    </span>
                    <span className="text-xs text-secondary flex-1" style={{ lineHeight: '1.45' }}>
                      {upd.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MITIGATION ACTIONS */}
        {activeTab === 'mitigation' && (
          <div className="d-flex flex-column gap-3">
            <div>
              <span className="font-bold text-xs text-secondary d-block mb-2">
                Recommended Hazard Mitigations & Protocol Steps
              </span>
              {report.mitigationActions && report.mitigationActions.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {report.mitigationActions.map((action, idx) => (
                    <div key={idx} className="d-flex align-center gap-2.5 p-2.5 rounded border bg-white">
                      <CheckCircle2 size={16} className="text-brand flex-shrink-0" />
                      <span className="text-xs font-medium text-primary">{action}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded text-center border text-muted text-xs" style={{ background: 'var(--bg-subtle)' }}>
                  No standardized mitigation checklist attached.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="d-flex align-center justify-between gap-2 pt-2 border-top">
          <div>
            {canUserManage(report) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-rose d-flex align-center gap-1"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete safety report "${report.title}"? This action cannot be undone.`)) {
                    deleteSafetyReport(report.id);
                    onClose();
                  }
                }}
                title="Delete safety report"
              >
                <Trash2 size={13} />
                <span>Delete Report</span>
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm d-flex align-center gap-1"
              onClick={() => openShareSocialModal(report, 'safety')}
              title="Share this safety report"
            >
              <Share2 size={13} />
              <span>Share Alert</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default SafetyDetailModal;
