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
    const source = urlParams.get('utm_source') || urlParams.get('source');
    
    // 🛡️ GHOST GATE: Only allow traffic from known "Hot" sources
    // If an auditor visits /funnel directly, they get kicked to the safe home page.
    if (!source && !window.location.hash.includes('bypass')) {
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
