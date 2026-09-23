'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllGroups, createNewGroup } from '@/lib/data-store';
import { Group } from '@/types/database';
import { Users, Plus, Check, X, Shield, Sparkles } from 'lucide-react';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupName?: string;
  onGroupSelected?: (group: Group) => void;
}

export function GroupManagerModal({
  isOpen,
  onClose,
  currentGroupName = 'AI Genius',
  onGroupSelected,
}: GroupManagerModalProps) {
  const [groups, setGroups] = useState<Group[]>(getAllGroups());
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedName, setSelectedName] = useState(currentGroupName);
  const [joinedNotice, setJoinedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const newG = createNewGroup(groupName, description);
    setGroups(getAllGroups());
    setSelectedName(newG.name);
    setIsCreating(false);
    setGroupName('');
    setDescription('');
    setJoinedNotice(`สร้างและเข้าร่วมกลุ่ม "${newG.name}" สำเร็จ!`);
    if (onGroupSelected) onGroupSelected(newG);
  };

  const handleSelectGroup = (g: Group) => {
    setSelectedName(g.name);
    setJoinedNotice(`เปลี่ยนมาเข้าร่วมกลุ่ม "${g.name}" เรียบร้อยแล้ว`);
    if (onGroupSelected) onGroupSelected(g);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">จัดการกลุ่มกิจกรรม (Group)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {joinedNotice && (
          <div className="mb-4 p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs font-semibold text-mint-700 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{joinedNotice}</span>
          </div>
        )}

        {!isCreating ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">
                เลือกกลุ่มที่ต้องการเข้าร่วม ({groups.length})
              </span>
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                size="sm"
                className="gap-1 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> สร้างกลุ่มใหม่
              </Button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {groups.map((group) => {
                const isSelected = selectedName.startsWith(group.name.split(' ')[0]);

                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {group.name}
                        {isSelected && (
                          <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                            กลุ่มปัจจุบันของคุณ
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {group.description || 'กลุ่มกิจกรรมเพื่อการเรียนรู้ AI'}
                      </p>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" className="text-xs">
                          เข้ากลุ่ม
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button onClick={onClose} variant="primary" className="font-bold">
                เสร็จสิ้น
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">สร้างกลุ่มกิจกรรมใหม่</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อกลุ่ม (Group Name)
              </label>
              <input
                type="text"
                required
                placeholder="เช่น AI Creators Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบายกลุ่ม
              </label>
              <textarea
                rows={3}
                placeholder="เป้าหมายของกลุ่มหรือหัวข้อที่สนใจ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                ย้อนกลับ
              </Button>
              <Button type="submit" variant="mint" className="font-bold">
                <Plus className="w-4 h-4 mr-1" /> ยืนยันสร้างกลุ่ม
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
