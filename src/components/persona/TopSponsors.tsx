'use client';

import { Crown, Star, MoreHorizontal, Trophy, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface TopSponsor {
  user_id: string;
  total_discovery_spent: number;
}

interface TopSponsorsProps {
  personaId: string;
}

/**
 * SYSTEM 2: THE 'WHALE WARS' LEADERBOARD
 * Objective: Maximize ARPU via Status & Competition.
 */
export default function TopSponsors({ personaId }: TopSponsorsProps) {
  const [sponsors, setSponsors] = useState<TopSponsor[]>([]);

  useEffect(() => {
    async function fetchSponsors() {
        const { data, error } = await supabase
            .from('persona_top_spenders')
            .select('*')
            .eq('persona_id', personaId)
            .order('total_discovery_spent', { ascending: false })
            .limit(3);

        if (data && !error) {
            setSponsors(data);
        }
    }
    fetchSponsors();
  }, [personaId]);

  return (
    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic flex items-center gap-2">
            <Trophy size={10} className="text-[#ff00ff]" />
            Whale Wars: Top Discovery
         </h4>
         <MoreHorizontal size={14} className="text-white/20" />
      </div>

      <div className="space-y-3">
        {sponsors.length === 0 ? (
          <div className="py-8 text-center opacity-20 flex flex-col items-center gap-2">
             <Award size={20} />
             <p className="text-[9px] font-black uppercase tracking-widest">No Discovery Leaders Yet</p>
          </div>
        ) : (
          sponsors.map((s, i) => (
            <div 
              key={s.user_id} 
              className={`
                flex items-center justify-between p-4 rounded-2xl border transition-all
                ${i === 0 ? 'bg-gradient-to-r from-[#ff00ff]/20 to-transparent border-[#ff00ff]/40 shadow-[0_0_20px_rgba(255,0,255,0.1)]' : 'bg-white/5 border-white/5'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`
                    w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs
                    ${i === 0 ? 'text-[#ff00ff]' : 'text-white/40'}
                  `}>
                    {s.user_id.substring(0, 3)}
                  </div>
                  {i === 0 && (
                    <div className="absolute -top-2 -left-2 -rotate-45">
                        <Crown size={18} className="text-yellow-400 drop-shadow-[0_0_10px_#ff00ff]" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-black uppercase text-white truncate w-24">
                      {s.user_id.split('_')[1] || s.user_id}
                   </span>
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                      Discovery Tier {3 - i}
                   </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                 <span className={`text-[13px] font-black tracking-tighter ${i === 0 ? 'text-[#ff00ff]' : 'text-white'}`}>
                    {s.total_discovery_spent.toLocaleString()}
                 </span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                    Breathe Points
                 </span>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[9px] text-center text-white/20 leading-relaxed max-w-[200px] mx-auto lowercase italic">
          the leaderboards reset every 7 days. stay top to keep the crown.
      </p>
    </div>
  );
}



