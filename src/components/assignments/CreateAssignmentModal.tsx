'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssignmentItem } from '@/lib/data-store';
import { createAssignmentAction } from '@/lib/actions';
import { X, Plus, FileText, Calendar, Award } from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (assignment: AssignmentItem) => void;
  teacherName?: string;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onCreated,
  teacherName = 'ครูผู้สอน',
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState<number>(20);
  const [dueDate, setDueDate] = useState('26/09/2569 16:00 น.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const newAssignment = await createAssignmentAction({
        title: title.trim(),
        description: description.trim(),
        maxScore: maxScore > 0 ? maxScore : 10,
        dueDate: dueDate.trim() || 'วันนี้ 16:00 น.',
        teacherName: teacherName,
      });

      if (newAssignment) {
        onCreated(newAssignment);
        setTitle('');
        setDescription('');
        setMaxScore(20);
        setDueDate('26/09/2569 16:00 น.');
        onClose();
      } else {
        alert('ไม่สามารถสร้างงานได้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่อ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">สร้างงาน / มอบหมายงานใหม่</h3>
              <p className="text-[11px] text-slate-400">งานจะเด้งเข้าสู่ช่องส่งงานของนักเรียนทุกคนทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หัวข้องาน / ภารกิจ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น งานที่ 1: สร้างภาพและสื่อประชาสัมพันธ์ด้วย AI"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำสั่ง / รายละเอียดงาน <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุสิ่งที่นักเรียนต้องทำ เครื่องมือที่ใช้ และเกณฑ์การประเมิน..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>คะแนนเต็ม</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-800 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>กำหนดส่ง</span>
              </label>
              <input
                type="text"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="เช่น 26/09/2569 16:00 น."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> มอบหมายงานให้นักเรียน
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
