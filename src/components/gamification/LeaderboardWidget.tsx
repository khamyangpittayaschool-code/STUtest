'use client';

import React, { useState, useEffect } from 'react';
import { getLeaderboardAction, updateStudentScoreAction } from '@/lib/actions';
import { UserScoreLeaderboard } from '@/types/database';
import { Trophy, Crown, Search, X, Edit3, Save, Plus, Minus, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPoints } from '@/lib/utils';

interface LeaderboardWidgetProps {
  isTeacher?: boolean;
}

export function LeaderboardWidget({ isTeacher = false }: LeaderboardWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLeaderboard, setUserLeaderboard] = useState<UserScoreLeaderboard[]>([]);

  // State สำหรับ Modal แก้ไขคะแนน
  const [editingStudent, setEditingStudent] = useState<UserScoreLeaderboard | null>(null);
  const [newPoints, setNewPoints] = useState<number>(0);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboardAction();
      setUserLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenEdit = (student: UserScoreLeaderboard) => {
    setEditingStudent(student);
    setNewPoints(student.total_points);
    setSaveSuccessMsg('');
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || isSavingScore) return;

    setIsSavingScore(true);
    try {
      const targetPoints = Math.max(0, Math.round(Number(newPoints) || 0));
      const res = await updateStudentScoreAction({
        userId: editingStudent.user_id,
        newPoints: targetPoints,
      });

      if (res.success) {
        // อัปเดตใน state ทันทีเพื่อให้แสดงผลเร็ว
        setUserLeaderboard((prev) =>
          prev.map((u) =>
            u.user_id === editingStudent.user_id
              ? { ...u, total_points: targetPoints }
              : u
          ).sort((a, b) => b.total_points - a.total_points)
        );

        setSaveSuccessMsg(`บันทึกคะแนนเป็น ${targetPoints} แต้ม สำเร็จแล้ว!`);
        setTimeout(() => {
          setEditingStudent(null);
          setSaveSuccessMsg('');
          fetchLeaderboard();
        }, 1200);
      } else {
        alert(res.error || 'เกิดข้อผิดพลาดในการบันทึกคะแนน');
      }
    } catch (err: any) {
      console.error('Save score error:', err);
      alert(err?.message || 'เกิดข้อผิดพลาดในการบันทึกคะแนน');
    } finally {
      setIsSavingScore(false);
    }
  };

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

        {isTeacher && (
          <div className="bg-amber-500/15 border border-amber-400/30 px-3 py-1.5 rounded-xl text-[11px] text-amber-200 mt-2.5 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>คุณครูสามารถกดปุ่ม <strong>&quot;แก้ไขคะแนน&quot;</strong> เพื่อปรับแต้มที่ให้ผิดหรือแก้ไขคะแนนสะสมได้ทันที</span>
          </div>
        )}
      </div>

      {/* Scrollable List */}
      <div className="divide-y divide-slate-100 p-2 overflow-y-auto max-h-[460px] scrollbar-thin scrollbar-thumb-slate-200">
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

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-sm font-black text-brand-600">
                    {formatPoints(item.total_points)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-normal">แต้ม</span>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(item);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 hover:border-amber-300 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 ml-1"
                    title="แก้ไขคะแนนนักเรียนคนนี้"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">แก้ไขคะแนน</span>
                  </button>
                )}
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

      {/* Modal แก้ไขคะแนนสะสม (เฉพาะครู) */}
      {isTeacher && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แก้ไขคะแนนสะสม</h3>
                  <p className="text-[11px] text-slate-400">ปรับแก้คะแนนที่ให้ผิดจากกระดานลำดับคะแนน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ข้อมูลนักเรียน */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-4">
              <div className="text-xs text-slate-400">นักเรียน:</div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                {editingStudent.full_name}
                {editingStudent.student_id && (
                  <span className="text-xs text-slate-500 font-normal">({editingStudent.student_id})</span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>ห้องเรียน: {editingStudent.group_name || 'ม.5'}</span>
                <span className="font-medium text-slate-700">
                  คะแนนเดิม: <strong className="text-brand-600 text-sm font-bold">{formatPoints(editingStudent.total_points)}</strong> แต้ม
                </span>
              </div>
            </div>

            {/* Success Message Banner */}
            {saveSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4">
              {/* ปุ่มลัดปรับแต้มด่วน */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ปุ่มลัดปรับแต้ม (+ / -)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {[-5, -2, -1, 0, 1, 2, 5, 10].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        if (val === 0) {
                          setNewPoints(0);
                        } else {
                          setNewPoints((prev) => Math.max(0, prev + val));
                        }
                      }}
                      className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all ${
                        val === 0
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : val > 0
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                      }`}
                    >
                      {val === 0 ? 'รีเซ็ต 0' : val > 0 ? `+${val}` : `${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ช่องกรอกคะแนนสุทธิ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    คะแนนใหม่ที่ต้องการกำหนด (แต้ม) *
                  </label>
                  {newPoints !== editingStudent.total_points && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        newPoints > editingStudent.total_points
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {newPoints > editingStudent.total_points
                        ? `+${newPoints - editingStudent.total_points} แต้ม`
                        : `${newPoints - editingStudent.total_points} แต้ม`}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={newPoints}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setNewPoints(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-lg font-black text-brand-600 focus:border-brand-500 focus:outline-none bg-slate-50/50"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  พิมพ์ตัวเลขคะแนนที่ถูกต้องได้โดยตรง หรือกดปุ่มบวก/ลบด้านบน
                </p>
              </div>

              {/* ปุ่ม Action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStudent(null)}
                  disabled={isSavingScore}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingScore}
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isSavingScore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" /> บันทึกคะแนน
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
