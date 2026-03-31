'use client';

import { GaspPrivyProvider } from '@/components/providers/GaspPrivyProvider';
import { UserProvider } from '@/components/providers/UserProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GaspPrivyProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </GaspPrivyProvider>
  );
}
