import { SeverityBadge } from '../common/Badge';
import { ShieldAlert, MapPin, Clock } from 'lucide-react';

export const SafetyReportCard = ({ report }) => {
  return (
    <div className="card p-4" style={{ borderLeft: '4px solid var(--rose-600)' }}>
      <div className="d-flex align-center justify-between gap-2 mb-2">
        <div className="d-flex align-center gap-2">
          <ShieldAlert size={18} className="text-rose" />
          <span className="text-xs font-bold text-rose text-uppercase">Safety Alert</span>
        </div>
        <SeverityBadge severity={report.severity} />
      </div>

      <h4 className="font-bold text-md text-primary mb-2">
        {report.title}
      </h4>

      <p className="text-xs text-secondary mb-3" style={{ lineHeight: '1.45' }}>
        {report.description}
      </p>

      {report.mitigationActions && report.mitigationActions.length > 0 && (
        <div className="mb-3 p-2" style={{ background: 'var(--rose-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--rose-100)' }}>
          <span className="text-xs font-bold text-rose d-block mb-1">Recommended Precautions & Active Actions:</span>
          <ul className="text-xs text-secondary pl-3" style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {report.mitigationActions.map((action, idx) => (
              <li key={idx} className="mb-1">{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="d-flex align-center justify-between text-xs text-muted pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
        <span className="d-flex align-center gap-1">
          <MapPin size={13} />
          <span>{report.location.address}</span>
        </span>
        <span className="d-flex align-center gap-1">
          <Clock size={13} />
          <span>{report.timestamp}</span>
        </span>
      </div>
    </div>
  );
};
