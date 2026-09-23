'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaderboardWidget } from '@/components/gamification/LeaderboardWidget';
import { SingleCodeGenerator } from '@/components/gamification/SingleCodeGenerator';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal';
import { StudentManagementSection } from '@/components/teacher/StudentManagementSection';
import {
  FeedPost,
  SubmissionItem,
  AssignmentItem,
} from '@/lib/data-store';
import {
  getPostsAction,
  deletePostAction,
  addCommentAction,
  getSubmissionsAction,
  gradeSubmissionAction,
  getAssignmentsAction,
} from '@/lib/actions';
import { getEmbedPreviewUrl } from '@/lib/utils';
import {
  School, LayoutDashboard, Megaphone, CheckCircle2, Clock, FileText,
  Check, Edit3, Plus, ExternalLink, Trash2, Pin, MessageSquare,
  Trophy, Send, ChevronRight, BarChart3, Filter, Users, Eye, EyeOff,
  Maximize2, Copy, BookOpen, Layers, Globe, X, AlertCircle
} from 'lucide-react';

type Section = 'dashboard' | 'posts' | 'grade' | 'codes' | 'leaderboard' | 'students';

const NAV_ITEMS = [
  { key: 'dashboard' as Section, label: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard },
  { key: 'students' as Section, label: 'จัดการนักเรียน (CSV)', icon: Users },
  { key: 'grade' as Section, label: 'ระบบตรวจงาน', icon: CheckCircle2 },
  { key: 'posts' as Section, label: 'โพสต์ / ประกาศ', icon: Megaphone },
  { key: 'codes' as Section, label: 'สุ่มรหัสคะแนน', icon: BarChart3 },
  { key: 'leaderboard' as Section, label: 'กระดานลำดับคะแนน', icon: Trophy },
];

