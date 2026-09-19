import { useMemo } from 'react';
import { Globe, ExternalLink, Plus, Edit2 } from 'lucide-react';

// Platform Brand Definitions & Icons
const PLATFORMS = {
  twitter: {
    id: 'twitter',
    name: 'X',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    brandColor: '#0f172a',
    hoverBg: '#f8fafc',
    hoverBorder: '#334155',
    normalize: (val) => {
      const clean = val.replace(/^@/, '').trim();
      return clean.startsWith('http') ? clean : `https://x.com/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? (last.startsWith('@') ? last : `@${last}`) : 'X';
    }
  },
  x: {
    id: 'twitter', // alias
    name: 'X',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    brandColor: '#0f172a',
    hoverBg: '#f8fafc',
    hoverBorder: '#334155',
    normalize: (val) => {
      const clean = val.replace(/^@/, '').trim();
      return clean.startsWith('http') ? clean : `https://x.com/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? (last.startsWith('@') ? last : `@${last}`) : 'X';
    }
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
      </svg>
    ),
    brandColor: '#0a66c2',
    hoverBg: '#eff6ff',
    hoverBorder: '#0a66c2',
    normalize: (val) => {
      const clean = val.trim();
      if (clean.startsWith('http')) return clean;
      if (clean.startsWith('linkedin.com')) return `https://${clean}`;
      return `https://linkedin.com/in/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last && last !== 'in' ? last : 'LinkedIn';
    }
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    brandColor: '#24292f',
    hoverBg: '#f8fafc',
    hoverBorder: '#24292f',
    normalize: (val) => {
      const clean = val.replace(/^@/, '').trim();
      return clean.startsWith('http') ? clean : `https://github.com/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? `GitHub ${last}` : 'GitHub';
    }
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    brandColor: '#e1306c',
    hoverBg: '#fdf2f8',
    hoverBorder: '#e1306c',
    normalize: (val) => {
      const clean = val.replace(/^@/, '').trim();
      return clean.startsWith('http') ? clean : `https://instagram.com/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? (last.startsWith('@') ? last : `@${last}`) : 'Instagram';
    }
  },
  website: {
    id: 'website',
    name: 'Website',
    icon: ({ size = 13 }) => <Globe size={size} />,
    brandColor: '#059669',
    hoverBg: '#ecfdf5',
    hoverBorder: '#059669',
    normalize: (val) => {
      const clean = val.trim();
      return clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`;
    },
    formatLabel: (val) => {
      return val.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '') || 'Website';
    }
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    brandColor: '#1877f2',
    hoverBg: '#eff6ff',
    hoverBorder: '#1877f2',
    normalize: (val) => {
      const clean = val.trim();
      return clean.startsWith('http') ? clean : `https://facebook.com/${clean}`;
    },
    formatLabel: (val) => {
      const parts = val.replace(/\/$/, '').split('/');
      const last = parts[parts.length - 1];
      return last ? last : 'Facebook';
    }
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: ({ size = 13 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.13.17 1.76 2.69 4.27 3.77.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
      </svg>
    ),
    brandColor: '#25d366',
    hoverBg: '#f0fdf4',
    hoverBorder: '#22c55e',
    normalize: (val) => {
      const clean = val.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
      if (clean.startsWith('wa.me/')) return `https://${clean}`;
      const digits = clean.replace(/[^0-9]/g, '');
      return digits ? `https://wa.me/${digits}` : clean;
    },
    formatLabel: (val) => {
      const clean = val.trim();
      if (clean.startsWith('http') || clean.startsWith('wa.me')) {
        const parts = clean.replace(/\/$/, '').split('/');
        const last = parts[parts.length - 1];
        return last ? `WhatsApp (${last})` : 'WhatsApp';
      }
      return clean.length <= 18 ? `WhatsApp (${clean})` : 'WhatsApp';
    }
  }
};

/**
 * Checks whether user has chosen to hide their social links
 */
const isUserSocialLinksHidden = (user) => {
  if (!user) return false;
  const rawLinks = user.socialLinks || user.social || {};
  return Boolean(
    user.hideSocialLinks || 
    rawLinks.hideSocialLinks || 
    rawLinks.hidden || 
    user.privacySettings?.hideSocialLinks
  );
};

/**
 * Extracts and cleans user social links
 */
