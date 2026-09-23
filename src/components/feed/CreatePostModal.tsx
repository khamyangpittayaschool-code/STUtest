'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FeedPost } from '@/lib/data-store';
import { createPostAction, updatePostAction } from '@/lib/actions';
import { X, Plus, Megaphone, Pin, Save, Image as ImageIcon, Link as LinkIcon, Upload, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

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
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageSizeText, setImageSizeText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper บีบอัดรูปภาพฝั่ง client ด้วย Canvas
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // ถ้าเป็น GIF ให้ใช้ไฟล์เดิมเพื่อคงภาพเคลื่อนไหว (ถ้าไม่เกิน 2MB)
      if (file.type === 'image/gif' && file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDimension = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }

        // วาดพื้นหลังสีขาวสำหรับภาพโปร่งใสเมื่อแปลงเป็น JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // คุณภาพ 0.8 ให้ภาพคมชัด อ่านตัวหนังสือเกียรติบัตรได้ชัดเจน แต่ขนาดไฟล์ลดลงเหลือ ~100-200KB
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };

      img.src = objectUrl;
    });
  };

  // เติมข้อมูลเดิมเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setIsPinned(editPost.is_pinned);
      setAllowComment(editPost.allow_comment);
      setImageUrl(editPost.image_url || '');
      setLinkUrl(editPost.link_url || '');
      setImageSizeText('');
    } else {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setAllowComment(true);
      setImageUrl('');
      setLinkUrl('');
      setImageSizeText('');
    }
  }, [editPost, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editPost;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพใหญ่เกินไป กรุณาเลือกไฟล์ขนาดไม่เกิน 20MB');
      return;
    }

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file);
      setImageUrl(compressedDataUrl);

      // คำนวณขนาดหลังบีบอัด
      const sizeInKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setImageSizeText(`${sizeInKb} KB (ปรับขนาดเพื่อความเร็วและความคมชัด)`);
    } catch (err) {
      console.error('Image compression error:', err);
      // Fallback เป็น readAsDataURL ทั่วไป
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImageUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageSizeText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting || isCompressing) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editPost) {
        const success = await updatePostAction(editPost.id, {
          title: title.trim(),
          content: content.trim(),
          is_pinned: isPinned,
          allow_comment: allowComment,
          image_url: imageUrl.trim() || undefined,
          link_url: linkUrl.trim() || undefined,
        });

        if (!success) {
          alert('ไม่สามารถอัปเดตโพสต์ได้ กรุณาลองใหม่อีกครั้ง');
          return;
        }

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

        if (!newPost) {
          alert('เกิดข้อผิดพลาดในการบันทึกโพสต์ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
          return;
        }

        onCreated(newPost);
      }
      onClose();
    } catch (err: any) {
      console.error('Post submit error:', err);
      alert(err?.message || 'เกิดข้อผิดพลาดในการบันทึกโพสต์ กรุณาลองใหม่อีกครั้ง');
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
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>แนบรูปภาพประกอบประกาศ (Image)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-brand-600 hover:underline"
                >
                  เปลี่ยนรูปภาพ
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {isCompressing ? (
              <div className="border-2 border-dashed border-brand-300 bg-brand-50/50 rounded-2xl p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs">กำลังประมวลผลและปรับขนาดรูปภาพ...</p>
                <p className="text-[11px] text-slate-500 mt-0.5">บีบอัดรูปภาพเพื่อให้อัปโหลดได้เร็วและตัวหนังสือคมชัด</p>
              </div>
            ) : !imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-700 text-xs">คลิกเพื่ออัปโหลดรูปภาพจากเครื่อง</p>
                <p className="text-[11px] text-slate-400 mt-0.5">รองรับรูปภาพทั่วไป เกียรติบัตร และภาพถ่าย (JPG, PNG, WEBP)</p>
              </div>
            ) : (
              <div className="space-y-1.5 mt-2">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-56 flex items-center justify-center group">
                  <img src={imageUrl} alt="Post Preview" className="max-h-56 w-full object-contain bg-slate-50" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-xl shadow-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="ลบรูปภาพ"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบรูปภาพ
                  </button>
                </div>
                {imageSizeText && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{imageSizeText}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-1">หรือ วาง URL รูปภาพ (Image URL):</span>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://.../image.png"
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none bg-white"
                />
              </div>
            </div>
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
            <Button
              type="submit"
              variant={isEditing ? 'mint' : 'primary'}
              disabled={isSubmitting || isCompressing}
              className="font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังบันทึก...
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1" /> บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" /> เผยแพร่โพสต์
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
