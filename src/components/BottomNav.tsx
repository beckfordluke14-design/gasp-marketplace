'use client';

import { motion } from 'framer-motion';
import { Home, MessageSquare, Shield, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  onOpenChatList?: () => void;
  onOpenTopUp?: () => void;
  unreadCount?: number;
}

export default function BottomNav({ onOpenChatList, onOpenTopUp, unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/', active: pathname === '/' },
    { label: 'Chat', icon: MessageSquare, onClick: onOpenChatList, active: false, badge: unreadCount },
    { label: 'Vault', icon: Shield, href: '/vault', active: pathname === '/vault' },
    { label: 'TopUp', icon: Zap, onClick: onOpenTopUp, active: false, highlight: true },
    { label: 'Profile', icon: User, href: '/vault', active: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      {/* Glossy Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-t border-white/5" />
      
      {/* Safe Area Spacer */}
      <div className="relative pb-[env(safe-area-inset-bottom,20px)] pt-2 px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className={`flex flex-col items-center gap-1 p-2 transition-all ${item.active ? 'text-[#ff00ff]' : 'text-white/40'}`}>
              <div className="relative">
                <Icon size={20} className={item.highlight ? 'text-[#00f0ff]' : ''} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff00ff] text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </div>
          );

          if (item.onClick) {
            return (
              <button key={item.label} onClick={item.onClick} className="focus:outline-none active:scale-95 transition-transform">
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href || '#'} className="focus:outline-none active:scale-95 transition-transform">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
