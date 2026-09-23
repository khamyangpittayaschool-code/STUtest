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

// 1. In-memory Profiles
let currentProfiles: Profile[] = [
  {
    id: 'u-student-1',
    role: 'STUDENT',
    full_name: 'นายกิตติศักดิ์ พัฒนศิลป์',
    email: 'kittisak.ai@school.ac.th',
    username: 'kittisak67',
    student_id: '6701001',
    grade_level: 'ม.5',
    room: '1',
    academic_year: '2569',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-teacher-1',
    role: 'TEACHER',
    full_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    email: 'chookiat@school.ac.th',
    username: 'chookiat_ai',
    teacher_position: 'ครูชำนาญการพิเศษ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    organization: 'โรงเรียนตัวอย่างวิทยา',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-admin-1',
    role: 'SUPER_ADMIN',
    full_name: 'ผู้ดูแลระบบ AI Training (Super Admin)',
    email: 'admin@school.ac.th',
    username: 'superadmin',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// 2. Groups
let currentGroups: Group[] = [
  {
    id: 'g-001',
    name: 'AI Genius (อัจฉริยะ AI)',
    description: 'กลุ่มศึกษาและประยุกต์ใช้ Generative AI สำหรับนวัตกรรมการเรียนรู้',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g-002',
    name: 'Prompt Master (เซียนสั่ง AI)',
    description: 'เน้นการเขียน Prompt ขั้นสูงสำหรับ Gemini และ Claude',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g-003',
    name: 'AI Innovators (นักประดิษฐ์ AI)',
    description: 'เน้นการทำสื่อและมัลติมีเดียด้วยเครื่องมือ AI',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// 3. Activity
let currentActivity: Activity = {
  id: 'a0000000-0000-0000-0000-000000000001',
  title: 'อบรมการประยุกต์ใช้ AI ในการเรียนรู้และการสร้างสรรค์',
  description: 'การประยุกต์ใช้ Gemini, ChatGPT, Claude และ NotebookLM เพื่อการศึกษา',
  cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
  start_date: '2026-09-26T08:30:00+07:00',
  end_date: '2026-09-26T16:30:00+07:00',
  status: 'ACTIVE',
  allow_submissions: true,
  enable_scoring: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 4. Activity Codes (เริ่มต้นมีรหัสเดี่ยวสำหรับทดสอบ)
let currentCodes: ActivityCode[] = [
  { id: 'c-01', batch_id: 'b-01', activity_id: currentActivity.id, code: 'K7X2M', points: 10, status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'c-02', batch_id: 'b-01', activity_id: currentActivity.id, code: 'Q9R4Z', points: 10, status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'c-03', batch_id: 'b-01', activity_id: currentActivity.id, code: 'VJ3P8', points: 10, status: 'ACTIVE', created_at: new Date().toISOString() },
];

// 5. Scores
let userScoresRecord: Record<string, number> = {
  'u-student-1': 120,
  'u-student-2': 180,
  'u-student-3': 150,
  'u-student-4': 90,
  'u-student-5': 60,
};

let groupScoresRecord: Record<string, number> = {
  'g-001': 450,
  'g-002': 380,
  'g-003': 310,
};

// 6. Assignments
let currentAssignments: AssignmentItem[] = [
  {
    id: 'assign-1',
    title: 'งานที่ 1: สร้างภาพและสื่อประชาสัมพันธ์ด้วย AI',
    description: 'สร้างภาพด้วย Gemini Imagen หรือ Canva AI พร้อมระบุ Prompt ที่ใช้และอธิบายแนวคิดในการออกแบบ',
    max_score: 20,
    due_date: '26/09/2569 16:00 น.',
    status: 'ACTIVE',
    created_at: 'วันนี้ 09:30 น.',
    teacher_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    submitted: true,
    submission_status: 'GRADED',
    score: 18,
    feedback: 'ผลงานดีมาก มีความคิดสร้างสรรค์และเข้าใจหลักการ Prompting',
    submitted_at: '26/09/2569 14:32 น.',
  },
  {
    id: 'assign-2',
    title: 'งานที่ 2: สรุปงานวิจัยและทำเอกสารด้วย NotebookLM',
    description: 'อัปโหลดบทความวิจัยหรือเนื้อหาบทเรียนเข้า NotebookLM แล้วสร้างสรุปสาระสำคัญ 5 ข้อ พร้อมลิงก์ Audio Overview',
    max_score: 25,
    due_date: '26/09/2569 17:30 น.',
    status: 'ACTIVE',
    created_at: 'วันนี้ 11:00 น.',
    teacher_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    submitted: true,
    submission_status: 'SUBMITTED',
    submitted_at: '26/09/2569 15:10 น.',
  },
  {
    id: 'assign-3',
    title: 'งานที่ 3: ออกแบบ Chatbot Prompt สำหรับช่วยเรียนรู้',
    description: 'ออกแบบ System Prompt สำหรับสั่ง ChatGPT หรือ Claude ให้ทำหน้าที่เป็น Tutor สอนวิชาที่คุณสนใจ โดยมีเงื่อนไขให้ถามตอบทีละขั้น',
    max_score: 15,
    due_date: '27/09/2569 12:00 น.',
    status: 'ACTIVE',
    created_at: 'วันนี้ 13:00 น.',
    teacher_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    submitted: false,
    submission_status: undefined,
  },
];

// 7. Notifications
let currentNotifications: NotificationItem[] = [
  {
    id: 'n-01',
    title: '🎯 คุณได้รับ 10 คะแนน',
    message: 'ยินดีด้วย! คุณได้รับ 10 คะแนนจากการทำภารกิจช่วงเช้า',
    type: 'SCORE',
    is_read: false,
    created_at: '10 นาทีที่แล้ว',
  },
  {
    id: 'n-02',
    title: '📝 ครูตรวจงานของคุณแล้ว',
    message: 'งานที่ 1: สร้างภาพด้วย AI ได้รับ 18/20 คะแนน พร้อม Feedback',
    type: 'GRADE',
    is_read: false,
    created_at: '30 นาทีที่แล้ว',
  },
  {
    id: 'n-03',
    title: '📢 มีประกาศใหม่',
    message: 'วิทยากรได้โพสต์สรุปแนวทางการเขียน Prompt สำหรับ NotebookLM',
    type: 'POST',
    is_read: false,
    created_at: '1 ชั่วโมงที่แล้ว',
  }
];

// 8. Audit Logs
let currentAuditLogs: AuditLogItem[] = [
  {
    id: 'log-01',
    action: 'USER_REGISTERED',
    entity_type: 'profiles',
    user_name: 'นายกิตติศักดิ์ พัฒนศิลป์',
    details: { role: 'STUDENT', student_id: '6701001' },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'log-04',
    action: 'SUBMISSION_GRADED',
    entity_type: 'submissions',
    user_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    details: { score: 18, max_score: 20, student: 'นายกิตติศักดิ์' },
    created_at: new Date(Date.now() - 1800000).toISOString(),
  }
];

// 9. Feed Posts
let currentPosts: FeedPost[] = [
  {
    id: 'post-1',
    title: '📢 ประกาศกิจกรรมอบรม AI รอบที่ 1: กำหนดการและภารกิจ',
    content: 'ขอต้อนรับนักเรียนทุกคนเข้าสู่กิจกรรมอบรมการประยุกต์ใช้เทคโนโลยีปัญญาประดิษฐ์ (Generative AI: Gemini, ChatGPT, Claude และ NotebookLM) ในช่วงเช้าเราจะเรียนรู้การตั้งโจทย์และสร้างสรรค์ภาพด้วย AI จากนั้นจะมีรหัสลับแจกในห้องสำหรับสะสมคะแนนกลุ่ม!',
    post_type: 'ANNOUNCEMENT',
    author_name: 'อาจารย์ชูเกียรติ มงคลชัย',
    author_role: 'วิทยากร / ครูผู้สอน',
    is_pinned: true,
    allow_comment: true,
    created_at: 'วันนี้ 09:00 น.',
    reactions: { heart: 28, like: 14, party: 9, idea: 12 },
    comments: []
  }
];

// Functions
export function getSystemOverview() {
  const usedCodesCount = currentCodes.filter(c => c.status === 'USED').length;
  const activeCodesCount = currentCodes.filter(c => c.status === 'ACTIVE').length;
  const totalScores = Object.values(userScoresRecord).reduce((a, b) => a + b, 0);

  return {
    totalMembers: currentProfiles.length + 42,
    studentsCount: 38,
    teachersCount: 4,
    groupsCount: currentGroups.length,
    totalCodes: currentCodes.length,
    usedCodes: usedCodesCount,
    remainingCodes: activeCodesCount,
    totalPointsGiven: totalScores,
    activity: currentActivity,
  };
}

export function getStudentDashboardData(userId = 'u-student-1') {
  const profile = currentProfiles.find(p => p.id === userId) || currentProfiles[0];
  const userScore = userScoresRecord[userId] || 120;
  const group = currentGroups[0];
  const groupScore = groupScoresRecord[group.id] || 450;

  const allUserScores = Object.values(userScoresRecord).sort((a, b) => b - a);
  const userRank = allUserScores.indexOf(userScore) + 1 || 5;

  const allGroupScores = Object.values(groupScoresRecord).sort((a, b) => b - a);
  const groupRank = allGroupScores.indexOf(groupScore) + 1 || 1;

  return {
    profile,
    individualScore: userScore,
    userRank: `#${userRank}`,
    group,
    groupScore,
    groupRank: `#${groupRank}`,
  };
}

export function getAssignments(): AssignmentItem[] {
  return [...currentAssignments];
}

export function submitAssignmentStore(assignmentId: string, content: string, linkUrl: string, isDraft = false) {
  const assign = currentAssignments.find(a => a.id === assignmentId);
  if (assign) {
    assign.submitted = !isDraft;
    assign.submission_status = isDraft ? 'DRAFT' : 'SUBMITTED';
    assign.submitted_at = new Date().toLocaleTimeString('th-TH') + ' น.';
  }
}

// 🎲 สุ่มทีละรหัส (Single Code Generator - Prompt Requirement)
export function generateSingleCodeInStore(points: number = 10, batchName = 'สุ่มรหัสสดในห้องเรียน'): ActivityCode {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let j = 0; j < 5; j++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const item: ActivityCode = {
    id: `single-${Date.now()}`,
    batch_id: `single-batch-${Date.now()}`,
    activity_id: currentActivity.id,
    code,
    points,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };

  currentCodes.unshift(item);

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'SINGLE_CODE_GENERATED',
    entity_type: 'activity_codes',
    user_name: 'ครูผู้สอน / Admin',
    details: { code, points, batch: batchName },
    created_at: new Date().toISOString(),
  });

  return item;
}

// ลบรหัสออกจากระบบ (Delete Code Immediately)
export function deleteCodeInStore(codeId: string) {
  currentCodes = currentCodes.filter(c => c.id !== codeId);
}

export function redeemCodeInStore(code: string, userId = 'u-student-1'): CodeRedemptionResult {
  const cleanCode = code.trim().toUpperCase();
  const targetCodeIndex = currentCodes.findIndex(c => c.code === cleanCode);

  if (targetCodeIndex === -1) {
    return {
      success: false,
      message: 'ไม่พบรหัสนี้ในระบบ หรือ รหัสถูกลบเนื่องจากมีผู้ใช้งานไปแล้ว',
    };
  }

  const targetCode = currentCodes[targetCodeIndex];

  if (targetCode.status === 'USED') {
    // ลบออกจากรายการรหัสทันทีตามโจทย์! (หากใช้รหัสนั้นเพิ่มคะแนนแล้วรหัสจะถูกลบทันที)
    currentCodes.splice(targetCodeIndex, 1);
    return {
      success: false,
      message: '⚠️ รหัสนี้ถูกใช้งานและถูกลบออกจากระบบไปแล้ว',
    };
  }

  if (targetCode.status === 'EXPIRED') {
    return {
      success: false,
      message: 'รหัสนี้หมดอายุแล้ว',
    };
  }

  // เพิ่มคะแนนแก่นักเรียน
  const prevUser = userScoresRecord[userId] || 0;
  const pointsToAdd = targetCode.points;
  const newUser = prevUser + pointsToAdd;
  userScoresRecord[userId] = newUser;

  const groupId = currentGroups[0].id;
  const prevGroup = groupScoresRecord[groupId] || 0;
  const newGroup = prevGroup + pointsToAdd;
  groupScoresRecord[groupId] = newGroup;

  // ลบรหัสออกจาก active pool ทันทีตามที่ผู้ใช้สั่ง ("หากใช้รหัสนั้นเพิ่มคะแนนแล้วรหัสจะถูกลบทันที")
  currentCodes.splice(targetCodeIndex, 1);

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'CODE_REDEEMED_AND_DELETED',
    entity_type: 'activity_codes',
    entity_id: targetCode.id,
    user_name: 'นายกิตติศักดิ์ พัฒนศิลป์',
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
    individual_score: {
      previous: prevUser,
      current: newUser,
    },
    group_score: {
      has_group: true,
      previous: prevGroup,
      current: newGroup,
    },
  };
}

export function getLeaderboards(): { userLeaderboard: UserScoreLeaderboard[]; groupLeaderboard: GroupScoreLeaderboard[] } {
  const userLeaderboard: UserScoreLeaderboard[] = [
    { user_id: 'u-student-2', full_name: 'นางสาวพิมพ์ชนก รัตนพร', student_id: '6701004', group_name: 'Prompt Master (ม.5/1)', total_points: userScoresRecord['u-student-2'] || 180 },
    { user_id: 'u-student-3', full_name: 'นายธีรพัฒน์ วรเดช', student_id: '6701012', group_name: 'AI Genius (ม.5/1)', total_points: userScoresRecord['u-student-3'] || 150 },
    { user_id: 'u-student-1', full_name: 'นายกิตติศักดิ์ พัฒนศิลป์ (คุณ)', student_id: '6701001', group_name: 'AI Genius (ม.5/1)', total_points: userScoresRecord['u-student-1'] || 120 },
    { user_id: 'u-student-4', full_name: 'นายวชิรวิทย์ สมบูรณ์', student_id: '6701025', group_name: 'AI Innovators (ม.5/2)', total_points: userScoresRecord['u-student-4'] || 90 },
    { user_id: 'u-student-5', full_name: 'นางสาวธนภรณ์ สุวรรณฉัตร', student_id: '6701031', group_name: 'Prompt Master (ม.5/2)', total_points: userScoresRecord['u-student-5'] || 60 },
    { user_id: 'u-student-6', full_name: 'นายชินวัตร ปัญญาดี', student_id: '6701035', group_name: 'AI Genius (ม.5/1)', total_points: 55 },
    { user_id: 'u-student-7', full_name: 'นางสาวกชกร สุขเจริญ', student_id: '6701040', group_name: 'AI Innovators (ม.5/3)', total_points: 50 },
    { user_id: 'u-student-8', full_name: 'นายปณิธาน มั่นคง', student_id: '6701044', group_name: 'Prompt Master (ม.5/3)', total_points: 45 },
    { user_id: 'u-student-9', full_name: 'นางสาวสิรินดา วงศ์เทวัญ', student_id: '6701050', group_name: 'AI Genius (ม.5/2)', total_points: 40 },
    { user_id: 'u-student-10', full_name: 'นายภาณุเดช แสงสว่าง', student_id: '6701055', group_name: 'AI Innovators (ม.5/1)', total_points: 35 },
    { user_id: 'u-student-11', full_name: 'นางสาววรรณิสา แก้วมณี', student_id: '6701060', group_name: 'Prompt Master (ม.5/2)', total_points: 30 },
    { user_id: 'u-student-12', full_name: 'นายกฤษดา ทรัพย์เจริญ', student_id: '6701065', group_name: 'AI Genius (ม.5/3)', total_points: 25 },
    { user_id: 'u-student-13', full_name: 'นางสาวณิชกานต์ รุ่งเรือง', student_id: '6701070', group_name: 'AI Innovators (ม.5/1)', total_points: 20 },
    { user_id: 'u-student-14', full_name: 'นายธนกฤต เพชรแท้', student_id: '6701075', group_name: 'Prompt Master (ม.5/3)', total_points: 15 },
    { user_id: 'u-student-15', full_name: 'นางสาวสุพิชชา เลิศรัตน์', student_id: '6701080', group_name: 'AI Genius (ม.5/2)', total_points: 10 },
  ].sort((a, b) => b.total_points - a.total_points).map((item, index) => ({ ...item, rank: index + 1 }));

  const groupLeaderboard: GroupScoreLeaderboard[] = [
    { group_id: 'g-001', name: 'AI Genius', member_count: 8, total_points: groupScoresRecord['g-001'] || 450, rank: 1 },
    { group_id: 'g-002', name: 'Prompt Master', member_count: 7, total_points: groupScoresRecord['g-002'] || 380, rank: 2 },
    { group_id: 'g-003', name: 'AI Innovators', member_count: 6, total_points: groupScoresRecord['g-003'] || 310, rank: 3 },
  ].sort((a, b) => b.total_points - a.total_points).map((item, index) => ({ ...item, rank: index + 1 }));

  return { userLeaderboard, groupLeaderboard };
}

export function generateBulkCodesInStore(quantity: number, points: number, batchName: string): ActivityCode[] {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCodes: ActivityCode[] = [];

  for (let i = 0; i < quantity; i++) {
    let code = '';
    for (let j = 0; j < 5; j++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const item: ActivityCode = {
      id: `gen-${Date.now()}-${i}`,
      batch_id: `batch-${Date.now()}`,
      activity_id: currentActivity.id,
      code,
      points,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    newCodes.push(item);
    currentCodes.push(item);
  }

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'CODE_BATCH_CREATED',
    entity_type: 'code_batches',
    user_name: 'Super Admin',
    details: { batch: batchName, quantity, points },
    created_at: new Date().toISOString(),
  });

  return newCodes;
}

export function getAllCodes(): ActivityCode[] {
  return [...currentCodes];
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

  if (newPost.post_type === 'ASSIGNMENT') {
    currentAssignments.unshift({
      id: `assign-${Date.now()}`,
      title: newPost.title,
      description: newPost.content,
      max_score: 20,
      due_date: '27/09/2569 16:00 น.',
      status: 'ACTIVE',
      created_at: 'เมื่อสักครู่',
      teacher_name: newPost.author_name,
      submitted: false,
    });

    currentNotifications.unshift({
      id: `notif-${Date.now()}`,
      title: '📝 มีงานใหม่จากครูผู้สอน',
      message: `งานใหม่: ${newPost.title}`,
      type: 'ASSIGNMENT',
      is_read: false,
      created_at: 'เมื่อสักครู่',
    });
  }

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

export function addComment(postId: string, content: string, authorName = 'นายกิตติศักดิ์ พัฒนศิลป์', role = 'นักเรียน') {
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

export function adminAdjustScore(userId: string, points: number, reason: string, adminName = 'Super Admin') {
  const prevUser = userScoresRecord[userId] || 0;
  const newUser = prevUser + points;
  userScoresRecord[userId] = newUser;

  const groupId = currentGroups[0].id;
  const prevGroup = groupScoresRecord[groupId] || 0;
  const newGroup = prevGroup + points;
  groupScoresRecord[groupId] = newGroup;

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'SCORE_ADJUSTED',
    entity_type: 'user_scores',
    user_name: adminName,
    details: {
      target_user: userId,
      points_adjustment: points,
      reason,
      new_user_score: newUser,
    },
    created_at: new Date().toISOString(),
  });

  currentNotifications.unshift({
    id: `notif-${Date.now()}`,
    title: points >= 0 ? `🎁 คุณได้รับคะแนนพิเศษ +${points}` : `⚠️ ปรับลดคะแนน ${points}`,
    message: `เหตุผล: ${reason}`,
    type: 'SCORE',
    is_read: false,
    created_at: 'เมื่อสักครู่',
  });

  return { success: true, newUserScore: newUser, newGroupScore: newGroup };
}

export function getAllMembers(): Profile[] {
  return [...currentProfiles];
}

export function getAllGroups(): Group[] {
  return [...currentGroups];
}

export function createNewGroup(name: string, description: string): Group {
  const newGroup: Group = {
    id: `g-${Date.now()}`,
    name,
    description,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  currentGroups.push(newGroup);
  groupScoresRecord[newGroup.id] = 0;

  currentAuditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'GROUP_CREATED',
    entity_type: 'groups',
    user_name: 'นายกิตติศักดิ์ พัฒนศิลป์',
    details: { group_name: name },
    created_at: new Date().toISOString(),
  });

  return newGroup;
}

