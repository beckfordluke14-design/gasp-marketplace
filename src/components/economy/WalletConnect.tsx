'use client';

import { useWallet } from '../providers/WalletProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, LogOut, ShieldCheck, Diamond, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * 🛰️ NEURAL WALLET HUB
 * Objective: Integrated Wallet Connection with High-Fidelity UI.
 * Supported: Metamask, Phantom.
 */

export default function WalletConnect() {
  const { address, isConnected, isConnecting, network, installedWallets, connectMetamask, connectPhantom, connectInjected, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  // 🧬 Format Address: High-Fidelity truncation
  const fmt = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;

  const toggleModal = (state: boolean) => {
    setIsOpen(state);
    window.dispatchEvent(new CustomEvent('gasp_wallet_modal_toggle', { detail: state }));
  };

  return (
    <div className="relative font-outfit">
      
      {/* 🚀 SOVEREIGN ACTION: Direct Privy Connection Node */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isConnected) {
            setIsOpen(!isOpen);
          } else {
            connectMetamask(); // This calls Privy's native connectWallet
          }
        }}
        className={`h-10 md:h-12 px-3 md:px-6 rounded-full flex items-center gap-2 md:gap-3 transition-all border ${
          isConnected 
            ? 'bg-black/40 border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.1)]' 
            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Wallet size={14} className={isConnected ? "text-[#00f0ff]" : ""} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xs:block">
          {isConnecting ? 'SYNCING...' : isConnected ? fmt(address!) : 'CONNECT'}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] xs:hidden">
           {isConnected ? '...' : <Zap size={10} />}
        </span>
        {isConnected && network === 'evm' && <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" title="Base L2 Connected" />}
        {isConnected && network === 'solana' && <div className="w-1.5 h-1.5 rounded-full bg-[#9945FF]" title="Solana Connected" />}
      </motion.button>

      {/* Account Info Dropdown (Only if Connected) */}
      <AnimatePresence>
        {isOpen && isConnected && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[5050] bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute right-0 top-full mt-4 z-[5100] w-72 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
               <div className="space-y-6 text-left">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-white/40 tracking-widest leading-none italic">Wallet ID</h3>
                      <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white"><X size={14} /></button>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2 relative overflow-hidden group">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">{network === 'evm' ? 'Base L2 Wallet' : 'Solana Wallet'}:</span>
                      <code className="text-[11px] font-mono font-bold text-white/80">{fmt(address!)}</code>
                      <div className="flex items-center gap-2 mt-2">
                         <ShieldCheck size={12} className="text-[#00ff00]" />
                         <span className="text-[7.5px] font-black uppercase tracking-widest text-white/30 italic">Linked & Secure</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => { disconnect(); setIsOpen(false); }}
                     className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                   >
                     <LogOut size={14} /> Disconnect Wallet
                   </button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