const getParsedSocialLinks = (user) => {
  if (!user) return [];

  // Check if user has chosen to hide their social links
  if (isUserSocialLinksHidden(user)) {
    return [];
  }

  const rawLinks = user.socialLinks || user.social || {};
  const list = [];
  const hasConfiguredKeys = typeof rawLinks === 'object' && !Array.isArray(rawLinks) && Object.keys(rawLinks).length > 0;

  // Parse structured object
  if (typeof rawLinks === 'object' && !Array.isArray(rawLinks)) {
    Object.entries(rawLinks).forEach(([key, value]) => {
      if (!value || typeof value !== 'string' || !value.trim()) return;
      if (key === 'hideSocialLinks' || key === 'hidden') return;
      const lowerKey = key.toLowerCase();
      const platformDef = PLATFORMS[lowerKey] || PLATFORMS.website;

      list.push({
        platformId: lowerKey,
        name: platformDef.name,
        rawUrl: value.trim(),
        url: platformDef.normalize(value),
        label: platformDef.formatLabel(value),
        icon: platformDef.icon,
        brandColor: platformDef.brandColor,
        hoverBg: platformDef.hoverBg,
        hoverBorder: platformDef.hoverBorder
      });
    });
  }

  // Graceful fallback: If no explicit social links object was ever configured,
  // generate a clean default based on user's handle so fresh profiles aren't bare.
  if (list.length === 0 && user.handle && !hasConfiguredKeys) {
    const rawHandle = user.handle.replace('@', '').trim();
    if (rawHandle && rawHandle !== 'guest') {
      const twitterDef = PLATFORMS.twitter;
      list.push({
        platformId: 'twitter',
        name: 'X',
        rawUrl: `@${rawHandle}`,
        url: `https://x.com/${rawHandle}`,
        label: `@${rawHandle}`,
        icon: twitterDef.icon,
        brandColor: twitterDef.brandColor,
        hoverBg: twitterDef.hoverBg,
        hoverBorder: twitterDef.hoverBorder
      });

      const linkedinDef = PLATFORMS.linkedin;
      list.push({
        platformId: 'linkedin',
        name: 'LinkedIn',
        rawUrl: rawHandle,
        url: `https://linkedin.com/in/${rawHandle}`,
        label: `${rawHandle}`,
        icon: linkedinDef.icon,
        brandColor: linkedinDef.brandColor,
        hoverBg: linkedinDef.hoverBg,
        hoverBorder: linkedinDef.hoverBorder
      });
    }
  }

  return list;
};

/**
 * SocialMediaLinks Component
 * Displays neat, responsive, interactive social media platform chips for each user.
 */
export const SocialMediaLinks = ({ 
  user, 
  isSelf = false, 
  onEdit = null, 
  size = 'md',
  className = '' 
}) => {
  const isHidden = isUserSocialLinksHidden(user);
  const socialList = useMemo(() => getParsedSocialLinks(user), [user]);
  const isCompact = size === 'sm';

  // If hidden and viewing another user's profile, render nothing
  if (isHidden && !isSelf) {
    return null;
  }

  if (!socialList.length && !isSelf) {
    return null;
  }

  return (
    <div 
      className={`d-flex align-center flex-wrap gap-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {isSelf && isHidden && (
        <span 
          className="badge badge-secondary text-xs d-inline-flex align-center gap-1"
          style={{ fontSize: isCompact ? '0.66rem' : '0.72rem', padding: isCompact ? '0.2rem 0.5rem' : '0.25rem 0.6rem', opacity: 0.9 }}
          title="Your social links are currently hidden from public visitors"
        >
          <span>🔒 Social links hidden</span>
        </span>
      )}
      {!isHidden && socialList.map((item) => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.platformId}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-platform-chip"
            style={{
              '--chip-brand-color': item.brandColor,
              '--chip-hover-bg': item.hoverBg,
              '--chip-hover-border': item.hoverBorder,
              fontSize: isCompact ? '0.7rem' : '0.74rem',
              padding: isCompact ? '0.2rem 0.55rem' : '0.25rem 0.65rem'
            }}
            title={`Open ${user?.name || 'user'}'s ${item.name} profile (${item.url})`}
            aria-label={`${item.name}: ${item.label}`}
          >
            <span 
              className="social-platform-icon" 
              style={{ color: item.brandColor, display: 'flex', alignItems: 'center' }}
            >
              <IconComponent size={isCompact ? 12 : 13} />
            </span>
            <span className="social-platform-label">{item.label}</span>
            <ExternalLink 
              size={isCompact ? 9 : 10} 
              className="social-platform-external-arrow" 
            />
          </a>
        );
      })}

      {/* When viewing own profile, provide a clean shortcut to edit or add platforms */}
      {isSelf && onEdit && (
        <button
          type="button"
          className="social-platform-edit-btn"
          onClick={onEdit}
          title="Add or edit your social media platform links"
          style={{
            fontSize: isCompact ? '0.68rem' : '0.72rem',
            padding: isCompact ? '0.2rem 0.5rem' : '0.25rem 0.6rem'
          }}
        >
          {socialList.length > 0 ? (
            <>
              <Edit2 size={11} className="mr-1" />
              <span>Edit Links</span>
            </>
          ) : (
            <>
              <Plus size={12} className="mr-1 text-brand" />
              <span>Add Social Profiles</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default SocialMediaLinks;
