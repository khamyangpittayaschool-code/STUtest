import {
  Profile,
  Activity,
  Group,
  Post,
  Assignment,
  Submission,
  CodeBatch,
  ActivityCode,
  UserScoreLeaderboard,
  GroupScoreLeaderboard,
  CodeRedemptionResult
} from '@/types/database';

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  user_name: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SCORE' | 'GRADE' | 'POST' | 'ASSIGNMENT' | 'RANK';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  post_type: 'ANNOUNCEMENT' | 'ASSIGNMENT' | 'MEDIA' | 'DISCUSSION' | 'DOCUMENT';
  author_name: string;
  author_role: string;
  is_pinned: boolean;
  allow_comment: boolean;
  created_at: string;
  reactions: {
    heart: number;
    like: number;
    party: number;
    idea: number;
    userReacted?: string;
  };
  comments: FeedComment[];
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  teacher_name: string;
  submitted: boolean;
  submission_status?: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';
  score?: number;
  feedback?: string;
  submitted_at?: string;
}

export interface SubmissionItem {
  id: string;
  assignmentId?: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// สะอาดและพร้อมใช้งานจริง (Cleared Mock Data)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Profiles (เริ่มต้นมีเฉพาะบัญชีครูผู้สอน)
let currentProfiles: Profile[] = [
  {
    id: 'u-teacher-1',
    role: 'TEACHER',
    full_name: 'ครูผู้สอน',
    email: 'admin@school.ac.th',
    username: 'admin',
    teacher_position: 'ครูผู้สอน',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// นักเรียนที่ล็อกอินอยู่ในเซสชันปัจจุบัน
let currentActiveStudent: Profile | null = null;

// 2. Activity Codes (สระรหัสสุ่ม)
let currentCodes: ActivityCode[] = [];

// 3. User Scores
let userScoresRecord: Record<string, number> = {};

// 4. Assignments & Submissions
let currentAssignments: AssignmentItem[] = [];
let currentSubmissions: SubmissionItem[] = [];

// 5. Notifications
let currentNotifications: NotificationItem[] = [];

// 6. Audit Logs
let currentAuditLogs: AuditLogItem[] = [];

// 7. Feed Posts
let currentPosts: FeedPost[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export function registerStudentInStore(data: {
  fullName: string;
  studentId?: string;
  gradeLevel: string;
  room: string;
  username: string;
}): Profile {
  const newStudent: Profile = {
    id: `u-stu-${Date.now()}`,
    role: 'STUDENT',
    full_name: data.fullName,
    username: data.username,
    student_id: data.studentId || `${Date.now()}`.slice(-6),
    grade_level: data.gradeLevel,
    room: data.room,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  currentProfiles.push(newStudent);
  userScoresRecord[newStudent.id] = 0;
  currentActiveStudent = newStudent;

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'USER_REGISTERED',
    entity_type: 'profiles',
    user_name: newStudent.full_name,
    details: { role: 'STUDENT', username: newStudent.username },
    created_at: new Date().toISOString(),
  });

  return newStudent;
}

export function getCurrentStudent(): Profile {
  if (typeof window !== 'undefined' && !currentActiveStudent) {
    try {
      const saved = localStorage.getItem('active_student_profile') || sessionStorage.getItem('active_student_profile');
      if (saved) currentActiveStudent = JSON.parse(saved);
    } catch {}
  }
  if (currentActiveStudent) return currentActiveStudent;
  const firstStudent = currentProfiles.find(p => p.role === 'STUDENT');
  if (firstStudent) return firstStudent;

  return {
    id: 'u-guest',
    role: 'STUDENT',
    full_name: 'นักเรียน',
    username: 'student',
    student_id: '-',
    grade_level: 'ม.5',
    room: '1',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function setCurrentStudentSession(profile: Profile) {
  currentActiveStudent = profile;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('active_student_profile', JSON.stringify(profile));
      sessionStorage.setItem('active_student_profile', JSON.stringify(profile));
    } catch {}
  }
}

export function getSystemOverview() {
  const usedCodesCount = currentCodes.filter(c => c.status === 'USED').length;
  const activeCodesCount = currentCodes.filter(c => c.status === 'ACTIVE').length;
  const students = currentProfiles.filter(p => p.role === 'STUDENT');
  const teachers = currentProfiles.filter(p => p.role === 'TEACHER' || p.role === 'SUPER_ADMIN');
  const totalScores = Object.values(userScoresRecord).reduce((a, b) => a + b, 0);

  return {
    totalMembers: currentProfiles.length,
    studentsCount: students.length,
    teachersCount: teachers.length,
    totalCodes: currentCodes.length,
    usedCodes: usedCodesCount,
    remainingCodes: activeCodesCount,
    totalPointsGiven: totalScores,
  };
}

export function getStudentDashboardData(userId?: string) {
  const profile = userId
    ? currentProfiles.find(p => p.id === userId) || getCurrentStudent()
    : getCurrentStudent();

  const userScore = userScoresRecord[profile.id] || 0;
  const allUserScores = Object.values(userScoresRecord).sort((a, b) => b - a);
  const userRankIndex = allUserScores.indexOf(userScore);
  const userRank = userRankIndex >= 0 && userScore > 0 ? `#${userRankIndex + 1}` : '-';

  return {
    profile,
    individualScore: userScore,
    userRank,
  };
}

export function getAssignments(): AssignmentItem[] {
  return [...currentAssignments];
}

export function addAssignment(assignment: Omit<AssignmentItem, 'id' | 'created_at' | 'submitted'>): AssignmentItem {
  const item: AssignmentItem = {
    ...assignment,
    id: `assign-${Date.now()}`,
    created_at: 'เมื่อสักครู่',
    submitted: false,
  };
  currentAssignments.unshift(item);
  return item;
}

export function submitAssignmentStore(assignmentId: string, content: string, linkUrl: string, isDraft = false) {
  const student = getCurrentStudent();
  const assign = currentAssignments.find(a => a.id === assignmentId);

  if (assign) {
    assign.submitted = !isDraft;
    assign.submission_status = isDraft ? 'DRAFT' : 'SUBMITTED';
    assign.submitted_at = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  }

  if (!isDraft) {
    const newSub: SubmissionItem = {
      id: `sub-${Date.now()}`,
      assignmentId,
      studentName: student.full_name,
      studentId: student.student_id || '-',
      classroom: `ม.${student.grade_level?.replace('ม.', '') || '5'}/${student.room || '1'}`,
      submittedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      status: 'SUBMITTED',
      maxScore: assign ? assign.max_score : 20,
      content,
      linkUrl,
      files: [],
    };
    currentSubmissions.unshift(newSub);
  }
}

export function getSubmissions(): SubmissionItem[] {
  return [...currentSubmissions];
}

export function gradeSubmissionInStore(submissionId: string, score: number, feedback: string) {
  const sub = currentSubmissions.find(s => s.id === submissionId);
  if (sub) {
    sub.status = 'GRADED';
    sub.score = score;
    sub.feedback = feedback;

    const student = currentProfiles.find(p => p.student_id === sub.studentId || p.full_name === sub.studentName);
    if (student) {
      userScoresRecord[student.id] = (userScoresRecord[student.id] || 0) + score;
    }
  }
}

// 🎲 สุ่มทีละรหัส (Single Code Generator)
export function generateSingleCodeInStore(points: number = 10, batchName = 'สุ่มรหัสสดในห้องเรียน'): ActivityCode {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let j = 0; j < 5; j++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const newCode: ActivityCode = {
    id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    batch_id: `batch-${Date.now()}`,
    activity_id: 'act-01',
    code,
    points,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };

  currentCodes.unshift(newCode);

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'SINGLE_CODE_GENERATED',
    entity_type: 'activity_codes',
    user_name: 'ครูผู้สอน',
    details: { code, points, batch: batchName },
    created_at: new Date().toISOString(),
  });

  return newCode;
}

export function getAllCodes(): ActivityCode[] {
  return [...currentCodes];
}

export function deleteCodeInStore(codeId: string) {
  currentCodes = currentCodes.filter(c => c.id !== codeId);
}

export function redeemCodeInStore(code: string, userId?: string): CodeRedemptionResult {
  const cleanCode = code.trim().toUpperCase();
  const targetCodeIndex = currentCodes.findIndex(c => c.code === cleanCode);

  if (targetCodeIndex === -1) {
    return {
      success: false,
      message: 'ไม่พบรหัสนี้ในระบบ หรือ รหัสถูกลบเนื่องจากมีผู้ใช้งานไปแล้ว',
    };
  }

  const targetCode = currentCodes[targetCodeIndex];

  if (targetCode.status === 'USED' || targetCode.status === 'EXPIRED') {
    currentCodes.splice(targetCodeIndex, 1);
    return {
      success: false,
      message: '⚠️ รหัสนี้ถูกใช้งานหรือหมดอายุไปแล้ว',
    };
  }

  const student = userId
    ? currentProfiles.find(p => p.id === userId) || getCurrentStudent()
    : getCurrentStudent();

  const prevUser = userScoresRecord[student.id] || 0;
  const pointsToAdd = targetCode.points;
  userScoresRecord[student.id] = prevUser + pointsToAdd;

  // ลบรหัสออกจากระบบทันทีตามเงื่อนไข
  currentCodes.splice(targetCodeIndex, 1);

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'CODE_REDEEMED_AND_DELETED',
    entity_type: 'activity_codes',
    entity_id: targetCode.id,
    user_name: student.full_name,
    details: { code: cleanCode, points: pointsToAdd },
    created_at: new Date().toISOString(),
  });

  currentNotifications.unshift({
    id: `notif-${Date.now()}`,
    title: '🎉 ได้รับคะแนนสำเร็จ!',
    message: `คุณได้รับ +${pointsToAdd} คะแนน จากการกรอกรหัส ${cleanCode}`,
    type: 'SCORE',
    is_read: false,
    created_at: 'เมื่อสักครู่',
  });

  return {
    success: true,
    message: `🎉 ถูกต้อง! คุณได้รับ +${pointsToAdd} คะแนน (รหัสถูกลบออกจากระบบแล้ว)`,
    points_added: pointsToAdd,
  };
}

