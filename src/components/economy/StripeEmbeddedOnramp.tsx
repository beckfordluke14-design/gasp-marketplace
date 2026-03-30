'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Script from 'next/script';

interface StripeOnrampProps {
  clientSecret: string;
  onReady?: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    StripeOnramp: any;
  }
}

/**
 * 🛡️ SOVEREIGN EMBEDDED ONRAMP
 * Objective: Direct Fiat-to-Crypto Widget Infusion
 */
export default function StripeEmbeddedOnramp({ clientSecret, onReady, onSuccess, onCancel }: StripeOnrampProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [onrampInstance, setOnrampInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initOnramp = () => {
    if (!window.StripeOnramp) {
        setError('Uplink Refused (Onramp SDK Missing)');
        return;
    }

    try {
        const onramp = window.StripeOnramp(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        const session = onramp.createSession({ clientSecret });

        session.mount(containerRef.current);
        
        session.addEventListener('onramp_session_updated', (e: any) => {
            if (e.payload.session.status === 'fulfillment_processing' || e.payload.session.status === 'fulfilled') {
                onSuccess?.();
            }
        });

        setOnrampInstance(session);
        onReady?.();
    } catch (err: any) {
        console.error('[Onramp] Init Fault:', err);
        setError(err.message);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500">
      <Script 
        src="https://js.stripe.com/v3/crypto-onramp-outer.js" 
        onLoad={initOnramp}
      />
      
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
        </div>
      )}

      {!onrampInstance && !error && (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
             <Loader2 size={32} className="text-[#00f0ff] animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Synchronizing Crypto Gate...</span>
        </div>
      )}

      <div ref={containerRef} className="w-full min-h-[500px] bg-white/5 rounded-3xl overflow-hidden border border-white/10" id="stripe-onramp-container"></div>
    </div>
  );
}