export default function TeacherDashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedAssignFilter, setSelectedAssignFilter] = useState<string>('ALL');
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [gradeScore, setGradeScore] = useState('1');
  const [gradeFeedback, setGradeFeedback] = useState('ผลงานยอดเยี่ยม');
  const [gradingSuccess, setGradingSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullModalPreview, setIsFullModalPreview] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const ensureHttpUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const isImageUrl = (url: string) => {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.gif') || clean.endsWith('.webp') || clean.endsWith('.svg');
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const loadData = async () => {
    try {
      const [pData, sData, aData] = await Promise.all([
        getPostsAction(),
        getSubmissionsAction(),
        getAssignmentsAction(),
      ]);
      setPosts(pData);
      setSubmissions(sData);
      setAssignments(aData);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    const num = parseFloat(gradeScore);
    if (isNaN(num) || num < 1 || num > selectedSub.maxScore) {
      alert(`คะแนนต้องเริ่มต้นที่ 1 ถึง ${selectedSub.maxScore}`);
      return;
    }
    await gradeSubmissionAction({
      submissionId: selectedSub.id,
      score: num,
      feedback: gradeFeedback,
    });
    await loadData();
    setSelectedSub(prev => prev ? { ...prev, status: 'GRADED', score: num, feedback: gradeFeedback } : null);
    setGradingSuccess(true);
    setTimeout(() => setGradingSuccess(false), 3000);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('ยืนยันที่จะลบโพสต์นี้หรือไม่?')) return;
    await deletePostAction(id);
    await loadData();
    if (expandedPostId === id) setExpandedPostId(null);
  };

  const handlePostSaved = async () => {
    await loadData();
    setIsPostModalOpen(false);
    setEditingPost(null);
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    await addCommentAction({
      postId,
      content: text,
      authorName: 'ครูผู้สอน',
      authorRole: 'ครูผู้สอน',
    });
    await loadData();
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalSubs = submissions.length;
  const waitingGrade = submissions.filter(s => s.status === 'SUBMITTED').length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const gradedSubs = submissions.filter(s => s.score !== undefined);
  const avgScore = gradedSubs.length > 0
    ? (gradedSubs.reduce((a, s) => a + (s.score || 0), 0) / gradedSubs.length).toFixed(1)
    : '-';

  const filteredSubmissions = submissions.filter(s => {
    if (gradeFilter === 'SUBMITTED') return s.status === 'SUBMITTED';
    if (gradeFilter === 'GRADED') return s.status === 'GRADED';
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
      {/* ─── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col py-6 px-3.5 gap-1.5 sticky top-16 h-[calc(100vh-4rem)]">
        <div className="px-2.5 mb-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">ระบบครูผู้สอน</div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center shadow-xs">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">แดชบอร์ดครู</div>
              <div className="text-[11px] text-slate-400">จัดการอบรม AI</div>
            </div>
          </div>
        </div>

        <div className="my-1 border-t border-slate-100" />

        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold w-full text-left transition-all ${
              activeSection === key
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {key === 'grade' && waitingGrade > 0 && (
              <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeSection === key ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
              }`}>
                {waitingGrade}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">

        {/* ═══ 1. แดชบอร์ดภาพรวม ═══════════════════════════════════════════════ */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">สรุปภาพรวมการส่งงานนักเรียน</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  กิจกรรม: อบรมการประยุกต์ใช้ AI • งานที่ 1: สร้างภาพด้วย AI (คะแนนเต็ม 20)
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  onClick={() => setIsAssignModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="font-bold gap-1.5 border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="w-4 h-4" /> สร้างงาน / มอบหมายงาน
                </Button>
                <Button
                  onClick={() => setActiveSection('grade')}
                  variant="primary"
                  size="sm"
                  className="font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> เริ่มตรวจงาน ({waitingGrade} คน)
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{totalSubs}
                  <span className="text-xs font-normal text-slate-400 ml-1">ชิ้น</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">ส่งงานทั้งหมด</div>
              </Card>

              <Card className="p-4 bg-white border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{waitingGrade}
                  <span className="text-xs font-normal text-slate-400 ml-1">คน</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">รอตรวจ</div>
              </Card>

              <Card className="p-4 bg-white border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-mint-50 border border-mint-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-mint-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{gradedCount}
                  <span className="text-xs font-normal text-slate-400 ml-1">คน</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">ตรวจเรียบร้อยแล้ว</div>
              </Card>

              <Card className="p-4 bg-white border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{avgScore}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ 20</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">คะแนนเฉลี่ย</div>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card className="p-5 bg-white border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-sm">ความคืบหน้าการตรวจงาน</h3>
                <span className="text-xs font-bold text-brand-600">{gradedCount} จาก {totalSubs} คน</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-mint-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${totalSubs > 0 ? (gradedCount / totalSubs) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                ตรวจงานเสร็จสิ้นแล้ว {totalSubs > 0 ? Math.round((gradedCount / totalSubs) * 100) : 0}% ของรายการส่งทั้งหมด
              </p>
            </Card>

            {/* Submission Table */}
            <Card className="p-0 overflow-hidden bg-white border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">รายการส่งงานนักเรียนทั้งหมด</h3>
                  <p className="text-[11px] text-slate-400">คลิกที่รายการเพื่อไปตรวจงานทันที</p>
                </div>
                <button
                  onClick={() => setActiveSection('grade')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  ไปหน้าระบบตรวจงาน <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    ยังไม่มีรายการส่งงานจากนักเรียนในขณะนี้ (เมื่อนักเรียนส่งงานจะปรากฏที่นี่ทันที)
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSub(sub);
                        setGradeScore(sub.score ? String(sub.score) : '20');
                        setGradeFeedback(sub.feedback || 'ผลงานยอดเยี่ยม');
                        setActiveSection('grade');
                      }}
                      className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {sub.studentName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400">รหัส: {sub.studentId} • {sub.classroom}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">{sub.submittedAt}</span>
                        {sub.status === 'GRADED' ? (
                          <Badge variant="mint" className="text-xs">ตรวจแล้ว ({sub.score}/{sub.maxScore})</Badge>
                        ) : (
                          <Badge variant="amber" className="text-xs">รอตรวจ</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {NAV_ITEMS.filter(n => n.key !== 'dashboard').map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-xs text-slate-700 hover:text-brand-600 transition-all"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 2. แยกหน้าสร้างโพสต์และดูโพสต์ที่สร้าง ═════════════════════════ */}
        {activeSection === 'posts' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">โพสต์และประกาศ</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  สร้างโพสต์สื่อสารกับนักเรียน ดูโพสต์ย้อนหลัง แก้ไข ลบ และดู/ตอบความคิดเห็น
                </p>
              </div>
              <Button
                onClick={() => { setEditingPost(null); setIsPostModalOpen(true); }}
                variant="primary"
                size="sm"
                className="font-bold gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> สร้างประกาศ / โพสต์ใหม่
              </Button>
            </div>

            {posts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">ยังไม่มีโพสต์ประกาศ</p>
                <p className="text-xs text-slate-400 mt-1">กดปุ่ม "สร้างประกาศ / โพสต์ใหม่" ด้านบนเพื่อเริ่มโพสต์</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-0 overflow-hidden bg-white border-slate-200 shadow-xs">
                    {/* Post Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {post.is_pinned && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Pin className="w-3 h-3" /> ปักหมุด
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">{post.created_at}</span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900">{post.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                            {post.content}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                            <span>ผู้โพสต์: <strong className="text-slate-600">{post.author_name}</strong></span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {post.comments.length} ความคิดเห็น
                            </span>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => { setEditingPost(post); setIsPostModalOpen(true); }}
                            className="p-2 rounded-xl text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors"
                            title="แก้ไขโพสต์"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="ลบโพสต์"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Comment Toggle */}
                      {post.allow_comment && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {expandedPostId === post.id ? 'ซ่อนความคิดเห็น' : `ดูและตอบความคิดเห็น (${post.comments.length})`}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comments List & Reply Box */}
                    {expandedPostId === post.id && post.allow_comment && (
                      <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-3">
                        <div className="text-xs font-bold text-slate-700">ความคิดเห็นทั้งหมด ({post.comments.length})</div>

                        {post.comments.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2">ยังไม่มีความคิดเห็นจากนักเรียน</p>
                        ) : (
                          post.comments.map((c) => (
                            <div key={c.id} className="flex gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {c.author_name[0]}
                              </div>
                              <div className="flex-1 bg-white rounded-xl p-3 border border-slate-200 shadow-2xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-slate-800">{c.author_name}</span>
                                  <span className="text-[10px] text-slate-400">({c.author_role})</span>
                                  <span className="text-[10px] text-slate-300 ml-auto">{c.created_at}</span>
                                </div>
                                <p className="text-xs text-slate-600">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Teacher Reply Input */}
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            placeholder="ครูพิมพ์ตอบกลับความคิดเห็น..."
                            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-white focus:border-brand-500 focus:outline-none"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleAddComment(post.id)} className="font-bold shrink-0">
                            <Send className="w-3.5 h-3.5 mr-1" /> ส่ง
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 3. ระบบตรวจงาน ══════════════════════════════════════════════════ */}
        {activeSection === 'grade' && (
          <div className="space-y-5">
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-brand-600" />
                  <span>ระบบตรวจงานนักเรียน (Grading System)</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  รอตรวจ {waitingGrade} คน จากงานที่ส่งทั้งหมด {totalSubs} ชิ้น • ให้คะแนนพร้อมเปิดดูผลงานแบบ Real-time
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsAssignModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="font-bold gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> สร้างงาน / มอบหมายงานใหม่
                </Button>

                {/* Filter Status Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                  <button
                    onClick={() => setGradeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      gradeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ทั้งหมด ({totalSubs})
                  </button>
                  <button
                    onClick={() => setGradeFilter('SUBMITTED')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      gradeFilter === 'SUBMITTED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    รอตรวจ ({waitingGrade})
                  </button>
                  <button
                    onClick={() => setGradeFilter('GRADED')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      gradeFilter === 'GRADED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ตรวจแล้ว ({gradedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ แถบงานที่ครูมอบหมาย (Assigned Tasks Selector) ═══ */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span>งานที่ครูมอบหมายทั้งหมด ({assignments.length} งาน):</span>
                </span>
                <span className="text-[11px] text-slate-400">คลิกที่งานเพื่อกรองรายการส่งงานของนักเรียน</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedAssignFilter === 'ALL'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ทุกงานที่มอบหมาย</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    selectedAssignFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {submissions.length}
                  </span>
                </button>

                {assignments.map((assign) => {
                  const isCurrent = selectedAssignFilter === assign.id;
                  const assignSubCount = submissions.filter(s => s.assignmentId === assign.id).length;
                  return (
                    <button
                      key={assign.id}
                      type="button"
                      onClick={() => setSelectedAssignFilter(isCurrent ? 'ALL' : assign.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-brand-600 text-white border-brand-700 shadow-xs ring-2 ring-brand-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/30'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px]">{assign.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'
                      }`}>
                        +{assign.max_score} แต้ม
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isCurrent ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        ส่ง {assignSubCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* รายละเอียดของงานที่เลือก */}
              {selectedAssignFilter !== 'ALL' && (
                (() => {
                  const currentAssign = assignments.find(a => a.id === selectedAssignFilter);
                  if (!currentAssign) return null;
                  return (
                    <div className="mt-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100 text-xs text-brand-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-brand-900">
                          <span>📌 {currentAssign.title}</span>
                          <Badge variant="brand" className="text-[10px] py-0 font-normal">
                            คะแนนเต็ม {currentAssign.max_score} แต้ม
                          </Badge>
                          <span className="text-[11px] text-slate-500 font-normal">
                            กำหนดส่ง: {currentAssign.due_date}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                          {currentAssign.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedAssignFilter('ALL')}
                        className="text-[11px] text-brand-600 hover:text-brand-800 underline shrink-0 font-semibold"
                      >
                        ล้างตัวกรองงาน
                      </button>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Submission List (Left 4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span className="font-bold">รายการส่งงาน ({filteredSubmissions.length})</span>
                  <span>คลิกเพื่อเปิดตรวจและดูงาน</span>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white border border-dashed rounded-2xl text-xs">
                    ไม่มีรายการส่งงานตามตัวกรองที่เลือก
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSub?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSub(sub);
                          setGradeScore(sub.score ? String(sub.score) : '1');
                          setGradeFeedback(sub.feedback || 'ผลงานยอดเยี่ยม');
                          setGradingSuccess(false);
                          setIsPreviewOpen(true);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              รหัส: {sub.studentId} • {sub.classroom}
                            </div>
                            <div className="text-[10px] font-semibold text-brand-600 mt-1 line-clamp-1">
                              📂 {sub.assignmentTitle || 'งานที่มอบหมาย'}
                            </div>
                          </div>
                          {sub.status === 'GRADED' ? (
                            <Badge variant="mint" className="text-[10px] shrink-0 font-bold">
                              ✓ {sub.score}/{sub.maxScore}
                            </Badge>
                          ) : (
                            <Badge variant="amber" className="text-[10px] shrink-0 font-bold">
                              รอตรวจ
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {sub.submittedAt}
                          </span>
                          {sub.linkUrl && (
                            <span className="text-brand-600 font-bold flex items-center gap-0.5">
                              <ExternalLink className="w-3 h-3" /> มีลิงก์
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Grading Desk & Work Preview (Right 8 cols) */}
              <div className="lg:col-span-8">
                {selectedSub ? (
                  <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold mb-1">
                          <FileText className="w-3.5 h-3.5" /> {selectedSub.assignmentTitle || 'งานที่มอบหมาย'}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{selectedSub.studentName}</h3>
                        <p className="text-xs text-slate-400">
                          รหัสนักเรียน: {selectedSub.studentId} • ชั้น: {selectedSub.classroom} • ส่งเมื่อ {selectedSub.submittedAt}
                        </p>
                      </div>
                      <Badge variant={selectedSub.status === 'GRADED' ? 'mint' : 'amber'}>
                        {selectedSub.status === 'GRADED' ? 'ตรวจแล้ว' : 'รอการตรวจ'}
                      </Badge>
                    </div>

                    {/* Content text */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        คำอธิบาย / รายละเอียดผลงานที่นักเรียนเขียนส่ง
                      </span>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {selectedSub.content || '(นักเรียนไม่ได้เขียนข้อความเพิ่มเติม)'}
                      </div>
                    </div>

                    {/* ═══ ลิงก์ผลงานและการพรีวิว (Live Work Preview) ═══ */}
                    {selectedSub.linkUrl && (
                      (() => {
                        const safeUrl = ensureHttpUrl(selectedSub.linkUrl);
                        const embedUrl = getEmbedPreviewUrl(safeUrl);
                        const isImg = isImageUrl(safeUrl);
                        const ytEmbed = getYoutubeEmbedUrl(safeUrl);

                        return (
                          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                  ลิงก์ผลงานของนักเรียน:
                                </span>
                                <a
                                  href={safeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono font-bold text-brand-600 hover:underline break-all"
                                >
                                  {safeUrl}
                                </a>
                              </div>

                              {/* Action buttons for Link & Preview */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={safeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:bg-brand-700 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>เปิดดูในแท็บใหม่</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(safeUrl);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                  }}
                                  className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                                  title="คัดลอกลิงก์"
                                >
                                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
                                  title="ย่อ/ขยาย พรีวิว"
                                >
                                  {isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  <span>{isPreviewOpen ? 'ซ่อนพรีวิว' : 'ดูพรีวิว'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsFullModalPreview(true)}
                                  className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                                  title="เปิดพรีวิวแบบเต็มจอ"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Live Preview Container */}
                            {isPreviewOpen && (
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                {isImg ? (
                                  <div className="p-3 flex items-center justify-center bg-slate-900/5 min-h-[220px]">
                                    <img
                                      src={safeUrl}
                                      alt="Student Work"
                                      className="max-h-[380px] max-w-full rounded-xl object-contain shadow-xs cursor-pointer hover:scale-[1.01] transition-transform"
                                      onClick={() => window.open(safeUrl, '_blank')}
                                    />
                                  </div>
                                ) : ytEmbed ? (
                                  <div className="aspect-video w-full">
                                    <iframe
                                      src={ytEmbed}
                                      title="YouTube Video Preview"
                                      className="w-full h-full border-0"
                                      allowFullScreen
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                                      <span className="font-bold flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-brand-600" />
                                        <span>หน้าต่างพรีวิวผลงานสด (Live Preview)</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        คลิกที่ชิ้นงานเพื่อเลื่อนดู
                                      </span>
                                    </div>
                                    <div className="relative h-[380px] w-full bg-white">
                                      <iframe
                                        src={embedUrl}
                                        title="Work Preview Frame"
                                        className="w-full h-full border-0"
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-storage-access-by-user-activation allow-presentation allow-downloads"
                                      />
                                    </div>
                                    <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                                      <div className="flex items-center gap-1.5 text-slate-600">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>* หากพรีวิวขึ้นว่า <strong>"ต้องมีสิทธิ์เข้าถึง"</strong> ให้คลิกปุ่ม <strong>"เปิดดูในแท็บใหม่"</strong> ด้านบน หรือให้นักเรียนแชร์ไฟล์เป็น <em>"ทุกคนที่มีลิงก์ (Anyone with the link)"</em></span>
                                      </div>
                                      <a
                                        href={safeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-600 font-bold hover:underline flex items-center gap-1 shrink-0 ml-2"
                                      >
                                        <ExternalLink className="w-3 h-3" /> เปิดดูในแท็บใหม่
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* Files list */}
                    {selectedSub.files.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          ไฟล์แนบ ({selectedSub.files.length} ไฟล์)
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedSub.files.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                              <FileText className="w-3.5 h-3.5 text-brand-500" /> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Modal Preview */}
                    {isFullModalPreview && selectedSub.linkUrl && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95">
                          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">
                                พรีวิวผลงานเต็มจอ: {selectedSub.studentName} ({selectedSub.assignmentTitle || 'งานที่มอบหมาย'})
                              </h4>
                              <p className="text-[11px] font-mono text-slate-500">{selectedSub.linkUrl}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={ensureHttpUrl(selectedSub.linkUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> เปิดในแท็บใหม่
                              </a>
                              <button
                                onClick={() => setIsFullModalPreview(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 bg-slate-100 relative overflow-hidden">
                            {isImageUrl(ensureHttpUrl(selectedSub.linkUrl)) ? (
                              <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                  src={ensureHttpUrl(selectedSub.linkUrl)}
                                  alt="Full Preview"
                                  className="max-h-full max-w-full rounded-xl object-contain shadow-md"
                                />
                              </div>
                            ) : (
                              <iframe
                                src={getEmbedPreviewUrl(selectedSub.linkUrl)}
                                title="Full Preview Frame"
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-storage-access-by-user-activation allow-presentation allow-downloads"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grading Form */}
                    <form onSubmit={handleGradeSubmit} className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ให้คะแนน (เริ่มต้นที่ 1 เต็ม {selectedSub.maxScore})
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={1}
                            max={selectedSub.maxScore}
                            value={gradeScore}
                            onChange={e => setGradeScore(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xl font-black text-slate-800 focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ข้อเสนอแนะ (Feedback)
                          </label>
                          <input
                            type="text"
                            value={gradeFeedback}
                            onChange={e => setGradeFeedback(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                            placeholder="เขียนคำแนะนำแก่นักเรียน..."
                          />
                        </div>
                      </div>

                      {gradingSuccess && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-mint-50 text-mint-700 text-xs font-bold border border-mint-200">
                          <Check className="w-4 h-4" /> บันทึกคะแนนและส่งผลตอบรับแก่นักเรียนเรียบร้อยแล้ว!
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button type="submit" variant="mint" className="font-bold">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> บันทึกและยืนยันคะแนน
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center p-12 text-center text-slate-400 border-2 border-dashed rounded-2xl bg-white">
                    เลือกรายการส่งงานทางซ้ายเพื่อตรวจ
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 4. ระบบสุ่มคะแนน กำหนดคะแนนได้ ═══════════════════════════════════ */}
        {activeSection === 'codes' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200/80 pb-4">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ระบบสุ่มรหัสคะแนน</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                สุ่มทีละ 1 รหัส สำหรับฉายขึ้นจอหน้าห้อง • สามารถกำหนดคะแนนเองได้ • รหัสจะถูกลบทันทีที่นักเรียนนำไปใช้
              </p>
            </div>
            <SingleCodeGenerator />
          </div>
        )}

        {/* ═══ 5. กระดานลำดับคะแนน ═════════════════════════════════════════════ */}
        {activeSection === 'leaderboard' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200/80 pb-4">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">กระดานลำดับคะแนน</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                แสดงผลคะแนนสะสมรายบุคคล พร้อมค้นหาชื่อหรือรหัสนักเรียน
              </p>
            </div>
            <LeaderboardWidget />
          </div>
        )}

        {/* ═══ 6. จัดการบัญชีนักเรียน (CSV) ══════════════════════════════════════ */}
        {activeSection === 'students' && (
          <StudentManagementSection />
        )}
      </main>

      {/* Modal สร้าง/แก้ไข โพสต์ */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => { setIsPostModalOpen(false); setEditingPost(null); }}
        onCreated={handlePostSaved}
        editPost={editingPost}
      />

      {/* Modal สร้างงาน / มอบหมายงาน */}
      <CreateAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onCreated={() => {
          alert('✅ มอบหมายงานให้นักเรียนเรียบร้อยแล้ว! งานจะเด้งเข้าสู่ช่องส่งงานของนักเรียนทันที');
          setIsAssignModalOpen(false);
        }}
      />
    </div>
  );
}
