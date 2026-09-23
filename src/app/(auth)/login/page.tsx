'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, GraduationCap, School, CheckCircle, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

// ─── ข้อมูล credentials ครู (hardcoded) ───────────────────────────────────────
const TEACHER_CREDENTIALS = { username: 'admin', password: 'admin1234' };

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);

      if (selectedRole === 'TEACHER') {
        if (
          username.trim() === TEACHER_CREDENTIALS.username &&
          password === TEACHER_CREDENTIALS.password
        ) {
          router.push('/teacher');
        } else {
          setErrorMsg('Username หรือรหัสผ่านไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
        }
      } else {
        // นักเรียน: เข้าใช้งานได้
        router.push('/student');
      }
    }, 600);
  };

  const handleQuickLogin = (role: 'STUDENT' | 'TEACHER') => {
    if (role === 'TEACHER') {
      setSelectedRole('TEACHER');
      return; // ไม่ทำ quick login สำหรับครู
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/student');
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white shadow-lg shadow-brand-500/25 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-500 mt-2">
            ระบบบริหารจัดการกิจกรรมอบรมการประยุกต์ใช้ AI
          </p>
        </div>

        <Card className="p-8 shadow-xl border-slate-200/80">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                เลือกบทบาทผู้ใช้งาน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('STUDENT'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    selectedRole === 'STUDENT'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>นักเรียน</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRole('TEACHER'); setErrorMsg(null); }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    selectedRole === 'TEACHER'
                      ? 'border-mint-500 bg-mint-50 text-mint-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>ครูผู้สอน</span>
                </button>
              </div>
            </div>

            {/* Teacher locked warning */}
            {selectedRole === 'TEACHER' && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium">
                  ระบบครูผู้สอนใช้บัญชีพิเศษจากผู้ดูแลระบบเท่านั้น ไม่สามารถสมัครได้
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-bold text-rose-700">{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'TEACHER' ? 'admin' : 'kittisak67'}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant={selectedRole === 'TEACHER' ? 'mint' : 'primary'}
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-md text-base"
            >
              เข้าสู่ระบบ <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Quick Demo - Student only */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              ⚡ ทดสอบระบบด่วน
            </span>
            <button
              type="button"
              onClick={() => handleQuickLogin('STUDENT')}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-brand-500" />
              <span>ทดสอบโหมดนักเรียน</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            ยังไม่มีบัญชี (นักเรียน)?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              สมัครสมาชิกใหม่ได้ทันที
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
