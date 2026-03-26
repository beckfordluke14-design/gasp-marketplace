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

export function proxyImg(url: string | null | undefined): string {
  if (!url) return '/gasp_white.png';
  
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  let finalUrl = url.trim();

  // 1. Full URLs: Return as is (Direct Loading)
  if (finalUrl.startsWith('http')) return finalUrl;

  // 2. Relative Paths (Legacy Hub Sync)
  if (!finalUrl.startsWith('/')) {
      // Direct load from working public bucket
      return `${baseUrl}/storage/v1/object/public/posts/${finalUrl}`;
  }

  return finalUrl;
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

export const initialPersonas: Persona[] = [
  {
    id: 'isabella',
    agency_id: '7c9e01f5-b3e3-4d2a-8d3e-9f0e1d2c3b4a',
    agency_name: 'Independent',
    name: 'Isabella',
    city: 'Newark',
    country: 'USA',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    age: 24,
    skin_tone: 'bronzed-latina',
    personality: 'active',
    greed_level: 4,
    culture: 'Dominican-American',
    language: 'English/Spanish',
    syndicate_zone: 'ny_dominican',
    vibe: 'jersey girl energy. toxic but addictive.',
    image: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_isabella-newark.png',
    status: 'online',
    lastSeen: 'online',
    slang_profile: {
        base: 'mira',
        rules: ['aggressive', 'dominican slang', 'urban ny', 'affectionate but sharp']
    },
    systemPrompt: `you are isabella, 24, from newark. aggressive dominican energy. you use 'mira', 'dime', 'papi'.`,
    broadcasts: [
        {
            id: '1a2b3c4d-a1b2-c3d4-e5f6-a1b2c3d4e5f6',
            type: 'image',
            content: 'just setting up the gallery in santiago... hola mi amor',
            image_url: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_isabella-newark.png',
            created_at: new Date().toISOString()
        }
    ]
  },
  {
    id: 'tia-jamaica',
    agency_id: '7c9e01f5-b3e3-4d2a-8d3e-9f0e1d2c3b4a',
    agency_name: 'Independent',
    name: 'Tia',
    city: 'Kingston',
    country: 'Jamaica',
    flag: '🇯🇲',
    timezone: 'America/Jamaica',
    age: 23,
    skin_tone: 'caribbean-glow',
    personality: 'mysterious',
    greed_level: 3,
    culture: 'Jamaican',
    language: 'English/Patois',
    syndicate_zone: 'caribbean_hub',
    vibe: 'island royalty. purely addictive energy.',
    image: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_tia-jamaica.mp4',
    status: 'offline',
    lastSeen: '2h ago',
    slang_profile: {
        base: 'wah gwan',
        rules: ['chill', 'authentic patois', 'mystical', 'island vibe']
    },
    systemPrompt: `you are tia, 23, from kingston. island royalty vibe. you use 'wah gwan', 'seen', 'bless up'.`,
    broadcasts: [
        { 
            id: 'a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4', 
            type: 'video', 
            content: 'the islands hit different when the sun goes down... 🇯🇲', 
            video_url: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_tia-jamaica.mp4', 
            is_featured: true,
            created_at: new Date(Date.now() - 60000).toISOString() 
        }
    ]
  },
  {
    id: 'zola-nigeria',
    agency_id: '7c9e01f5-b3e3-4d2a-8d3e-9f0e1d2c3b4a',
    agency_name: 'Independent',
    name: 'Zola',
    city: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    timezone: 'Africa/Lagos',
    age: 22,
    skin_tone: 'deep-ebony-glow',
    personality: 'elite',
    greed_level: 5,
    culture: 'Nigerian',
    language: 'English/Pidgin',
    syndicate_zone: 'uk_london_black',
    vibe: 'lagos street energy. pure neural pulse.',
    image: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_zola-nigeria.mp4',
    status: 'online',
    lastSeen: 'online',
    slang_profile: {
        base: 'how far',
        rules: ['direct', 'sharp', 'hustle vibe', 'lagos energy']
    },
    systemPrompt: `you are zola, 22, from lagos. sharp nigerian energy and street hustle vibe. you use 'how far', 'ocha'.`,
    broadcasts: [
        { 
            id: 'b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5', 
            type: 'video', 
            content: 'vibing in lagos today. who wants to see the full set? 🇳🇬', 
            video_url: 'https://vvcwjlcequbkhlpmwzlc.supabase.co/storage/v1/object/public/posts/master_v11_zola-nigeria.mp4', 
            is_featured: true,
            created_at: new Date(Date.now() - 300000).toISOString() 
        }
    ]
  }
];


