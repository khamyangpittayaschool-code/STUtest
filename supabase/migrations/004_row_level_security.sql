-- ===================================================================
-- AI TRAINING MANAGEMENT, GAMIFICATION & ASSIGNMENT SYSTEM
-- Migration 004: Row Level Security (RLS) & Role-Based Policies
-- ===================================================================

-- 1. Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

-- 2. Enable RLS on all tables
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

-- -------------------------------------------------------------------
-- PROFILES POLICIES
-- -------------------------------------------------------------------
CREATE POLICY "Profiles can be read by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile upon registration"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Super Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

-- -------------------------------------------------------------------
-- GROUPS & MEMBERS POLICIES
-- -------------------------------------------------------------------
CREATE POLICY "Groups readable by authenticated"
ON public.groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members readable by authenticated"
ON public.group_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------
-- ACTIVITIES & POSTS POLICIES
-- -------------------------------------------------------------------
CREATE POLICY "Activities readable by authenticated"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage activities"
ON public.activities FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Posts readable by authenticated"
ON public.posts FOR SELECT
TO authenticated
USING (status = 'PUBLISHED' OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));

CREATE POLICY "Teachers and Admins can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'));

CREATE POLICY "Post attachments readable by authenticated"
ON public.post_attachments FOR SELECT
TO authenticated
USING (true);

-- -------------------------------------------------------------------
-- ASSIGNMENTS & SUBMISSIONS POLICIES (File Security)
-- -------------------------------------------------------------------
CREATE POLICY "Assignments readable by authenticated"
ON public.assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students see own submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER')
);

CREATE POLICY "Students can submit or draft their assignments"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own un-graded submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    (student_id = auth.uid() AND status IN ('DRAFT', 'SUBMITTED', 'RETURNED'))
    OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER')
);

CREATE POLICY "Submission versions viewable by owner or teachers"
ON public.submission_versions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id
        AND (s.student_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'))
    )
);

CREATE POLICY "Submission attachments viewable by owner or teachers"
ON public.submission_attachments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id
        AND (s.student_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('SUPER_ADMIN', 'TEACHER'))
    )
);

-- -------------------------------------------------------------------
-- ACTIVITY CODES & BATCHES (Zero-Trust)
-- Note: Students CANNOT read activity_codes directly! Must use RPC redeem_activity_code
-- -------------------------------------------------------------------
CREATE POLICY "Only Super Admins can see code batches"
ON public.code_batches FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Only Super Admins can view activity codes list"
ON public.activity_codes FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');

-- -------------------------------------------------------------------
-- SCORES & LEADERBOARDS (Read-Only to Users, Modified ONLY via RPC)
-- -------------------------------------------------------------------
CREATE POLICY "Everyone can see user scores leaderboard"
ON public.user_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Everyone can see group scores leaderboard"
ON public.group_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can see own score transactions"
ON public.score_transactions FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'SUPER_ADMIN'
);

-- -------------------------------------------------------------------
-- COMMENTS & REACTIONS
-- -------------------------------------------------------------------
CREATE POLICY "Comments readable by authenticated"
ON public.comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can post comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can manage own comments"
ON public.comments FOR DELETE
TO authenticated
USING (
    auth.uid() = author_id
    OR public.get_user_role(auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "Reactions readable and insertable by users"
ON public.reactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------------------
CREATE POLICY "Users can only read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- -------------------------------------------------------------------
-- AUDIT LOGS
-- -------------------------------------------------------------------
CREATE POLICY "Only Super Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'SUPER_ADMIN');
