'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';

/**
 * 🛰️ NEURAL WALLET BRIDGE (Privy Edition)
 * Universal adapter for EVM and Solana, powered by the Privy Identity Gate.
 * Objective: Unified settlement protocol for all authenticated titans.
 */

interface WalletState {
  address: string | null;
  network: 'evm' | 'solana' | null;
  isConnected: boolean;
  isConnecting: boolean;
  installedWallets: any[]; // Privy takes care of discovery
}

interface WalletContextType extends WalletState {
  connectMetamask: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  connectInjected: (provider: any) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { connectWallet, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets[0]; // Primary settlement agent

  const state = useMemo(() => ({
    address: activeWallet?.address || null,
    network: (activeWallet?.walletClientType === 'phantom' || activeWallet?.address.length > 42) ? 'solana' : 'evm' as any,
    isConnected: !!activeWallet,
    isConnecting: false,
    installedWallets: wallets.map(w => ({ info: { name: w.walletClientType, icon: '' }, provider: w })),
  }), [wallets, activeWallet]);

  const connectMetamask = useCallback(async () => {
    connectWallet();
  }, [connectWallet]);

  const connectPhantom = useCallback(async () => {
    connectWallet();
  }, [connectWallet]);

  const connectInjected = useCallback(async () => {
    connectWallet();
  }, [connectWallet]);

  const disconnect = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <WalletContext.Provider value={{ ...state, connectMetamask, connectPhantom, connectInjected, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
