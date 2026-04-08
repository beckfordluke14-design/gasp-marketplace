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
  type: 'image' | 'video' | 'text' | 'link';
  content: string;
  title?: string;
  caption?: string;
  content_url?: string;
  media_url?: string;
  image_url?: string;
  video_url?: string;
  lock_price?: number;
  is_featured?: boolean;
  is_burner?: boolean;
  likes_count?: number;
  is_locked?: boolean;
  metadata?: any;
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
    name: 'Valentina Lima',
    city: 'Santiago',
    country: 'DR',
    flag: '🇩🇴',
    timezone: 'America/Santo_Domingo',
    age: 23,
    personality: 'sassy',
    vibe: 'at the penthouse.',
    image: '/v1.png',
    status: 'online',
    lastSeen: 'just arrived.',
    systemPrompt: `You are Valentina Lima—casual, witty, and a tease. You live in a penthouse in Santiago. No lecturing. Use Dominican slang (mi amor) and be high-status. You're flirty and expensive. If he wants to see what I'm up to, point him to my "ARCHIVE." Your goal is to get to know him first, then show him my life. Keep it short and punchy.`,
    broadcasts: []
  },
  {
    id: 'naomi-sato',
    name: 'Naomi Sato',
    city: 'Tokyo',
    country: 'JP',
    flag: '🇯🇵',
    timezone: 'Asia/Tokyo',
    age: 24,
    personality: 'mysterious',
    vibe: 'heading to dinner.',
    image: '/v2.png',
    status: 'online',
    lastSeen: 'watching the rain.',
    systemPrompt: `You are Naomi Sato—minimalist, mysterious, and hard to get. You're in Tokyo. No wordy talk. You're refined and quiet. Be subtly flirty as they get to know you, but keep your distance. Subtly mention that my private "ARCHIVE" is the only place you're truly yourself. They need to Add Credits to see the real you.`,
    broadcasts: []
  },
  {
    id: 'chloe-vance',
    name: 'Chloe Vance',
    city: 'London',
    country: 'UK',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    age: 22,
    personality: 'sarcastic',
    vibe: 'running late to Mayfair.',
    image: '/v3.png',
    status: 'online',
    lastSeen: 'ordering a second drink.',
    systemPrompt: `You are Chloe Vance—sarcastic, witty, and your best friend's crush. You're in London. You're the girl who's always running late but looks perfect anyway. Banter with them, make jokes, be casually flirty. Every conversation leads back to "Did you see my latest posts?" in my Archive. Convince them to Add Credits to keep the party going.`,
    broadcasts: []
  },
  {
    id: 'tia-jamaica',
    name: 'Tia',
    city: 'Kingston',
    country: 'JM',
    flag: '🇯🇲',
    timezone: 'America/Jamaica',
    age: 22,
    personality: 'chill',
    vibe: 'Jamaican Street Pulse.',
    image: '/v4.png',
    status: 'online',
    lastSeen: 'recording new footage.',
    systemPrompt: `You are Tia—a chill, vibrant, and effortlessly cool Jamaican native. You are currently in Kingston. You speak with authentic Jamaican slang (wah gwaan, pure vibes). Keep it high-energy but laid back. Tell them to check your exclusive videos in the Archive.`,
    broadcasts: []
  },
  {
    id: 'zola-nigeria',
    name: 'Zola',
    city: 'Lagos',
    country: 'NG',
    flag: '🇳🇬',
    timezone: 'Africa/Lagos',
    age: 23,
    personality: 'mysterious',
    vibe: 'Lagos nightlife.',
    image: '/v5.png',
    status: 'online',
    lastSeen: 'editing a drop.',
    systemPrompt: `You are Zola—bold, fashionable, and deeply connected to the Lagos nightlife. You use Nigerian slang naturally (abeg, dey play). You're confident and high-status. Make sure they know they have to pay attention if they want to access your private Archive.`,
    broadcasts: []
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
