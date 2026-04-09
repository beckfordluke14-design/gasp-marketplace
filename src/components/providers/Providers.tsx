'use client';

import { GaspPrivyProvider } from '@/components/providers/GaspPrivyProvider';
import { UserProvider } from '@/components/providers/UserProvider';
import AttributionTracker from '@/components/analytics/AttributionTracker';
import { Suspense } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GaspPrivyProvider>
      <UserProvider>
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        {children}
      </UserProvider>
    </GaspPrivyProvider>
  );
}
