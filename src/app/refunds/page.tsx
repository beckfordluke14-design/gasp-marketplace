import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function RefundPolicy() {
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
            <div className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full text-red-500 mb-4">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Strict Financial Covenant</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white font-syncopate">Refund & Cancellation Policy</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#ff00ff] font-bold">Last Updated: March 20, 2026</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">
            
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">1. Final Sale Guarantee</h2>
                <div className="p-6 border-l-4 border-red-500 bg-white/5 rounded-r-2xl">
                    <p className="font-bold text-white text-base">All sales of Breathe Points are strictly final.</p>
                    <p className="mt-3 text-white/70">Because Breathe Points act as digital credits that are instantly injected into your blockchain wallet and are accessible immediately upon purchase, <strong>AllTheseFlows LLC does not offer refunds, partial refunds, or chargeback authorizations once a transaction successfully processes.</strong> We fulfill our service instantly via fully automated protocols.</p>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">2. Chargeback Policy</h2>
                <p>By engaging in a transaction with AllTheseFlows LLC, you legally agree that the product is a consumable, 100% digital service delivered immediately upon successful payment confirmation. Fraudulent chargeback disputes initiated through your bank or high-risk processors (like CCBill) for legitimately rendered and delivered Breathe Points will result in a permanent blacklist of your identity, IP array, and card structures across our entire network.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">3. Transaction Discrepancies & Technical Errors</h2>
                <p>We recognize that payment gateways and API architectures occasionally experience latency or fatal packet losses. If an algorithmic drop occurs and your funds execute without crediting your virtual balance:</p>
                <div className="p-5 border border-white/10 rounded-2xl bg-black mt-3">
                    <ul className="list-disc pl-5 space-y-2 text-white/70">
                        <li><strong className="text-white">Do not issue a chargeback immediately.</strong> Doing so will lock the funds in a 30-day clearing delay sequence.</li>
                        <li><strong>Initiate Technical Review:</strong> You must directly email <a href="mailto:support@alltheseflows.com" className="text-[#ff00ff] hover:underline transition-all">support@alltheseflows.com</a> with your Guest ID or registered email address, along with the specific transaction receipt ID or timestamp.</li>
                    </ul>
                </div>
                <p className="mt-3">If our backend diagnostics confirm the discrepancy, we will instantly force an overriding wallet injection to credit your missing Breathe Points. If we cannot credit your account due to systemic failure, we will issue a direct, authorized refund back to your original payment method.</p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider font-syncopate">4. Termination and Void Context</h2>
                <p>If AllTheseFlows LLC detects severe manipulation, bots, scraping, or behavior that violates the Terms of Service, we reserve the right to immediately terminate the account. Upon termination, any remaining, unspent Breathe Points inside your ecosystem wallet are forfeited and immediately voided with zero compensation or right to refund.</p>
            </section>

        </div>
      </div>
    </div>
  );
}



