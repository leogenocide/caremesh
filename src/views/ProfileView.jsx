import { useState } from 'react';
import { useCareMesh } from '../context/useCareMesh';
import { PlanStatusBadge } from '../components/common/Badge';
import { 
  MapPin, 
  Package, 
  HandHeart, 
  Lock, 
  RefreshCw,
  CheckCircle2,
  Edit3
} from 'lucide-react';

export const ProfileView = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    resources, 
    requests, 
    plans, 
    resetToSeedData,
    viewPlanDetail,
    navigateTo 
  } = useCareMesh();

  const [activeSubTab, setActiveSubTab] = useState('contributions'); // 'contributions' | 'resources' | 'privacy'

  // User's linked items
  const myResources = resources.filter(res => res.provider?.id === currentUser.id);
  const myRequests = requests.filter(r => r.requester?.id === currentUser.id || r.responses?.some(resp => resp.user?.id === currentUser.id));
  const myPlans = plans.filter(p => p.participants?.some(part => part.user?.id === currentUser.id));

  const togglePrivacy = (key) => {
    setCurrentUser(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: !prev.privacySettings?.[key]
      }
    }));
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
      {/* Profile Header Card */}
      <div className="card p-4">
        <div className="d-flex align-start justify-between flex-wrap gap-3 mb-4">
          <div className="d-flex align-start gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary-500)',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <div>
              <div className="d-flex align-center gap-2">
                <h2 className="text-xl font-bold text-primary">{currentUser.name}</h2>
                <span className="badge badge-primary text-xs">Community Coordinator</span>
              </div>
              <span className="text-xs font-semibold text-brand d-block mb-1">{currentUser.handle}</span>
              <span className="text-xs font-medium text-secondary d-block mb-2">{currentUser.role}</span>
              <span className="d-flex align-center gap-1 text-xs text-muted">
                <MapPin size={13} /> {currentUser.location.address}
              </span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const newBio = prompt('Update your bio / coordination focus:', currentUser.bio);
                if (newBio !== null) {
                  setCurrentUser(prev => ({ ...prev, bio: newBio }));
                }
              }}
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-secondary mb-4" style={{ lineHeight: '1.5', maxWidth: '720px' }}>
          {currentUser.bio}
        </p>

        {/* Impact & Contribution Stats Ribbon */}
        <div className="stats-grid gap-2 p-3 card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div className="text-center">
            <span className="font-bold text-lg text-primary d-block">{currentUser.stats.contributions}</span>
            <span className="text-xs text-muted">Total Contributions</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-lg text-brand d-block">{currentUser.stats.requestsFulfilled}</span>
            <span className="text-xs text-muted">Requests Fulfilled</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-lg text-amber d-block">{myResources.length}</span>
            <span className="text-xs text-muted">Resources Shared</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-lg text-purple d-block">{myPlans.length}</span>
            <span className="text-xs text-muted">Plans Joined</span>
          </div>
        </div>

        {/* Skills & Badges */}
        <div className="mt-4 pt-3 border-top">
          <span className="text-xs font-bold text-secondary text-uppercase d-block mb-2">
            Community Skills & Capabilities
          </span>
          <div className="d-flex gap-2 flex-wrap">
            {currentUser.skills.map((skill, idx) => (
              <span key={idx} className="badge badge-gray text-xs">
                <CheckCircle2 size={12} className="text-brand" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div className="touch-scroll-x gap-2 border-bottom pb-2">
        <button
          className={`btn btn-sm ${activeSubTab === 'contributions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('contributions')}
        >
          <HandHeart size={14} />
          <span>Active Plans & Needs ({myPlans.length + myRequests.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === 'resources' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('resources')}
        >
          <Package size={14} />
          <span>Shared Resources ({myResources.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeSubTab === 'privacy' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('privacy')}
        >
          <Lock size={14} />
          <span>Privacy & Prototype Settings</span>
        </button>
      </div>

      {/* TAB 1: CONTRIBUTIONS & PLANS */}
      {activeSubTab === 'contributions' && (
        <div className="d-flex flex-column gap-3">
          <h4 className="font-bold text-sm text-primary">Participating Long-term Plans</h4>
          <div className="d-flex flex-column gap-2">
            {myPlans.map(plan => {
              const completedCount = plan.milestones?.filter(m => m.status === 'completed').length || 0;
              const totalCount = plan.milestones?.length || 0;

              return (
                <div 
                  key={plan.id} 
                  className="card p-3 card-interactive cursor-pointer d-flex align-center justify-between"
                  onClick={() => viewPlanDetail(plan)}
                >
                  <div>
                    <h5 className="font-bold text-sm text-primary mb-1">{plan.title}</h5>
                    <span className="text-xs text-muted">
                      {completedCount} of {totalCount} Milestones Completed · {plan.problemStatement}
                    </span>
                  </div>
                  <PlanStatusBadge status={plan.overallStatus || 'in_progress'} />
                </div>
              );
            })}
          </div>

          <h4 className="font-bold text-sm text-primary mt-3">My Help Requests & Volunteer Pledges</h4>
          <div className="d-flex flex-column gap-2">
            {myRequests.map(req => (
              <div 
                key={req.id} 
                className="card p-3 d-flex align-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-sm text-primary mb-1">{req.title}</h5>
                  <span className="text-xs text-muted">{req.location?.address} • {req.status}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigateTo('collaborate', 'requests', req.id)}
                >
                  View in Hub
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY RESOURCES */}
      {activeSubTab === 'resources' && (
        <div className="d-flex flex-column gap-3">
          {myResources.map(res => (
            <div key={res.id} className="card p-4">
              <div className="d-flex align-center justify-between mb-2">
                <span className="badge badge-primary text-xs">{res.contributionType}</span>
                <span className="text-xs text-muted">{res.availability}</span>
              </div>
              <h4 className="font-bold text-sm text-primary mb-1">{res.title}</h4>
              <p className="text-xs text-secondary mb-2">{res.description}</p>
              <div className="text-xs text-muted">
                <strong>Capacity:</strong> {res.quantity} • <strong>Terms:</strong> {res.conditionsTerms}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PRIVACY & PROTOTYPE CONTROLS */}
      {activeSubTab === 'privacy' && (
        <div className="card p-4 d-flex flex-column gap-4">
          <div>
            <h4 className="font-bold text-sm text-primary mb-1">Privacy & Real-World Safety Controls</h4>
            <p className="text-xs text-secondary">
              CareMesh is built for physical safety. Choose what information neighbors and public viewers can see.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Display Exact Pinned Coordinates</span>
                <span className="text-xs text-muted">When off, only your general district/neighborhood is displayed.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.showExactLocation ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('showExactLocation')}
              >
                {currentUser.privacySettings?.showExactLocation ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Allow Direct Peer Coordination Messages</span>
                <span className="text-xs text-muted">Allows coordinators to message you about matched resources.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.allowDirectMessages ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('allowDirectMessages')}
              >
                {currentUser.privacySettings?.allowDirectMessages ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="d-flex align-center justify-between p-3 rounded" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div>
                <span className="font-bold text-xs text-primary d-block">Public Contribution History & Provenance Trail</span>
                <span className="text-xs text-muted">Displays your completed help requests and evidence submissions.</span>
              </div>
              <button
                className={`btn btn-sm ${currentUser.privacySettings?.publicContributionHistory ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePrivacy('publicContributionHistory')}
              >
                {currentUser.privacySettings?.publicContributionHistory ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Reset Prototype Data Button */}
          <div className="mt-3 pt-3 border-top d-flex align-center justify-between">
            <div>
              <span className="font-bold text-xs text-primary d-block">Reset Prototype Demo State</span>
              <span className="text-xs text-muted">Restore all original mock observations, plans, evidence, and requests.</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (confirm('Reset prototype to original seed state? All newly created items will be restored to defaults.')) {
                  resetToSeedData();
                  alert('Prototype state reset successfully.');
                }
              }}
            >
              <RefreshCw size={14} />
              <span>Reset to Seed Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
