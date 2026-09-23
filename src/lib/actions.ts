'use server';

import { query, pool } from './db';
import {
  FeedPost,
  FeedComment,
  AssignmentItem,
  SubmissionItem,
} from './data-store';
import {
  Profile,
  ActivityCode,
  UserScoreLeaderboard,
  CodeRedemptionResult,
  StudentManagementItem,
  CsvImportResult
} from '../types/database';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Posts & Comments Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getPostsAction(): Promise<FeedPost[]> {
  try {
    const postsRes = await query(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.post_type,
        COALESCE(p.author_name, pr.full_name, 'ครูผู้สอน') as author_name,
        COALESCE(p.author_role, pr.role, 'ครูผู้สอน') as author_role,
        p.is_pinned,
        p.allow_comment,
        p.reactions_count,
        p.created_at
      FROM public.posts p
      LEFT JOIN public.profiles pr ON p.author_id = pr.id
      WHERE p.status != 'ARCHIVED'
      ORDER BY p.is_pinned DESC, p.created_at DESC;
    `);

    const commentsRes = await query(`
      SELECT 
        c.id,
        c.post_id,
        COALESCE(c.author_name, pr.full_name, 'ผู้ใช้งาน') as author_name,
        COALESCE(c.author_role, pr.role, 'นักเรียน') as author_role,
        c.content,
        c.created_at
      FROM public.comments c
      LEFT JOIN public.profiles pr ON c.author_id = pr.id
      ORDER BY c.created_at ASC;
    `);

    const commentsByPost: Record<string, FeedComment[]> = {};
    for (const c of commentsRes.rows) {
      if (!commentsByPost[c.post_id]) {
        commentsByPost[c.post_id] = [];
      }
      commentsByPost[c.post_id].push({
        id: c.id,
        post_id: c.post_id,
        author_name: c.author_name,
        author_role: c.author_role,
        content: c.content,
        created_at: formatThaiDate(c.created_at),
      });
    }

    return postsRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      post_type: (row.post_type || 'ANNOUNCEMENT') as FeedPost['post_type'],
      author_name: row.author_name,
      author_role: row.author_role,
      is_pinned: Boolean(row.is_pinned),
      allow_comment: Boolean(row.allow_comment),
      created_at: formatThaiDate(row.created_at),
      reactions: row.reactions_count || { heart: 0, like: 0, party: 0, idea: 0 },
      comments: commentsByPost[row.id] || [],
    }));
  } catch (error) {
    console.error('getPostsAction error:', error);
    return [];
  }
}

export async function createPostAction(data: {
  title: string;
  content: string;
  isPinned?: boolean;
  allowComment?: boolean;
  authorName?: string;
  authorRole?: string;
  postType?: string;
  authorId?: string;
}): Promise<FeedPost | null> {
  try {
    const res = await query(
      `
      INSERT INTO public.posts (
        title, content, is_pinned, allow_comment, author_name, author_role, post_type, author_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', NOW(), NOW())
      RETURNING *;
      `,
      [
        data.title,
        data.content,
        data.isPinned ?? false,
        data.allowComment ?? true,
        data.authorName ?? 'ครูผู้สอน',
        data.authorRole ?? 'ครูผู้สอน',
        data.postType ?? 'ANNOUNCEMENT',
        data.authorId || null,
      ]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      post_type: row.post_type,
      author_name: row.author_name,
      author_role: row.author_role,
      is_pinned: row.is_pinned,
      allow_comment: row.allow_comment,
      created_at: 'เมื่อสักครู่',
      reactions: row.reactions_count || { heart: 0, like: 0, party: 0, idea: 0 },
      comments: [],
    };
  } catch (error) {
    console.error('createPostAction error:', error);
    return null;
  }
}

export async function updatePostAction(
  id: string,
  data: {
    title?: string;
    content?: string;
    is_pinned?: boolean;
    allow_comment?: boolean;
  }
): Promise<boolean> {
  try {
    await query(
      `
      UPDATE public.posts
      SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        is_pinned = COALESCE($3, is_pinned),
        allow_comment = COALESCE($4, allow_comment),
        updated_at = NOW()
      WHERE id = $5;
      `,
      [data.title, data.content, data.is_pinned, data.allow_comment, id]
    );
    return true;
  } catch (error) {
    console.error('updatePostAction error:', error);
    return false;
  }
}

export async function deletePostAction(id: string): Promise<boolean> {
  try {
    await query(`DELETE FROM public.comments WHERE post_id = $1;`, [id]);
    await query(`DELETE FROM public.posts WHERE id = $1;`, [id]);
    return true;
  } catch (error) {
    console.error('deletePostAction error:', error);
    return false;
  }
}

export async function addCommentAction(data: {
  postId: string;
  content: string;
  authorName?: string;
  authorRole?: string;
  authorId?: string;
}): Promise<FeedComment | null> {
  try {
    const res = await query(
      `
      INSERT INTO public.comments (post_id, content, author_name, author_role, author_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *;
      `,
      [
        data.postId,
        data.content,
        data.authorName || 'ผู้ใช้งาน',
        data.authorRole || 'นักเรียน',
        data.authorId || null,
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      post_id: row.post_id,
      author_name: row.author_name,
      author_role: row.author_role,
      content: row.content,
      created_at: 'เมื่อสักครู่',
    };
  } catch (error) {
    console.error('addCommentAction error:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Assignments & Submissions Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getAssignmentsAction(studentId?: string): Promise<AssignmentItem[]> {
  try {
    const res = await query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.max_score,
        a.due_date,
        a.status,
        a.teacher_name,
        a.created_at
      FROM public.assignments a
      ORDER BY a.created_at DESC;
    `);

    // If studentId provided, check submissions
    let studentSubs: Record<string, any> = {};
    if (studentId) {
      const subRes = await query(
        `SELECT * FROM public.submissions WHERE student_id = $1;`,
        [studentId]
      );
      for (const s of subRes.rows) {
        studentSubs[s.assignment_id] = s;
      }
    }

    return res.rows.map((row) => {
      const sub = studentSubs[row.id];
      return {
        id: row.id,
        title: row.title || 'ไม่มีชื่อหัวข้องาน',
        description: row.description || '',
        max_score: Number(row.max_score || 20),
        due_date: row.due_date || 'ไม่ระบุกำหนดส่ง',
        status: (row.status || 'ACTIVE') as AssignmentItem['status'],
        created_at: formatThaiDate(row.created_at),
        teacher_name: row.teacher_name || 'ครูผู้สอน',
        submitted: Boolean(sub && sub.status !== 'DRAFT'),
        submission_status: sub ? sub.status : undefined,
        score: sub?.score != null ? Number(sub.score) : undefined,
        feedback: sub?.feedback || undefined,
        submitted_at: sub?.submitted_at ? formatThaiDate(sub.submitted_at) : undefined,
      };
    });
  } catch (error) {
    console.error('getAssignmentsAction error:', error);
    return [];
  }
}

export async function createAssignmentAction(data: {
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  teacherName?: string;
}): Promise<AssignmentItem | null> {
  try {
    const res = await query(
      `
      INSERT INTO public.assignments (
        title, description, max_score, due_date, teacher_name, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
      RETURNING *;
      `,
      [
        data.title,
        data.description,
        data.maxScore || 20,
        data.dueDate,
        data.teacherName || 'ครูผู้สอน',
      ]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      max_score: Number(row.max_score),
      due_date: row.due_date,
      status: row.status,
      created_at: 'เมื่อสักครู่',
      teacher_name: row.teacher_name,
      submitted: false,
    };
  } catch (error) {
    console.error('createAssignmentAction error:', error);
    return null;
  }
}

export async function submitAssignmentAction(data: {
  assignmentId: string;
  studentId?: string;
  studentName: string;
  classroom: string;
  content: string;
  linkUrl: string;
  maxScore?: number;
  isDraft?: boolean;
}): Promise<boolean> {
  try {
    const status = data.isDraft ? 'DRAFT' : 'SUBMITTED';

    // Check if student profile exists, otherwise fallback
    let stuId = data.studentId;
    if (stuId) {
      const checkProfile = await query(`SELECT id FROM public.profiles WHERE id = $1`, [stuId]);
      if (checkProfile.rowCount === 0) {
        stuId = undefined;
      }
    }

    await query(
      `
      INSERT INTO public.submissions (
        assignment_id, student_id, student_name, classroom, content, link_url, status, max_score, submitted_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
      `,
      [
        data.assignmentId,
        stuId || null,
        data.studentName,
        data.classroom,
        data.content,
        data.linkUrl,
        status,
        data.maxScore || 20,
      ]
    );
    return true;
  } catch (error) {
    console.error('submitAssignmentAction error:', error);
    return false;
  }
}

export async function getSubmissionsAction(): Promise<SubmissionItem[]> {
  try {
    const res = await query(`
      SELECT 
        s.id,
        s.assignment_id,
        COALESCE(s.student_name, pr.full_name, 'นักเรียน') as student_name,
        COALESCE(pr.student_id, '-') as student_code,
        COALESCE(s.classroom, CONCAT('ม.', pr.grade_level, '/', pr.room), 'ม.5/1') as classroom,
        s.submitted_at,
        s.status,
        s.score,
        COALESCE(s.max_score, a.max_score, 20) as max_score,
        s.feedback,
        s.content,
        s.link_url,
        a.title as assignment_title
      FROM public.submissions s
      LEFT JOIN public.assignments a ON s.assignment_id = a.id
      LEFT JOIN public.profiles pr ON s.student_id = pr.id
      ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC;
    `);

    return res.rows.map((row) => ({
      id: row.id,
      assignmentId: row.assignment_id,
      studentName: row.student_name,
      studentId: row.student_code,
      classroom: row.classroom,
      submittedAt: formatThaiDate(row.submitted_at),
      status: row.status as 'SUBMITTED' | 'GRADED',
      score: row.score !== null ? Number(row.score) : undefined,
      maxScore: Number(row.max_score),
      feedback: row.feedback || '',
      content: row.content || '',
      linkUrl: row.link_url || '',
      files: [],
    }));
  } catch (error) {
    console.error('getSubmissionsAction error:', error);
    return [];
  }
}

export async function gradeSubmissionAction(data: {
  submissionId: string;
  score: number;
  feedback: string;
}): Promise<boolean> {
  try {
    const res = await query(
      `
      UPDATE public.submissions
      SET 
        score = $1,
        feedback = $2,
        status = 'GRADED',
        graded_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING student_id, student_name;
      `,
      [data.score, data.feedback, data.submissionId]
    );

    if (res.rowCount && res.rows[0].student_id) {
      const studentId = res.rows[0].student_id;
      // Add score to user_scores
      await query(
        `
        INSERT INTO public.user_scores (user_id, total_points, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET total_points = public.user_scores.total_points + EXCLUDED.total_points, updated_at = NOW();
        `,
        [studentId, data.score]
      );
    }
    return true;
  } catch (error) {
    console.error('gradeSubmissionAction error:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Single Code Generator & Redemption
// ─────────────────────────────────────────────────────────────────────────────

export async function generateSingleCodeAction(
  points: number = 10,
  batchName: string = 'สุ่มรหัสสดหน้าชั้นเรียน'
): Promise<ActivityCode | null> {
  try {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let j = 0; j < 5; j++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const res = await query(
      `
      INSERT INTO public.activity_codes (code, points, status, created_at)
      VALUES ($1, $2, 'ACTIVE', NOW())
      RETURNING *;
      `,
      [code, points]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      batch_id: row.batch_id,
      activity_id: row.activity_id,
      code: row.code,
      points: Number(row.points),
      status: row.status,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error('generateSingleCodeAction error:', error);
    return null;
  }
}

export async function getAllCodesAction(): Promise<ActivityCode[]> {
  try {
    const res = await query(`
      SELECT * FROM public.activity_codes 
      WHERE status = 'ACTIVE' 
      ORDER BY created_at DESC;
    `);

    return res.rows.map((r) => ({
      id: r.id,
      batch_id: r.batch_id,
      activity_id: r.activity_id,
      code: r.code,
      points: Number(r.points),
      status: r.status,
      created_at: r.created_at,
    }));
  } catch (error) {
    console.error('getAllCodesAction error:', error);
    return [];
  }
}

export async function deleteCodeAction(id: string): Promise<boolean> {
  try {
    await query(`DELETE FROM public.activity_codes WHERE id = $1;`, [id]);
    return true;
  } catch (error) {
    console.error('deleteCodeAction error:', error);
    return false;
  }
}

export async function redeemCodeAction(
  code: string,
  userId?: string,
  username?: string
): Promise<CodeRedemptionResult> {
  try {
    const cleanCode = code.trim().toUpperCase();

    // 1. ตรวจสอบรหัสในฐานข้อมูล Supabase
    const codeRes = await query(
      `SELECT * FROM public.activity_codes WHERE code = $1 AND status = 'ACTIVE' LIMIT 1;`,
      [cleanCode]
    );

    if (codeRes.rowCount === 0) {
      return {
        success: false,
        message: '⚠️ ไม่พบรหัสนี้ในระบบ หรือ รหัสถูกใช้งานไปแล้ว',
      };
    }

    const targetCode = codeRes.rows[0];
    const pointsToAdd = Number(targetCode.points);

    // 2. ลบรหัสออกจากฐานข้อมูลทันทีตามเงื่อนไข ป้องกันการใช้ซ้ำ
    await query(`DELETE FROM public.activity_codes WHERE id = $1;`, [targetCode.id]);

    // 3. ค้นหานักเรียนที่ถูกต้องเพื่อเพิ่มคะแนน
    let targetStudentId: string | null = null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');

    if (isUUID) {
      const p = await query(`SELECT id FROM public.profiles WHERE id = $1`, [userId]);
      if (p.rowCount && p.rowCount > 0) targetStudentId = p.rows[0].id;
    }

    if (!targetStudentId && username) {
      const p = await query(
        `SELECT id FROM public.profiles WHERE (LOWER(username) = LOWER($1) OR student_id = $1 OR full_name ILIKE $2) LIMIT 1`,
        [username.trim(), `%${username.trim()}%`]
      );
      if (p.rowCount && p.rowCount > 0) targetStudentId = p.rows[0].id;
    }

    if (!targetStudentId && userId && !isUUID && userId !== 'u-guest') {
      const p = await query(
        `SELECT id FROM public.profiles WHERE (LOWER(username) = LOWER($1) OR student_id = $1 OR full_name ILIKE $2) LIMIT 1`,
        [userId.trim(), `%${userId.trim()}%`]
      );
      if (p.rowCount && p.rowCount > 0) targetStudentId = p.rows[0].id;
    }

    if (!targetStudentId) {
      const p = await query(`SELECT id FROM public.profiles WHERE role = 'STUDENT' ORDER BY updated_at DESC, created_at DESC LIMIT 1`);
      if (p.rowCount && p.rowCount > 0) targetStudentId = p.rows[0].id;
    }

    // 4. บันทึกและเพิ่มคะแนนลง user_scores ใน Supabase พร้อมคำนวณคะแนนก่อน-หลัง
    let prevScore = 0;
    let newScore = pointsToAdd;

    if (targetStudentId) {
      const currentScoreRes = await query(
        `SELECT total_points FROM public.user_scores WHERE user_id = $1;`,
        [targetStudentId]
      );
      if (currentScoreRes.rowCount && currentScoreRes.rowCount > 0) {
        prevScore = Number(currentScoreRes.rows[0].total_points);
      }

      const scoreRes = await query(
        `
        INSERT INTO public.user_scores (user_id, total_points, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET total_points = public.user_scores.total_points + EXCLUDED.total_points, updated_at = NOW()
        RETURNING total_points;
        `,
        [targetStudentId, pointsToAdd]
      );

      if (scoreRes.rowCount && scoreRes.rowCount > 0) {
        newScore = Number(scoreRes.rows[0].total_points);
      } else {
        newScore = prevScore + pointsToAdd;
      }
    }

    return {
      success: true,
      message: `🎉 ถูกต้อง! คุณได้รับ +${pointsToAdd} คะแนน (รหัสถูกลบออกจากระบบแล้ว)`,
      points_added: pointsToAdd,
      individual_score: {
        previous: prevScore,
        current: newScore,
      },
    };
  } catch (error) {
    console.error('redeemCodeAction error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Profiles, Auth & Leaderboard
// ─────────────────────────────────────────────────────────────────────────────

export async function registerStudentAction(data: {
  fullName: string;
  studentId?: string;
  gradeLevel: string;
  room: string;
  username: string;
}): Promise<Profile | null> {
  try {
    const cleanUsername = data.username.trim();
    const cleanName = data.fullName.trim();
    const studentCode = data.studentId?.trim() || `${Date.now()}`.slice(-6);

    // 1. ตรวจสอบว่ามีชื่อผู้ใช้นี้อยู่แล้วหรือไม่
    const existing = await query(
      `SELECT * FROM public.profiles WHERE LOWER(username) = LOWER($1) LIMIT 1;`,
      [cleanUsername]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const existingUser = existing.rows[0];
      // อัปเดตข้อมูลให้ทันสมัย แล้วนำโปรไฟล์นั้นเข้าสู่ระบบทันที
      const updated = await query(
        `
        UPDATE public.profiles
        SET full_name = $1, grade_level = $2, room = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *;
        `,
        [cleanName, data.gradeLevel, data.room, existingUser.id]
      );
      return updated.rows[0] || existingUser;
    }

    // 2. ถ้าเป็นชื่อผู้ใช้ใหม่ ให้สร้างบัญชีใหม่
    const res = await query(
      `
      INSERT INTO public.profiles (
        role, full_name, username, student_id, grade_level, room, status, created_at, updated_at
      ) VALUES ('STUDENT', $1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
      RETURNING *;
      `,
      [
        cleanName,
        cleanUsername,
        studentCode,
        data.gradeLevel,
        data.room,
      ]
    );

    const profile = res.rows[0];

    // Initialize 0 score in user_scores
    await query(
      `
      INSERT INTO public.user_scores (user_id, total_points, updated_at)
      VALUES ($1, 0, NOW())
      ON CONFLICT (user_id) DO NOTHING;
      `,
      [profile.id]
    );

    return profile;
  } catch (error) {
    console.error('registerStudentAction error:', error);
    return null;
  }
}

export async function loginStudentAction(username: string, password?: string): Promise<Profile | null> {
  try {
    const q = username.trim();
    const res = await query(
      `SELECT * FROM public.profiles 
       WHERE role = 'STUDENT' 
         AND (LOWER(username) = LOWER($1) OR student_id = $1 OR full_name ILIKE $2) 
       LIMIT 1;`,
      [q, `%${q}%`]
    );
    if (res.rowCount === 0) return null;
    const user = res.rows[0];

    // ตรวจสอบรหัสผ่าน (หากมีรหัสผ่านส่งมา และในบัญชีกำหนดรหัสเฉพาะไว้)
    if (password && user.password && user.password !== '1234') {
      if (password.trim() !== user.password.trim()) {
        return null;
      }
    }

    // บันทึกเวลาเข้าสู่ระบบล่าสุด (Login Tracking)
    await query(
      `UPDATE public.profiles SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1;`,
      [user.id]
    ).catch(() => {});

    // บันทึก Audit Log การเข้าสู่ระบบ
    await query(
      `INSERT INTO public.audit_logs (user_id, action, entity_type, details, created_at)
       VALUES ($1, 'USER_LOGIN', 'profiles', $2, NOW());`,
      [user.id, JSON.stringify({ username: user.username, full_name: user.full_name })]
    ).catch(() => {});

    return user;
  } catch (error) {
    console.error('loginStudentAction error:', error);
    return null;
  }
}

export async function getStudentsListAction(): Promise<StudentManagementItem[]> {
  try {
    const res = await query(`
      SELECT 
        p.id,
        COALESCE(p.username, '') as username,
        COALESCE(p.student_id, '') as student_id,
        COALESCE(p.full_name, 'นักเรียน') as full_name,
        COALESCE(p.grade_level, 'ม.5') as grade_level,
        COALESCE(p.room, '1') as room,
        COALESCE(p.status, 'ACTIVE') as status,
        COALESCE(p.password, '1234') as password,
        p.last_login_at,
        p.created_at,
        COALESCE(us.total_points, 0) as total_points
      FROM public.profiles p
      LEFT JOIN public.user_scores us ON p.id = us.user_id
      WHERE p.role = 'STUDENT'
      ORDER BY p.created_at DESC;
    `);

    return res.rows.map(r => ({
      id: r.id,
      username: r.username,
      student_id: r.student_id,
      full_name: r.full_name,
      grade_level: r.grade_level,
      room: r.room,
      status: r.status,
      password: r.password,
      last_login_at: r.last_login_at ? formatThaiDate(r.last_login_at) : null,
      created_at: formatThaiDate(r.created_at),
      total_points: Number(r.total_points || 0),
    }));
  } catch (error) {
    console.error('getStudentsListAction error:', error);
    return [];
  }
}

export async function importStudentsCsvAction(
  students: Array<{
    username: string;
    password?: string;
    full_name: string;
    student_id?: string;
    grade_level?: string;
    room?: string;
  }>
): Promise<CsvImportResult> {
  const result: CsvImportResult = {
    success: true,
    message: '',
    total_rows: students.length,
    inserted_count: 0,
    skipped_count: 0,
    duplicates: [],
    errors: [],
  };

  try {
    // ดึง username และ student_id ที่มีอยู่แล้วในระบบทั้งหมดมาตรวจสอบความซ้ำซ้อน
    const existingRes = await query(`SELECT LOWER(username) as username, student_id FROM public.profiles WHERE role = 'STUDENT';`);
    const existingUsernames = new Set(existingRes.rows.map(r => r.username?.toLowerCase().trim()).filter(Boolean));
    const existingStudentIds = new Set(existingRes.rows.map(r => r.student_id?.trim()).filter(Boolean));

    const seenInBatch = new Set<string>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const cleanUsername = (s.username || s.student_id || '').trim();
      const cleanStudentId = (s.student_id || s.username || '').trim();
      const cleanName = (s.full_name || '').trim();
      const cleanPassword = (s.password || '1234').trim();
      const grade = (s.grade_level || 'ม.5').trim();
      const room = (s.room || '1').trim();

      if (!cleanUsername && !cleanName) {
        continue;
      }

      if (!cleanName) {
        result.errors.push(`แถวที่ ${i + 1}: ขาดชื่อ-นามสกุล`);
        result.skipped_count++;
        continue;
      }

      const lowerUser = cleanUsername.toLowerCase();

      // ตรวจสอบความซ้ำซ้อน ทั้งในฐานข้อมูล และในไฟล์ชุดเดียวกัน
      if (
        (lowerUser && existingUsernames.has(lowerUser)) ||
        (cleanStudentId && existingStudentIds.has(cleanStudentId)) ||
        seenInBatch.has(lowerUser)
      ) {
        result.duplicates.push(`${cleanUsername} (${cleanName})`);
        result.skipped_count++;
        continue;
      }

      seenInBatch.add(lowerUser);

      // บันทึกลงฐานข้อมูล Supabase
      const insertRes = await query(
        `
        INSERT INTO public.profiles (
          role, full_name, username, student_id, password, grade_level, room, status, created_at, updated_at
        ) VALUES ('STUDENT', $1, $2, $3, $4, $5, $6, 'ACTIVE', NOW(), NOW())
        RETURNING id;
        `,
        [
          cleanName,
          cleanUsername,
          cleanStudentId,
          cleanPassword,
          grade,
          room,
        ]
      );

      if (insertRes.rowCount && insertRes.rowCount > 0) {
        const newId = insertRes.rows[0].id;
        // กำหนดคะแนนเริ่มต้น 0
        await query(
          `INSERT INTO public.user_scores (user_id, total_points, updated_at) VALUES ($1, 0, NOW()) ON CONFLICT (user_id) DO NOTHING;`,
          [newId]
        );
        result.inserted_count++;
        existingUsernames.add(lowerUser);
        if (cleanStudentId) existingStudentIds.add(cleanStudentId);
      }
    }

    // บันทึก audit log
    await query(
      `
      INSERT INTO public.audit_logs (action, entity_type, details, created_at)
      VALUES ('STUDENTS_CSV_IMPORTED', 'profiles', $1, NOW())
      `,
      [
        JSON.stringify({
          total_rows: result.total_rows,
          inserted: result.inserted_count,
          skipped: result.skipped_count,
        })
      ]
    ).catch(() => {});

    result.success = true;
    result.message = `นำเข้าสำเร็จ ${result.inserted_count} บัญชี (ข้ามรายการซ้ำหรือไม่สมบูรณ์ ${result.skipped_count} รายการ)`;
    return result;
  } catch (error) {
    console.error('importStudentsCsvAction error:', error);
    result.success = false;
    result.message = 'เกิดข้อผิดพลาดในการนำเข้าข้อมูลลงฐานข้อมูล';
    return result;
  }
}

export async function deleteStudentAction(id: string): Promise<boolean> {
  try {
    await query(`DELETE FROM public.user_scores WHERE user_id = $1;`, [id]);
    await query(`DELETE FROM public.profiles WHERE id = $1 AND role = 'STUDENT';`, [id]);
    return true;
  } catch (error) {
    console.error('deleteStudentAction error:', error);
    return false;
  }
}

export async function getLeaderboardAction(): Promise<UserScoreLeaderboard[]> {
  try {
    const res = await query(`
      SELECT 
        p.id as user_id,
        p.full_name,
        p.student_id,
        CONCAT('ม.', REPLACE(COALESCE(p.grade_level, '5'), 'ม.', ''), '/', COALESCE(p.room, '1')) as group_name,
        COALESCE(us.total_points, 0) as total_points
      FROM public.profiles p
      LEFT JOIN public.user_scores us ON p.id = us.user_id
      WHERE p.role = 'STUDENT'
      ORDER BY total_points DESC, p.created_at ASC;
    `);

    return res.rows.map((row, index) => ({
      user_id: row.user_id,
      full_name: row.full_name,
      student_id: row.student_id,
      group_name: row.group_name,
      total_points: Number(row.total_points),
      rank: index + 1,
    }));
  } catch (error) {
    console.error('getLeaderboardAction error:', error);
    return [];
  }
}

export async function getStudentDashboardAction(userId?: string, username?: string): Promise<{
  profile: Profile;
  individualScore: number;
  userRank: string;
}> {
  try {
    let profile: Profile | null = null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');

    if (isUUID) {
      const pRes = await query(`SELECT * FROM public.profiles WHERE id = $1;`, [userId]);
      if (pRes.rowCount && pRes.rowCount > 0) profile = pRes.rows[0];
    }

    if (!profile && username) {
      const pRes = await query(
        `SELECT * FROM public.profiles WHERE (LOWER(username) = LOWER($1) OR student_id = $1 OR full_name ILIKE $2) LIMIT 1;`,
        [username.trim(), `%${username.trim()}%`]
      );
      if (pRes.rowCount && pRes.rowCount > 0) profile = pRes.rows[0];
    }

    if (!profile && userId && !isUUID && userId !== 'u-guest') {
      const pRes = await query(
        `SELECT * FROM public.profiles WHERE (LOWER(username) = LOWER($1) OR student_id = $1 OR full_name ILIKE $2) LIMIT 1;`,
        [userId.trim(), `%${userId.trim()}%`]
      );
      if (pRes.rowCount && pRes.rowCount > 0) profile = pRes.rows[0];
    }

    if (!profile) {
      // Pick newest student consistently
      const firstRes = await query(`SELECT * FROM public.profiles WHERE role = 'STUDENT' ORDER BY updated_at DESC, created_at DESC LIMIT 1;`);
      if (firstRes.rowCount && firstRes.rowCount > 0) profile = firstRes.rows[0];
    }

    if (!profile) {
      profile = {
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

    // Get score
    const scoreRes = await query(
      `SELECT total_points FROM public.user_scores WHERE user_id = $1;`,
      [profile.id]
    );
    const individualScore = scoreRes.rowCount && scoreRes.rowCount > 0 ? Number(scoreRes.rows[0].total_points) : 0;

    // Get rank
    const rankRes = await query(`
      SELECT user_id, total_points 
      FROM public.user_scores 
      ORDER BY total_points DESC;
    `);
    const allScores = rankRes.rows.map((r) => Number(r.total_points));
    const userRankIndex = allScores.indexOf(individualScore);
    const userRank = userRankIndex >= 0 && individualScore > 0 ? `#${userRankIndex + 1}` : '-';

    return {
      profile,
      individualScore,
      userRank,
    };
  } catch (error) {
    console.error('getStudentDashboardAction error:', error);
    return {
      profile: {
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
      },
      individualScore: 0,
      userRank: '-',
    };
  }
}

export async function getSystemOverviewAction() {
  try {
    const profRes = await query(`SELECT role FROM public.profiles;`);
    const students = profRes.rows.filter((r) => r.role === 'STUDENT').length;
    const teachers = profRes.rows.filter((r) => r.role === 'TEACHER' || r.role === 'SUPER_ADMIN').length;

    const codesRes = await query(`SELECT status FROM public.activity_codes;`);
    const totalCodes = codesRes.rows.length;
    const activeCodes = codesRes.rows.filter((c) => c.status === 'ACTIVE').length;
    const usedCodes = codesRes.rows.filter((c) => c.status === 'USED').length;

    const scoresRes = await query(`SELECT SUM(total_points) as total FROM public.user_scores;`);
    const totalPointsGiven = scoresRes.rows[0]?.total ? Number(scoresRes.rows[0].total) : 0;

    return {
      totalMembers: profRes.rows.length,
      studentsCount: students,
      teachersCount: teachers,
      totalCodes,
      usedCodes,
      remainingCodes: activeCodes,
      totalPointsGiven,
    };
  } catch (error) {
    console.error('getSystemOverviewAction error:', error);
    return {
      totalMembers: 0,
      studentsCount: 0,
      teachersCount: 0,
      totalCodes: 0,
      usedCodes: 0,
      remainingCodes: 0,
      totalPointsGiven: 0,
    };
  }
}

function formatThaiDate(d: any): string {
  if (!d) return 'เมื่อสักครู่';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  } catch {
    return 'เมื่อสักครู่';
  }
}
