import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LocationPicker } from '../common/LocationPicker';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Globe, 
  Lock, 
  ShieldCheck, 
  Plus,
  Upload 
} from 'lucide-react';

export const CreateGroupModal = () => {
  const { isCreateGroupModalOpen, closeCreateGroupModal, createCommunity } = useCareMesh();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState('environmental');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [location, setLocation] = useState({
    address: 'Maplewood District',
    lat: 37.7749,
    lng: -122.4194
  });
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

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    createCommunity({
      name: name.trim(),
      handle: handle.trim() || `@${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category: finalCategory,
      privacy,
      location: location.address ? location.address.trim() : 'Maplewood District',
      lat: location.lat,
      lng: location.lng,
      description: description.trim(),
      banner: bannerUrl,
      avatar: avatarUrl
    });

    closeCreateGroupModal();
    setName('');
    setDescription('');
    setHandle('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setLocation({
      address: 'Maplewood District',
      lat: 37.7749,
      lng: -122.4194
    });
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
            <div className="d-flex align-center justify-between mb-1">
              <label className="form-label font-bold text-sm text-primary mb-0">Category Focus</label>
              {isCustomCategory && (
                <span className="badge badge-primary text-xs" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                  Custom
                </span>
              )}
            </div>
            <select
              value={isCustomCategory ? '__custom__' : category}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomCategory(true);
                } else {
                  setIsCustomCategory(false);
                  setCategory(e.target.value);
                }
              }}
              className="form-select"
            >
              <option value="environmental">🌱 Environmental & Flood Defense</option>
              <option value="mutual_aid">🤝 Mutual Aid & Senior Care</option>
              <option value="food_security">🍎 Food Sharing & Community Pantries</option>
              <option value="safety">🚸 Safe Streets & Pedestrian Mobility</option>
              <option value="tool_lending">🔧 Tool Lending & Repair Network</option>
              <option value="__custom__">✨ + Custom Category...</option>
            </select>

            {isCustomCategory && (
              <div className="mt-2 d-flex align-center gap-1.5">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Solar Cooperative, Pet Rescue..."
                  className="form-input text-xs"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-muted"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCustomCategory('');
                    setCategory('environmental');
                  }}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            )}
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

        {/* Geographic Scope & Coordinates */}
        <LocationPicker
          value={location}
          onChange={setLocation}
          label="Geographic Coverage Area & Coordinates"
          placeholder="e.g. North Maplewood & River Basin"
        />

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
          <div className="create-group-banners-grid mb-2">
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

          <div className="d-flex align-center justify-between mt-2 pt-1">
            <span className="text-xs text-muted">Or upload your own custom photo:</span>
            <label className="btn btn-secondary btn-xs d-flex align-center gap-1 cursor-pointer mb-0">
              <Upload size={12} />
              <span>Upload Custom Banner</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                      setBannerUrl(ev.target.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                style={{ display: 'none' }}
              />
            </label>
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
