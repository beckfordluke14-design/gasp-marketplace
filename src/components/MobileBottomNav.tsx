'use client';

import { motion } from 'framer-motion';
import { Home, Compass, MessageSquare, Zap, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileBottomNav({ onSelectChat, unreadCounts = {} }: { onSelectChat: () => void, unreadCounts?: Record<string, number> }) {
  const router = useRouter();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const items = [
    { icon: Home, label: 'feed', active: true, action: () => router.push('/') },
    { icon: Compass, label: 'discover', active: false, action: () => router.push('/') },
    { icon: MessageSquare, label: 'chats', active: false, action: () => onSelectChat(), badge: totalUnread }, 
    { icon: Zap, label: 'gasp', active: false, action: () => router.push('/') },
    { icon: User, label: 'vault', active: false, action: () => router.push('/vault') },
  ];

  return (
    <div className="lg:hidden fixed right-4 top-1/2 -translate-y-1/2 w-16 h-auto py-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full z-[500] flex flex-col items-center justify-center gap-8 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,1)]">
      {items.map((item) => {
        return (
          <button
            key={item.label}
            onClick={item.action}
            className={`relative flex flex-col items-center gap-1 transition-all
              ${item.active ? 'text-[#ff00ff]' : 'text-white/30'}
            `}
          >
            <item.icon size={22} className={item.active ? 'drop-shadow-[0_0_10px_#ff00ff]' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">{item.label}</span>
            
            {item.badge && item.badge > 0 && (
               <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff00ff] text-black text-[8px] font-black flex items-center justify-center shadow-[0_0_10px_#ff00ff]">
                  {item.badge}
               </div>
            )}
          </button>
        );
      })}
    </div>
  );
}


