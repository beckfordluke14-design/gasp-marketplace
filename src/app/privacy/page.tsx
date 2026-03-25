import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white font-syncopate">Privacy Policy</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#ff00ff] font-bold">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">
            
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">1. Who We Are</h2>
                <p>This Privacy Policy explains how AllTheseFlows LLC ("we," "us," or "our") collects, uses, protects, and discloses information when you use Gasp.fun and our associated services.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">2. Information Collection</h2>
                <p>We may collect several types of data during your time interacting with our platform, including:</p>
                <ul className="list-disc pl-5 mt-3 space-y-2 text-white/60">
                    <li><strong className="text-white">Account Information:</strong> If you register or migrate your guest ID, we collect your email address and encrypted password state through standard OAuth/Email procedures.</li>
                    <li><strong className="text-white">Transaction Data:</strong> If you purchase Breathe Points, payment details are collected directly by secure, high-risk payment processors (like Stripe or CCBill). We only retain secure billing tokens and successful invoice IDs; we never access raw credit card numbers.</li>
                    <li><strong className="text-white">Usage & Communication Logs:</strong> We collect hardware session data, clickstreams, and the text of chat messages sent between you and our neural engines to maintain contextual reality continuity.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">3. AI Integration & Google Gemini API</h2>
                <p>Because our platform heavily utilizes dynamic artificial intelligence to generate chat responses and parse contextual identity, the chat dialogue you submit to a persona is processed through the <strong>Google Gemini API infrastructure</strong> (and equivalent LLM pipelines). Any conversation data processed by these engines is utilized strictly to formulate character responses and maintain your specific user-bonding session memory. We strongly advise users never to transmit highly sensitive personally identifiable information (PII) to an AI node.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">4. Data Usage and Non-Sale Covenant</h2>
                <p>We use your information exclusively to provide, maintain, and improve the AI entertainment experience on Gasp.fun. We also use contact structures (like Resend) to trigger engagement notifications. <strong>AllTheseFlows LLC strictly does not sell your personal data, chat behavior, identity, or emails to third-party data brokers or advertisers.</strong></p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">5. Security & Encryption Standards</h2>
                <p>Security is a paramount concern for our architecture. We use industry-standard encryption protocols (including SSL/HTTPS tunneling and Supabase Row Level Security) to encrypt and defend all transactions, user wallets, connection hashes, and persistent profile data.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">6. Cookie Usage</h2>
                <p>Gasp.fun utilizes standard internet cookies, localStorage (such as `gasp_guest_id`), and tracking pixels to maintain your authentication state across the decentralized environment, remember your user preferences, and securely authorize your wallet when executing the purchase of Breathe Points. By continuing to use our platform, you consent to our foundational cookie architecture.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">7. Contact & Deletion Protocol</h2>
                <p>Under CCPA, GDPR, and broader data law frameworks, you have the right to request a complete deletion of your account and its associated neural memory blocks. To execute a digital purge, review our Contact page to speak with our compliance operator.</p>
            </section>

        </div>
      </div>
    </div>
  );
}



