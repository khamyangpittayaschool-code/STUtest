'use client';

import React, { useState, useEffect } from 'react';
import { getLeaderboardAction } from '@/lib/actions';
import { UserScoreLeaderboard } from '@/types/database';
import { Trophy, Crown, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPoints } from '@/lib/utils';

export function LeaderboardWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLeaderboard, setUserLeaderboard] = useState<UserScoreLeaderboard[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboardAction();
        setUserLeaderboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(timer);
  }, []);

  const filteredUsers = userLeaderboard.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.full_name.toLowerCase().includes(q) ||
      (u.student_id && u.student_id.toLowerCase().includes(q))
    );
  });

  return (
    <Card className="p-0 overflow-hidden border-slate-200 shadow-xs bg-white">
      {/* Header */}
      <div className="bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">กระดานลำดับคะแนน (Leaderboard)</h3>
          </div>
          <Badge variant="mint" className="bg-mint-500/20 text-mint-300 border-mint-500/30 text-[10px] py-0">
            สมาชิก {userLeaderboard.length} คน
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 พิมพ์ค้นหาชื่อ หรือ รหัสนักเรียน..."
            className="w-full rounded-xl bg-white/10 border border-white/20 pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable List */}
      <div className="divide-y divide-slate-100 p-2 overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-200">
        <div className="space-y-1">
          {filteredUsers.map((item) => (
            <div
              key={item.user_id}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                item.rank === 1
                  ? 'bg-amber-50/80 border border-amber-200/80'
                  : item.rank === 2
                  ? 'bg-slate-50 border border-slate-200/60'
                  : item.rank === 3
                  ? 'bg-orange-50/50 border border-orange-200/50'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 text-center font-black text-xs">
                  {item.rank === 1 ? (
                    <span className="text-base">🥇</span>
                  ) : item.rank === 2 ? (
                    <span className="text-base">🥈</span>
                  ) : item.rank === 3 ? (
                    <span className="text-base">🥉</span>
                  ) : (
                    <span className="text-slate-400 font-bold">#{item.rank}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    {item.full_name}
                    {item.student_id && (
                      <span className="text-[10px] text-slate-400 font-normal">({item.student_id})</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.group_name || 'ม.5'}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-brand-600">
                  {formatPoints(item.total_points)}
                </span>
                <span className="text-[10px] text-slate-400 block font-normal">แต้ม</span>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              {searchQuery ? (
                `ไม่พบข้อมูลที่ตรงกับคำค้นหา "${searchQuery}"`
              ) : (
                'ยังไม่มีคะแนนสะสมในระบบ (เมื่อนักเรียนกรอกรหัสคะแนนหรือตรวจงานแล้ว อันดับจะปรากฏที่นี่ทันที)'
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
