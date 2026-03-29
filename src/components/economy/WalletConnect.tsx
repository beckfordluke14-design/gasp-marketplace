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
      
      {/* 🏔️ MAIN CONNECT TRIGGER */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isConnected) {
            toggleModal(!isOpen);
          } else {
            toggleModal(true);
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

      {/* 🏔️ WALLET HUB MODAL */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => toggleModal(false)}
              className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-[calc(100%-1rem)] md:w-80 max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-[0_30px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Payment Method</span>
                    <h3 className="text-sm font-syncopate font-black uppercase italic text-white leading-none">Add Credits</h3>
                 </div>
                 <button onClick={() => toggleModal(false)} className="text-white/20 hover:text-white transition-colors">
                    <X size={16} />
                 </button>
              </div>

              {isConnected ? (
                <div className="space-y-6">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         {network === 'evm' ? <Zap size={40} /> : <Diamond size={40} />}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#00f0ff]">{network === 'evm' ? 'Base L2 Wallet' : 'Solana Wallet'}:</span>
                      <code className="text-[11px] font-mono font-bold text-white/80">{fmt(address!)}</code>
                      <div className="flex items-center gap-2 mt-2">
                         <ShieldCheck size={12} className="text-[#00ff00]" />
                         <span className="text-[7.5px] font-black uppercase tracking-widest text-white/30 italic">Linked & Secure</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => { disconnect(); toggleModal(false); }}
                     className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                   >
                     <LogOut size={14} /> Disconnect Wallet
                   </button>
                </div>
              ) : (
                <div className="space-y-3">
                   {installedWallets.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                         <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 pl-1 mb-1">Detected Wallets:</span>
                         <div className="grid grid-cols-2 gap-2">
                            {installedWallets.map((w: any) => (
                               <button 
                                 key={w.info.uuid} 
                                 onClick={() => { connectInjected(w); toggleModal(false); }}
                                 className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00f0ff]/40 hover:bg-white/10 transition-all text-left group"
                               >
                                  <img src={w.info.icon} alt={w.info.name} className="w-6 h-6 rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white truncate">{w.info.name}</span>
                               </button>
                            ))}
                         </div>
                      </div>
                   )}

                   <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 pl-1">Wallet Selection:</span>
                      
                      <button 
                        onClick={() => { connectMetamask(); toggleModal(false); }}
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-5 group hover:border-[#0052FF]/60 hover:bg-[#0052FF]/5 transition-all shadow-inner"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0052FF]/20 flex items-center justify-center text-[#0052FF]"><Zap size={18} fill="currentColor" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white leading-none">Standard Crypto</span>
                         </div>
                         <div className="text-[8px] font-black text-[#0052FF] opacity-0 group-hover:opacity-100 transition-opacity">ETH / BASE</div>
                      </button>

                      <button 
                        onClick={() => { connectPhantom(); toggleModal(false); }}
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-5 group hover:border-[#9945FF]/60 hover:bg-[#9945FF]/5 transition-all shadow-inner"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#9945FF]/20 flex items-center justify-center text-[#9945FF]"><Diamond size={18} fill="currentColor" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white leading-none">Phantom App</span>
                         </div>
                         <div className="text-[8px] font-black text-[#9945FF] opacity-0 group-hover:opacity-100 transition-opacity">SOLANA</div>
                      </button>
                   </div>

                   <p className="text-[8.5px] text-white/20 text-center leading-relaxed font-outfit uppercase font-black pt-4 px-6">
                      Syncing your wallet allows for <span className="text-white">Easy Access</span> to credits & exclusive content.
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
