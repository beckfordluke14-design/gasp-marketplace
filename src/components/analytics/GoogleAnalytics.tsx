'use client';

import Script from 'next/script';

const GA_ID = 'G-9DZHLCD1DN';

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Fire a custom GA4 event anywhere in the app.
 * Usage: trackEvent('topup_click', { package: 'diamond', method: 'crypto' })
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  (window as any).gtag?.('event', eventName, params);
}



