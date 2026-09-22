import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Image, 
  BarChart2, 
  HandHeart, 
  Pin, 
  Send, 
  X, 
  Plus, 
  Tag,
  Users 
} from 'lucide-react';

export const GroupPostComposer = ({ community }) => {
  const { 
    currentUser, 
    createPost, 
    requests, 
    observations, 
    plans, 
    resources = [],
    safetyReports = [],
    inspectEntity,
    toggleJoinCommunity, 
    openAuthModal, 
    showToast 
  } = useCareMesh();

  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Attachments
  const [activeAttachmentMode, setActiveAttachmentMode] = useState(null); // 'photo' | 'poll' | 'entity' | 'category' | null
  const [imageUrl, setImageUrl] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null); // { type, id, title }
  const [isPinned, setIsPinned] = useState(false);

  // Category state
  const [postCategory, setPostCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const isPlatformAdmin = Boolean(currentUser?.isAdmin);
  const isAdmin = Boolean(community?.adminIds?.includes(currentUser?.id) || isPlatformAdmin);
  const isJoined = Boolean(community?.isJoined || community?.memberIds?.includes(currentUser?.id) || isAdmin);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleUpdatePollOption = (index, value) => {
    const next = [...pollOptions];
    next[index] = value;
    setPollOptions(next);
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentUser?.id === 'usr_guest') {
      openAuthModal('login');
      showToast('Please sign in or create an account to post.', 'info');
      return;
    }

    if (!content.trim() && !pollQuestion.trim() && !imageUrl.trim()) {
      return;
    }

    let pollPayload = null;
    if (activeAttachmentMode === 'poll' && pollQuestion.trim()) {
      const validOptions = pollOptions
        .filter(opt => opt.trim().length > 0)
        .map((opt, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text: opt.trim(),
          votes: 0,
          voterIds: []
        }));

      if (validOptions.length >= 2) {
        pollPayload = {
          id: `poll_${Date.now()}`,
          question: pollQuestion.trim(),
          options: validOptions
        };
      }
    }

    let finalCategory = null;
    if (isCustomCategory) {
      finalCategory = customCategory.trim() || 'General';
    } else if (postCategory) {
      finalCategory = postCategory;
    }

    const extraData = {
      communityId: community?.id || null,
      mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : [],
      poll: pollPayload,
      isPinned: isPinned && isAdmin,
      category: finalCategory
    };

    createPost(content.trim() || (pollPayload ? `📊 Poll: ${pollPayload.question}` : 'Photo update'), selectedEntity, community?.id, extraData);

    // Reset
    setContent('');
    setImageUrl('');
    setSelectedEntity(null);
    setActiveAttachmentMode(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setIsPinned(false);
    setPostCategory('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setIsExpanded(false);
  };

  if (!isJoined) {
    return (
      <div 
        className="card p-3 mb-4 d-flex align-center justify-between gap-3 flex-wrap" 
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
      >
        <div className="d-flex align-center gap-2.5">
          <Users size={18} className="text-brand" />
          <span className="text-xs text-secondary">
            Join <strong>{community?.name || 'this community circle'}</strong> to post updates and participate in discussions.
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => {
            if (currentUser?.id === 'usr_guest') {
              openAuthModal('login');
              showToast('Please sign in or create an account to join.', 'info');
              return;
            }
            if (community?.id) toggleJoinCommunity(community.id);
          }}
        >
          + Join Group to Post
        </button>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="card p-3 mb-4" 
      style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
    >
      {/* Top Input Bar with Avatar */}
      <div className="d-flex align-start gap-3">
        <img
          src={currentUser?.avatar}
          alt={currentUser?.name || 'User'}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div className="flex-1 min-w-0" style={{ width: '100%', maxWidth: '100%' }}>
          <textarea
            placeholder={`Write something to ${community?.name || 'this circle'}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 1}
            className="form-textarea"
            style={{ 
              borderRadius: isExpanded ? 'var(--radius-md)' : 'var(--radius-full)', 
              padding: '0.65rem 1rem',
              resize: 'vertical',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Expanded Attachment Drawers */}
      {isExpanded && (
        <div className="d-flex flex-column gap-3 mt-3 pt-3 border-top">
          {/* Photo Attachment Drawer */}
          {activeAttachmentMode === 'photo' && (
            <div className="card p-3 animate-fade-in" style={{ background: 'var(--bg-subtle)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                  <Image size={14} className="text-brand" /> Attach Field Photo / Proof
                </span>
                <button type="button" className="btn-icon btn-xs text-muted" onClick={() => setActiveAttachmentMode(null)}>
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="form-input"
              />
              <div className="d-flex gap-2 mt-2">
                <button 
                  type="button" 
                  className="btn btn-xs btn-ghost text-muted"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80')}
                >
                  + Sample: Culvert Weir
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-ghost text-muted"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80')}
                >
                  + Sample: Creek Restoration
                </button>
              </div>
            </div>
          )}

          {/* Interactive Poll Creator Drawer */}
          {activeAttachmentMode === 'poll' && (
            <div className="card p-3 animate-fade-in" style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="font-bold text-xs text-blue-900 d-flex align-center gap-1">
                  <BarChart2 size={15} className="text-blue-600" /> Create Coordination Poll
                </span>
                <button type="button" className="btn-icon btn-xs text-muted" onClick={() => setActiveAttachmentMode(null)}>
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Ask a community question or scheduling inquiry..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="form-input mb-2 font-semibold"
              />
              <div className="d-flex flex-column gap-2 mb-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="d-flex align-center gap-2">
                    <span className="text-xs font-bold text-muted" style={{ width: '20px' }}>{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                      className="form-input flex-1"
                      style={{ padding: '0.35rem 0.65rem' }}
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" className="btn-icon btn-xs text-rose" onClick={() => handleRemovePollOption(idx)}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button type="button" className="btn btn-ghost btn-xs text-brand font-semibold" onClick={handleAddPollOption}>
                  <Plus size={13} /> Add Option
                </button>
              )}
            </div>
          )}

          {/* Entity Linker Drawer */}
          {activeAttachmentMode === 'entity' && (
            <div className="card p-3 animate-fade-in" style={{ background: 'var(--bg-subtle)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                  <HandHeart size={14} className="text-amber" /> Link CareMesh Real-World Object
                </span>
                <button type="button" className="btn-icon btn-xs text-muted" onClick={() => setActiveAttachmentMode(null)}>
                  <X size={14} />
                </button>
              </div>
              <select
                className="form-select text-xs"
                value={selectedEntity?.id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedEntity(null);
                    return;
                  }
                  const r = requests?.find(item => item.id === val);
                  if (r) { setSelectedEntity({ type: 'request', id: r.id, title: r.title, entity: r }); return; }
                  const o = observations?.find(item => item.id === val);
                  if (o) { setSelectedEntity({ type: 'observation', id: o.id, title: o.title, entity: o }); return; }
                  const p = plans?.find(item => item.id === val);
                  if (p) { setSelectedEntity({ type: 'plan', id: p.id, title: p.title, entity: p }); return; }
                  const res = resources?.find(item => item.id === val);
                  if (res) { setSelectedEntity({ type: 'resource', id: res.id, title: res.title, entity: res }); return; }
                  const s = safetyReports?.find(item => item.id === val);
                  if (s) { setSelectedEntity({ type: 'safety', id: s.id, title: s.title, entity: s }); return; }
                }}
              >
                <option value="">Select an active context object to embed...</option>
                <optgroup label="Help Requests & Needs">
                  {requests.map(r => (
                    <option key={r.id} value={r.id}>[Need] {r.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Field Observations">
                  {observations.map(o => (
                    <option key={o.id} value={o.id}>[Obs] {o.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Long-term Plans">
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>[Plan] {p.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Resources & Equipment">
                  {(resources || []).map(res => (
                    <option key={res.id} value={res.id}>[Resource] {res.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Safety Hazards">
                  {(safetyReports || []).map(s => (
                    <option key={s.id} value={s.id}>[Hazard] {s.title}</option>
                  ))}
                </optgroup>
              </select>

              {/* Selected Entity Card inside Drawer */}
              {selectedEntity && (
                <div className="mt-2.5 p-2 rounded bg-white border d-flex align-center justify-between gap-2">
                  <div className="d-flex align-center gap-2 min-w-0 flex-1">
                    <span className="badge badge-primary text-xs text-uppercase font-bold flex-shrink-0">
                      Linked {selectedEntity.type}
                    </span>
                    <span className="text-xs font-semibold text-primary truncate">
                      {selectedEntity.title}
                    </span>
                  </div>
                  <div className="d-flex align-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => inspectEntity(selectedEntity.entity || selectedEntity, selectedEntity.type)}
                      title="Inspect details of this linked item"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-xs text-rose"
                      onClick={() => setSelectedEntity(null)}
                      title="Remove linked object"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Tag Drawer */}
          {activeAttachmentMode === 'category' && (
            <div className="card p-3 animate-fade-in" style={{ background: 'var(--bg-subtle)' }}>
              <div className="d-flex align-center justify-between mb-2">
                <span className="font-bold text-xs text-primary d-flex align-center gap-1">
                  <Tag size={14} className="text-brand" /> Post Category
                </span>
                <button type="button" className="btn-icon btn-xs text-muted" onClick={() => setActiveAttachmentMode(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex gap-2 align-center">
                  <select
                    className="form-select text-xs flex-1"
                    value={isCustomCategory ? '__custom__' : postCategory}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setPostCategory(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select category (optional)...</option>
                    <option value="General">General</option>
                    <option value="Update">Update</option>
                    <option value="Event">Event</option>
                    <option value="Mutual Aid">Mutual Aid</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Urgent Alert">Urgent Alert</option>
                    <option value="__custom__">✨ + Custom Category...</option>
                  </select>
                  {(postCategory || isCustomCategory) && (
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost text-muted"
                      onClick={() => {
                        setPostCategory('');
                        setIsCustomCategory(false);
                        setCustomCategory('');
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {isCustomCategory && (
                  <div className="d-flex gap-2 align-center mt-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Enter custom category name (e.g. Flood Watch, Kitchen Crew)..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="form-input text-xs flex-1"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Pinned Announcement Toggle */}
          {isAdmin && (
            <div className="d-flex align-center justify-between p-2 rounded" style={{ background: isPinned ? 'var(--amber-50)' : 'transparent', border: isPinned ? '1px solid var(--amber-300)' : 'none' }}>
              <span className="text-xs text-primary font-semibold d-flex align-center gap-1">
                <Pin size={13} className="text-amber" /> Pin to Top as Community Announcement
              </span>
              <button
                type="button"
                className={`btn btn-xs ${isPinned ? 'btn-primary' : 'btn-secondary'}`}
                style={{ background: isPinned ? 'var(--amber-600)' : undefined }}
                onClick={() => setIsPinned(!isPinned)}
              >
                {isPinned ? 'Pinned' : 'Pin Notice'}
              </button>
            </div>
          )}

          {/* Attached Context Object Preview Banner */}
          {selectedEntity && (
            <div 
              className="p-2.5 rounded border d-flex align-center justify-between gap-2 animate-fade-in"
              style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}
            >
              <div className="d-flex align-center gap-2 min-w-0 flex-1">
                <span className="badge badge-primary text-xs text-uppercase font-bold flex-shrink-0">
                  Linked {selectedEntity.type}
                </span>
                <span className="text-xs font-semibold text-primary truncate" style={{ wordBreak: 'break-word' }}>
                  {selectedEntity.title}
                </span>
              </div>
              <div className="d-flex align-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => inspectEntity(selectedEntity.entity || selectedEntity, selectedEntity.type)}
                  title="Inspect full details of this linked item"
                >
                  Inspect Details
                </button>
                <button
                  type="button"
                  className="btn-icon btn-xs text-rose"
                  onClick={() => setSelectedEntity(null)}
                  title="Remove linked object"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attachment Triggers & Submit Row */}
      <div className="d-flex align-center justify-between gap-2 mt-2 pt-2 border-top flex-wrap">
        <div className="d-flex align-center gap-1 flex-wrap">
          <span className="text-xs text-muted font-medium mr-1 d-none d-sm-inline">Add to post:</span>
          
          <button
            type="button"
            className={`btn btn-xs ${activeAttachmentMode === 'photo' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setIsExpanded(true);
              setActiveAttachmentMode(activeAttachmentMode === 'photo' ? null : 'photo');
            }}
            title="Attach Photo"
          >
            <Image size={14} className="text-brand" />
            <span className="d-none d-md-inline">Photo</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs ${activeAttachmentMode === 'poll' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setIsExpanded(true);
              setActiveAttachmentMode(activeAttachmentMode === 'poll' ? null : 'poll');
            }}
            title="Create Poll"
          >
            <BarChart2 size={14} className="text-blue-600" />
            <span className="d-none d-md-inline">Poll</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs ${activeAttachmentMode === 'entity' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setIsExpanded(true);
              setActiveAttachmentMode(activeAttachmentMode === 'entity' ? null : 'entity');
            }}
            title="Link Need or Plan"
          >
            <HandHeart size={14} className="text-amber" />
            <span className="d-none d-md-inline">Link Need</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs ${activeAttachmentMode === 'category' || postCategory || isCustomCategory ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setIsExpanded(true);
              setActiveAttachmentMode(activeAttachmentMode === 'category' ? null : 'category');
            }}
            title="Add Category"
          >
            <Tag size={14} className={postCategory || isCustomCategory ? 'text-white' : 'text-brand'} />
            <span className="d-none d-md-inline">
              {isCustomCategory && customCategory.trim() 
                ? customCategory.trim() 
                : postCategory || 'Category'}
            </span>
          </button>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-sm"
          disabled={!content.trim() && !pollQuestion.trim() && !imageUrl.trim()}
        >
          <Send size={14} />
          <span>Post</span>
        </button>
      </div>
    </form>
  );
};
