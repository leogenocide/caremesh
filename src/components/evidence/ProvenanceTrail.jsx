import { FileCheck } from 'lucide-react';

export const ProvenanceTrail = ({ chain = [] }) => {
  if (!chain || chain.length === 0) {
    return (
      <div className="text-xs text-muted p-2">
        Direct upload by author. No external verification log attached.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2 mt-2">
      {chain.map((step, idx) => (
        <div key={idx} className="d-flex align-start gap-2 text-xs text-secondary">
          <div className="d-flex align-center justify-center mt-1" style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', flexShrink: 0 }}>
            <FileCheck size={10} />
          </div>
          <div className="flex-1">
            <span className="font-medium text-primary">{step.step}</span>
            {step.time && <span className="text-muted ml-2">({step.time})</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
