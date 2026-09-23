'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateSingleCodeAction, getAllCodesAction, deleteCodeAction } from '@/lib/actions';
import { ActivityCode } from '@/types/database';
import { Dices, Sparkles, ShieldCheck, Copy, Check, Eye, Trash2, Flame, RefreshCw } from 'lucide-react';

interface SingleCodeGeneratorProps {
  onCodeGenerated?: (code: ActivityCode) => void;
}

export function SingleCodeGenerator({ onCodeGenerated }: SingleCodeGeneratorProps) {
  const [selectedPoints, setSelectedPoints] = useState<number>(10);
  const [currentCode, setCurrentCode] = useState<ActivityCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCodes, setActiveCodes] = useState<ActivityCode[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshActiveCodes = async () => {
    try {
      const all = await getAllCodesAction();
      const active = all.filter((c) => c.status === 'ACTIVE');
      setActiveCodes(active);

      setCurrentCode((prev) => {
        // ถ้ารหัสปัจจุบันยังอยู่ใน active ให้อยู่ต่อ
        if (prev && active.some((c) => c.id === prev.id)) {
          return active.find((c) => c.id === prev.id) || prev;
        }
        // ถ้ายังไม่มีรหัสฉาย หรือรหัสเดิมถูกใช้ไปแล้ว ให้ดึงรหัสแรกสุดในฐานข้อมูลมาแสดงทันที
        return active.length > 0 ? active[0] : null;
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshActiveCodes();
    const interval = setInterval(refreshActiveCodes, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshActiveCodes();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGenerate = async () => {
    try {
      const newCode = await generateSingleCodeAction(selectedPoints, 'สุ่มรหัสสดหน้าชั้นเรียน');
      if (newCode) {
        setCurrentCode(newCode);
        setCopied(false);
        await refreshActiveCodes();
        if (onCodeGenerated) {
          onCodeGenerated(newCode);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteCode = async (id: string, codeStr: string) => {
    if (!confirm(`ต้องการลบรหัส ${codeStr} ออกจากระบบหรือไม่?`)) return;
    await deleteCodeAction(id);
    await refreshActiveCodes();
  };

  return (
    <Card className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 border-2 border-orange-200/80 shadow-md p-5 rounded-2xl relative overflow-hidden space-y-4">
      {/* Background Decorative Blob */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" className="gap-1 text-xs px-2.5 py-0.5">
              <Dices className="w-3.5 h-3.5" /> สุ่มทีละรหัส (Prevent Bulk Leak)
            </Badge>
            <Badge variant="mint" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" /> ลบทันทีเมื่อใช้
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            🎲 สุ่มรหัสคะแนนสดสำหรับเปิดหน้าจอชั้นเรียน
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            สุ่มทีละ 1 รหัส ป้องกันนักเรียนมองเห็นรหัสอื่นล่วงหน้า เมื่อนักเรียนนำไปกรอกแล้ว รหัสจะถูกลบออกจากระบบทันที
          </p>
        </div>

        {/* Points Selector & Custom Points */}
        <div className="flex flex-wrap items-center gap-2 bg-white/90 p-2 rounded-xl border border-orange-200 shadow-2xs self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-600 px-1">กำหนดคะแนน:</span>
          <div className="flex items-center gap-1">
            {[5, 10, 15, 20].map((pts) => (
              <button
                key={pts}
                type="button"
                onClick={() => setSelectedPoints(pts)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPoints === pts
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs scale-105'
                    : 'text-slate-600 hover:bg-orange-100/50'
                }`}
              >
                +{pts}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">หรือกำหนดเอง:</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={selectedPoints}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSelectedPoints(isNaN(val) || val <= 0 ? 1 : val);
              }}
              className="w-16 px-2 py-1 text-xs font-bold text-orange-600 bg-orange-50/60 border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-center"
            />
            <span className="text-[11px] font-semibold text-slate-500">แต้ม</span>
          </div>
        </div>
      </div>

      {/* Main Display Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Giant Code Display */}
        <div className="md:col-span-8 flex flex-col items-center justify-center p-6 bg-white/90 border-2 border-dashed border-orange-300 rounded-2xl shadow-inner text-center relative min-h-[200px]">
          {currentCode ? (
            <>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                รหัสสะสมคะแนนสด (+{currentCode.points} คะแนน)
              </div>
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 py-2 select-all drop-shadow-xs">
                {currentCode.code.split('').join(' ')}
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" /> ฉายขึ้นหน้าจอทีวี/โปรเจกเตอร์เพื่อให้นักเรียนกรอกสด
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="text-xs border-orange-200 hover:bg-orange-50 gap-1.5 text-orange-700 font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกเรียบร้อย' : 'คัดลอกรหัส'}</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <Dices className="w-12 h-12 text-orange-300 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold text-slate-700">ไม่มีรหัสรอใช้งานในระบบ</p>
              <p className="text-xs text-slate-500 mt-1">กดปุ่ม "สุ่มรหัสสด 1 รหัส" ด้านขวา เพื่อเริ่มแจกคะแนน</p>
            </div>
          )}
        </div>

        {/* Action Button & Status */}
        <div className="md:col-span-4 flex flex-col justify-between gap-3 h-full">
          <Button
            onClick={handleGenerate}
            size="lg"
            className="w-full h-24 text-base sm:text-lg font-black bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-orange-500/25 transition-all flex flex-col items-center justify-center gap-1 rounded-2xl group active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>🎲 สุ่มรหัสสด 1 รหัส</span>
            </div>
            <span className="text-xs font-normal opacity-90">({selectedPoints} คะแนน • ลบทันทีเมื่อใช้)</span>
          </Button>

          <div className="bg-orange-100/60 rounded-xl p-3 border border-orange-200/60 text-xs text-orange-950 space-y-1.5">
            <div className="font-bold flex items-center justify-between text-orange-900">
              <span className="flex items-center gap-1.5">
                <span>⚡ รหัสที่รอใช้งานในระบบ:</span>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="text-orange-600 hover:text-orange-800 p-0.5"
                  title="รีเฟรชข้อมูลจากฐานข้อมูล"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </span>
              <Badge variant="amber" className="text-xs px-2 py-0 font-bold">
                {activeCodes.length} รหัส
              </Badge>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              ทันทีที่นักเรียนป้อนรหัส รหัสจะเปลี่ยนสถานะและถูกลบออกจากสระรหัสทันที ป้องกันการแอบมองและใช้ซ้ำ
            </p>
          </div>
        </div>
      </div>

      {/* รายการรหัสทั้งหมดที่รอใช้งานในฐานข้อมูล */}
      {activeCodes.length > 0 && (
        <div className="pt-3 border-t border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>📋 รายการรหัสที่รอใช้งานในฐานข้อมูล ({activeCodes.length} รหัส):</span>
            </span>
            <span className="text-[11px] text-slate-500">คลิกที่รหัสเพื่อฉายขึ้นจอ หรือกดลบ</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCodes.map((codeItem) => {
              const isSelected = currentCode?.id === codeItem.id;
              return (
                <div
                  key={codeItem.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-600 shadow-sm font-black ring-2 ring-orange-300'
                      : 'bg-white text-slate-700 border-orange-200 hover:border-orange-400 hover:bg-orange-50/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentCode(codeItem)}
                    className="flex items-center gap-1.5 font-mono tracking-wider cursor-pointer"
                    title="คลิกเพื่อฉายรหัสนี้ขึ้นจอใหญ่"
                  >
                    <span className="text-sm font-bold">{codeItem.code}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      +{codeItem.points} แต้ม
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCode(codeItem.id, codeItem.code)}
                    className={`ml-1 p-0.5 rounded hover:text-red-600 transition-colors cursor-pointer ${
                      isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400'
                    }`}
                    title="ลบรหัสนี้ออกจากฐานข้อมูล"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

