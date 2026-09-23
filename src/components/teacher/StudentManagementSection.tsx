'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentManagementItem, CsvImportResult } from '@/types/database';
import {
  getStudentsListAction,
  importStudentsCsvAction,
  deleteStudentAction
} from '@/lib/actions';
import { formatPoints } from '@/lib/utils';
import {
  Users,
  Upload,
  Download,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Clock,
  Key,
  ShieldCheck,
  UserPlus,
  HelpCircle,
  X,
  FileText
} from 'lucide-react';

export function StudentManagementSection() {
  const [students, setStudents] = useState<StudentManagementItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<Array<{
    username: string;
    password?: string;
    full_name: string;
    student_id?: string;
    grade_level?: string;
    room?: string;
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStudents = async () => {
    try {
      const data = await getStudentsListAction();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    const interval = setInterval(loadStudents, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStudents();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบบัญชีของ "${name}" หรือไม่? ข้อมูลคะแนนและประวัติการส่งงานจะถูกลบด้วย`)) {
      return;
    }
    const ok = await deleteStudentAction(id);
    if (ok) {
      setStudents(prev => prev.filter(s => s.id !== id));
    } else {
      alert('เกิดข้อผิดพลาดในการลบบัญชี');
    }
  };

  // ─── CSV Parser ─────────────────────────────────────────────────────────────
  const parseCsvContent = (content: string) => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const rows: typeof parsedRows = [];
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes('username') ||
      firstLine.includes('student') ||
      firstLine.includes('ชื่อ') ||
      firstLine.includes('รหัส');

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // รองรับทั้ง comma (,) และ tab (\t)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 2) {
        // รูปแบบ 1: username, password, full_name, grade, room
        // รูปแบบ 2: username, full_name (password default 1234)
        let username = parts[0] || '';
        let password = '1234';
        let fullName = '';
        let grade = 'ม.5';
        let room = '1';

        if (parts.length >= 3) {
          // ถ้าคอลัมน์ที่ 2 ดูเหมือนรหัสผ่าน
          if (parts[1].length <= 20 && !parts[1].includes('นาย') && !parts[1].includes('นาง')) {
            password = parts[1] || '1234';
            fullName = parts[2] || '';
            grade = parts[3] || 'ม.5';
            room = parts[4] || '1';
          } else {
            // username, fullName, password
            fullName = parts[1] || '';
            password = parts[2] || '1234';
            grade = parts[3] || 'ม.5';
            room = parts[4] || '1';
          }
        } else {
          fullName = parts[1] || '';
        }

        if (username || fullName) {
          rows.push({
            username,
            student_id: username,
            password,
            full_name: fullName,
            grade_level: grade,
            room: room,
          });
        }
      }
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvRawText(val);
    parseCsvContent(val);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await importStudentsCsvAction(parsedRows);
      setImportResult(res);
      if (res.success && res.inserted_count > 0) {
        await loadStudents();
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    if (students.length === 0) {
      alert('ยังไม่มีข้อมูลนักเรียนในระบบสำหรับการส่งออก');
      return;
    }

    // Header CSV
    const headers = ['รหัสนักเรียน', 'ชื่อผู้ใช้', 'ชื่อ-นามสกุล', 'ระดับชั้น', 'ห้อง', 'คะแนนสะสม', 'เข้าสู่ระบบล่าสุด', 'สถานะ'];
    const rows = students.map(s => [
      `"${s.student_id || s.username}"`,
      `"${s.username}"`,
      `"${s.full_name}"`,
      `"${s.grade_level}"`,
      `"${s.room}"`,
      s.total_points,
      `"${s.last_login_at || 'ยังไม่เคยเข้าสู่ระบบ'}"`,
      `"${s.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    // UTF-8 BOM สำหรับเปิดใน Excel ภาษาไทยให้ไม่เพี้ยน
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายชื่อนักเรียน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ดาวน์โหลดไฟล์แม่แบบ
  const handleDownloadTemplate = () => {
    const templateContent = [
      'username,password,full_name,grade_level,room',
      '65001,1234,เด็กชายสมชาย ใจดี,ม.5,1',
      '65002,1234,เด็กหญิงสมศรี มีสุข,ม.5,1',
      '65003,1234,นายอนันต์ ขยันเรียน,ม.5,2'
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.room && s.room.includes(q))
    );
  });

  const activeLoginCount = students.filter(s => Boolean(s.last_login_at)).length;
  const totalPointsAll = students.reduce((acc, curr) => acc + curr.total_points, 0);

  return (
    <div className="space-y-6">
      {/* ─── Header & Top Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-brand-600" />
              <span>จัดการบัญชีนักเรียน (Student Management)</span>
            </h1>
            <Badge variant="mint" className="text-xs">
              {students.length} คน
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            นำเข้าบัญชีนักเรียนผ่านไฟล์ CSV • ตรวจสอบไอดีซ้ำ • ติดตามการ Login • ส่งออกข้อมูล Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setParsedRows([]);
              setCsvRawText('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            variant="primary"
            size="sm"
            className="font-bold gap-1.5 shadow-sm"
          >
            <Upload className="w-4 h-4" /> นำเข้าข้อมูล (Import CSV)
          </Button>

          <Button
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            className="font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-brand-600" /> ส่งออก (Export CSV)
          </Button>

          <Button
            onClick={handleDownloadTemplate}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-500 hover:text-slate-800 gap-1"
            title="ดาวน์โหลดไฟล์แม่แบบ CSV ตัวอย่าง"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> ดาวน์โหลดแม่แบบ
          </Button>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">นักเรียนทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {students.length} <span className="text-xs font-normal text-slate-400">บัญชี</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">พร้อมใช้งานในระบบการอบรม</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">เข้าสู่ระบบแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {activeLoginCount} <span className="text-xs font-normal text-slate-400">/ {students.length} คน</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">มีประวัติการเข้าใช้งาน (Login Tracking)</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">คะแนนสะสมรวม</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatPoints(totalPointsAll)} <span className="text-xs font-normal text-slate-400">แต้ม</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">คะแนนกิจกรรมและรหัสสะสมรวม</p>
        </Card>
      </div>

      {/* ─── Search & Students Table ────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสนักเรียน, หรือห้อง..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            แสดง <strong className="text-slate-800">{filteredStudents.length}</strong> จาก {students.length} รายการ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">รหัสนักเรียน (ID)</th>
                <th className="py-3 px-4">ชื่อผู้ใช้ (Username)</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">ระดับชั้น/ห้อง</th>
                <th className="py-3 px-4">รหัสผ่าน</th>
                <th className="py-3 px-4 text-right">คะแนนสะสม</th>
                <th className="py-3 px-4">เข้าสู่ระบบล่าสุด (Login Tracking)</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">ไม่พบรายชื่อนักเรียน</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      สามารถกดปุ่ม "นำเข้าข้อมูล (Import CSV)" ด้านบนเพื่อเพิ่มนักเรียนเข้าสู่ระบบ
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {st.student_id || st.username}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {st.username}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {st.full_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="brand" className="text-[10px] py-0 font-normal">
                        ม.{st.grade_level?.replace('ม.', '') || '5'}/{st.room || '1'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {st.password || '1234'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 text-sm">
                      {formatPoints(st.total_points)}
                    </td>
                    <td className="py-3 px-4">
                      {st.last_login_at ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {st.last_login_at}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          ยังไม่เคยเข้าสู่ระบบ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.full_name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบบัญชีนักเรียน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Modal นำเข้าข้อมูล CSV ────────────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">นำเข้าบัญชีนักเรียน (Import CSV)</h3>
                  <p className="text-[11px] text-slate-400">
                    รูปแบบ: username (รหัสนักเรียน), password (1234), ชื่อผู้ใช้ ชื่อสกุล
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Tip */}
            <div className="bg-brand-50/60 border border-brand-100 p-3 rounded-2xl text-xs text-brand-900 mb-4 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>วิธีเตรียมข้อมูล CSV:</strong> คอลัมน์ลำดับ: <code>username, password, full_name, grade, room</code>
                <br />
                เช่น: <code>65001, 1234, เด็กชายสมชาย ใจดี, ม.5, 1</code>
                <br />
                <span className="text-[11px] text-brand-700">
                  * หากรหัสผ่านเว้นว่าง ระบบจะตั้งเป็น <strong>1234</strong> ให้อัตโนมัติ • ระบบจะตรวจสอบและป้องกันไอดีซ้ำซ้อน
                </span>
              </div>
            </div>

            {/* File Upload Box */}
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-brand-50/20 transition-colors group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-brand-600 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-bold text-slate-700">
                  คลิกเพื่อเลือกไฟล์ <code>.csv</code> จากเครื่องคอมพิวเตอร์
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">หรือวางข้อความลงในช่องด้านล่างนี้ได้โดยตรง</p>
              </div>

              {/* Textarea for Direct Paste */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หรือวางข้อความ CSV ที่นี่ (Copy-Paste Text):
                </label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={handleRawTextChange}
                  placeholder="65001, 1234, ด.ช.สมชาย ใจดี, ม.5, 1&#10;65002, 1234, ด.ญ.สมศรี มีสุข, ม.5, 1"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      พรีวิวข้อมูลที่ตรวจพบ ({parsedRows.length} รายการ):
                    </span>
                    <span className="text-slate-400 text-[11px]">พร้อมนำเข้า</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Username / รหัส</th>
                          <th className="p-2">รหัสผ่าน</th>
                          <th className="p-2">ชื่อ-สกุล</th>
                          <th className="p-2">ชั้น/ห้อง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 font-mono font-bold text-brand-600">{r.username}</td>
                            <td className="p-2 font-mono text-slate-500">{r.password || '1234'}</td>
                            <td className="p-2 font-bold text-slate-800">{r.full_name}</td>
                            <td className="p-2 text-slate-500">{r.grade_level}/{r.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs border ${
                    importResult.success && importResult.inserted_count > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {importResult.success && importResult.inserted_count > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{importResult.message}</span>
                  </div>
                  {importResult.duplicates.length > 0 && (
                    <div className="mt-2 text-[11px] text-amber-700">
                      <strong>รายการที่ซ้ำในระบบ (ข้ามการบันทึก):</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {importResult.duplicates.slice(0, 10).map((d, i) => (
                          <span key={i} className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                        {importResult.duplicates.length > 10 && (
                          <span className="text-[10px] text-amber-600">
                            และอีก {importResult.duplicates.length - 10} รายการ...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  ปิด
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isImporting}
                  disabled={parsedRows.length === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="font-bold gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> ยืนยันการนำเข้า ({parsedRows.length} คน)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
