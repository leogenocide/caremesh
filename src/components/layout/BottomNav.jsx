import { useNavigate, useLocation } from 'react-router-dom';
import { useCareMesh } from '../../context/useCareMesh';
import { Home, Map, HandHeart, Target, Users, User } from 'lucide-react';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requests, plans } = useCareMesh();

  const openRequestsCount = requests?.filter(r => r.status === 'open' || r.status === 'partially_fulfilled').length || 0;
  const reviewPlansCount = plans?.filter(p => p.lifecycleStage === 'community_review' || p.lifecycleStage === 'draft').length || 0;

  const getActiveTab = () => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p.startsWith('/explore') || p.startsWith('/observations') || p.startsWith('/claims')) return 'explore';
    if (p.startsWith('/collaborate') || p.startsWith('/requests') || p.startsWith('/resources')) return 'collaborate';
    if (p.startsWith('/plans')) return 'plans';
    if (p.startsWith('/social')) return 'social';
    if (p.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'home', path: '/', label: 'Home', icon: <Home size={19} /> },
    { id: 'explore', path: '/explore', label: 'Explore', icon: <Map size={19} /> },
    { id: 'collaborate', path: '/collaborate', label: 'Action', icon: <HandHeart size={19} />, hasBadge: openRequestsCount > 0 },
    { id: 'plans', path: '/plans', label: 'Plans', icon: <Target size={19} />, hasBadge: reviewPlansCount > 0 },
    { id: 'social', path: '/social', label: 'Social', icon: <Users size={19} /> },
    { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={19} /> }
  ];

  return (
    <nav className="app-bottom-nav">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              navigate(item.path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {item.icon}
              {item.hasBadge && <span className="bottom-nav-badge" />}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
