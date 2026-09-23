'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedPost, toggleReaction } from '@/lib/data-store';
import { addCommentAction } from '@/lib/actions';
import {
  Heart,
  ThumbsUp,
  PartyPopper,
  Lightbulb,
  MessageCircle,
  Pin,
  Send,
  User,
  Share2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-react';

interface PostCardProps {
  post: FeedPost;
  onUpdate?: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reactions, setReactions] = useState(post.reactions);
  const [comments, setComments] = useState(post.comments);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleReactionClick = (type: 'heart' | 'like' | 'party' | 'idea') => {
    toggleReaction(post.id, type);
    setReactions({ ...post.reactions });
    if (onUpdate) onUpdate();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newC = await addCommentAction({
      postId: post.id,
      content: commentText.trim(),
      authorName: 'นักเรียน',
      authorRole: 'นักเรียน',
    });
    if (newC) {
      setComments(prev => [...prev, newC]);
      setCommentText('');
      if (onUpdate) onUpdate();
    }
  };

  /** แปลงข้อความ URL ให้เป็นลิงก์ที่สามารถกดได้ (Clickable Link Parser) */
  const renderContentWithLinks = (content: string) => {
    if (!content) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 font-bold hover:underline inline-flex items-center gap-0.5 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part} <ExternalLink className="w-3.5 h-3.5 inline shrink-0 ml-0.5 text-brand-500" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const ensureHttpUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <Card className={`overflow-hidden transition-all bg-white ${post.is_pinned ? 'border-l-4 border-l-brand-600 shadow-md' : 'border-slate-200/80 shadow-xs'}`}>
      {/* Pinned & Type Header */}
      <div className="flex items-center justify-between gap-2 p-5 pb-0">
        <div className="flex items-center gap-2">
          {post.is_pinned && (
            <Badge variant="brand" className="gap-1 font-bold">
              <Pin className="w-3 h-3 fill-current" /> ปักหมุดโดยวิทยากร
            </Badge>
          )}
          <Badge variant={post.post_type === 'ANNOUNCEMENT' ? 'rose' : post.post_type === 'MEDIA' ? 'amber' : 'slate'}>
            {post.post_type}
          </Badge>
        </div>
        <span className="text-xs text-slate-400">{post.created_at}</span>
      </div>

      {/* Author Details */}
      <div className="flex items-center gap-3 px-5 pt-3">
        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
          {post.author_name ? post.author_name.charAt(0) : 'A'}
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900 leading-none">{post.author_name}</h4>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{post.author_role}</span>
        </div>
      </div>

      {/* Post Title & Content */}
      <div className="px-5 py-3 space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {post.title}
        </h3>
        <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
          {renderContentWithLinks(post.content)}
        </div>

        {/* รูปภาพแนบในโพสต์ (Attached Image) */}
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900/5 my-3 relative group">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-[480px] object-contain bg-slate-900/5 hover:opacity-95 transition-opacity cursor-pointer"
              onClick={() => setIsImageModalOpen(true)}
            />
            <div className="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3 h-3" /> คลิกเพื่อดูรูปใหญ่
            </div>
          </div>
        )}

        {/* ลิงก์แนบประจำโพสต์ (Attached External Link Card) */}
        {post.link_url && (
          <a
            href={ensureHttpUrl(post.link_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all group my-2 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-800 group-hover:text-brand-700 truncate block text-xs">
                  เปิดลิงก์ที่เกี่ยวข้องกับประกาศนี้
                </span>
                <span className="text-[11px] text-slate-400 truncate block font-mono">
                  {post.link_url}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>
        )}
      </div>

      {/* Lightbox ดูรูปใหญ่ */}
      {isImageModalOpen && post.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={post.image_url} alt={post.title} className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-3 right-3 bg-slate-900/70 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reactions Bar (Prompt Section 38: ❤️ 👍 🎉 💡) */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleReactionClick('heart')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
              reactions.userReacted === 'heart'
                ? 'bg-rose-50 border-rose-300 text-rose-600 font-bold scale-105'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">❤️</span> {reactions.heart}
          </button>

          <button
            onClick={() => handleReactionClick('like')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
              reactions.userReacted === 'like'
                ? 'bg-sky-50 border-sky-300 text-sky-600 font-bold scale-105'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">👍</span> {reactions.like}
          </button>

          <button
            onClick={() => handleReactionClick('party')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
              reactions.userReacted === 'party'
                ? 'bg-amber-50 border-amber-300 text-amber-600 font-bold scale-105'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">🎉</span> {reactions.party}
          </button>

          <button
            onClick={() => handleReactionClick('idea')}
            className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
              reactions.userReacted === 'idea'
                ? 'bg-mint-50 border-mint-300 text-mint-600 font-bold scale-105'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm">💡</span> {reactions.idea}
          </button>
        </div>

        {post.allow_comment && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length} ความคิดเห็น</span>
          </button>
        )}
      </div>

      {/* Comment Section */}
      {showComments && post.allow_comment && (
        <div className="bg-slate-50/70 border-t border-slate-100 p-5 space-y-4">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{comment.author_name}</span>
                    <span className="text-[10px] text-brand-600 font-medium bg-brand-50 px-1.5 py-0.2 rounded">
                      {comment.author_role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{comment.created_at}</span>
                </div>
                <p className="text-xs text-slate-600">{comment.content}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-3 text-xs text-slate-400">
                ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นเลย!
              </div>
            )}
          </div>

          {/* Write Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="เขียนความคิดเห็นหรือคำถาม..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none bg-white"
            />
            <Button type="submit" variant="primary" size="sm" className="font-bold shrink-0">
              <Send className="w-3.5 h-3.5 mr-1" /> ส่ง
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
