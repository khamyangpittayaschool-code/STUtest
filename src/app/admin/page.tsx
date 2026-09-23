'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SingleCodeGenerator } from '@/components/gamification/SingleCodeGenerator';
import {
  getSystemOverview,
  generateBulkCodesInStore,
  getAllCodes,
  getAuditLogs,
  getAllMembers,
  getAllGroups,
  adminAdjustScore,
  AuditLogItem
} from '@/lib/data-store';
import { ActivityCode, Profile, Group } from '@/types/database';
import {
  Shield,
  School,
  KeyRound,
  Users,
  Trophy,
  Download,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  Search,
  Sliders,
  History,
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher');
  }, [router]);
  const [overview, setOverview] = useState(getSystemOverview());
  const [codesList, setCodesList] = useState<ActivityCode[]>(getAllCodes());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(getAuditLogs());
  const [members, setMembers] = useState<Profile[]>(getAllMembers());
  const [groups, setGroups] = useState<Group[]>(getAllGroups());

  // Search Filter (Prompt Section 59)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'codes' | 'adjust' | 'audit' | 'members'>('codes');

  // Form State for Bulk Generator
  const [batchName, setBatchName] = useState('Gemini Challenge รอบบ่าย');
  const [quantity, setQuantity] = useState(10);
  const [pointsPerCode, setPointsPerCode] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccessMsg, setGenerateSuccessMsg] = useState<string | null>(null);

  // Score Adjustment Modal State (Prompt Section 61)
  const [targetUserId, setTargetUserId] = useState('u-student-1');
  const [adjustPoints, setAdjustPoints] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState('Bonus จากการตอบคำถามพิเศษช่วงกิจกรรม');
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateSuccessMsg(null);

    try {
      await new Promise((res) => setTimeout(res, 500));
      const newCodes = generateBulkCodesInStore(quantity, pointsPerCode, batchName);
      setCodesList(getAllCodes());
      setOverview(getSystemOverview());
      setAuditLogs(getAuditLogs());
      setGenerateSuccessMsg(`✅ สร้างรหัสจำนวน ${newCodes.length} รหัสสำเร็จ (ชุด: ${batchName})`);
    } catch {
      alert('เกิดข้อผิดพลาดในการสร้างรหัส');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdjustScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      alert('จำเป็นต้องระบุเหตุผลในการปรับคะแนน');
      return;
    }

    const res = adminAdjustScore(targetUserId, adjustPoints, adjustReason);
    setOverview(getSystemOverview());
    setAuditLogs(getAuditLogs());
    setAdjustSuccessMsg(`✅ ปรับคะแนน (${adjustPoints >= 0 ? '+' : ''}${adjustPoints} คะแนน) สำเร็จแล้ว`);
    setTimeout(() => setAdjustSuccessMsg(null), 4000);
  };

  // Export to Excel / CSV (Prompt Section 60: รหัส, สมาชิก, Audit Log)
  const handleExportCodes = () => {
    const exportData = codesList.map((c) => ({
      'Code (รหัส)': c.code,
      'Points (คะแนน)': c.points,
      'Status (สถานะ)': c.status === 'ACTIVE' ? 'ยังไม่ได้ใช้' : 'ใช้งานแล้ว',
      'Batch ID': c.batch_id,
      'Used By (ผู้ใช้)': c.used_by || '-',
      'Used At (วันที่ใช้)': c.used_at || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ActivityCodes');
    XLSX.writeFile(workbook, `Activity_Codes_${Date.now()}.xlsx`);
  };

  const handleExportAuditLogs = () => {
    const exportData = auditLogs.map((log) => ({
      'Timestamp': log.created_at,
      'Action': log.action,
      'Target Entity': log.entity_type,
      'Operator/User': log.user_name,
      'Details': JSON.stringify(log.details),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditLogs');
    XLSX.writeFile(workbook, `Audit_Logs_${Date.now()}.xlsx`);
  };

  // Filtered Codes
  const filteredCodes = codesList.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Super Admin Control Center
          </div>
          <h1 className="text-2xl font-black text-slate-900">การบริหารจัดการระบบ & Audit Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            กิจกรรมหลัก: {overview.activity.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/teacher">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold border-mint-200 text-mint-700 bg-mint-50/60 hover:bg-mint-100 transition-colors shadow-2xs"
            >
              <School className="w-4 h-4 text-mint-600" />
              <span>สลับกลับสู่โหมดครู</span>
            </Button>
          </Link>
          <Button onClick={handleExportCodes} variant="outline" size="sm" className="gap-1.5 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-mint-600" /> Export รหัส
          </Button>
          <Button onClick={handleExportAuditLogs} variant="outline" size="sm" className="gap-1.5 font-bold">
            <Download className="w-4 h-4 text-brand-600" /> Export Log
          </Button>
        </div>
      </div>

      {/* Overview Cards (Prompt Section 36) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <span className="text-xs text-slate-400 font-bold block uppercase">สมาชิกทั้งหมด</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{overview.totalMembers} คน</div>
          <span className="text-[11px] text-slate-500">นักเรียน {overview.studentsCount} • ครู {overview.teachersCount}</span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-xs text-slate-400 font-bold block uppercase">รหัสทั้งหมด</span>
          <div className="text-2xl font-black text-brand-600 mt-1">{overview.totalCodes} รหัส</div>
          <span className="text-[11px] text-mint-600 font-medium">คงเหลือ {overview.remainingCodes} รหัส</span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-xs text-slate-400 font-bold block uppercase">รหัสที่ใช้แล้ว</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{overview.usedCodes} รหัส</div>
          <span className="text-[11px] text-slate-400">อัตราการใช้งาน {Math.round((overview.usedCodes / (overview.totalCodes || 1)) * 100)}%</span>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-xs text-slate-400 font-bold block uppercase">คะแนนสะสมรวม</span>
          <div className="text-2xl font-black text-mint-600 mt-1">{overview.totalPointsGiven.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">ใน {overview.groupsCount} กลุ่มกิจกรรม</span>
        </Card>
      </div>

      {/* Live Single Code Generator Card */}
      <SingleCodeGenerator onCodeGenerated={() => setCodesList(getAllCodes())} />

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'codes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🔑 จัดการรหัสกิจกรรม (Bulk Generator)
        </button>
        <button
          onClick={() => setActiveTab('adjust')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'adjust' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⚖️ ปรับแก้คะแนน (Score Adjustment)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audit' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📋 ประวัติ Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* 1. Tab: Codes & Bulk Generator */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <Card className="p-6 border-2 border-brand-100 bg-gradient-to-b from-white to-brand-50/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-brand-100 text-brand-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">สร้างรหัสจำนวนมาก (Bulk)</h3>
                  <p className="text-xs text-slate-500">สุ่มชุดอักษร 5 ตัว ไม่ซ้ำกัน (Server-Side)</p>
                </div>
              </div>

              <form onSubmit={handleGenerateCodes} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อชุดรหัส (Batch Name)</label>
                  <input
                    type="text"
                    required
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนรหัส</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                    >
                      <option value={10}>10 รหัส</option>
                      <option value={50}>50 รหัส</option>
                      <option value={100}>100 รหัส</option>
                      <option value={500}>500 รหัส</option>
                      <option value={1000}>1,000 รหัส</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">คะแนนต่อรหัส</label>
                    <input
                      type="number"
                      min={1}
                      value={pointsPerCode}
                      onChange={(e) => setPointsPerCode(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {generateSuccessMsg && (
                  <div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs font-semibold text-mint-700">
                    {generateSuccessMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isGenerating}
                  className="w-full font-bold shadow-md shadow-brand-500/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> สร้างรหัส {quantity} รหัสทันที
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัส..."
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400">พบ {filteredCodes.length} รายการ</span>
              </div>

              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="py-3 px-4">รหัส</th>
                      <th className="py-3 px-4">คะแนน</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">ผู้ใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCodes.slice(0, 30).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-800 text-base">
                          {item.code}
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-600">
                          +{item.points}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'ACTIVE' ? (
                            <Badge variant="mint">ยังไม่ได้ใช้</Badge>
                          ) : (
                            <Badge variant="slate">ใช้แล้ว</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {item.used_by ? 'นักเรียนแล้ว' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Tab: Score Adjustment (Prompt Section 61) */}
      {activeTab === 'adjust' && (
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 sm:p-8 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ระบบปรับแก้คะแนนผู้ใช้ (Admin Adjustment)</h3>
                <p className="text-xs text-slate-500">การปรับคะแนนทุกครั้งจะสร้าง Score Transaction และบันทึก Audit Log</p>
              </div>
            </div>

            <form onSubmit={handleAdjustScoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เลือกนักเรียนที่ต้องการปรับคะแนน</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="u-student-1">นายกิตติศักดิ์ พัฒนศิลป์ (รหัส 6701001 - กลุ่ม AI Genius)</option>
                  <option value="u-student-2">นางสาวพิมพ์ชนก รัตนพร (รหัส 6701004 - กลุ่ม Prompt Master)</option>
                  <option value="u-student-3">นายธีรพัฒน์ วรเดช (รหัส 6701012 - กลุ่ม AI Genius)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนคะแนนที่ต้องการปรับ (ใส่ + หรือ -)</label>
                <input
                  type="number"
                  required
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(Number(e.target.value))}
                  placeholder="เช่น 5 หรือ -5"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลในการปรับคะแนน <span className="text-rose-500">* (จำเป็นต้องระบุตาม Section 61)</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="เช่น Bonus จากกิจกรรมตอบคำถามพิเศษ, แก้ไขคะแนนผิดพลาด"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {adjustSuccessMsg && (
                <div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs font-semibold text-mint-700">
                  {adjustSuccessMsg}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                บันทึกการปรับคะแนนและเขียน Audit Log
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* 3. Tab: Audit Logs (Prompt Section 50) */}
      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" /> บันทึกประวัติระบบ (Audit Logs)
            </h4>
            <span className="text-xs text-slate-400">บันทึกทั้งหมด {auditLogs.length} เหตุการณ์</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">วัน-เวลา</th>
                  <th className="py-3 px-4">การกระทำ (Action)</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ</th>
                  <th className="py-3 px-4">ตารางเป้าหมาย</th>
                  <th className="py-3 px-4">รายละเอียด (JSON Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString('th-TH')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={log.action.includes('SCORE') ? 'amber' : log.action.includes('CODE') ? 'mint' : 'slate'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
