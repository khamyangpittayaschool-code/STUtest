'use client';

import React, { useState } from 'react';
import { getNotifications, markNotificationRead, NotificationItem } from '@/lib/data-store';
import { Bell, CheckCheck, X, Sparkles, Award, FileText, Megaphone, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(getNotifications());

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    markNotificationRead();
    setNotifications(getNotifications());
  };

  const handleItemClick = (id: string) => {
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SCORE':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'GRADE':
        return <Award className="w-4 h-4 text-mint-600" />;
      case 'POST':
        return <Megaphone className="w-4 h-4 text-brand-600" />;
      case 'RANK':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-base">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <Badge variant="rose" className="text-[10px] px-1.5 py-0">
                {unreadCount} ใหม่
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="อ่านทั้งหมด"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold p-1"
              >
                <CheckCheck className="w-4 h-4 inline mr-1" />
                อ่านทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`p-4 transition-colors cursor-pointer flex gap-3 items-start ${
                !item.is_read ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {item.created_at}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
              {!item.is_read && (
                <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
