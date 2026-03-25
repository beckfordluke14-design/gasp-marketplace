'use client';

import { motion } from 'framer-motion';
import { type Persona, type Broadcast, proxyImg } from '@/lib/profiles';
import Image from 'next/image';
import { Lock, Circle, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface FeedItemProps {
  persona: Persona;
  broadcast: Broadcast;
}

const getCityStatus = (persona: Persona) => {
    const weatherPool: Record<string, string> = {
        'Santiago': '82°F',
        'Medellín': '74°F',
        'Rio': '88°F',
        'Madrid': '64°F'
    };
    return {
        weather: weatherPool[persona.city] || '72°F'
    };
};

export default function FeedItem({ persona, broadcast }: FeedItemProps) {
  const cityStatus = getCityStatus(persona);

  return (
    <div className="border-b border-white/5 pb-12 mb-12 last:border-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black uppercase italic tracking-tighter text-white">
            {persona.name}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-white/40">
            {persona.city} • {cityStatus.weather}
          </div>
        </div>
      </div>

      {/* Content Switcher */}
      <div className="px-4">
        {broadcast.type === 'text' && (
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white lowercase leading-tight">
            {broadcast.content}
          </h2>
        )}

        {broadcast.type === 'image' && (
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src={proxyImg(broadcast.image_url || persona.image)}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        {broadcast.type === 'video' && (
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5">
            {broadcast.is_locked ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-8 text-center backdrop-blur-3xl bg-black/40">
                <div className="w-16 h-16 rounded-full bg-[#FF007F]/20 flex items-center justify-center border border-[#FF007F]/30 shadow-[0_0_20px_rgba(255,0,127,0.3)]">
                  <Lock size={24} className="text-[#FF007F]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white">lifestyle vault</h3>
                  <p className="text-xs text-white/40 lowercase">unlock this private moment</p>
                </div>
                <button className="px-8 py-4 bg-[#FF007F] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 transition-all">
                  unlock for {broadcast.lock_price} credits
                </button>
              </div>
            ) : (
              <video src={broadcast.video_url} autoPlay loop muted className="w-full h-full object-cover" />
            )}
            <Image
              src={proxyImg(persona.image)}
              alt=""
              fill
              unoptimized
              className={`object-cover ${broadcast.is_locked ? 'blur-2xl opacity-50' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Action Icons (OII) */}
      <div className="flex items-center gap-8 mt-8 px-6">
        {/* O: Quick Tip */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl group-hover:shadow-[#FF007F]/10">
            <Circle size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40">infuse</span>
        </button>

        {/* I: Private Message */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <MessageSquare size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">uplink</span>
        </button>

        {/* I: Vault / Media */}
        <button className="group flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#FF007F]/50 transition-all shadow-xl">
            <ImageIcon size={18} className="text-white/40 group-hover:text-[#FF007F] transition-colors" />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20">vault</span>
        </button>
      </div>
    </div>
  );
}


