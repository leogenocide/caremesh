export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tabs-container" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <div className="d-flex align-center gap-2">
              {tab.icon && tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`badge ${isActive ? 'badge-primary' : 'badge-gray'} text-xs`}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
