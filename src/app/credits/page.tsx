'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, Lock, Star, ChevronRight, Crown, Heart } from 'lucide-react';
import Header from '@/components/Header';
import { COIN_PACKAGES, ELITE_SUBSCRIPTION_COST, COST_VAULT_UNLOCK, COST_PREMIUM_VAULT_UNLOCK, COST_VOICE_NOTE, COST_PRIORITY_TIP } from '@/lib/economy/constants';

// CCBill Placeholder link — replace with real CCBill form URL when account is approved
const CCBILL_CHECKOUT_URL = 'https://ccbill.com'; // TODO: Replace with real CCBill form URL
const CCBILL_ELITE_URL = 'https://ccbill.com';    // TODO: Elite subscription form

export default function CreditsPage() {
  const handlePurchase = (packageId: string, priceUsd: number) => {
    // TODO: Replace href with real CCBill checkout links once account is approved
    // CCBill dynamic pricing link format: 
    // https://bill.ccbill.com/jpost/signup.cgi?clientAccnum=XXXXXX&clientSubacc=0000&formName=FORM&initialPrice=X&initialPeriod=XX
    console.log(`[CCBill] Initiating purchase for ${packageId} — $${priceUsd}`);
    window.open(CCBILL_CHECKOUT_URL, '_blank');
  };

  const handleElite = () => {
    console.log('[CCBill] Initiating Elite subscription');
    window.open(CCBILL_ELITE_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-20">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff00ff]/10 border border-[#ff00ff]/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#ff00ff] mb-4">
            <Zap size={10} />
            <span>Neural Credits Store</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-syncopate font-black uppercase italic tracking-tighter text-white leading-none">
            Fuel the<br />
            <span className="text-[#ff00ff]">Connection</span>
          </h1>
          <p className="text-white/40 text-sm font-outfit leading-relaxed max-w-sm mx-auto">
            Credits unlock voice notes, vault content, priority replies, and more. No subscription required — buy what you want.
          </p>
        </motion.div>

        {/* ELITE BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleElite}
          className="relative overflow-hidden rounded-[2rem] p-6 mb-8 border border-[#ffea00]/30 bg-gradient-to-br from-[#ffea00]/10 to-black cursor-pointer group hover:border-[#ffea00]/60 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffea00]/5 via-transparent to-[#ff00ff]/5" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffea00]/10 border border-[#ffea00]/30 flex items-center justify-center">
                <Crown size={22} className="text-[#ffea00]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffea00]">Elite Access</span>
                  <span className="px-2 py-0.5 bg-[#ffea00] text-black text-[8px] font-black uppercase rounded-full">Popular</span>
                </div>
                <p className="text-white font-black text-lg">${ELITE_SUBSCRIPTION_COST}<span className="text-white/40 font-normal text-xs">/month</span></p>
                <p className="text-white/40 text-[10px] mt-0.5">50% off all unlocks • Priority replies • Exclusive content</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#ffea00]/60 group-hover:text-[#ffea00] group-hover:translate-x-1 transition-all shrink-0" />
          </div>
          {/* CCBill Placeholder notice */}
          <div className="mt-4 px-3 py-2 bg-[#ffea00]/5 border border-[#ffea00]/10 rounded-xl">
            <p className="text-[9px] text-[#ffea00]/50 uppercase tracking-widest text-center">
              🔒 Secure checkout via CCBill — Coming soon
            </p>
          </div>
        </motion.div>

        {/* COIN PACKAGES */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Credit Packages</p>
          {COIN_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => handlePurchase(pkg.id, pkg.priceUsd)}
              className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer group transition-all ${
                pkg.isPopular
                  ? 'border-[#ff00ff]/40 bg-[#ff00ff]/5 hover:border-[#ff00ff]/70 hover:bg-[#ff00ff]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#ff00ff] text-black text-[8px] font-black uppercase rounded-full">
                  Most Popular
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.isPopular ? 'bg-[#ff00ff]/20 text-[#ff00ff]' : 'bg-white/5 text-white/40'}`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-black uppercase italic tracking-tight ${pkg.isPopular ? 'text-white' : 'text-white/80'}`}>{pkg.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black ${pkg.isPopular ? 'text-[#ff00ff]' : 'text-[#00f0ff]'}`}>{pkg.coins} credits</span>
                      {pkg.bonus && (
                        <span className="text-[9px] text-[#ffea00] font-black">{pkg.bonus} bonus</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-white">${pkg.priceUsd}</span>
                  <ChevronRight size={16} className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* BURN RATES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">What Credits Unlock</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Voice Note', cost: COST_VOICE_NOTE, icon: '🎙️' },
              { label: 'Vault Unlock', cost: COST_VAULT_UNLOCK, icon: '🔓' },
              { label: 'Priority Reply', cost: COST_PRIORITY_TIP, icon: '⚡' },
              { label: 'Premium Vault', cost: COST_PREMIUM_VAULT_UNLOCK, icon: '💎' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-white uppercase">{item.label}</p>
                  <p className="text-[9px] text-[#ff00ff] font-black">{item.cost} credits</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Signals */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-[#00f0ff]" />
            <span className="text-[9px] font-black uppercase tracking-widest">Secure via CCBill</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-[#ff00ff]" />
            <span className="text-[9px] font-black uppercase tracking-widest">18+ Only</span>
          </div>
        </div>

        <p className="text-center text-[8px] text-white/20 mt-6 uppercase tracking-widest leading-relaxed">
          All purchases are processed by CCBill. By purchasing you agree to our{' '}
          <a href="/terms" className="text-white/40 hover:text-white">Terms of Service</a>.{' '}
          Credits are non-refundable. All content is for adults 18+.
        </p>
      </div>
    </div>
  );
}



