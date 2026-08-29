import { useState } from 'react';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Image, 
  BarChart2, 
  HandHeart, 
  Pin, 
  Send, 
  X, 
  Plus 
} from 'lucide-react';

export const GroupPostComposer = ({ community }) => {
  const { currentUser, createPost, requests, observations, plans } = useCareMesh();

  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Attachments
  const [activeAttachmentMode, setActiveAttachmentMode] = useState(null); // 'photo' | 'poll' | 'entity' | null
  const [imageUrl, setImageUrl] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null); // { type, id, title }
  const [isPinned, setIsPinned] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const isAdmin = community?.adminIds?.includes(currentUser.id);

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

    const extraData = {
      communityId: community?.id || null,
      mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : [],
      poll: pollPayload,
      isPinned: isPinned && isAdmin
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
    setIsExpanded(false);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="card p-3 mb-4" 
      style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}
    >
      {/* Top Input Bar with Avatar */}
      <div className="d-flex align-start gap-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
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
                value={selectedEntity ? `${selectedEntity.type}_${selectedEntity.id}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedEntity(null);
                    return;
                  }
                  if (val.startsWith('req_')) {
                    const r = requests.find(item => item.id === val);
                    if (r) setSelectedEntity({ type: 'request', id: r.id, title: r.title });
                  } else if (val.startsWith('obs_')) {
                    const o = observations.find(item => item.id === val);
                    if (o) setSelectedEntity({ type: 'observation', id: o.id, title: o.title });
                  } else if (val.startsWith('plan_')) {
                    const p = plans.find(item => item.id === val);
                    if (p) setSelectedEntity({ type: 'plan', id: p.id, title: p.title });
                  }
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
              </select>
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
