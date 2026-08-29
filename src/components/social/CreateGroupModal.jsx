import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Globe, 
  Lock, 
  MapPin, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';

export const CreateGroupModal = () => {
  const { isCreateGroupModalOpen, closeCreateGroupModal, createCommunity } = useCareMesh();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState('environmental');
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [location, setLocation] = useState('Maplewood District');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80');
  const [avatarUrl] = useState('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80');

  const presetBanners = [
    { label: 'Watershed & River', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Community Support', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Urban Farm & Garden', url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Streets & Mobility', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Please provide a group name and description.');
      return;
    }

    createCommunity({
      name: name.trim(),
      handle: handle.trim() || `@${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category,
      privacy,
      location: location.trim(),
      description: description.trim(),
      banner: bannerUrl,
      avatar: avatarUrl
    });

    closeCreateGroupModal();
    setName('');
    setDescription('');
    setHandle('');
  };

  return (
    <Modal
      isOpen={isCreateGroupModalOpen}
      onClose={closeCreateGroupModal}
      title="Create a New Community Group"
      subtitle="Organize neighbors around shared geographic resilience, watershed protection, mutual aid, or food security."
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        {/* Group Name & Handle */}
        <div className="grid-2">
          <div>
            <label className="form-label font-bold text-sm text-primary">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!handle) setHandle(`@${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
              }}
              placeholder="e.g. Maplewood Flood Response Network"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label font-bold text-sm text-primary">Unique Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@mw_flood_net"
              className="form-input"
            />
          </div>
        </div>

        {/* Category & Privacy Mode */}
        <div className="grid-2">
          <div>
            <label className="form-label font-bold text-sm text-primary">Category Focus</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="environmental">🌱 Environmental & Flood Defense</option>
              <option value="mutual_aid">🤝 Mutual Aid & Senior Care</option>
              <option value="food_security">🍎 Food Sharing & Community Pantries</option>
              <option value="safety">🚸 Safe Streets & Pedestrian Mobility</option>
              <option value="tool_lending">🔧 Tool Lending & Repair Network</option>
            </select>
          </div>

          <div>
            <label className="form-label font-bold text-sm text-primary">Privacy Mode</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm flex-1 ${privacy === 'public' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPrivacy('public')}
              >
                <Globe size={14} />
                <span>Public</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-1 ${privacy === 'private' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPrivacy('private')}
              >
                <Lock size={14} />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>

        {/* Geographic Scope */}
        <div>
          <label className="form-label font-bold text-sm text-primary">Geographic Coverage Area</label>
          <div className="d-flex align-center" style={{ position: 'relative' }}>
            <MapPin size={15} className="text-muted" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. North Maplewood & River Basin"
              className="form-input"
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="form-label font-bold text-sm text-primary">Mission & Group Purpose</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe who this group is for and how members coordinate real-world actions..."
            className="form-textarea"
            required
          />
        </div>

        {/* Preset Cover Banner Picker */}
        <div>
          <label className="form-label font-bold text-xs text-muted text-uppercase">
            Choose a Cover Theme Banner
          </label>
          <div className="grid-4 gap-2 mb-2">
            {presetBanners.map((p, idx) => (
              <div
                key={idx}
                className="card p-1 cursor-pointer"
                style={{
                  border: bannerUrl === p.url ? '2px solid var(--primary-600)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
                onClick={() => setBannerUrl(p.url)}
              >
                <img src={p.url} alt="" style={{ height: '50px', width: '100%', objectFit: 'cover' }} />
                <span className="text-xs text-center d-block text-truncate mt-1" style={{ fontSize: '0.65rem' }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex align-center justify-between pt-3 border-top">
          <span className="text-xs text-muted d-flex align-center gap-1">
            <ShieldCheck size={13} className="text-brand" />
            <span>You will be established as Community Admin</span>
          </span>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={closeCreateGroupModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Create Group</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
