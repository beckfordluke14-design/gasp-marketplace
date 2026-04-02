'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Zap, 
  ShieldCheck, 
  History, 
  X, 
  ChevronRight, 
  Loader2, 
  Copy,
  CheckCircle2,
  AlertCircle,
  Globe,
  Coins
} from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface TopUpDrawerProps {
  onClose: () => void;
  userId: string;
}

const CREDIT_PACKAGES = [
    { id: 'starter', credits: 500, priceUsd: 4.99, label: 'Tactical Recon', bonus: '5% Bonus', popular: false },
    { id: 'pro', credits: 2300, priceUsd: 19.99, label: 'Elite Intelligence', bonus: '15% Bonus', popular: true },
    { id: 'institutional', credits: 6250, priceUsd: 49.99, label: 'Sovereign Archive', bonus: '25% Bonus', popular: false },
];

/**
 * 🛰️ SOVEREIGN TOP-UP HUB v8.8 // MULTI-LOCALE GLOBAL NODE
 * Strategy: Zero-Friction Handshake using Institutional crypto.link.com Bridge.
 */
export default function TopUpDrawer({ onClose, userId }: TopUpDrawerProps) {
  const vaultAddress = "DGQVNRTWEv1HEwP6Wtcm1LEUPgZKsW9JfwVpEDjPcEkS";
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isSpanish = typeof window !== 'undefined' && localStorage.getItem('gasp_locale') === 'es';

  const handleSelect = (id: string) => {
    setSelectedPkgId(id);
  };

  if (isSuccess) {
      return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl"
          >
              <div className="bg-[#111] border border-[#ff00ff]/20 p-12 rounded-[3.5rem] flex flex-col items-center text-center max-w-lg shadow-[0_0_100px_rgba(255,0,255,0.1)]">
                   <div className="w-24 h-24 rounded-full bg-[#ff00ff]/10 flex items-center justify-center mb-8">
                       <CheckCircle2 size={48} className="text-[#ff00ff]" />
                   </div>
                   <h2 className="text-4xl font-syncopate font-black italic uppercase text-white mb-4">
                        {isSpanish ? 'UPLINK EXITOSO' : 'UPLINK SUCCESS'}
                   </h2>
                   <p className="text-white/40 text-sm font-outfit uppercase tracking-widest leading-relaxed mb-10">
                        {isSpanish ? 'Los créditos de inteligencia han sido provicionados en su Bóveda del Archivo.' : 'Intelligence Credits have been provisioned to your Archive Vault.'}
                   </p>
                   <button 
                    onClick={onClose}
                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl"
                   >
                    {isSpanish ? 'CERRAR TERMINAL' : 'CLOSE TERMINAL'}
                   </button>
              </div>
          </motion.div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl h-full bg-[#050505] border-l border-white/5 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex flex-col">
            <h2 className="text-2xl font-syncopate font-black italic uppercase text-white tracking-widest">
                {isSpanish ? 'Puente del Archivo' : 'Archive Bridge'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 italic">
                    {isSpanish ? 'Liquidación Directa Activa' : 'Direct Treasury Settlement Active'}
                </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 transition-all flex items-center justify-center text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            {!selectedPkgId ? (
              <motion.div
                key="package-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-10 text-center md:text-left">
                  <h3 className="text-sm font-black uppercase text-white/60 tracking-[0.2em] mb-2 font-syncopate italic">
                    {isSpanish ? 'Seleccione Paquete de Inteligencia' : 'Select Intelligence Package'}
                  </h3>
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest italic">
                    {isSpanish ? 'Todas las liquidaciones se procesan directamente en la Bóveda Maestra del Archivo.' : 'All settlements processed directly into the Archive Master Vault.'}
                  </p>
                </div>

                <div className="grid gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelect(pkg.id)}
                      className={`group relative p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden ${
                        pkg.popular 
                          ? 'border-[#ff00ff]/30 bg-[#ff00ff]/5' 
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-10 bg-[#ff00ff] text-white text-[7px] font-black uppercase px-4 py-1.5 rounded-b-xl tracking-widest italic animate-pulse">
                            {isSpanish ? 'RECOMENDADO' : 'RECOMMENDED'}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff00ff] mb-2">{pkg.label}</span>
                          <div className="flex items-end gap-3 mb-1">
                            <span className="text-3xl font-syncopate font-black italic uppercase text-white">{pkg.credits}</span>
                            <span className="text-[10px] font-black uppercase text-white/20 mb-1.5 font-syncopate tracking-widest italic">CREDITS</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-syncopate font-black text-white italic">${pkg.priceUsd}</span>
                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#00f0ff] mt-2 italic bg-[#00f0ff]/5 px-3 py-1 rounded-full">
                            <Zap size={10} /> {pkg.bonus}
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] group-hover:opacity-[0.05] transition-all">
                        <Coins size={120} className={pkg.popular ? 'text-[#ff00ff]' : 'text-white'} />
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={() => handleSelect('custom_250')}
                    className="p-6 rounded-3xl border border-dashed border-white/10 hover:border-[#ff00ff]/30 hover:bg-[#ff00ff]/5 transition-all text-center group"
                  >
                    <span className="text-[8px] font-black uppercase text-white/20 tracking-widest group-hover:text-[#ff00ff] transition-all italic">
                        {isSpanish ? 'Escala Institucional / Despliegue Personalizado' : 'Institutional Scale / Custom Deployment'}
                    </span>
                  </button>
                </div>

                {/* 🛡️ INSTITUTIONAL BRIDGE: THE LOCKED TREASURY GATEWAY */}
                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3.5rem] space-y-6 text-center mt-12 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[#00f0ff]/5 animate-pulse pointer-events-none" />
                    <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.3em] italic relative z-10">
                        {isSpanish ? 'Puente de Liquidación Rápida' : 'Quick Settlement Card Bridge'}
                    </p>
                    <button 
                      onClick={() => window.open(`https://crypto.link.com/?destination_currency=usdc&destination_network=solana&source_currency=usd&source_amount=4.99&wallet_address=${vaultAddress}&lock_wallet_address=true&client_reference_id=${userId}`, '_blank')}
                      className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 relative z-10"
                    >
                      <CreditCard size={18} /> {isSpanish ? 'COMPRA CON TARJETA' : 'BUY WITH CARD'}
                    </button>
                    <p className="text-[8px] text-white/20 uppercase font-black tracking-widest leading-relaxed px-12 italic relative z-10">
                      {isSpanish ? 'Liquidación Directa SOL-USDC a:' : 'Direct Solana-USDC Settlement to:'} <br /> 
                      <span className="text-[#00f0ff] font-mono">{vaultAddress.slice(0, 8)}...{vaultAddress.slice(-8)}</span> 🏛️🛡️
                    </p>
                </div>
              </motion.div>
            ) : (
                <InstitutionalCashier 
                    key="institutional-cashier"
                    userId={userId} 
                    vaultAddress={vaultAddress}
                    customAmount={selectedPkgId.startsWith('custom_') ? selectedPkgId.split('_')[1] : CREDIT_PACKAGES.find(p => p.id === selectedPkgId)?.priceUsd.toString() || '4.99'} 
                    onStepBack={() => setSelectedPkgId(null)}
                    onSuccess={() => setIsSuccess(true)}
                    isSpanish={isSpanish}
                />
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-[#00f0ff]" />
                <span className="text-[7px] font-black uppercase text-white/30 tracking-widest italic">
                    {isSpanish ? 'Encriptación Soberana Activa' : 'Sovereign Encryption Active'}
                </span>
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-[7px] font-black uppercase text-white/40 hover:text-white tracking-widest flex items-center gap-2 italic"
            >
                <History size={14} /> {isSpanish ? 'Historial de Liquidación' : 'Settlement History'}
            </button>
        </div>
      </motion.div>
    </div>
  );
}

function InstitutionalCashier({ userId, vaultAddress, customAmount, onStepBack, onSuccess, isSpanish }: { userId: string, vaultAddress: string, customAmount: string, onStepBack: () => void, onSuccess: () => void, isSpanish: boolean }) {
    const copyAddress = () => {
        navigator.clipboard.writeText(vaultAddress);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center gap-4 mb-2">
                <button onClick={onStepBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                    <X size={16} className="rotate-45" />
                </button>
                <h3 className="text-sm font-black uppercase text-white tracking-widest font-syncopate italic">
                    {isSpanish ? 'Panel de Liquidación de Bóveda' : 'Vault Settlement Panel'}
                </h3>
            </div>

            <div className="p-10 bg-[#ff00ff]/5 border border-[#ff00ff]/20 rounded-[3rem] text-center">
                <span className="text-[9px] font-black uppercase text-[#ff00ff] tracking-[0.4em] mb-4 block italic">
                    {isSpanish ? 'LIQUIDACIÓN TOTAL' : 'TOTAL SETTLEMENT'}
                </span>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-syncopate font-black italic text-white">${customAmount}</span>
                    <span className="text-xl font-syncopate font-black text-white/20 italic">USD</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
                    <h4 className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-4 italic px-2">
                        {isSpanish ? 'Puente Institucional (SOL/USDC)' : 'Institutional Bridge (SOL/USDC)'}
                    </h4>
                    
                    <button 
                        onClick={() => window.open(`https://crypto.link.com/?destination_currency=usdc&destination_network=solana&source_currency=usd&source_amount=${customAmount}&wallet_address=${vaultAddress}&lock_wallet_address=true&client_reference_id=${userId}`, '_blank')}
                        className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        <CreditCard size={18} /> {isSpanish ? 'COMPRA CON TARJETA' : 'BUY WITH CARD'}
                    </button>

                    <p className="text-[7px] text-white/30 uppercase text-center font-bold tracking-widest leading-relaxed px-8 italic">
                        {isSpanish ? 'La liquidación llega directamente a la Bóveda Maestro.' : 'Settlement arrives directly in the Master Vault.'} <br /> 
                        {isSpanish ? 'Verificación Instantánea Activa.' : 'Instant Verification Active.'} 🏛️🛡️
                    </p>
                    
                    <p className="text-[7px] text-white/20 uppercase text-center font-black tracking-[0.3em] py-4">
                        {isSpanish ? 'O LIQUIDACIÓN DIRECTA A BÓVEDA' : 'OR DIRECT VAULT SETTLEMENT'}
                    </p>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl relative group flex flex-col items-center gap-6">
                        {/* 🏦 STRATEGIC QR HUB */}
                        <div className="relative group/qr">
                            <div className="absolute -inset-4 bg-[#00f0ff]/10 blur-xl opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                            <div className="relative w-40 h-40 bg-white p-2 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vaultAddress}&color=000000&bgcolor=ffffff`}
                                    alt="Vault QR Code"
                                    className="w-full h-full"
                                />
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-[7px] font-black uppercase text-[#00f0ff] tracking-[0.4em] italic animate-pulse">
                                    {isSpanish ? 'ESCANEAR PARA PAGAR' : 'SCAN TO SETTLE'}
                                </span>
                            </div>
                        </div>

                        <div className="w-full relative">
                            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20 block mb-3 text-center">MASTER VAULT ADDRESS</span>
                            <code className="block text-[11px] font-mono text-[#00f0ff] break-all text-center leading-relaxed pr-10">
                                {vaultAddress}
                            </code>
                            <button 
                                onClick={copyAddress}
                                className="absolute right-0 bottom-[-4px] w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-[#00f0ff] hover:text-black transition-all shadow-2xl"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 🧬 BILINGUAL SETTLEMENT WIZARD */}
                    <div className="grid grid-cols-3 gap-2 w-full pt-4">
                        <div className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[6px] font-black uppercase text-[#00f0ff] tracking-widest italic">{isSpanish ? '01. ESCANEAR' : '01. SCAN'}</span>
                            <p className="text-[6px] text-white/30 uppercase text-center font-black leading-tight">{isSpanish ? 'Usa tu Móvil' : 'Use Mobile Wallet'}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[6px] font-black uppercase text-[#ff00ff] tracking-widest italic">{isSpanish ? '02. ENVIAR' : '02. SEND'}</span>
                            <p className="text-[6px] text-white/30 uppercase text-center font-black leading-tight">{isSpanish ? 'Firma Transacción' : 'Push Signature'}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[6px] font-black uppercase text-[#ffea00] tracking-widest italic">{isSpanish ? '03. RECIBIR' : '03. SYNC'}</span>
                            <p className="text-[6px] text-white/30 uppercase text-center font-black leading-tight">{isSpanish ? 'Créditos Listos' : 'Credits Ready'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <AlertCircle size={14} className="text-[#ffea00] shrink-0" />
                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-loose">
                        {isSpanish 
                            ? 'Las transferencias manuales requieren verificación en cadena. El G-Scanner monitorea su saldo 24/7.' 
                            : 'Manual transfers require on-chain verification. G-Scanner monitors your balance 24/7.'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
