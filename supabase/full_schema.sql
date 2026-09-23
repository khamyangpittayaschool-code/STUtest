-- ===================================================================
-- AI TRAINING MANAGEMENT, GAMIFICATION & ASSIGNMENT SYSTEM
-- CONSOLIDATED PRODUCTION DATABASE SCHEMA & PROCEDURES
-- Execute this script directly in Supabase SQL Editor
-- ===================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('SUPER_ADMIN', 'TEACHER', 'STUDENT')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    student_id VARCHAR(50),
    grade_level VARCHAR(50),
    room VARCHAR(50),
    academic_year VARCHAR(20),
    teacher_position VARCHAR(100),
    department VARCHAR(100),
    organization VARCHAR(255),
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISABLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'MEMBER')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_group UNIQUE (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    allow_submissions BOOLEAN NOT NULL DEFAULT TRUE,
    enable_scoring BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_type VARCHAR(30) NOT NULL DEFAULT 'ANNOUNCEMENT' CHECK (post_type IN ('ANNOUNCEMENT', 'ASSIGNMENT', 'MEDIA', 'DISCUSSION', 'ACTIVITY', 'DOCUMENT')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    allow_comment BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    start_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    allow_resubmission BOOLEAN NOT NULL DEFAULT TRUE,
    max_files INT NOT NULL DEFAULT 5,
    allow_text BOOLEAN NOT NULL DEFAULT TRUE,
    allow_image BOOLEAN NOT NULL DEFAULT TRUE,
    allow_video BOOLEAN NOT NULL DEFAULT TRUE,
    allow_document BOOLEAN NOT NULL DEFAULT TRUE,
    allow_link BOOLEAN NOT NULL DEFAULT TRUE,
    add_individual_score BOOLEAN NOT NULL DEFAULT TRUE,
    add_group_score BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    content TEXT,
    link_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'GRADED', 'RETURNED')),
    current_version INT NOT NULL DEFAULT 1,
    score NUMERIC(5,2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.submission_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    content TEXT,
    link_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_submission_version UNIQUE (submission_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.submission_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('HEART', 'LIKE', 'PARTY', 'IDEA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.code_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255) NOT NULL,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    code_length INT NOT NULL DEFAULT 5,
    points_per_code NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    character_set VARCHAR(100) NOT NULL DEFAULT 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'EXHAUSTED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.code_batches(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    points NUMERIC(8,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED')),
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.score_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('CODE', 'ASSIGNMENT', 'BONUS', 'ADMIN_ADJUSTMENT')),
    source_id UUID,
    points NUMERIC(8,2) NOT NULL,
    score_type VARCHAR(20) NOT NULL CHECK (score_type IN ('INDIVIDUAL', 'GROUP', 'BOTH')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_scores (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_points NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_scores (
    group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
    total_points NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_activity_codes_code ON public.activity_codes(code);
CREATE INDEX IF NOT EXISTS idx_activity_codes_batch ON public.activity_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_activity_codes_status ON public.activity_codes(status);
CREATE INDEX IF NOT EXISTS idx_activity_codes_activity ON public.activity_codes(activity_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_user ON public.score_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_group ON public.score_transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_activity ON public.score_transactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_rank ON public.user_scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_group_scores_rank ON public.group_scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_activity_pinned ON public.posts(activity_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 4. ATOMIC RPC PROCEDURES
CREATE OR REPLACE FUNCTION public.redeem_activity_code(
    p_code TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_code_record RECORD;
    v_activity_record RECORD;
    v_user_record RECORD;
    v_group_id UUID;
    v_prev_user_score NUMERIC(10,2) := 0.00;
    v_new_user_score NUMERIC(10,2) := 0.00;
    v_prev_group_score NUMERIC(10,2) := 0.00;
    v_new_group_score NUMERIC(10,2) := 0.00;
    v_clean_code TEXT;
BEGIN
    v_clean_code := UPPER(TRIM(p_code));

    IF LENGTH(v_clean_code) = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสกิจกรรม');
    END IF;

    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลผู้ใช้งาน');
    END IF;

    IF v_user_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
    END IF;

    -- Row Lock to prevent concurrent double-spending
    SELECT * INTO v_code_record
    FROM public.activity_codes
    WHERE code = v_clean_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรหัสนี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
    END IF;

    IF v_code_record.status = 'USED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'รหัสนี้ถูกใช้งานไปแล้ว');
    ELSIF v_code_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'รหัสนี้ไม่สามารถใช้งานได้ (หมดอายุหรือถูกปิด)');
    END IF;

    SELECT * INTO v_activity_record
    FROM public.activities
    WHERE id = v_code_record.activity_id;

    IF NOT FOUND OR v_activity_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'กิจกรรมนี้ปิดแล้วหรือไม่พร้อมรับรหัส');
    END IF;

    IF NOT v_activity_record.enable_scoring THEN
        RETURN jsonb_build_object('success', false, 'message', 'ระบบปิดรับคะแนนสำหรับกิจกรรมนี้ชั่วคราว');
    END IF;

    SELECT group_id INTO v_group_id
    FROM public.group_members
    WHERE user_id = p_user_id
    LIMIT 1;

    SELECT COALESCE(total_points, 0.00) INTO v_prev_user_score
    FROM public.user_scores
    WHERE user_id = p_user_id;

    v_new_user_score := v_prev_user_score + v_code_record.points;

    IF v_group_id IS NOT NULL THEN
        SELECT COALESCE(total_points, 0.00) INTO v_prev_group_score
        FROM public.group_scores
        WHERE group_id = v_group_id;

        v_new_group_score := v_prev_group_score + v_code_record.points;
    END IF;

    INSERT INTO public.score_transactions (
        user_id, group_id, activity_id, source_type, source_id, points, score_type, reason
    ) VALUES (
        p_user_id, v_group_id, v_code_record.activity_id, 'CODE', v_code_record.id, v_code_record.points,
        CASE WHEN v_group_id IS NOT NULL THEN 'BOTH' ELSE 'INDIVIDUAL' END,
        'กรอกรหัสรับคะแนน: ' || v_clean_code
    );

    INSERT INTO public.user_scores (user_id, total_points, activity_id, updated_at)
    VALUES (p_user_id, v_new_user_score, v_code_record.activity_id, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET total_points = EXCLUDED.total_points, updated_at = NOW();

    IF v_group_id IS NOT NULL THEN
        INSERT INTO public.group_scores (group_id, total_points, activity_id, updated_at)
        VALUES (v_group_id, v_new_group_score, v_code_record.activity_id, NOW())
        ON CONFLICT (group_id)
        DO UPDATE SET total_points = EXCLUDED.total_points, updated_at = NOW();
    END IF;

    UPDATE public.activity_codes
    SET status = 'USED', used_by = p_user_id, used_group_id = v_group_id, used_at = NOW()
    WHERE id = v_code_record.id;

    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'CODE_REDEEMED', 'activity_codes', v_code_record.id,
        jsonb_build_object('code', v_clean_code, 'points', v_code_record.points, 'group_id', v_group_id)
    );

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (p_user_id, '🎉 ได้รับคะแนนสำเร็จ!',
        'คุณได้รับ +' || v_code_record.points::TEXT || ' คะแนน จากการกรอกรหัส ' || v_clean_code, 'SCORE'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'ถูกต้อง! คุณได้รับ +' || v_code_record.points::TEXT || ' คะแนน',
        'points_added', v_code_record.points,
        'individual_score', jsonb_build_object('previous', v_prev_user_score, 'current', v_new_user_score),
        'group_score', jsonb_build_object('has_group', (v_group_id IS NOT NULL), 'previous', v_prev_group_score, 'current', v_new_group_score)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_bulk_codes(
    p_batch_id UUID,
    p_activity_id UUID,
    p_quantity INT,
    p_code_length INT DEFAULT 5,
    p_points NUMERIC DEFAULT 10.00
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_charset TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_charset_len INT := 32;
    v_generated_count INT := 0;
    v_attempts INT := 0;
    v_max_attempts INT := p_quantity * 5;
    v_code TEXT;
    v_i INT;
BEGIN
    WHILE v_generated_count < p_quantity AND v_attempts < v_max_attempts LOOP
        v_attempts := v_attempts + 1;
        v_code := '';

        FOR v_i IN 1..p_code_length LOOP
            v_code := v_code || SUBSTR(v_charset, FLOOR(RANDOM() * v_charset_len + 1)::INT, 1);
        END LOOP;

        BEGIN
            INSERT INTO public.activity_codes (batch_id, activity_id, code, points, status)
            VALUES (p_batch_id, p_activity_id, v_code, p_points, 'ACTIVE');
            v_generated_count := v_generated_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Skip collision
        END;
    END LOOP;

    RETURN v_generated_count;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles can be read by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile upon registration" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Groups readable by authenticated" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group members readable by authenticated" ON public.group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Activities readable by authenticated" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage activities" ON public.activities FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');
CREATE POLICY "Posts readable by authenticated" ON public.posts FOR SELECT TO authenticated USING (status = 'PUBLISHED' OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));
CREATE POLICY "Teachers and Admins can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));
CREATE POLICY "Post attachments readable by authenticated" ON public.post_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Assignments readable by authenticated" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students see own submissions" ON public.submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));
CREATE POLICY "Students can submit or draft assignments" ON public.submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update un-graded submissions" ON public.submissions FOR UPDATE TO authenticated USING ((student_id = auth.uid() AND status IN ('DRAFT', 'SUBMITTED', 'RETURNED')) OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));

CREATE POLICY "Only Super Admins can see code batches" ON public.code_batches FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');
CREATE POLICY "Only Super Admins can view activity codes list" ON public.activity_codes FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Everyone can see user scores leaderboard" ON public.user_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can see group scores leaderboard" ON public.group_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can see own score transactions" ON public.score_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Comments readable by authenticated" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can post comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.get_user_role(auth.uid()) = 'SUPER_ADMIN');
CREATE POLICY "Reactions readable and insertable by users" ON public.reactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Only Super Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

-- 6. INITIAL SEED DATA
INSERT INTO public.activities (
    id, title, description, cover_image_url, start_date, end_date, status, allow_submissions, enable_scoring
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'อบรมการประยุกต์ใช้ AI ในการเรียนรู้และการสร้างสรรค์',
    'กิจกรรมอบรมเชิงปฏิบัติการ การประยุกต์ใช้เทคโนโลยีปัญญาประดิษฐ์ (Generative AI: Gemini, ChatGPT, Claude และ NotebookLM)',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    '2026-09-26 08:30:00+07', '2026-09-26 16:30:00+07', 'ACTIVE', TRUE, TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.code_batches (
    id, batch_name, activity_id, quantity, code_length, points_per_code, character_set, status
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Gemini Challenge 01 (ชุดรหัสกิจกรรมรอบเช้า)',
    'a0000000-0000-0000-0000-000000000001',
    100, 5, 10.00, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.activity_codes (batch_id, activity_id, code, points, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'K7X2M', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Q9R4Z', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'VJ3P8', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'N6T8W', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'C4Y9K', 10.00, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;
