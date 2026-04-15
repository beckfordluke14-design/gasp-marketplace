'use client';

import { Suspense } from 'react';
import FunnelView from '@/components/FunnelView';

/**
 * 🌪️ DIRECT FUNNEL INGRESS NODE
 * Optimized for high-intent traffic from adult platforms.
 */

export default function FunnelPage() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || urlParams.get('source') || urlParams.get('src');
    const hasBypass = urlParams.has('bypass') || window.location.hash.includes('bypass');
    
    // 🛡️ GHOST GATE: Redirect organic non-intent traffic to safe site
    if (!source && !hasBypass) {
      window.location.href = '/';
      return null;
    }
  }

  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white font-syncopate text-xs tracking-widest animate-pulse uppercase">Synchronizing Neural Core...</div>}>
      <FunnelView />
    </Suspense>
  );
}
