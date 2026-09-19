import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { FileAttachmentPicker } from '../common/FileAttachmentPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Eye, 
  HandHeart, 
  Package, 
  Target, 
  ShieldAlert, 
  Send,
  Lock,
  Globe,
  Users,
  Calendar
} from 'lucide-react';

export const CreateModal = () => {
  const { 
    isCreateModalOpen, 
    closeCreateModal, 
    createModalType, 
    createModalPrefill,
    createObservation,
    createRequest,
    createResource,
    createEvent,
    createPlan,
    createSafetyReport,
    communities,
    currentUser,
    openAuthModal,
    showToast
  } = useCareMesh();

  const [activeTypeOverride, setActiveTypeOverride] = useState(null);
  const activeType = activeTypeOverride || createModalType || 'observation';
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [evidenceType, setEvidenceType] = useState('photo'); // 'photo' | 'measurement' | 'document' | 'sensor' | 'lab_test' | '__custom__'
  const [customEvidenceType, setCustomEvidenceType] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'environmental',
    locationAddress: '',
    lat: null,
    lng: null,
    // Observation specific
    claimText: '',
    imageUrl: '',
    // Request specific
    urgency: 'high',
    peopleNeeded: 4,
    requiredSkills: '',
    requiredResources: '',
    expiresAt: 'In 48 hours',
    communityId: createModalPrefill?.communityId || '',
    visibility: createModalPrefill?.visibility || (createModalPrefill?.communityId ? 'group_only' : 'public'),
    // Resource specific
    contributionType: 'lend',
    availability: 'immediate',
    quantity: '1 Unit',
    condition: 'Good condition',
    conditionsTerms: 'Free for community coordination',
    validUntil: 'Ongoing',
    // Event specific
    eventType: 'assistance_operation',
    date: 'Upcoming Weekend',
    time: '10:00 AM - 1:00 PM',
    maxParticipants: 10,
    // Proposal / Plan specific
    problemStatement: '',
    desiredOutcome: '',
    proposedApproach: '',
    resourcesNeeded: '',
    affectedParties: '',
    goals: '',
    overallStatus: 'planning',
    lifecycleStage: 'community_review',
    // Safety specific
    severity: 'high',
    mitigationActions: ''
  });

  const [prevPrefill, setPrevPrefill] = useState(createModalPrefill);
  if (createModalPrefill !== prevPrefill) {
    setPrevPrefill(createModalPrefill);
    if (createModalPrefill) {
      setFormData(prev => ({
        ...prev,
        communityId: createModalPrefill.communityId !== undefined ? createModalPrefill.communityId : prev.communityId,
        visibility: createModalPrefill.visibility || (createModalPrefill.communityId ? 'group_only' : prev.visibility || 'public')
      }));
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentUser?.id === 'usr_guest') {
      if (showToast) showToast('Please sign in or create an account to post entries.', 'info');
      closeCreateModal();
      openAuthModal('login');
      return;
    }

    if (!formData.title && activeType !== 'plan') {
      alert('Please enter a title or summary.');
      return;
    }

    const resolvedLat = formData.lat !== null && formData.lat !== undefined
      ? Number(formData.lat)
      : (createModalPrefill?.lat !== undefined ? Number(createModalPrefill.lat) : null);
    const resolvedLng = formData.lng !== null && formData.lng !== undefined
      ? Number(formData.lng)
      : (createModalPrefill?.lng !== undefined ? Number(createModalPrefill.lng) : null);
    const resolvedAddress = (formData.locationAddress || createModalPrefill?.locationAddress || '').trim();

    const imageFiles = attachedFiles.filter(f => f.isImage && f.dataUrl);
    const mediaUrls = imageFiles.map(f => f.dataUrl);
    if (formData.imageUrl && !mediaUrls.includes(formData.imageUrl)) {
      mediaUrls.push(formData.imageUrl);
    }

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : formData.category;
    const finalEvidenceType = evidenceType === '__custom__'
      ? (customEvidenceType.trim().toLowerCase() || 'photo')
      : evidenceType;

    const payload = {
      ...formData,
      category: finalCategory,
      evidenceType: finalEvidenceType,
      lat: resolvedLat,
      lng: resolvedLng,
      locationAddress: resolvedAddress,
      location: {
        address: resolvedAddress || 'Maplewood Local Area',
        lat: resolvedLat,
        lng: resolvedLng
      },
      mediaUrls,
      files: attachedFiles.map(f => ({ ...f, evidenceType: finalEvidenceType })),
      imageUrl: mediaUrls.length > 0 ? mediaUrls[0] : formData.imageUrl
    };

    if (activeType === 'observation') {
      createObservation(payload);
    } else if (activeType === 'request') {
      createRequest(payload);
    } else if (activeType === 'resource') {
      createResource(payload);
    } else if (activeType === 'event') {
      createEvent(payload);
    } else if (activeType === 'plan') {
      createPlan(payload);
    } else if (activeType === 'safety') {
      createSafetyReport(payload);
    }

    const labelMap = {
      observation: 'Field Observation',
      request: 'Help Request',
      resource: 'Resource Offering',
      event: 'Civic Event / Work Party',
      plan: 'Long-Term Plan Proposal',
      safety: 'Safety & Hazard Alert'
    };
    showToast(`${labelMap[activeType] || 'Record'} published successfully!`, 'success');

    // Reset
    setActiveTypeOverride(null);
    setAttachedFiles([]);
    setEvidenceType('photo');
    setCustomEvidenceType('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setFormData({
      title: '',
      description: '',
      category: 'environmental',
      locationAddress: '',
      lat: null,
      lng: null,
      claimText: '',
      imageUrl: '',
      urgency: 'high',
      peopleNeeded: 4,
      requiredSkills: '',
      requiredResources: '',
      expiresAt: 'In 48 hours',
      contributionType: 'lend',
      availability: 'immediate',
      quantity: '1 Unit',
      condition: 'Good condition',
      conditionsTerms: 'Free for community coordination',
      validUntil: 'Ongoing',
      eventType: 'assistance_operation',
      date: 'Upcoming Weekend',
      time: '10:00 AM - 1:00 PM',
      maxParticipants: 10,
      problemStatement: '',
      goals: '',
      severity: 'high',
      mitigationActions: ''
    });
  };

  const types = [
    { id: 'observation', label: 'Observation', icon: <Eye size={16} /> },
    { id: 'request', label: 'Help Request', icon: <HandHeart size={16} /> },
    { id: 'resource', label: 'Offer Resource', icon: <Package size={16} /> },
    { id: 'event', label: 'Civic Event', icon: <Calendar size={16} /> },
    { id: 'plan', label: 'Long-term Plan', icon: <Target size={16} /> },
    { id: 'safety', label: 'Safety Report', icon: <ShieldAlert size={16} /> }
  ];

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => {
        setActiveTypeOverride(null);
        closeCreateModal();
      }}
      title="Create CareMesh Coordination Entry"
      subtitle="Connect observations, requests, resources, civic events, plans, and safety reports to real-world context."
      maxWidth="720px"
    >
      {/* Type Selector Tabs */}
      <div className="touch-tab-nav mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
        {types.map(t => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${activeType === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTypeOverride(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {/* Title */}
        <div>
          <label className="form-label">
            {activeType === 'observation' && 'What did you observe?'}
            {activeType === 'request' && 'What help is needed?'}
            {activeType === 'resource' && 'What resource can you offer?'}
            {activeType === 'plan' && 'Plan Title'}
            {activeType === 'safety' && 'Hazard / Safety Alert Title'}
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={
              activeType === 'observation' ? 'e.g. Silt buildup clogging Elm St culvert intake' :
              activeType === 'request' ? 'e.g. Need 4 volunteers for sandbag line' :
              activeType === 'resource' ? 'e.g. 3-inch Honda Trash Pump with 100ft hose' :
              activeType === 'plan' ? 'e.g. Willow Creek Watershed Ecological Restoration Plan' :
              'e.g. Flash flood risk along low-lying River Road'
            }
            className="form-input"
            required
          />
        </div>

        {/* Category Selector */}
        <div>
          <div className="d-flex align-center justify-between mb-1">
            <label className="form-label mb-0">Category</label>
            {isCustomCategory && (
              <span className="badge badge-primary text-xs" style={{ fontSize: '0.7rem' }}>
                Custom Category Active
              </span>
            )}
          </div>
          <select
            name="category"
            value={isCustomCategory ? '__custom__' : formData.category}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustomCategory(true);
              } else {
                setIsCustomCategory(false);
                setFormData(prev => ({ ...prev, category: e.target.value }));
              }
            }}
            className="form-select"
          >
            <option value="environmental">Environmental / Ecological</option>
            <option value="community_need">Community Need & Mutual Aid</option>
            <option value="food_security">Food Security & Gleaning</option>
            <option value="safety_concern">Safety & Mobility Hazard</option>
            <option value="supplies">Supplies & Equipment</option>
            <option value="transport">Transportation</option>
            <option value="labor">Volunteer Labor</option>
            <option value="infrastructure">Infrastructure & Roads</option>
            <option value="health_wellness">Health & Wellness</option>
            <option value="__custom__">✨ + Add Custom Category...</option>
          </select>

          {isCustomCategory && (
            <div className="mt-2.5 p-3 rounded card animate-fade-in" style={{ background: 'var(--primary-50)', border: '1.5px dashed var(--primary-300)' }}>
              <label className="form-label text-xs font-bold text-primary mb-1 d-flex align-center gap-1">
                <span>Enter Custom Category Name</span>
                <span className="text-rose">*</span>
              </label>
              <div className="d-flex align-center gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                  }}
                  placeholder="e.g. Senior Well-Being, Solar Energy, Tool Lending, Animal Care..."
                  className="form-input text-xs"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-muted flex-shrink-0"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCustomCategory('');
                    setFormData(prev => ({ ...prev, category: 'environmental' }));
                  }}
                  title="Revert to preset categories"
                >
                  Cancel
                </button>
              </div>
              <span className="text-xs text-muted mt-1 d-block" style={{ fontSize: '0.72rem' }}>
                Your post will be tagged under this custom category and automatically displayed across feeds and filters.
              </span>
            </div>
          )}
        </div>

        {/* Location & Coordinates Picker */}
        <LocationPicker
          value={{
            address: formData.locationAddress || createModalPrefill?.locationAddress || '',
            lat: formData.lat !== null && formData.lat !== undefined ? formData.lat : (createModalPrefill?.lat ?? null),
            lng: formData.lng !== null && formData.lng !== undefined ? formData.lng : (createModalPrefill?.lng ?? null)
          }}
          onChange={({ address, lat, lng }) => {
            setFormData(prev => ({
              ...prev,
              locationAddress: address,
              lat,
              lng
            }));
          }}
          placeholder="e.g. Elm St Bridge, Maplewood"
          required
        />

        {/* Description / Problem Statement */}
        <div>
          <label className="form-label">
            {activeType === 'plan' ? 'Problem Statement & Context' : 'Detailed Description'}
          </label>
          <textarea
            name={activeType === 'plan' ? 'problemStatement' : 'description'}
            value={activeType === 'plan' ? formData.problemStatement : formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Provide context, observations, conditions, and why this matters to the community..."
            className="form-textarea"
            required
          />
        </div>

        {/* Observation Specific: Claim & Evidence Link */}
        {activeType === 'observation' && (
          <div className="card p-3" style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)' }}>
            <span className="text-xs font-bold text-primary d-block mb-1">
              Associate an Assertion Claim (Optional):
            </span>
            <p className="text-xs text-muted mb-2">
              Claims are transparent assertions that can be supported, investigated, or disputed with evidence.
            </p>
            <input
              type="text"
              name="claimText"
              value={formData.claimText}
              onChange={handleChange}
              placeholder="e.g. Water flow is reduced by ~65% threatening downstream properties"
              className="form-input mb-2"
            />
            <div className="mt-2">
              <label className="form-label font-bold text-xs text-primary d-flex align-center justify-between mb-1.5">
                <span>Evidence Record Type</span>
                <span className="text-xs text-muted font-normal">Classifies proof attached to this observation</span>
              </label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {[
                  { id: 'photo', label: '📷 Photo' },
                  { id: 'measurement', label: '📏 Measurement' },
                  { id: 'document', label: '📄 Document' },
                  { id: 'sensor', label: '📡 Sensor' },
                  { id: 'lab_test', label: '🧪 Lab Test' },
                  { id: '__custom__', label: '✨ Custom...' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-xs ${evidenceType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      background: evidenceType === t.id ? 'var(--primary-600)' : undefined,
                      color: evidenceType === t.id ? '#ffffff' : undefined,
                      fontWeight: evidenceType === t.id ? '700' : '500'
                    }}
                    onClick={() => setEvidenceType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {evidenceType === '__custom__' && (
                <input
                  type="text"
                  value={customEvidenceType}
                  onChange={(e) => setCustomEvidenceType(e.target.value)}
                  placeholder="Enter custom evidence type (e.g. acoustic survey)..."
                  className="form-input text-xs mb-2"
                  required
                />
              )}
              <FileAttachmentPicker
                files={attachedFiles}
                onChange={setAttachedFiles}
                label="Attach Field Photos & Proof from Device"
                helpText="Upload photos of what you observed, lab measurements, or telemetry from your phone or PC"
              />
            </div>
          </div>
        )}

        {/* Request Specific: Urgency & Resource Requirements */}
        {activeType === 'request' && (
          <div className="grid-2">
            <div>
              <label className="form-label">Urgency Level</label>
              <select name="urgency" value={formData.urgency} onChange={handleChange} className="form-select">
                <option value="low">Low (Flexible timing)</option>
                <option value="medium">Medium (Within 2-3 days)</option>
                <option value="high">High (Needed today)</option>
                <option value="critical">Critical (Immediate safety / emergency)</option>
              </select>
            </div>
            <div>
              <label className="form-label">People Needed</label>
              <input
                type="number"
                name="peopleNeeded"
                min="1"
                max="50"
                value={formData.peopleNeeded}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Required Skills (Comma separated)</label>
              <input
                type="text"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleChange}
                placeholder="e.g. Shoveling, First Aid, Heavy Lifting"
                className="form-input"
              />
            </div>

            {/* Community Group Affiliation & Visibility Scope */}
            <div style={{ gridColumn: 'span 2', background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)' }} className="p-3">
              <div className="mb-2">
                <label className="form-label font-bold text-primary d-flex align-center gap-1.5 mb-1">
                  <Users size={14} className="text-brand" />
                  <span>Link to Community Group (Optional)</span>
                </label>
                <p className="text-xs text-muted mb-2">
                  Associate this help request with a community group to coordinate member response.
                </p>
                <select
                  name="communityId"
                  value={formData.communityId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      communityId: val,
                      visibility: val ? (prev.visibility || 'group_only') : 'public'
                    }));
                  }}
                  className="form-select"
                >
                  <option value="">-- None (Global Public Request) --</option>
                  {(communities || []).filter(c => c.isJoined || c.adminIds?.includes(currentUser?.id) || c.id === formData.communityId).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.privacy === 'private' ? 'Private Circle' : 'Public Group'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Visibility Option */}
              {formData.communityId && (
                <div className="pt-2 border-top">
                  <label className="form-label font-bold text-primary mb-1.5">Visibility Scope</label>
                  <div className="d-flex flex-column gap-2">
                    <label 
                      className="d-flex align-start gap-2 p-2 rounded cursor-pointer border" 
                      style={{ 
                        background: formData.visibility === 'group_only' ? '#faf5ff' : '#ffffff', 
                        borderColor: formData.visibility === 'group_only' ? '#d8b4fe' : 'var(--border-light)' 
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="group_only"
                        checked={formData.visibility === 'group_only'}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-xs font-bold text-primary d-flex align-center gap-1">
                          <Lock size={12} className="text-purple" />
                          <span>Visible Only to Group</span>
                        </span>
                        <p className="text-xs text-secondary mb-0" style={{ fontSize: '0.73rem' }}>
                          Only verified members of this group can view, volunteer, or coordinate. Completely hidden from public discovery feeds.
                        </p>
                      </div>
                    </label>

                    <label 
                      className="d-flex align-start gap-2 p-2 rounded cursor-pointer border" 
                      style={{ 
                        background: formData.visibility === 'public' ? 'var(--bg-subtle)' : '#ffffff', 
                        borderColor: formData.visibility === 'public' ? 'var(--border-medium)' : 'var(--border-light)' 
                      }}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-xs font-bold text-primary d-flex align-center gap-1">
                          <Globe size={12} className="text-primary" />
                          <span>Public (Group + All Neighbors)</span>
                        </span>
                        <p className="text-xs text-secondary mb-0" style={{ fontSize: '0.73rem' }}>
                          Featured on the group page and also visible to all neighbors across Maplewood public feeds and map.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resource Specific: Contribution Type */}
        {activeType === 'resource' && (
          <div className="grid-2">
            <div>
              <label className="form-label">Contribution Type</label>
              <select name="contributionType" value={formData.contributionType} onChange={handleChange} className="form-select">
                <option value="lend">Equipment / Item Loan</option>
                <option value="donate">Direct Donation (Give away)</option>
                <option value="make_available">Open Community Access</option>
                <option value="offer_skill">Offer Specialized Skill</option>
                <option value="offer_time">Offer Volunteer Time</option>
                <option value="offer_transportation">Offer Vehicle / Transportation</option>
              </select>
            </div>
            <div>
              <label className="form-label">Availability</label>
              <select name="availability" value={formData.availability} onChange={handleChange} className="form-select">
                <option value="immediate">Immediate Availability</option>
                <option value="scheduled">Scheduled / By Appointment</option>
                <option value="on_call">On Call for Emergencies</option>
              </select>
            </div>
            <div>
              <label className="form-label">Quantity / Capacity</label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 1 Unit, 4 Passenger Seats"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Condition & Terms</label>
              <input
                type="text"
                name="conditionsTerms"
                value={formData.conditionsTerms}
                onChange={handleChange}
                placeholder="e.g. Will drop off on site"
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* Civic Event & Work Party Specific */}
        {activeType === 'event' && (
          <div className="grid-2">
            <div>
              <label className="form-label">Activity / Event Type</label>
              <select name="eventType" value={formData.eventType} onChange={handleChange} className="form-select">
                <option value="assistance_operation">Community Assistance Operation</option>
                <option value="volunteer_workday">Volunteer Workday / Clean-up</option>
                <option value="skill_share">Skill Share & Workshop</option>
                <option value="emergency_response">Emergency Response Team</option>
                <option value="planning_assembly">Community Planning Assembly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Max Participants Capacity</label>
              <input
                type="number"
                name="maxParticipants"
                min="1"
                max="100"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Scheduled Date / Day</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="e.g. Saturday, Oct 14 or Upcoming Weekend"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Time Window</label>
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="e.g. 9:00 AM - 1:00 PM"
                className="form-input"
                required
              />
            </div>
          </div>
        )}

        {/* Long-Term Proposal / Plan Specific */}
        {activeType === 'plan' && (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label font-bold text-primary">1. What problem are we trying to solve?</label>
              <textarea
                name="problemStatement"
                value={formData.problemStatement}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Persistent culvert clogging and sediment runoff during storm events threaten 35 nearby residences..."
                className="form-textarea"
                required
              />
            </div>

            <div>
              <label className="form-label font-bold text-primary">2. Desired outcome & measurable impact</label>
              <textarea
                name="desiredOutcome"
                value={formData.desiredOutcome}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Restore potable water flow to 45 L/min, protect downstream aquatic habitat, and secure community backup..."
                className="form-textarea"
                required
              />
            </div>

            <div>
              <label className="form-label font-bold text-primary">3. Proposed approach & methodology</label>
              <textarea
                name="proposedApproach"
                value={formData.proposedApproach}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Excavate clay blockage using low-impact hand-trenching during dry season, install bio-engineered gravel filters..."
                className="form-textarea"
                required
              />
            </div>

            <div className="grid-2">
              <div>
                <label className="form-label font-bold text-primary">4. Resources & materials needed</label>
                <textarea
                  name="resourcesNeeded"
                  value={formData.resourcesNeeded}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. 15 tons washed gravel, geotextile silt curtains, 6 volunteer workdays..."
                  className="form-textarea"
                />
              </div>

              <div>
                <label className="form-label font-bold text-primary">5. Who might be affected?</label>
                <textarea
                  name="affectedParties"
                  value={formData.affectedParties}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. 40 hillside households, downstream nesting bird sanctuary, trail hikers..."
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label className="form-label font-bold text-primary">Initial Proposal Stage</label>
                <select name="lifecycleStage" value={formData.lifecycleStage} onChange={handleChange} className="form-select">
                  <option value="community_review">Community Review & Critique (Recommended)</option>
                  <option value="draft">Draft Proposal (Private formulation)</option>
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-primary">Key Initial Goals (One per line)</label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  rows={2}
                  placeholder="1. Silt barrier staging&#10;2. Bio-filter stone placement"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        )}

        {/* Safety Specific */}
        {activeType === 'safety' && (
          <div className="d-flex flex-column gap-2">
            <div>
              <label className="form-label">Severity Level</label>
              <select name="severity" value={formData.severity} onChange={handleChange} className="form-select">
                <option value="critical">Critical (Immediate danger to life/property)</option>
                <option value="high">High (Imminent severe impact)</option>
                <option value="moderate">Moderate (Caution required)</option>
                <option value="low">Low (Advisory notice)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Recommended Precautions (One per line)</label>
              <textarea
                name="mitigationActions"
                value={formData.mitigationActions}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Avoid driving on Elm St during rain&#10;Place sandbags along north bank"
                className="form-textarea"
              />
            </div>

            <div className="card p-3 mt-1" style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-default)' }}>
              <FileAttachmentPicker
                files={attachedFiles}
                onChange={setAttachedFiles}
                label="Attach Hazard Photos & Documentation"
                helpText="Attach site photos or hazard documentation from your device"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="d-flex justify-end gap-2 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border-light)' }}>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={() => {
              setActiveTypeOverride(null);
              closeCreateModal();
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Send size={15} />
            <span>Publish to CareMesh</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
