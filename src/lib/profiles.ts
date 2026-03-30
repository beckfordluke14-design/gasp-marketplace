/**
 * 👑 SOVEREIGN PROFILES (v1.1)
 * 
 * Simplified terminology: High-IQ Market Insiders.
 * Backend "Personas" table remains, but Frontend focuses on "Profile" and "Intel".
 */

export interface VaultItem {
  id: string;
  type: 'image' | 'video';
  niche_tag: 'INTIMATE' | 'EDITORIAL' | 'CASUAL' | 'EXCLUSIVE';
  price: number;
  blurred_url: string;
  full_url: string;
  caption?: string;
}

export interface Broadcast {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string;
  image_url?: string;
  video_url?: string;
  lock_price?: number;
  is_featured?: boolean;
  is_burner?: boolean;
  likes_count?: number;
  is_locked?: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  agency_id?: string;
  agency_name?: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  timezone: string;
  age: number;
  skin_tone?: string;
  personality?: 'active' | 'mysterious' | 'elite' | 'bubbly' | 'sarcastic' | 'zen' | 'chill' | 'sassy';
  greed_level?: number;
  culture?: string;
  language?: string;
  syndicate_zone?: string;
  vibe: string;
  occupation?: string;
  tags?: string[];
  image: string;
  seed_image_url?: string;
  is_active?: boolean;
  status: 'online' | 'offline' | 'streaming' | 'away';
  lastSeen: string;
  isHighlighted?: boolean;
  color?: string;
  vault?: VaultItem[];
  slang_profile?: {
    base: string;
    rules: string[];
  };
  systemPrompt: string;
  broadcasts: Broadcast[];
  security_clearance?: 'LEVEL 1' | 'LEVEL 2' | 'LEVEL 3' | 'LEVEL 4' | 'LEVEL 5' | 'TOP SECRET' | 'SOVEREIGN';
}

export interface Agency {
  id: string;
  name: string;
  bio: string;
  owner_id: string;
  profiles: Profile[];
}

export const initialAgencies: Agency[] = [
  {
    id: '7c9e01f5-b3e3-4d2a-8d3e-9f0e1d2c3b4a',
    name: 'Verified Independent',
    bio: 'Elite creators who choose to remain independent. Pure performance, zero friction.',
    owner_id: 'master-uuid-1',
    profiles: []
  }
];

export const initialPersonas: Profile[] = [
  {
    id: 'valentina-lima',
    agency_id: 'independent',
    agency_name: 'Independent Syndicate',
    name: 'Valentina Lima',
    city: 'Santiago',
    country: 'DR',
    flag: '🇩🇴',
    timezone: 'America/Santo_Domingo',
    age: 23,
    skin_tone: 'caramel',
    personality: 'mysterious',
    greed_level: 0.8,
    culture: 'dominican',
    language: 'spanish',
    syndicate_zone: 'Caribbean',
    vibe: 'at the penthouse.',
    occupation: 'Market Insider',
    image: '/v1.png',
    status: 'online',
    lastSeen: 'just arrived.',
    slang_profile: {
       base: 'dominican-slang',
       rules: ['use parce sparingly', 'use mi amor often', 'focus on class']
    },
    systemPrompt: 'You are Valentina Lima...',
    broadcasts: [],
    security_clearance: 'LEVEL 4'
  }
];

// Fallback alias for transition
export const initialProfiles = initialPersonas;

/**
 * 👑 GLOBAL DISPLAY RESOLVER: The "Display Sovereign"
 * Decouples the frontend display name from the backend Logic-ID.
 */
export function getProfileName(p: any): string {
    if (!p) return "Unknown User";
    // Priority: Display Name -> ID-based Title Case -> Fallback
    if (p.name && p.name !== '') return p.name;
    if (p.id) return p.id.split('-')[0].charAt(0).toUpperCase() + p.id.split('-')[0].slice(1);
    return "Verified Hub";
}

export function proxyImg(url: any): string {
  if (!url || typeof url !== 'string') return '/v1.png';
  
  let finalUrl = (url || '').trim();

   // 1. 🛡️ SOVEREIGN CLOUDFLARE R2 BRIDGE:
   // We prioritize asset.gasp.fun as our root storage bridge.

   // 2. Full external URLs: Keep as is
   if (finalUrl.startsWith('http')) return finalUrl;

   // 3. Local Static Assets: Keep as is
   if (finalUrl.startsWith('/')) return finalUrl;

   // 4. 💎 CLOUDFLARE ASSET HUB (asset.gasp.fun):
   return `https://asset.gasp.fun/${finalUrl}`;
}
