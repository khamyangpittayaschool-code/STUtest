import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var _pgliteDb: PGlite | undefined;
  // eslint-disable-next-line no-var
  var _pgliteInitPromise: Promise<PGlite> | undefined;
}

const DB_DIR = path.join(process.cwd(), 'data', 'pgdata');

async function initDb(): Promise<PGlite> {
  if (global._pgliteDb) {
    return global._pgliteDb;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new PGlite(DB_DIR);
  await db.waitReady;

  // Initialize all tables if not exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      username VARCHAR(100) UNIQUE,
      student_id VARCHAR(50),
      grade_level VARCHAR(50) DEFAULT 'ม.5',
      room VARCHAR(50) DEFAULT '1',
      academic_year VARCHAR(20) DEFAULT '2567',
      teacher_position VARCHAR(100),
      department VARCHAR(100),
      organization VARCHAR(255),
      avatar_url TEXT,
      password VARCHAR(255) DEFAULT '1234',
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cover_image_url TEXT,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      allow_submissions BOOLEAN NOT NULL DEFAULT TRUE,
      enable_scoring BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.code_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_name VARCHAR(255) NOT NULL,
      activity_id UUID,
      quantity INT NOT NULL DEFAULT 1,
      code_length INT NOT NULL DEFAULT 5,
      points_per_code NUMERIC(10,2) NOT NULL DEFAULT 10,
      character_set VARCHAR(100) DEFAULT 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.activity_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID,
      activity_id UUID,
      code VARCHAR(50) NOT NULL UNIQUE,
      points NUMERIC(10,2) NOT NULL DEFAULT 10,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      used_by UUID,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.user_scores (
      user_id UUID PRIMARY KEY,
      total_points NUMERIC(10,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_id UUID,
      author_id UUID,
      post_type VARCHAR(50) NOT NULL DEFAULT 'ANNOUNCEMENT',
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      allow_comment BOOLEAN NOT NULL DEFAULT TRUE,
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      author_name VARCHAR(255) DEFAULT 'ครูผู้สอน',
      author_role VARCHAR(255) DEFAULT 'ครูผู้สอน',
      reactions_count JSONB DEFAULT '{"heart":0,"like":0,"party":0,"idea":0}'::jsonb,
      image_url TEXT,
      link_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL,
      author_id UUID,
      author_name VARCHAR(255) DEFAULT 'ผู้ใช้งาน',
      author_role VARCHAR(255) DEFAULT 'นักเรียน',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      max_score INT NOT NULL DEFAULT 10,
      due_date TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      teacher_name VARCHAR(255) DEFAULT 'ครูผู้สอน',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID,
      assignment_title VARCHAR(255),
      student_id UUID,
      student_name VARCHAR(255) NOT NULL,
      student_code VARCHAR(50),
      classroom VARCHAR(50),
      content TEXT,
      link_url TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
      score NUMERIC(10,2),
      max_score NUMERIC(10,2) DEFAULT 10,
      feedback TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      graded_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100),
      details JSONB DEFAULT '{}'::jsonb,
      user_name VARCHAR(255) DEFAULT 'ระบบ',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Seed Default Teacher Profile
    INSERT INTO public.profiles (
      id, role, full_name, email, username, password, teacher_position, department, status, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'TEACHER',
      'ครูผู้สอน',
      'admin@school.ac.th',
      'admin',
      '1234',
      'ครูผู้สอน',
      'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
      'ACTIVE',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Seed Sample Activity
    INSERT INTO public.activities (
      id, title, description, cover_image_url, start_date, end_date, status, allow_submissions, enable_scoring
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'อบรมการประยุกต์ใช้ AI ในการเรียนรู้และการสร้างสรรค์',
      'กิจกรรมอบรมเชิงปฏิบัติการ การประยุกต์ใช้เทคโนโลยีปัญญาประดิษฐ์ (Generative AI: Gemini, ChatGPT, Claude และ NotebookLM) สำหรับโรงเรียน เพื่อเสริมทักษะในศตวรรษที่ 21',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      NOW(),
      NOW() + INTERVAL '30 days',
      'ACTIVE',
      TRUE,
      TRUE
    ) ON CONFLICT (id) DO NOTHING;

    -- Seed Sample Codes
    INSERT INTO public.code_batches (
      id, batch_name, activity_id, quantity, points_per_code, status
    ) VALUES (
      'b0000000-0000-0000-0000-000000000001',
      'Gemini Challenge 01 (ชุดรหัสกิจกรรมรอบเช้า)',
      'a0000000-0000-0000-0000-000000000001',
      5,
      10.00,
      'ACTIVE'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.activity_codes (batch_id, activity_id, code, points, status)
    VALUES
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'K7X2M', 10.00, 'ACTIVE'),
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Q9R4Z', 10.00, 'ACTIVE'),
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'VJ3P8', 10.00, 'ACTIVE'),
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'N6T8W', 10.00, 'ACTIVE'),
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'C4Y9K', 10.00, 'ACTIVE')
    ON CONFLICT (code) DO NOTHING;
  `);

  global._pgliteDb = db;
  return db;
}

export function getDbPromise(): Promise<PGlite> {
  if (!global._pgliteInitPromise) {
    global._pgliteInitPromise = initDb();
  }
  return global._pgliteInitPromise;
}

// Backwards-compatible pool object
export const pool = {
  query: (text: string, params?: any[]) => query(text, params),
};

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const db = await getDbPromise();
  const res = await db.query<T>(text, params);
  return {
    rows: (res.rows as T[]) || [],
    rowCount: res.rowCount ?? (res.affectedRows ?? res.rows?.length ?? 0),
  };
}
