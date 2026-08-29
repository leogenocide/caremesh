import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Eye, 
  HandHeart, 
  Package, 
  Calendar, 
  Target, 
  ShieldAlert, 
  Send 
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
    createSafetyReport
  } = useCareMesh();

  const [activeTypeOverride, setActiveTypeOverride] = useState(null);
  const activeType = activeTypeOverride || createModalType || 'observation';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title && activeType !== 'plan') {
      alert('Please enter a title or summary.');
      return;
    }

    const payload = {
      ...formData,
      lat: createModalPrefill?.lat !== undefined ? createModalPrefill.lat : formData.lat,
      lng: createModalPrefill?.lng !== undefined ? createModalPrefill.lng : formData.lng,
      locationAddress: formData.locationAddress || createModalPrefill?.locationAddress || ''
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

    // Reset
    setActiveTypeOverride(null);
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
    { id: 'event', label: 'Event / Activity', icon: <Calendar size={16} /> },
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
      subtitle="Connect observations, requests, resources, events, and plans to real-world context."
      maxWidth="720px"
    >
      {/* Type Selector Tabs */}
      <div className="touch-scroll-x gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
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
            {activeType === 'event' && 'Event Title'}
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
              activeType === 'event' ? 'e.g. Saturday Morning Flood Diversion Operation' :
              activeType === 'plan' ? 'e.g. Willow Creek Watershed Ecological Restoration Plan' :
              'e.g. Flash flood risk along low-lying River Road'
            }
            className="form-input"
            required
          />
        </div>

        {/* Location & Category Grid */}
        <div className="grid-2">
          <div>
            <label className="form-label">Location / Address</label>
            <input
              type="text"
              name="locationAddress"
              value={formData.locationAddress || createModalPrefill?.locationAddress || ''}
              onChange={handleChange}
              placeholder="e.g. Elm St Bridge, Maplewood"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
            >
              <option value="environmental">Environmental / Ecological</option>
              <option value="community_need">Community Need & Mutual Aid</option>
              <option value="food_security">Food Security & Gleaning</option>
              <option value="safety_concern">Safety & Mobility Hazard</option>
              <option value="supplies">Supplies & Equipment</option>
              <option value="transport">Transportation</option>
              <option value="labor">Volunteer Labor</option>
            </select>
          </div>
        </div>

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
            <label className="form-label mt-2">Attached Photo / Proof URL</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="form-input"
            />
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

        {/* Event Specific */}
        {activeType === 'event' && (
          <div className="grid-3">
            <div>
              <label className="form-label">Event Type</label>
              <select name="eventType" value={formData.eventType} onChange={handleChange} className="form-select">
                <option value="assistance_operation">Assistance Operation</option>
                <option value="community_activity">Community Activity</option>
                <option value="volunteer_activity">Volunteer Workday</option>
                <option value="meeting">Planning Meeting</option>
                <option value="chat_only">Chat-Only Virtual Room</option>
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="text" name="date" value={formData.date} onChange={handleChange} placeholder="e.g. Saturday, Oct 26" className="form-input" />
            </div>
            <div>
              <label className="form-label">Time</label>
              <input type="text" name="time" value={formData.time} onChange={handleChange} placeholder="e.g. 10:00 AM - 1:00 PM" className="form-input" />
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
          </div>
        )}

        {/* Submit */}
        <div className="d-flex justify-end gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
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
