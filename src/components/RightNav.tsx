'use client';

import { motion } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  Compass, 
  Heart, 
  Settings,
  ShieldCheck,
  Zap,
  MoreVertical
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function RightNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'home', path: '/' },
    { icon: Compass, label: 'explore', path: '/explore' },
    { icon: MessageSquare, label: 'chats', path: '/chats' },
    { icon: Heart, label: 'liked', path: '/liked' },
    { icon: Zap, label: 'infusion', path: '/infusion' },
    { icon: Settings, label: 'settings', path: '/settings' },
  ];

  return (
    <aside className="w-[80px] h-screen bg-black border-l border-white/5 flex flex-col items-center py-10 pt-32 shrink-0 relative z-[90]">
      <div className="flex flex-col gap-10">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.1, x: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(item.path)}
              className={`
                relative cursor-pointer group p-3 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-[#ff00ff]/10 text-[#ff00ff]' : 'text-white/20 hover:text-white'}
              `}
            >
              <item.icon size={22} className={isActive ? 'drop-shadow-[0_0_10px_#ff00ff]' : ''} />
              
              {/* Tooltip (Mock) */}
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-black border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
              </div>

              {isActive && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ff00ff] rounded-r-full shadow-[0_0_10px_#ff00ff]" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="mt-auto flex flex-col items-center gap-8">
         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all cursor-pointer">
            <MoreVertical size={16} />
         </div>
         <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative">
            <ShieldCheck size={18} className="text-[#ff00ff]/40" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-black" />
         </div>
      </div>
    </aside>
  );
}


