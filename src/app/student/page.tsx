'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeRedemptionBox } from '@/components/gamification/CodeRedemptionBox';
import { LeaderboardWidget } from '@/components/gamification/LeaderboardWidget';
import { PostCard } from '@/components/feed/PostCard';
import {
  getCurrentStudent,
  FeedPost,
  AssignmentItem
} from '@/lib/data-store';
import {
  getPostsAction,
  getAssignmentsAction,
  submitAssignmentAction,
  getStudentDashboardAction,
} from '@/lib/actions';
import { formatPoints } from '@/lib/utils';
import {
  Star,
  Trophy,
  Award,
  KeyRound,
  Send,
  FileText,
  CheckCircle,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Newspaper,
  Check,
  Clock,
  ArrowLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

import { Profile } from '@/types/database';

const DEFAULT_STUDENT: Profile = {
  id: 'u-guest',
  role: 'STUDENT',
  full_name: 'นักเรียน',
  username: 'student',
  student_id: '-',
  grade_level: 'ม.5',
  room: '1',
  status: 'ACTIVE',
  created_at: '',
  updated_at: '',
};

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'code' | 'tasks' | 'feed' | 'ranks'>('code');
  const [currentStudent, setCurrentStudent] = useState<Profile>(DEFAULT_STUDENT);
  const [dashboardData, setDashboardData] = useState({
    profile: DEFAULT_STUDENT,
    individualScore: 0,
    userRank: '-',
  });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedAssign, setSelectedAssign] = useState<AssignmentItem | null>(null);

  // Auto-sync ข้อมูลอัตโนมัติ (เมื่อครูโพสต์ข่าวสารหรือมอบหมายงาน จะเด้งขึ้นทันทีจาก PostgreSQL)
  const syncData = async () => {
    try {
      const student = getCurrentStudent();
      setCurrentStudent(student);
      const [dash, pData, aData] = await Promise.all([
        getStudentDashboardAction(student.id !== 'u-guest' ? student.id : undefined),
        getPostsAction(),
        getAssignmentsAction(student.id !== 'u-guest' ? student.id : undefined),
      ]);
      setDashboardData(dash);
      setPosts(pData);
      setAssignments(aData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const student = getCurrentStudent();
    setCurrentStudent(student);
    syncData();
    const timer = setInterval(syncData, 2500);
    return () => clearInterval(timer);
  }, []);

  // Assignment Form State
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmittedNotice, setIsSubmittedNotice] = useState<string | null>(null);

  const handleRedeemSuccess = () => {
    syncData();
  };

  const handleOpenAssignment = (assign: AssignmentItem) => {
    setSelectedAssign(assign);
    setSubmissionContent('');
    setSubmissionLink('');
    setIsSubmittedNotice(null);
  };

  const handleSubmitAssignment = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!selectedAssign) return;

    await submitAssignmentAction({
      assignmentId: selectedAssign.id,
      studentId: currentStudent.id !== 'u-guest' ? currentStudent.id : undefined,
      studentName: currentStudent.full_name || 'นักเรียน',
      classroom: `ม.${currentStudent.grade_level?.replace('ม.', '') || '5'}/${currentStudent.room || '1'}`,
      content: submissionContent,
      linkUrl: submissionLink,
      maxScore: selectedAssign.max_score,
      isDraft,
    });

    await syncData();

    if (isDraft) {
      setIsSubmittedNotice('💾 บันทึกแบบร่าง (Draft) สำเร็จ! คุณสามารถกลับมาแก้ไขและส่งจริงได้ก่อนกำหนด');
    } else {
      setIsSubmittedNotice(`✅ ส่งงาน "${selectedAssign.title}" สำเร็จเรียบร้อย! (สถานะ: รอตรวจ)`);
    }
    setTimeout(() => setIsSubmittedNotice(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Clean Top Header & Profile Bar */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900">{dashboardData.profile.full_name}</h1>
              <Badge variant="brand" className="text-[10px] py-0">
                ม.{dashboardData.profile.grade_level?.replace('ม.', '')}/{dashboardData.profile.room}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">รหัสนักเรียน: {dashboardData.profile.student_id}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">สถานะ</span>
          <Badge variant="mint" className="text-xs">ACTIVE</Badge>
        </div>
      </div>

      {/* 2. Visual Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* ⭐ คะแนนฉัน */}
        <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-white border border-amber-200 p-4 rounded-2xl shadow-2xs text-center">
          <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> คะแนนของฉัน
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {formatPoints(dashboardData.individualScore)}
          </div>
        </div>

        {/* 🥇 อันดับบุคคลบน Leaderboard */}
        <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white border border-brand-200 p-4 rounded-2xl shadow-2xs text-center">
          <span className="text-[11px] font-bold text-brand-700 uppercase flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-brand-600" /> อันดับของฉัน
          </span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 mt-1">
            {dashboardData.userRank}
          </div>
        </div>

        {/* 📝 งานที่ครูมอบหมาย */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> งานที่ต้องทำ
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
            {assignments.length} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Tabs */}
      <div className="grid grid-cols-4 p-1 bg-slate-200/70 rounded-2xl text-xs sm:text-sm font-bold gap-1">
        <button
          onClick={() => setActiveTab('code')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'code' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>กรอกรหัส</span>
        </button>

        <button
          onClick={() => { setActiveTab('tasks'); setSelectedAssign(null); syncData(); }}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tasks' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ส่งงาน ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ranks')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ranks' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>อันดับ</span>
        </button>

        <button
          onClick={() => { setActiveTab('feed'); syncData(); }}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'feed' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>ข่าวสาร {posts.length > 0 ? `(${posts.length})` : ''}</span>
        </button>
      </div>

      {/* 4. Tab 1: Code Input */}
      {activeTab === 'code' && (
        <div className="py-2">
          <CodeRedemptionBox
            onSuccess={handleRedeemSuccess}
            userId={currentStudent.id}
            username={currentStudent.username}
          />
        </div>
      )}

      {/* 5. Tab 2: All Assignments Posted by Teachers (นักเรียนเห็นทุกงานที่ครูโพสต์) */}
      {activeTab === 'tasks' && (
        <div>
          {!selectedAssign ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>รายการงานทั้งหมดที่ครูมอบหมาย ({assignments.length} งาน)</span>
                </h3>
                <span className="text-xs text-slate-400">คลิกที่งานเพื่อเปิดส่งงาน</span>
              </div>

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white border border-dashed rounded-2xl">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">ยังไม่มีงานที่มอบหมายในขณะนี้</p>
                    <p className="text-xs text-slate-400 mt-1">เมื่อครูผู้สอนมอบหมายงานใหม่ งานจะปรากฏขึ้นที่นี่</p>
                  </div>
                ) : (
                  assignments.map((assign) => (
                    <Card
                      key={assign.id}
                      onClick={() => handleOpenAssignment(assign)}
                      className="p-5 border-slate-200/80 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{assign.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {assign.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge variant="mint" className="text-xs font-bold mb-1">
                            {assign.max_score} คะแนน
                          </Badge>
                          <div className="mt-1">
                            {assign.submission_status === 'GRADED' ? (
                              <Badge variant="mint" className="text-[11px]">
                                ตรวจแล้ว ({assign.score}/{assign.max_score})
                              </Badge>
                            ) : assign.submission_status === 'SUBMITTED' ? (
                              <Badge variant="amber" className="text-[11px]">
                                ส่งแล้ว รอตรวจ
                              </Badge>
                            ) : assign.submission_status === 'DRAFT' ? (
                              <Badge variant="slate" className="text-[11px]">
                                แบบร่าง (Draft)
                              </Badge>
                            ) : (
                              <Badge variant="rose" className="text-[11px]">
                                ยังไม่ได้ส่ง
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> กำหนดส่ง: {assign.due_date}
                        </span>
                        <span className="font-bold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          เปิดทำภารกิจ <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Selected Assignment Detail & Submission Form */
            <Card className="p-5 sm:p-7 max-w-xl mx-auto border-slate-200">
              <button
                onClick={() => setSelectedAssign(null)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> กลับสู่รายการงานทั้งหมด
              </button>

              <div className="border-b border-slate-100 pb-4 mb-5 flex items-start justify-between gap-3">
                <div>
                  <Badge variant="brand" className="mb-1 text-[10px]">{selectedAssign.teacher_name}</Badge>
                  <h2 className="text-lg font-bold text-slate-900">{selectedAssign.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedAssign.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="mint" className="text-sm font-black">{selectedAssign.max_score} คะแนน</Badge>
                  <span className="text-[10px] text-slate-400 block mt-1">กำหนดส่ง: {selectedAssign.due_date}</span>
                </div>
              </div>

              {isSubmittedNotice && (
                <div className="mb-4 p-3 rounded-xl bg-mint-50 border border-mint-200 text-xs font-bold text-mint-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-mint-600 shrink-0" />
                  <span>{isSubmittedNotice}</span>
                </div>
              )}

              {selectedAssign.submission_status === 'GRADED' && (
                <div className="mb-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>🎉 งานได้รับการตรวจเรียบร้อยแล้ว</span>
                    <span className="text-base text-mint-700 font-black">{selectedAssign.score} / {selectedAssign.max_score} คะแนน</span>
                  </div>
                  {selectedAssign.feedback && (
                    <p className="text-slate-600 mt-1">
                      <strong>ข้อเสนอแนะครู:</strong> {selectedAssign.feedback}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={(e) => handleSubmitAssignment(e, false)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำอธิบาย Prompt และแนวคิดในการทำชิ้นงาน
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="ระบุคำสั่ง Prompt ที่ใช้และแนวคิดในการสร้างสรรค์..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ลิงก์ชิ้นงาน (Canva / Google Drive / YouTube / NotebookLM)
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      placeholder="https://canva.com/design/..."
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    แนบไฟล์ชิ้นงาน (รูปภาพ / PDF / วิดีโอ)
                  </label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-500">คลิกเพื่อเลือกไฟล์ส่ง</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmitAssignment(e, true)}
                    className="text-xs font-bold"
                  >
                    บันทึกแบบร่าง (Draft)
                  </Button>
                  <Button type="submit" variant="mint" size="lg" className="font-bold text-xs">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> ส่งงานจริง
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* 6. Tab 3: Leaderboard */}
      {activeTab === 'ranks' && (
        <div className="max-w-xl mx-auto">
          <LeaderboardWidget />
        </div>
      )}

      {/* 7. Tab 4: Feed */}
      {activeTab === 'feed' && (
        <div className="max-w-xl mx-auto space-y-4">
          {posts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white border border-dashed rounded-2xl">
              <Newspaper className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">ยังไม่มีประกาศใหม่</p>
              <p className="text-xs text-slate-400 mt-1">เมื่อครูผู้สอนโพสต์ข่าวสารหรือประกาศ จะแสดงที่นี่ทันที</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={() => syncData()} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