export function getLeaderboards(): { userLeaderboard: UserScoreLeaderboard[]; groupLeaderboard: GroupScoreLeaderboard[] } {
  const students = currentProfiles.filter(p => p.role === 'STUDENT');

  const userLeaderboard: UserScoreLeaderboard[] = students.map((p) => {
    const pts = userScoresRecord[p.id] || 0;
    return {
      user_id: p.id,
      full_name: p.full_name,
      student_id: p.student_id,
      group_name: `ม.${p.grade_level?.replace('ม.', '') || '5'}/${p.room || '1'}`,
      total_points: pts,
      rank: 1,
    };
  }).sort((a, b) => b.total_points - a.total_points).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return { userLeaderboard, groupLeaderboard: [] };
}

export function getPosts(): FeedPost[] {
  return [...currentPosts];
}

export function addPost(newPost: Omit<FeedPost, 'id' | 'created_at' | 'reactions' | 'comments'>): FeedPost {
  const item: FeedPost = {
    ...newPost,
    id: `post-${Date.now()}`,
    created_at: 'เมื่อสักครู่',
    reactions: { heart: 0, like: 0, party: 0, idea: 0 },
    comments: [],
  };
  currentPosts.unshift(item);

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'POST_CREATED',
    entity_type: 'posts',
    user_name: newPost.author_name,
    details: { title: newPost.title, type: newPost.post_type },
    created_at: new Date().toISOString(),
  });

  return item;
}

