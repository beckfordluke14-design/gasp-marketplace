export interface Profile {
  id: string;
  name: string;
  image: string;
  city: string;
  country?: string;
  flag?: string;
  vibe?: string;
  age: number;
  status: 'online' | 'offline' | 'streaming' | 'away';
  is_active?: boolean;
  isHighlighted?: boolean;
  color?: string;
}

export interface Agency {
  id: string;
  name: string;
  bio: string;
  owner_id: string;
  personas: Persona[];
}

export const initialAgencies: Agency[] = [
  {
    id: '7c9e01f5-b3e3-4d2a-8d3e-9f0e1d2c3b4a',
    name: 'Independent Syndicate',
    bio: 'The default elite neural node for unmanaged talent. pure performance, zero friction.',
    owner_id: 'master-uuid-1',
    personas: []
  }
];

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

/**
 * 🏁 NEURAL STABILIZATION (v1.0) - SITE RESTORATION
 * 
 * Reverting to direct, proven routing for established models
 * while the Proxy-Bridge is calibrated.
 */
/**
 * 👑 GLOBAL ALIAS RESOLVER: The "Display Sovereign"
 * Decouples the frontend display name from the backend Logic-ID.
 */
export function getPersonaName(p: any): string {
    if (!p) return "Unknown Baddie";
    // Priority: Display Name -> ID-based Title Case -> Fallback
    if (p.name && p.name !== '') return p.name;
    if (p.id) return p.id.split('-')[0].charAt(0).toUpperCase() + p.id.split('-')[0].slice(1);
    return "Archive Node";
}

export function proxyImg(url: any): string {
  if (!url || typeof url !== 'string') return '/v1.png';
  
  let finalUrl = (url || '').trim();

  // 1. 🛡️ MASTER DOMAIN STRIPPER: 
  // If explicitly a Supabase URL, strip the domain so we can proxy it through asset.gasp.fun
  const supabaseHost = '.supabase.co';
  if (finalUrl.includes(supabaseHost)) {
      // Find where public storage path starts
      const publicPrefix = '/storage/v1/object/public/';
      const idx = finalUrl.indexOf(publicPrefix);
      if (idx !== -1) {
          finalUrl = finalUrl.substring(idx + publicPrefix.length);
      }
  }

  // 2. Full external URLs (non-Supabase): Keep as is (Direct Loading)
  if (finalUrl.startsWith('http')) return finalUrl;

  // 3. Local Static Assets: Keep as is
  if (finalUrl.startsWith('/')) return finalUrl;

  // 4. 💎 SOVEREIGN ASSET HUB (asset.gasp.fun):
  // Direct Cloudflare Proxy to Supabase Storage.
  // Zero-Egress, Zero-VPS Load, Ultra-Latency.
  return `https://asset.gasp.fun/storage/v1/object/public/${finalUrl}`;
}

export interface Persona {
  id: string;
  agency_id: string;
  agency_name: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  timezone: string;
  age: number;
  skin_tone: string;
  personality: 'active' | 'mysterious' | 'elite' | 'bubbly' | 'sarcastic' | 'zen' | 'chill' | 'sassy';
  greed_level: number;
  culture: string;
  language: string;
  syndicate_zone: string;
  vibe: string;
  occupation?: string;
  tags?: string[];
  image: string;
  seed_image_url?: string;
  is_active?: boolean;
  status: 'online' | 'offline';
  lastSeen: string;
  vault?: VaultItem[];
  slang_profile: {
    base: string;
    rules: string[];
  };
  systemPrompt: string;
  broadcasts: Broadcast[];
}

// ── initialPersonas: Sovereign Fallback Roster
// Keeps the Syndicate Hub active even during DB desynchronization.
export const initialPersonas: Persona[] = [
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
    vibe: 'in the penthouse.',
    occupation: 'Neural Weaver',
    image: '/v1.png',
    status: 'online',
    lastSeen: 'just arrived.',
    slang_profile: {
       base: 'dominican-slang',
       rules: ['use parce sparingly', 'use mi amor often', 'focus on class']
    },
    systemPrompt: 'You are Valentina Lima...',
    broadcasts: []
  }
];
