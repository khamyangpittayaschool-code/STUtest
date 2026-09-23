'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  School,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  User,
  LogIn,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { setCurrentStudentSession } from '@/lib/data-store';
import { registerStudentAction, loginStudentAction, getStudentDashboardAction } from '@/lib/actions';

// ─── ข้อมูล credentials ครู (hardcoded, ห้ามสมัครจากหน้าเว็บ) ───────────────
const TEACHER_CREDENTIALS = { username: 'admin', password: 'admin1234' };

export default function HomePage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Register Fields
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ม.5');
  const [room, setRoom] = useState('1');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Login Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const student = await registerStudentAction({
        fullName: studentName.trim(),
        gradeLevel,
        room,
        username: studentUsername.trim(),
      });

      if (student) {
        setCurrentStudentSession(student);
        setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบนักเรียน...');
        setTimeout(() => router.push('/student'), 800);
      } else {
        setErrorMsg('ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (loginRole === 'TEACHER') {
        // ตรวจสอบ credentials ครู (hardcoded)
        if (
          loginUsername.trim() === TEACHER_CREDENTIALS.username &&
          loginPassword === TEACHER_CREDENTIALS.password
        ) {
          router.push('/teacher');
        } else {
          setErrorMsg('Username หรือรหัสผ่านไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
        }
      } else {
        // นักเรียน: ค้นหาจากฐานข้อมูล Supabase พร้อมตรวจสอบรหัสผ่าน
        const student = await loginStudentAction(loginUsername.trim(), loginPassword.trim());
        if (student) {
          setCurrentStudentSession(student);
          router.push('/student');
        } else {
          setErrorMsg('ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง (รหัสผ่านเริ่มต้นคือ 1234)');
        }
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStudent = async () => {
    setIsLoading(true);
    try {
      const dash = await getStudentDashboardAction();
      if (dash?.profile && dash.profile.id !== 'u-guest') {
        setCurrentStudentSession(dash.profile);
        try {
          localStorage.setItem('student_score', String(dash.individualScore));
        } catch {}
      }
    } catch {}
    setIsLoading(false);
    router.push('/student');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200/60 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Training Management Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกนักเรียน'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {isLoginMode
            ? 'เลือกบทบาทแล้วเข้าสู่ระบบเพื่อใช้งาน'
            : 'สมัครแล้วใช้งานได้ทันที (เฉพาะนักเรียนเท่านั้น)'}
        </p>
      </div>

      <Card className="w-full p-6 sm:p-7 shadow-lg border-slate-200/80 bg-white">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsLoginMode(false); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              !isLoginMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>สมัครสมาชิก (นักเรียน)</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginMode(true); setSuccessMsg(null); setErrorMsg(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              isLoginMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs font-bold text-mint-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-mint-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ─── 1. REGISTER FORM (เฉพาะนักเรียน) ─────────────────────────────── */}
        {!isLoginMode && !successMsg && (
          <div>
            {/* Student-only badge */}
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-brand-200 bg-brand-50/60 mb-4">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-brand-700">สำหรับนักเรียน เท่านั้น</span>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล นักเรียน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายกิตติศักดิ์ พัฒนศิลป์"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ระดับชั้น / ห้อง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="ห้อง 1"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น kittisak67"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold text-sm mt-1"
              >
                สมัครสมาชิกแล้วเริ่มใช้งาน <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Teacher login hint */}
            <p className="mt-4 text-center text-[11px] text-slate-400">
              ครูผู้สอน?{' '}
              <button
                type="button"
                onClick={() => { setIsLoginMode(true); setLoginRole('TEACHER'); }}
                className="font-bold text-mint-600 hover:text-mint-700 underline underline-offset-2"
              >
                เข้าสู่ระบบที่นี่
              </button>
            </p>
          </div>
        )}

        {/* ─── 2. LOGIN FORM ──────────────────────────────────────────────────── */}
        {isLoginMode && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Role picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                เลือกบทบาท
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setLoginRole('STUDENT'); setErrorMsg(null); }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'STUDENT'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>นักเรียน</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole('TEACHER'); setErrorMsg(null); }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'TEACHER'
                      ? 'border-mint-500 bg-mint-50 text-mint-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>ครูผู้สอน</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={loginRole === 'TEACHER' ? 'admin' : 'kittisak67'}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant={loginRole === 'TEACHER' ? 'mint' : 'primary'}
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold text-sm mt-1"
            >
              {loginRole === 'TEACHER' ? (
                <><School className="w-4 h-4 mr-1.5" /> เข้าสู่ระบบครูผู้สอน</>
              ) : (
                <>เข้าสู่ระบบ <ArrowRight className="w-4 h-4 ml-1.5" /></>
              )}
            </Button>
          </form>
        )}

        {/* ─── 3. QUICK ACCESS BAR ────────────────────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-2">
            ⚡ เข้าสู่ระบบแบบด่วน (สำหรับทดสอบ)
          </span>
          <button
            type="button"
            onClick={handleQuickStudent}
            className="w-full py-2 px-3 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4 text-brand-500" />
            <span>ทดสอบโหมดนักเรียน</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