export function deletePost(postId: string): boolean {
  const idx = currentPosts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    currentPosts.splice(idx, 1);
    return true;
  }
  return false;
}

export function updatePost(postId: string, updates: Partial<Pick<FeedPost, 'title' | 'content' | 'is_pinned' | 'allow_comment'>>): FeedPost | null {
  const post = currentPosts.find(p => p.id === postId);
  if (post) {
    Object.assign(post, updates);
    return { ...post };
  }
  return null;
}

export function toggleReaction(postId: string, type: 'heart' | 'like' | 'party' | 'idea') {
  const post = currentPosts.find(p => p.id === postId);
  if (post) {
    if (post.reactions.userReacted === type) {
      post.reactions[type] = Math.max(0, post.reactions[type] - 1);
      post.reactions.userReacted = undefined;
    } else {
      if (post.reactions.userReacted) {
        const prev = post.reactions.userReacted as keyof typeof post.reactions;
        if (typeof post.reactions[prev] === 'number') {
          (post.reactions[prev] as number) = Math.max(0, (post.reactions[prev] as number) - 1);
        }
      }
      post.reactions[type] = (post.reactions[type] || 0) + 1;
      post.reactions.userReacted = type;
    }
  }
}

export function addComment(postId: string, content: string, authorName = 'นักเรียน', role = 'นักเรียน') {
  const post = currentPosts.find(p => p.id === postId);
  if (post) {
    const comment: FeedComment = {
      id: `comm-${Date.now()}`,
      post_id: postId,
      author_name: authorName,
      author_role: role,
      content,
      created_at: 'เมื่อสักครู่',
    };
    post.comments.push(comment);
    return comment;
  }
  return null;
}

export function getNotifications(): NotificationItem[] {
  return [...currentNotifications];
}

export function markNotificationRead(id?: string) {
  if (id) {
    const item = currentNotifications.find(n => n.id === id);
    if (item) item.is_read = true;
  } else {
    currentNotifications.forEach(n => n.is_read = true);
  }
}

export function getAuditLogs(): AuditLogItem[] {
  return [...currentAuditLogs];
}

export function getAllMembers(): Profile[] {
  return [...currentProfiles];
}

export function getAllGroups(): Group[] {
  return [];
}

export function createNewGroup(name: string, description: string): Group {
  return {
    id: `g-${Date.now()}`,
    name,
    description,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
