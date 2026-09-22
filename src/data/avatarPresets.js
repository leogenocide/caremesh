/**
 * CareMesh Cartoon Avatar Presets
 * High quality, vector SVG cartoon characters (bots, explorers, and friendly neighbors)
 * Powered by open DiceBear styles with custom palettes.
 */

export const CARTOON_AVATAR_PRESETS = [
  {
    id: 'cartoon_sparky',
    label: 'Sparky (Bot Helper)',
    role: 'Tech & Logistics',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=b6e3f4'
  },
  {
    id: 'cartoon_avery',
    label: 'Avery (Scout Explorer)',
    role: 'Field Responder',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Avery&backgroundColor=ffd5dc'
  },
  {
    id: 'cartoon_felix',
    label: 'Felix (Community Dynamo)',
    role: 'Neighborhood Volunteer',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede'
  },
  {
    id: 'cartoon_luna',
    label: 'Luna (Eco Botanist)',
    role: 'Environmental Care',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf'
  },
  {
    id: 'cartoon_bolt',
    label: 'Bolt (Cyber Sentinel)',
    role: 'Emergency Dispatch',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bolt&backgroundColor=d1d4f9'
  },
  {
    id: 'cartoon_milo',
    label: 'Milo (Trail Guide)',
    role: 'Mutual Aid Steward',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=b6e3f4'
  },
  {
    id: 'cartoon_nova',
    label: 'Nova (Civic Champion)',
    role: 'Community Coordinator',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova&backgroundColor=ffd5dc'
  },
  {
    id: 'cartoon_pip',
    label: 'Pip (Handy Droid)',
    role: 'Equipment Provider',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pip&backgroundColor=ffdfbf'
  },
  {
    id: 'cartoon_maya',
    label: 'Maya (Agile Runner)',
    role: 'Supply Courier',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&backgroundColor=c0aede'
  },
  {
    id: 'cartoon_sam',
    label: 'Sam (Warm Neighbor)',
    role: 'Senior Advocate',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=b6e3f4'
  },
  {
    id: 'cartoon_gizmo',
    label: 'Gizmo (Maker Bot)',
    role: 'Repair & Tools',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo&backgroundColor=ffd5dc'
  },
  {
    id: 'cartoon_riley',
    label: 'Riley (Medic Scout)',
    role: 'First Aid Volunteer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Riley&backgroundColor=d1d4f9'
  }
];

export const DEFAULT_CARTOON_AVATAR = CARTOON_AVATAR_PRESETS[0].url;

export default CARTOON_AVATAR_PRESETS;
