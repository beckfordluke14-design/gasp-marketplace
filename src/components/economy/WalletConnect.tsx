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

  return (
    <div className="relative font-outfit">
      
      {/* 🏔️ MAIN CONNECT TRIGGER */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => isConnected ? setIsOpen(!isOpen) : setIsOpen(true)}
        className={`h-12 px-6 rounded-full flex items-center gap-3 transition-all border ${
          isConnected 
            ? 'bg-black/40 border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.1)]' 
            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Wallet size={16} className={isConnected ? "text-[#00f0ff]" : ""} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {isConnecting ? 'SYNCING...' : isConnected ? fmt(address!) : 'CONNECT'}
        </span>
        {isConnected && network === 'evm' && <div className="w-1.5 h-1.5 rounded-full bg-[#0052FF]" title="Base L2 Connected" />}
        {isConnected && network === 'solana' && <div className="w-1.5 h-1.5 rounded-full bg-[#9945FF]" title="Solana Connected" />}
      </motion.button>

      {/* 🏔️ WALLET HUB MODAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop blur: Secure visual isolate */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
              className="fixed top-32 left-1/2 -translate-x-1/2 z-[1001] w-80 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              {/* 🏔️ HEADER */}
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Protocol Bridge</span>
                    <h3 className="text-sm font-syncopate font-black uppercase italic text-white leading-none">Settlement Node</h3>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                    <X size={16} />
                 </button>
              </div>

              {isConnected ? (
                <div className="space-y-6">
                   {/* 🏔️ CONNECTED STATE */}
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         {network === 'evm' ? <Zap size={40} /> : <Diamond size={40} />}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">{network === 'evm' ? 'EVM NODE' : 'SOLANA NODE'}:</span>
                      <code className="text-[11px] font-mono font-bold text-white/80">{fmt(address!)}</code>
                      <div className="flex items-center gap-2 mt-2">
                         <ShieldCheck size={12} className="text-[#00ff00]" />
                         <span className="text-[7.5px] font-black uppercase tracking-widest text-white/30 italic">Active Neural Link</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => { disconnect(); setIsOpen(false); }}
                     className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                   >
                     <LogOut size={14} /> Terminate Sync
                   </button>
                </div>
              ) : (
                <div className="space-y-3">
                   {/* 🌲 DYNAMIC DISCOVERY TRAY (EIP-6963) */}
                   {installedWallets.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                         <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 pl-1 mb-1">Detected Agents:</span>
                         <div className="grid grid-cols-2 gap-2">
                           {installedWallets.map((w: any) => (
                              <button 
                                key={w.info.uuid} 
                                onClick={() => { connectInjected(w); setIsOpen(false); }}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 hover:bg-white/10 transition-all text-left group"
                              >
                                 <img src={w.info.icon} alt={w.info.name} className="w-6 h-6 rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
                                 <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white truncate">{w.info.name}</span>
                              </button>
                           ))}
                         </div>
                      </div>
                   )}

                   {/* 🏔️ CONNECTION OPTIONS: THE DUAL-BRIDGE FALLBACK */}
                   <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 pl-1">Legacy Nodes:</span>
                      
                      <button 
                        onClick={() => { connectMetamask(); setIsOpen(false); }}
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-5 group hover:border-[#0052FF]/60 hover:bg-[#0052FF]/5 transition-all shadow-inner"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0052FF]/20 flex items-center justify-center text-[#0052FF]"><Zap size={18} fill="currentColor" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white leading-none">Global EVM</span>
                         </div>
                         <div className="text-[8px] font-black text-[#0052FF] opacity-0 group-hover:opacity-100 transition-opacity">ETH / BASE</div>
                      </button>

                      <button 
                        onClick={() => { connectPhantom(); setIsOpen(false); }}
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-5 group hover:border-[#9945FF]/60 hover:bg-[#9945FF]/5 transition-all shadow-inner"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#9945FF]/20 flex items-center justify-center text-[#9945FF]"><Diamond size={18} fill="currentColor" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white leading-none">Phantom Node</span>
                         </div>
                         <div className="text-[8px] font-black text-[#9945FF] opacity-0 group-hover:opacity-100 transition-opacity">SOLANA</div>
                      </button>
                   </div>

                   <p className="text-[8.5px] text-white/20 text-center leading-relaxed font-outfit uppercase font-black pt-4 px-6">
                      Syncing your wallet allows for <span className="text-white">One-Click Stake</span> credits & exclusive access.
                   </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
