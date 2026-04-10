'use client';

import { Suspense } from 'react';
import FunnelView from '@/components/FunnelView';

/**
 * 🌪️ DIRECT FUNNEL INGRESS NODE
 * Optimized for high-intent traffic from adult platforms.
 */

export default function FunnelPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white font-syncopate text-xs tracking-widest animate-pulse uppercase">Synchronizing Neural Core...</div>}>
      <FunnelView />
    </Suspense>
  );
}
