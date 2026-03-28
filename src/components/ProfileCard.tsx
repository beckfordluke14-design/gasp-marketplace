'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import ProfileAvatar from './profile/ProfileAvatar';
import { useRouter } from 'next/navigation';
import { MapPin, MessageCircle, Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Profile, proxyImg } from '@/lib/profiles';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProfileCard({
  id,
  name,
  country,
  flag,
  vibe,
  image,
  status,
  isHighlighted,
  color,
}: Profile) {
  const router = useRouter();

  const borderColors = {
    'neon-pink': 'border-neon-pink group-hover:shadow-[0_0_20px_rgba(255,0,127,0.4)]',
    'neon-blue': 'border-neon-blue group-hover:shadow-[0_0_20px_rgba(0,242,254,0.4)]',
    'neon-yellow': 'border-neon-yellow group-hover:shadow-[0_0_20px_rgba(255,235,59,0.4)]',
    'neon-purple': 'border-neon-purple group-hover:shadow-[0_0_20px_rgba(180,0,255,0.4)]',
  };

  const statusColors = {
    streaming: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    online: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]',
    away: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]',
    offline: 'bg-gray-500',
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      onClick={() => router.push(`/chat/${id}`)}
      className={cn(
        "relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500",
        isHighlighted ? "scale-105 border-2 border-white/20" : "border border-white/5",
        borderColors[color as keyof typeof borderColors] || borderColors['neon-pink']
      )}
    >
      {/* Background Image */}
      <ProfileAvatar
        src={image}
        alt={name}
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Badges Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {status === 'streaming' ? (
          <div className="flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm animate-pulse">
            <Play size={10} fill="currentColor" />
            Live Stream
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/40 text-white/80 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", statusColors[status as keyof typeof statusColors])} />
            {status}
          </div>
        )}

        {isHighlighted && (
          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
            Featured
          </div>
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 transition-opacity duration-500" />

      {/* Info Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{flag}</span>
          <h2 className="text-2xl font-outfit font-extrabold tracking-tight text-white uppercase italic drop-shadow-lg">
            {name}
          </h2>
        </div>

        <p className="text-white/60 font-inter text-xs flex items-center gap-1">
          <MapPin size={10} />
          {country}
        </p>

        <p className="text-white/80 font-inter text-[11px] leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {vibe}
        </p>

        {/* Aggressive CTA */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex items-center justify-center gap-2 w-full py-4 rounded-xl glass border border-white/20 text-white font-outfit font-bold uppercase tracking-widest text-xs hover:bg-white/10">
            <MessageCircle size={16} />
            Start Chat
          </div>
        </div>
      </div>

      {/* Floor Glow on Hover */}
      <div className={cn(
        "absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-32 blur-[60px] opacity-0 group-hover:opacity-60 transition-opacity",
        color === 'neon-pink' ? 'bg-neon-pink' : color === 'neon-blue' ? 'bg-neon-blue' : color === 'neon-yellow' ? 'bg-neon-yellow' : 'bg-neon-purple'
      )} />
    </motion.div>
  );
}
