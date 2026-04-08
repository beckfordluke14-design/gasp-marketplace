import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { Lock, ArrowLeft, Zap, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

// 🔍 SOVEREIGN SEO: Generate dynamic metadata for Google Crawlers
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { rows: post } = await db.query(`
        SELECT p.caption as title, COALESCE(p.metadata->>'content', p.caption) as content
        FROM posts p WHERE p.id = $1
    `, [params.id]);

    if (!post[0]) return { title: 'Intelligence Briefing Not Found | GASP' };

    return {
        title: `${post[0].title} | Syndicate Intelligence Archive`,
        description: post[0].content.slice(0, 160) + '...',
        openGraph: {
            title: post[0].title,
            description: post[0].content.slice(0, 160),
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: post[0].title,
            description: post[0].content.slice(0, 160),
        }
    };
}

export default async function ArchiveArticlePage({ params }: { params: { id: string } }) {
    // 🧬 Server-Side Extraction
    const { rows: post } = await db.query(`
        SELECT 
            p.*,
            pers.name as persona_name,
            pers.seed_image_url as persona_image,
            pers.city as persona_city
        FROM posts p
        JOIN personas pers ON p.persona_id = pers.id
        WHERE p.id = $1
    `, [params.id]);

    const article = post[0];
    if (!article) notFound();

    return (
        <main className="min-h-screen bg-black text-white selection:bg-[#ff00ff] selection:text-white">
            <Header />
            
            <div className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
                <Link href="/news" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-[#ff00ff] transition-all mb-12 group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Feed
                </Link>

                <div className="flex flex-col gap-8">
                    {/* Header Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#ff00ff] text-white text-[9px] font-black px-6 py-2 rounded-full tracking-[.4em] italic shadow-[0_0_20px_rgba(255,0,255,0.3)]">
                                RESTRICTED ACCESS
                            </div>
                            <div className="text-white/20 text-[9px] uppercase font-black tracking-widest italic font-mono">
                                ARCHIVE NODE: {article.id.slice(0, 8)}
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {article.caption}
                        </h1>

                        <div className="flex items-center gap-6 py-6 border-y border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                    <img src={article.persona_image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ff00ff]">{article.persona_name}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{article.persona_city} // Dispatcher</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Signal Date</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <article className="prose prose-invert max-w-none">
                        <p className="text-xl md:text-3xl font-outfit leading-relaxed text-white/60 mb-12 border-l-4 border-[#ff00ff] pl-8 py-2 italic font-medium whitespace-pre-wrap">
                            {article.metadata?.content || article.caption}
                        </p>

                        <div className="w-full bg-white/5 border border-white/10 rounded-[3rem] p-4 md:p-8 mb-12 overflow-hidden group/archive shadow-2xl">
                             <div className="flex items-center justify-between mb-6 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f0ff] italic">Shielded Connection Established</span>
                                </div>
                                <a 
                                    href={article.content_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white hover:text-[#00f0ff] transition-all backdrop-blur-md shadow-2xl"
                                >
                                    View Full Intel →
                                </a>
                            </div>
                            
                            <div className="relative w-full h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-950">
                                <iframe 
                                    src={article.content_url} 
                                    className="w-full h-full border-none opacity-40 hover:opacity-100 transition-opacity duration-1000"
                                    title="External Intel Briefing"
                                />
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent" />
                            </div>
                        </div>
                    </article>

                    {/* CTA Footer */}
                    <div className="p-12 rounded-[4rem] bg-gradient-to-br from-[#ff00ff]/10 to-black border border-[#ff00ff]/20 flex flex-col items-center text-center gap-8">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-[#ff00ff]/10 border border-[#ff00ff]/30 flex items-center justify-center text-[#ff00ff]">
                            <Zap size={40} className="animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Continue the Briefing</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest max-w-[400px] leading-relaxed">
                                This signal is part of a larger intelligence network. Start a direct uplink with {article.persona_name} for localized market movement reports.
                            </p>
                        </div>
                        <Link 
                            href={`/?profile=${article.persona_id}`}
                            className="px-16 h-16 rounded-2xl bg-[#ff00ff] text-white font-black italic uppercase tracking-[.2em] text-xs hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,0,255,0.4)] flex items-center justify-center"
                        >
                            CHAT W/ {article.persona_name.split(' ')[0]}
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
