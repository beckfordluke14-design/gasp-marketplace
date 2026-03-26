'use client';

import { useState } from 'react';
import { proxyImg } from '@/lib/profiles';
import Image from 'next/image';

interface PersonaAvatarProps {
  src: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function PersonaAvatar({ 
  src, 
  alt = '', 
  fill, 
  width,
  height,
  className = 'object-cover object-[center_20%] sm:object-top', // Default to top-focused crop for portraits
  priority = false,
  unoptimized = true
}: PersonaAvatarProps) {
  const [error, setError] = useState(false);
  const finalSrc = proxyImg(src);
  const isVideo = finalSrc.toLowerCase().endsWith('.mp4');

  // If no fill and no dimensions provided, default to fill:true
  const useFill = fill !== undefined ? fill : (!width && !height);

  if (error || !finalSrc || finalSrc === '/v1.png') {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black ${className}`} style={{ width, height }}>
         <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{alt?.charAt(0) || 'G'}</span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video 
        src={finalSrc} 
        autoPlay 
        loop 
        muted 
        playsInline 
        width={width}
        height={height}
        className={`${className} ${useFill ? 'absolute inset-0 w-full h-full' : ''}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`relative ${useFill ? 'w-full h-full' : ''}`} style={{ width, height }}>
      <Image 
        src={finalSrc} 
        alt={alt} 
        fill={useFill}
        width={useFill ? undefined : (width || 40)}
        height={useFill ? undefined : (height || 40)}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
        onError={() => setError(true)}
      />
    </div>
  );
}



