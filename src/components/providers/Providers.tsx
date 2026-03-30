'use client';

import { PrivyProvider } from "@privy-io/react-auth";
import { UserProvider } from '@/components/providers/UserProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cm1is5rpg00is4qonf00ndkki"
      config={{
        loginMethods: ['google', 'twitter', 'discord', 'email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#ff00ff',
          showWalletLoginFirst: false,
          logo: 'https://asset.gasp.fun/logo.png',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <UserProvider>
        {children}
      </UserProvider>
    </PrivyProvider>
  );
}
