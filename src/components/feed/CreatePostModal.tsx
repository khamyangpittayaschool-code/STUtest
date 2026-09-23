'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FeedPost } from '@/lib/data-store';
import { createPostAction, updatePostAction } from '@/lib/actions';
import { X, Plus, Megaphone, Pin, Save, Image as ImageIcon, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';

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
  authorName = 'ครูผู้สอน',
  authorRole = 'ครูผู้สอน',
  editPost = null,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [allowComment, setAllowComment] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // เติมข้อมูลเดิมเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setIsPinned(editPost.is_pinned);
      setAllowComment(editPost.allow_comment);
      setImageUrl(editPost.image_url || '');
      setLinkUrl(editPost.link_url || '');
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setAllowComment(true);
      setImageUrl('');
      setLinkUrl('');
    }
  }, [editPost, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editPost;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพใหญ่เกินไป กรุณาเลือกไฟล์ขนาดไม่เกิน 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setImageUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editPost) {
        await updatePostAction(editPost.id, {
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          allow_comment: allowComment,
          image_url: imageUrl.trim() || undefined,
          link_url: linkUrl.trim() || undefined,
        });
        onCreated({
          ...editPost,
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          allow_comment: allowComment,
          image_url: imageUrl.trim() || undefined,
          link_url: linkUrl.trim() || undefined,
        });
      } else {
        const newPost = await createPostAction({
          title: title.trim(),
          content: content.trim(),
          postType: 'ANNOUNCEMENT',
          authorName,
          authorRole,
          isPinned,
          allowComment,
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
        });
        if (newPost) onCreated(newPost);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกโพสต์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'แก้ไขประกาศ / โพสต์' : 'สร้างประกาศ / โพสต์ใหม่'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อประกาศ / โพสต์ *</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดเนื้อหา * (รองรับ Emoji, เว้นบรรทัด, ลิงก์)</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียดสิ่งที่ต้องการสื่อสารแก่นักเรียน..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none resize-none"
            />
          </div>

          {/* แนบรูปภาพประกาศ */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>แนบรูปภาพประกาศ (Image)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> เลือกรูปจากเครื่อง
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>

            <div className="relative">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="วาง URL รูปภาพ (https://.../photo.png) หรืออัปโหลดจากเครื่องด้านบน"
                className="w-full rounded-xl border border-slate-200 pl-3 pr-8 py-2 text-xs focus:border-brand-500 focus:outline-none bg-white"
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-44 bg-slate-900/5 flex items-center justify-center mt-2 group">
                <img src={imageUrl} alt="Post Preview" className="max-h-44 object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 transition-colors"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* แนบลิงก์ที่เกี่ยวข้อง */}
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-brand-600" />
              <span>แนบลิงก์ที่เกี่ยวข้อง (External Link)</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://canva.com/design/... หรือ ลิงก์เอกสาร/เว็บไซต์"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" variant={isEditing ? 'mint' : 'primary'} disabled={isSubmitting} className="font-bold">
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
