'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

/**
 * 🛰️ NEURAL WALLET BRIDGE
 * Universal adapter for EVM (Metamask) and Solana (Phantom).
 * Objective: Frictionless settlement protocol.
 */

interface WalletState {
  address: string | null;
  network: 'evm' | 'solana' | null;
  isConnected: boolean;
  isConnecting: boolean;
  installedWallets: any[]; // Detected browser wallets
}

interface WalletContextType extends WalletState {
  connectMetamask: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  connectInjected: (provider: any) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: null,
    isConnected: false,
    isConnecting: false,
    installedWallets: [],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const providers: any[] = [];
    const handleAnnounce = (event: any) => {
      if (providers.find(p => p.info.uuid === event.detail.info.uuid)) return;
      providers.push(event.detail);
      setState(s => ({ ...s, installedWallets: [...providers] }));
    };

    window.addEventListener('eip6963:announceProvider' as any, handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    
    return () => window.removeEventListener('eip6963:announceProvider' as any, handleAnnounce);
  }, []);

  const connectMetamask = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;

    if (ethereum) {
      setState(s => ({ ...s, isConnecting: true }));
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        setState(s => ({
          ...s,
          address: accounts[0],
          network: 'evm',
          isConnected: true,
          isConnecting: false,
        }));

        // Listen for changes
        ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            setState(s => ({ ...s, address: null, network: null, isConnected: false, isConnecting: false }));
          } else {
            setState(s => ({ ...s, address: newAccounts[0] }));
          }
        });

        ethereum.on('chainChanged', () => window.location.reload());

      } catch (err) {
        console.error('[EVM] Connection Failure:', err);
        setState(s => ({ ...s, isConnecting: false }));
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  }, []);

  const connectInjected = useCallback(async (injected: any) => {
    setState(s => ({ ...s, isConnecting: true }));
    try {
      const provider = new ethers.BrowserProvider(injected.provider);
      const accounts = await injected.provider.request({ method: 'eth_requestAccounts' });
      
      setState(s => ({
        ...s,
        address: accounts[0],
        network: 'evm',
        isConnected: true,
        isConnecting: false,
      }));

      injected.provider.on('accountsChanged', (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          setState(s => ({ ...s, address: null, network: null, isConnected: false }));
        } else {
          setState(s => ({ ...s, address: newAccounts[0] }));
        }
      });
    } catch (err) {
      console.error('[Injected] Connection Failure:', err);
      setState(s => ({ ...s, isConnecting: false }));
    }
  }, []);

  const connectPhantom = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const solana = (window as any).solana;

    if (solana?.isPhantom) {
      setState(s => ({ ...s, isConnecting: true }));
      try {
        const resp = await solana.connect();
        setState(s => ({
          ...s,
          address: resp.publicKey.toString(),
          network: 'solana',
          isConnected: true,
          isConnecting: false,
        }));

        solana.on('accountChanged', (publicKey: any) => {
          if (publicKey) {
            setState(s => ({ ...s, address: publicKey.toString() }));
          } else {
            setState(s => ({ ...s, address: null, network: null, isConnected: false, isConnecting: false }));
          }
        });

      } catch (err) {
        console.error('[SOL] Connection Failure:', err);
        setState(s => ({ ...s, isConnecting: false }));
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  }, []);

  const disconnect = useCallback(() => {
    setState(s => ({ ...s, address: null, network: null, isConnected: false, isConnecting: false }));
    // Note: Phantom allows programmatic disconnect, Metamask typically doesn't
    const solana = (window as any).solana;
    if (solana?.isPhantom) solana.disconnect();
  }, []);

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
