import { useNavigate, useLocation } from 'react-router-dom';
import { useCareMesh } from '../../context/useCareMesh';
import { 
  Home, 
  Map, 
  HandHeart, 
  Target, 
  Users, 
  User, 
  ShieldCheck 
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requests, plans } = useCareMesh();

  const openRequestsCount = requests.filter(r => r.status === 'open' || r.status === 'partially_fulfilled').length;
  const activePlansCount = plans.filter(p => p.lifecycleStage !== 'outcome_evaluated').length;

  const getActiveTab = () => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (
      p.startsWith('/explore') || 
      p.startsWith('/observations') || 
      p.startsWith('/claims') || 
      p.startsWith('/evidence') || 
      p.startsWith('/safety') || 
      p.startsWith('/hazards')
    ) return 'explore';
    if (p.startsWith('/collaborate') || p.startsWith('/requests') || p.startsWith('/resources')) return 'collaborate';
    if (p.startsWith('/plans')) return 'plans';
    if (p.startsWith('/social') || p.startsWith('/events')) return 'social';
    if (p.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'home', path: '/', label: 'Home', icon: <Home size={19} /> },
    { id: 'explore', path: '/explore', label: 'Explore & World', icon: <Map size={19} /> },
    { 
      id: 'collaborate', 
      path: '/collaborate', 
      label: 'Collaborate', 
      icon: <HandHeart size={19} />, 
      badge: openRequestsCount > 0 ? `${openRequestsCount} Needs` : null 
    },
    { 
      id: 'plans', 
      path: '/plans', 
      label: 'Long-term Plans', 
      icon: <Target size={19} />, 
      badge: activePlansCount > 0 ? `${activePlansCount}` : null 
    },
    { id: 'social', path: '/social', label: 'Social & Groups', icon: <Users size={19} /> },
    { id: 'profile', path: '/profile', label: 'My Impact & Profile', icon: <User size={19} /> }
  ];

  return (
    <aside className="app-sidebar">
      {/* Navigation Links */}
      <nav className="d-flex flex-column gap-1 flex-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span className="nav-icon-wrapper">{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Provenance & Philosophy Banner */}
      <div 
        className="card p-3 mt-auto sidebar-philosophy-card" 
        style={{ 
          background: 'var(--primary-50)', 
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div className="d-flex align-center gap-2 mb-1">
          <ShieldCheck size={16} className="text-brand" />
          <span className="text-xs font-bold text-primary">CareMesh Philosophy</span>
        </div>
        <p className="text-xs text-secondary" style={{ fontSize: '0.74rem', lineHeight: '1.4', margin: 0 }}>
          From <em>"Observation"</em> → <em>"Understanding & Evidence"</em> → <em>"Coordination"</em> → <em>"Action & Measured Outcome"</em>.
        </p>
      </div>
    </aside>
  );
};
