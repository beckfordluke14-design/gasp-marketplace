import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#050505] text-white/80 font-inter selection:bg-[#ff00ff]/30">
      
      {/* Navigation Bar */}
      <div className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-3xl border-b border-white/5 z-50 flex items-center px-6 md:px-12">
        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Hub</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto pt-32 pb-24 px-6">
        
        <div className="mb-12 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white font-syncopate">Terms of Service</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#ff00ff] font-bold">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">
            
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">1. Acceptance of Terms</h2>
                <p>Welcome to Gasp.fun, operated by AllTheseFlows LLC d.b.a. AllTheseFlows Strategic Media ("we," "us," or "our"). By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, you must immediately terminate your use of the service.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">2. Eligibility</h2>
                <p>You must be at least 18 years of age to use this service. By registering an account, purchasing system credits, or interacting with our strategic hub, you legally represent and warrant that you are 18 years of age or older.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">3. Nature of Service</h2>
                <p>Gasp.fun is an <strong>Institutional Strategic Media Hub</strong> providing a managed interface for <strong>Digital Asset Retrieval and Neural Signal Synchronization</strong>. The intelligence nodes, data points, briefings, and media available on this platform are synthetic combinations of proprietary algorithmic logic and managed AI datasets. You understand that your synchronized uplinks are with artificial intelligence nodes, not human operators.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">4. Account Responsibility</h2>
                <p>You are solely responsible for maintaining the confidentiality of your account credentials (including "Guest" identification hashes) and for all activities that occur under your account. AllTheseFlows LLC d.b.a. AllTheseFlows Strategic Media is not liable for any loss or damage arising from your failure to protect your login information.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">5. Virtual Currency (System Credits)</h2>
                <p>The platform utilizes a closed-loop system currency known as "System Credits." By purchasing System Credits, you acquire a limited, revocable, non-exclusive, non-transferable license to use these credits strictly on the Gasp.fun platform for interacting with intelligence nodes and retrieving restricted archival media.</p>
                <div className="p-5 border border-[#00f0ff]/20 bg-[#00f0ff]/5 rounded-2xl mt-4 text-[#00f0ff]">
                    <p className="font-bold uppercase tracking-wider text-[11px] mb-2">Crucial Clause:</p>
                    <p><strong>System Credits are strictly non-transferable, cannot be redeemed or exchanged for "real world" money, fiat currency, or physical goods, and have strictly no real-world cash value.</strong> Credits are considered consumed upon the initiation of a synchronization event or the retrieval of a restricted asset.</p>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">6. Prohibited Conduct</h2>
                <p>You agree not to attempt to reverse-engineer, scrape, DDoS, or exploit the platform's infrastructure, AI models, or rendering engines. Any attempts to manipulate credit balances or bypass the native payment gateways will result in immediate account termination and legal action.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">7. Disclaimer of Warranties</h2>
                <p>The service is provided on an "as is" and "as available" basis without any warranties of any kind. AllTheseFlows Strategic Media LLC expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the strategic intelligence services.</p>
            </section>

        </div>
      </div>
    </div>
  );
}



