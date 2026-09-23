'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Student Fields
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ม.5');
  const [room, setRoom] = useState('1');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => router.push('/student'), 1200);
    }, 800);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-mint-500 text-white shadow-lg shadow-brand-500/25 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">สมัครสมาชิกนักเรียน</h2>
          <p className="text-sm text-slate-500 mt-2">
            สมัครสมาชิกแล้วเข้าสู่ระบบใช้งานได้ทันที
          </p>
        </div>

        <Card className="p-8 shadow-xl border-slate-200/80">
          {/* Student-only note */}
          <div className="flex items-center gap-2 justify-center mb-5 py-2 px-3 rounded-xl border border-brand-200 bg-brand-50/60">
            <GraduationCap className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-brand-700">สำหรับนักเรียนเท่านั้น</span>
          </div>

          {success ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">สมัครสมาชิกสำเร็จ!</h3>
              <p className="text-sm text-slate-500">กำลังนำคุณเข้าสู่แดชบอร์ดทันที...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล นักเรียน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายกิตติศักดิ์ พัฒนศิลป์"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ระดับชั้น
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  >
                    <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                    <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                    <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                    <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                    <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                    <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ห้อง
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ห้อง 1"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น kittisak67"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
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
                  placeholder="กำหนดรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold text-base"
              >
                ยืนยันการสมัครสมาชิก <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
