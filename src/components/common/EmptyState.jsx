import { Sparkles } from 'lucide-react';

export const EmptyState = ({
  icon = <Sparkles size={36} className="text-muted" />,
  title = 'No items found',
  description = 'There are currently no items matching your criteria in this view.',
  action = null
}) => {
  return (
    <div className="card d-flex flex-column align-center justify-center text-center p-5 gap-3" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-lg text-primary">{title}</h4>
        <p className="text-sm text-muted mt-1" style={{ maxWidth: '420px', margin: '0.25rem auto 0' }}>
          {description}
        </p>
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};
