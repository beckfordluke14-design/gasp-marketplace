'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/telemetry';

/**
 * 🛰️ ATTRIBUTION TRACKER: Sovereign Marketing Intake
 * Captures UTM parameters and Traffic Stars signal data.
 * Persists attribution to localStorage for conversion correlation.
 */
export default function AttributionTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const tsClickId = searchParams.get('ts_clickid'); // Special capture for Traffic Stars if used

    if (utmSource || tsClickId) {
      const attribution = {
        source: utmSource || (tsClickId ? 'trafficstars' : 'direct'),
        medium: utmMedium || (tsClickId ? 'preroll' : 'none'),
        campaign: utmCampaign || 'none',
        clickId: tsClickId || null,
        timestamp: new Date().toISOString(),
        landingUrl: window.location.href
      };

      // 🛡️ PERSISTENCE: Save attribution for later conversion lookup
      localStorage.setItem('gasp_attribution', JSON.stringify(attribution));

      // 🧬 TELEMETRY: Trace the ad landing event
      const guestId = localStorage.getItem('gasp_guest_id') || 'uninitialized';
      trackEvent('ad_landing', guestId, {
        source: attribution.source,
        campaign: attribution.campaign,
        type: tsClickId ? 'trafficstars_preroll' : 'standard_utm'
      });

      console.log('📡 [Attribution] Marketing signal captured:', attribution.source);
    }
  }, [searchParams]);

  return null;
}
