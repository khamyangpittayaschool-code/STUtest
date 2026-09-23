'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Bell, LogOut } from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';

export function Navbar() {
  const router = useRouter();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-slate-900 leading-tight text-sm sm:text-base flex items-center gap-1.5">
                AI Training Hub <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.2 rounded font-bold">2569</span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">ระบบกิจกรรมอบรม AI</div>
            </div>
          </Link>

          {/* Right: Notification + Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNotifOpen(true)}
              title="การแจ้งเตือน"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                3
              </span>
            </button>

            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
}
