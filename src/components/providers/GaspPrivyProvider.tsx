'use client';

import { PrivyProvider } from "@privy-io/react-auth";

/**
 * 🛰️ NEURAL IDENTITY GATE (Privy v1.0)
 * Objective: Universal Social + Wallet Authentication with Zero-Friction Handshake.
 * Replaces Supabase Auth to resolve 'Usage Limit' and 'Unsupported Provider' regressions.
 */

export function GaspPrivyProvider({ children }: { children: React.ReactNode }) {
  // 🛡️ PLACEHOLDER APP ID: User needs to replace this in the dashboard 
  // Get yours at: https://dashboard.privy.io/
  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clxp_placeholder_id";

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // 🧬 Supported Protocols: The "Syndicate" Standard
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'apple'],
        appearance: {
          theme: 'dark',
          accentColor: '#ff00ff', // GASP MAGENTA
          logo: '/gasp_white.png',
          showWalletLoginFirst: true,
        },
        // 💎 Embedded Wallet: Zero-friction settlement node creation
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
