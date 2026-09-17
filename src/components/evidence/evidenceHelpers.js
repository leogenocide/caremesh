import { 
  AlertCircle, 
  FileText, 
  Camera, 
  Activity, 
  FlaskConical, 
  Ruler, 
  Sparkles 
} from 'lucide-react';

export const getEvidenceBadgeConfig = (type, isContradicting = false) => {
  if (isContradicting) {
    return {
      label: 'Counter-Evidence',
      className: 'badge-rose',
      border: 'var(--rose-600)',
      bg: '#fff5f5',
      icon: AlertCircle
    };
  }

  const normalized = (type || '').toLowerCase();
  switch (normalized) {
    case 'measurement':
      return {
        label: 'Field Measurement',
        className: 'badge-primary',
        border: 'var(--primary-600)',
        bg: 'var(--primary-50, #f0fdf4)',
        icon: Ruler
      };
    case 'sensor':
      return {
        label: 'Sensor Telemetry',
        className: 'badge-secondary',
        border: '#0891b2',
        bg: '#ecfeff',
        icon: Activity
      };
    case 'lab_test':
      return {
        label: 'Lab Test Assay',
        className: 'badge-secondary',
        border: '#7c3aed',
        bg: '#f5f3ff',
        icon: FlaskConical
      };
    case 'photo':
      return {
        label: 'Geotagged Photo',
        className: 'badge-secondary',
        border: '#d97706',
        bg: '#fffbeb',
        icon: Camera
      };
    case 'document':
      return {
        label: 'Agency / Technical Document',
        className: 'badge-secondary',
        border: '#2563eb',
        bg: '#eff6ff',
        icon: FileText
      };
    default:
      return {
        label: type ? type.replace(/_/g, ' ') : 'Verified Record',
        className: 'badge-gray',
        border: 'var(--border-default)',
        bg: 'var(--bg-subtle)',
        icon: Sparkles
      };
  }
};
