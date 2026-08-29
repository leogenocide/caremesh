import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  XCircle,
  Eye,
  MessageSquare,
  Search,
  Lightbulb,
  FileCheck,
  Edit,
  Paperclip,
  ThumbsUp
} from 'lucide-react';

export const ClaimStatusBadge = ({ status }) => {
  const map = {
    supported: {
      label: 'Supported by Evidence',
      className: 'badge-claim-supported',
      icon: <CheckCircle2 size={13} />
    },
    under_assessment: {
      label: 'Under Assessment',
      className: 'badge-claim-assessment',
      icon: <Clock size={13} />
    },
    reported: {
      label: 'Reported Assertion',
      className: 'badge-gray',
      icon: <Eye size={13} />
    },
    disputed: {
      label: 'Disputed / Inaccurate',
      className: 'badge-claim-disputed',
      icon: <XCircle size={13} />
    },
    resolved: {
      label: 'Resolved',
      className: 'badge-claim-resolved',
      icon: <CheckCircle2 size={13} />
    },
    outdated: {
      label: 'Outdated Context',
      className: 'badge-claim-outdated',
      icon: <RefreshCw size={13} />
    }
  };

  const item = map[status] || map.reported;

  return (
    <span className={`badge ${item.className}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const map = {
    critical: { label: 'Critical Urgency', className: 'badge-rose', icon: <AlertTriangle size={12} /> },
    high: { label: 'High Priority', className: 'badge-amber', icon: <AlertTriangle size={12} /> },
    medium: { label: 'Medium Urgency', className: 'badge-blue', icon: <Clock size={12} /> },
    low: { label: 'Low Urgency', className: 'badge-gray', icon: <Clock size={12} /> }
  };

  const item = map[urgency] || map.medium;

  return (
    <span className={`badge ${item.className}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  const map = {
    critical: { label: 'Critical Hazard', className: 'badge-rose', icon: <ShieldAlert size={12} /> },
    high: { label: 'High Severity', className: 'badge-amber', icon: <AlertTriangle size={12} /> },
    moderate: { label: 'Moderate', className: 'badge-blue', icon: <AlertTriangle size={12} /> },
    low: { label: 'Low Severity', className: 'badge-gray', icon: <CheckCircle2 size={12} /> }
  };

  const item = map[severity] || map.moderate;

  return (
    <span className={`badge ${item.className}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const ResourceTypeBadge = ({ type }) => {
  const map = {
    donate: { label: 'Donation Offer', className: 'badge-primary' },
    lend: { label: 'Equipment Loan', className: 'badge-blue' },
    make_available: { label: 'Open Access', className: 'badge-purple' },
    offer_skill: { label: 'Specialized Skill', className: 'badge-amber' },
    offer_time: { label: 'Volunteer Hours', className: 'badge-primary' },
    offer_transportation: { label: 'Transportation Offer', className: 'badge-blue' }
  };

  const item = map[type] || { label: type || 'Resource', className: 'badge-gray' };

  return (
    <span className={`badge ${item.className}`}>
      <span>{item.label}</span>
    </span>
  );
};

export const LifecycleBadge = ({ stage }) => {
  const map = {
    draft: { label: '1. Draft Proposal', className: 'badge-gray', icon: <Edit size={11} /> },
    community_review: { label: '2. Community Review & Critique', className: 'badge-blue', icon: <Search size={11} /> },
    revised: { label: '3. Revised Draft', className: 'badge-purple', icon: <RefreshCw size={11} /> },
    accepted: { label: '4. Accepted Plan', className: 'badge-amber', icon: <FileCheck size={11} /> },
    active: { label: '5. Active Implementation', className: 'badge-primary', icon: <CheckCircle2 size={11} /> },
    completed: { label: '6. Completed & Evaluated', className: 'badge-primary', icon: <Sparkles size={11} /> },
    cancelled: { label: 'Cancelled / Withdrawn', className: 'badge-gray', icon: <XCircle size={11} /> },
    // Backward-compatibility aliases
    coordinating: { label: '2. Community Review', className: 'badge-blue', icon: <Search size={11} /> },
    plan_active: { label: '4. Accepted Plan', className: 'badge-amber', icon: <FileCheck size={11} /> },
    actions_underway: { label: '5. Active Implementation', className: 'badge-primary', icon: <CheckCircle2 size={11} /> },
    progress_review: { label: '3. Revised Draft', className: 'badge-purple', icon: <RefreshCw size={11} /> },
    outcome_evaluated: { label: '6. Completed & Evaluated', className: 'badge-primary', icon: <Sparkles size={11} /> }
  };

  const item = map[stage] || { label: stage || 'Plan', className: 'badge-gray', icon: <Sparkles size={11} /> };

  return (
    <span className={`badge ${item.className}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const PlanStatusBadge = ({ status }) => {
  const map = {
    planning: { label: 'Planning', className: 'badge-blue' },
    in_progress: { label: 'In Progress', className: 'badge-amber' },
    blocked: { label: 'Blocked', className: 'badge-rose' },
    completed: { label: 'Completed', className: 'badge-primary' },
    cancelled: { label: 'Cancelled', className: 'badge-gray' }
  };

  const item = map[status] || map.planning;

  return (
    <span className={`badge ${item.className} font-bold text-xs`}>
      <span>{item.label}</span>
    </span>
  );
};

export const MilestoneStatusBadge = ({ status }) => {
  const map = {
    completed: { label: 'Completed', className: 'badge-primary' },
    in_progress: { label: 'In Progress', className: 'badge-amber' },
    blocked: { label: 'Blocked', className: 'badge-rose' },
    pending: { label: 'Pending', className: 'badge-gray' }
  };

  const item = map[status] || map.pending;

  return (
    <span className={`badge ${item.className} text-xs`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
      <span>{item.label}</span>
    </span>
  );
};

export const FeedbackTypeBadge = ({ type }) => {
  const map = {
    support: { label: 'Support', className: 'badge-primary', icon: <ThumbsUp size={11} /> },
    critique: { label: 'Critique', className: 'badge-purple', icon: <Search size={11} /> },
    alternative: { label: 'Alternative Suggestion', className: 'badge-blue', icon: <Lightbulb size={11} /> },
    risk: { label: 'Risk / Concern', className: 'badge-rose', icon: <AlertTriangle size={11} /> },
    evidence: { label: 'Attached Evidence', className: 'badge-gray', icon: <Paperclip size={11} /> },
    modification: { label: 'Modification', className: 'badge-amber', icon: <Edit size={11} /> },
    comment: { label: 'Comment', className: 'badge-gray', icon: <MessageSquare size={11} /> }
  };

  const item = map[type] || map.comment;

  return (
    <span className={`badge ${item.className} text-xs font-semibold`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const FeedbackStatusBadge = ({ status }) => {
  const map = {
    open: { label: 'Open for Review', className: 'badge-gray' },
    adopted: { label: '✓ Adopted into Revision', className: 'badge-primary font-bold' },
    addressed: { label: 'Addressed in Notes', className: 'badge-blue' },
    under_discussion: { label: 'Under Discussion', className: 'badge-amber' }
  };

  const item = map[status] || map.open;

  return (
    <span className={`badge ${item.className} text-xs`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
      <span>{item.label}</span>
    </span>
  );
};
