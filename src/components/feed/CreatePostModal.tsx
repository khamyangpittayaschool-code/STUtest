'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { addPost, updatePost, FeedPost } from '@/lib/data-store';
import { X, Plus, Megaphone, Pin, Save } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
  authorName?: string;
  authorRole?: string;
  /** ถ้าส่ง editPost มา = โหมดแก้ไข */
  editPost?: FeedPost | null;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onCreated,
  authorName = 'อาจารย์ชูเกียรติ มงคลชัย',
  authorRole = 'วิทยากร / ครูผู้สอน',
  editPost = null,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [allowComment, setAllowComment] = useState(true);

  // เติมข้อมูลเดิมเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setIsPinned(editPost.is_pinned);
      setAllowComment(editPost.allow_comment);
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setAllowComment(true);
    }
  }, [editPost, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editPost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (isEditing && editPost) {
      const updated = updatePost(editPost.id, { title, content, is_pinned: isPinned, allow_comment: allowComment });
      if (updated) onCreated(updated);
    } else {
      const newPost = addPost({
        title,
        content,
        post_type: 'ANNOUNCEMENT',
        author_name: authorName,
        author_role: authorRole,
        is_pinned: isPinned,
        allow_comment: allowComment,
      });
      onCreated(newPost);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'แก้ไขโพสต์' : 'สร้างประกาศ / โพสต์ใหม่'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อประกาศ / โพสต์</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น 📢 สรุปการใช้ Prompt ในการทำสไลด์..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">เนื้อหา (รองรับ Emoji, เว้นบรรทัด, ลิงก์)</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียดสิ่งที่ต้องการสื่อสารแก่นักเรียน..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <Pin className="w-3.5 h-3.5 text-brand-600" />
              <span>ปักหมุดไว้บนสุด</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allowComment}
                onChange={(e) => setAllowComment(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>อนุญาตความคิดเห็น</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant={isEditing ? 'mint' : 'primary'} className="font-bold">
              {isEditing ? (
                <><Save className="w-4 h-4 mr-1" /> บันทึกการแก้ไข</>
              ) : (
                <><Plus className="w-4 h-4 mr-1" /> เผยแพร่โพสต์</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
