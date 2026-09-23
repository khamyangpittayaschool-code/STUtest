'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeaderboardWidget } from '@/components/gamification/LeaderboardWidget';
import { SingleCodeGenerator } from '@/components/gamification/SingleCodeGenerator';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { getPosts, deletePost, FeedPost, addComment } from '@/lib/data-store';
import {
  School, LayoutDashboard, Megaphone, CheckCircle2, Clock, FileText,
  Check, Edit3, Plus, ExternalLink, Trash2, Pin, MessageSquare,
  Trophy, Send, ChevronRight, BarChart3, Filter
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface MockSubmission {
  id: string;
  studentName: string;
  studentId: string;
  classroom: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
  score?: number;
  maxScore: number;
  feedback?: string;
  content: string;
  linkUrl: string;
  files: string[];
}

type Section = 'dashboard' | 'posts' | 'grade' | 'codes' | 'leaderboard';

const INITIAL_SUBMISSIONS: MockSubmission[] = [
  {
    id: 'sub-1',
    studentName: 'นายกิตติศักดิ์ พัฒนศิลป์',
    studentId: '6701001',
    classroom: 'ม.5/1',
    submittedAt: '26/09/2569 14:32 น.',
    status: 'SUBMITTED',
    maxScore: 20,
    content: 'สร้างภาพโปสเตอร์วิทยาศาสตร์ในยุคอนาคตด้วย Gemini Imagen และจัดเลย์เอาต์ด้วย Canva AI โดยวิเคราะห์สีแบบ Cyberpunk',
    linkUrl: 'https://canva.com/design/DAFexample',
    files: ['poster_ai_final.png (3.2 MB)', 'prompt_notebooklm.pdf (1.1 MB)'],
  },
  {
    id: 'sub-2',
    studentName: 'นางสาวพิมพ์ชนก รัตนพร',
    studentId: '6701004',
    classroom: 'ม.5/1',
    submittedAt: '26/09/2569 13:45 น.',
    status: 'GRADED',
    score: 18,
    maxScore: 20,
    feedback: 'ผลงานดีมาก มีการใช้ AI ได้เหมาะสมและ Prompt ชัดเจน มีการจัดวางองค์ประกอบได้น่าสนใจ',
    content: 'Infographic สรุปการประยุกต์ใช้ NotebookLM เพื่อการวิจัยทางวิทยาศาสตร์ระดับมัธยมปลาย',
    linkUrl: 'https://notebooklm.google.com/notebook/example',
    files: ['notebooklm_infographic.png (4.5 MB)'],
  },
  {
    id: 'sub-3',
    studentName: 'นายวชิรวิทย์ สมบูรณ์',
    studentId: '6701025',
    classroom: 'ม.5/2',
    submittedAt: '26/09/2569 15:10 น.',
    status: 'SUBMITTED',
    maxScore: 20,
    content: 'วิดีโอสตอรี่บอร์ดแอนิเมชันสร้างด้วย Runway Gen-2 ผสานเสียงพากย์ AI ภาษาไทย',
    linkUrl: 'https://youtube.com/watch?v=example',
    files: ['storyboard.pdf (2.8 MB)', 'sample_ai_clip.mp4 (18.4 MB)'],
  },
  {
    id: 'sub-4',
    studentName: 'นางสาวสุทธิดา วงศ์เจริญ',
    studentId: '6701033',
    classroom: 'ม.5/2',
    submittedAt: '26/09/2569 16:02 น.',
    status: 'SUBMITTED',
    maxScore: 20,
    content: 'แดชบอร์ดวิเคราะห์ข้อมูลโรงเรียนด้วย Google Looker Studio + AI แนะนำการตีความ',
    linkUrl: 'https://lookerstudio.google.com/example',
    files: ['dashboard_screenshot.png (5.1 MB)'],
  },
];

const NAV_ITEMS = [
  { key: 'dashboard' as Section, label: 'แดชบอร์ดภาพรวม', icon: LayoutDashboard },
  { key: 'posts' as Section, label: 'โพสต์ / ประกาศ', icon: Megaphone },
  { key: 'grade' as Section, label: 'ระบบตรวจงาน', icon: CheckCircle2 },
  { key: 'codes' as Section, label: 'สุ่มรหัสคะแนน', icon: BarChart3 },
  { key: 'leaderboard' as Section, label: 'กระดานลำดับคะแนน', icon: Trophy },
];

export default function TeacherDashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [submissions, setSubmissions] = useState<MockSubmission[]>(INITIAL_SUBMISSIONS);
  const [selectedSub, setSelectedSub] = useState<MockSubmission | null>(INITIAL_SUBMISSIONS[0]);
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [gradeScore, setGradeScore] = useState('18');
  const [gradeFeedback, setGradeFeedback] = useState('ผลงานดี มีความคิดสร้างสรรค์ และเข้าใจหลักการ Prompting');
  const [gradingSuccess, setGradingSuccess] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>(getPosts());
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    const num = parseFloat(gradeScore);
    if (isNaN(num) || num < 0 || num > selectedSub.maxScore) {
      alert(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${selectedSub.maxScore}`);
      return;
    }
    setSubmissions(prev => prev.map(s =>
      s.id === selectedSub.id ? { ...s, status: 'GRADED', score: num, feedback: gradeFeedback } : s
    ));
    setSelectedSub({ ...selectedSub, status: 'GRADED', score: num, feedback: gradeFeedback });
    setGradingSuccess(true);
    setTimeout(() => setGradingSuccess(false), 3000);
  };

  const handleDeletePost = (id: string) => {
    if (!confirm('ยืนยันที่จะลบโพสต์นี้หรือไม่?')) return;
    deletePost(id);
    setPosts(getPosts());
    if (expandedPostId === id) setExpandedPostId(null);
  };

  const handlePostSaved = () => {
    setPosts(getPosts());
    setIsPostModalOpen(false);
    setEditingPost(null);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text, 'ครูผู้สอน', 'ครูผู้สอน');
    setPosts(getPosts());
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
              <Button
                onClick={() => setActiveSection('grade')}
                variant="primary"
                size="sm"
                className="font-bold gap-1.5 self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4" /> เริ่มตรวจงาน ({waitingGrade} คน)
              </Button>
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
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSub(sub);
                      setGradeScore(sub.score ? String(sub.score) : '18');
                      setGradeFeedback(sub.feedback || 'ผลงานดี มีความคิดสร้างสรรค์ และเข้าใจหลักการ Prompting');
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
                ))}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">ระบบตรวจงานนักเรียน</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  งานที่ 1: สร้างภาพด้วย AI (คะแนนเต็ม 20) • รอตรวจ {waitingGrade} คน จาก {totalSubs} คน
                </p>
              </div>

              {/* Filter Tabs */}
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Submission List (Left 4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white border border-dashed rounded-2xl text-xs">
                    ไม่มีรายการในตัวกรองนี้
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSub?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSub(sub);
                          setGradeScore(sub.score ? String(sub.score) : '18');
                          setGradeFeedback(sub.feedback || 'ผลงานดี มีความคิดสร้างสรรค์ และเข้าใจหลักการ Prompting');
                          setGradingSuccess(false);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">รหัส: {sub.studentId} • {sub.classroom}</div>
                          </div>
                          {sub.status === 'GRADED' ? (
                            <Badge variant="mint" className="text-[10px] shrink-0">✓ {sub.score}/{sub.maxScore}</Badge>
                          ) : (
                            <Badge variant="amber" className="text-[10px] shrink-0">รอตรวจ</Badge>
                          )}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sub.submittedAt}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Grading Desk (Right 8 cols) */}
              <div className="lg:col-span-8">
                {selectedSub ? (
                  <Card className="p-6 bg-white border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{selectedSub.studentName}</h3>
                        <p className="text-xs text-slate-400">
                          รหัส {selectedSub.studentId} • ชั้น {selectedSub.classroom} • ส่งเมื่อ {selectedSub.submittedAt}
                        </p>
                      </div>
                      <Badge variant={selectedSub.status === 'GRADED' ? 'mint' : 'amber'}>
                        {selectedSub.status === 'GRADED' ? 'ตรวจแล้ว' : 'รอการตรวจ'}
                      </Badge>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          เนื้อหาและคำอธิบายที่ส่ง
                        </span>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed">
                          {selectedSub.content}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          ลิงก์ผลงาน
                        </span>
                        <a
                          href={selectedSub.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> {selectedSub.linkUrl}
                        </a>
                      </div>

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
                    </div>

                    {/* Grading Form */}
                    <form onSubmit={handleGradeSubmit} className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            ให้คะแนน (เต็ม {selectedSub.maxScore})
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
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
      </main>

      {/* Modal สร้าง/แก้ไข โพสต์ */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => { setIsPostModalOpen(false); setEditingPost(null); }}
        onCreated={handlePostSaved}
        editPost={editingPost}
      />
    </div>
  );
}
