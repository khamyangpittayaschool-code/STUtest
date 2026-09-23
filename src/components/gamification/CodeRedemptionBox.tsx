'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fireCelebrationConfetti } from './ConfettiEffect';
import { redeemCodeInStore } from '@/lib/data-store';
import { CodeRedemptionResult } from '@/types/database';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Trophy, Users } from 'lucide-react';

interface CodeRedemptionBoxProps {
  onSuccess?: (result: CodeRedemptionResult) => void;
  userId?: string;
}

export function CodeRedemptionBox({ onSuccess, userId = 'u-student-1' }: CodeRedemptionBoxProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CodeRedemptionResult | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '');

    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (cleaned.length === 1) {
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      setDigits(newDigits);
      if (index < 4) {
        inputsRef.current[index + 1]?.focus();
      }
    } else {
      const chars = cleaned.slice(0, 5).split('');
      const newDigits = [...digits];
      chars.forEach((ch, idx) => {
        if (index + idx < 5) {
          newDigits[index + idx] = ch;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 4);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const fullCode = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 5) {
      setErrorMsg('กรุณากรอกรหัสให้ครบ 5 ตัว');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await new Promise((res) => setTimeout(res, 500));
      const res = redeemCodeInStore(fullCode, userId);

      if (res.success) {
        setSuccessResult(res);
        fireCelebrationConfetti();
        if (onSuccess) onSuccess(res);
        setDigits(['', '', '', '', '']);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Code Input Card */}
      <Card className="border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="text-center mb-5">
          <h2 className="text-lg font-black text-slate-900">กรอกรหัสรับคะแนน</h2>
          <p className="text-xs text-slate-400 mt-0.5">รหัส 5 ตัวอักษรจากวิทยากร</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center items-center gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 border-slate-200 bg-slate-50/50 shadow-xs focus:border-brand-500 focus:bg-white focus:outline-none transition-all uppercase text-slate-900"
                placeholder="•"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            variant="mint"
            isLoading={isLoading}
            disabled={fullCode.length !== 5 || isLoading}
            className="w-full text-sm font-bold py-3"
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'รับคะแนน'}
          </Button>
        </form>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>รหัสทดสอบ:</span>
          <span className="font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">K7X2M</span>
        </div>
      </Card>

      {/* Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-xl border border-mint-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-mint-100 text-mint-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900">🎉 ถูกต้อง!</h3>
            <p className="text-mint-600 font-bold text-base mt-0.5">
              +{successResult.points_added} คะแนน
            </p>

            <div className="my-4 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">คะแนนฉัน</span>
                <span className="font-bold text-slate-800">
                  {successResult.individual_score?.previous} → <strong className="text-mint-600">{successResult.individual_score?.current}</strong>
                </span>
              </div>

              {successResult.group_score?.has_group && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500">คะแนนกลุ่ม</span>
                  <span className="font-bold text-slate-800">
                    {successResult.group_score.previous} → <strong className="text-brand-600">{successResult.group_score.current}</strong>
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={() => setSuccessResult(null)}
              variant="primary"
              size="md"
              className="w-full font-bold text-xs"
            >
              ตกลง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
