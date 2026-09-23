-- ===================================================================
-- AI TRAINING MANAGEMENT, GAMIFICATION & ASSIGNMENT SYSTEM
-- Migration 002: Indexes & Performance Optimization (200+ CCU)
-- ===================================================================

-- Index for instant code lookup & redemption (Critical Path)
CREATE INDEX IF NOT EXISTS idx_activity_codes_code ON public.activity_codes(code);
CREATE INDEX IF NOT EXISTS idx_activity_codes_batch ON public.activity_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_activity_codes_status ON public.activity_codes(status);
CREATE INDEX IF NOT EXISTS idx_activity_codes_activity ON public.activity_codes(activity_id);

-- Indexes for Ledger & Score Transactions
CREATE INDEX IF NOT EXISTS idx_score_tx_user ON public.score_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_group ON public.score_transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_activity ON public.score_transactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_score_tx_source ON public.score_transactions(source_type, source_id);

-- Indexes for High-Speed Real-time Leaderboards
CREATE INDEX IF NOT EXISTS idx_user_scores_rank ON public.user_scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_group_scores_rank ON public.group_scores(total_points DESC);

-- Indexes for Groups & Memberships
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

-- Indexes for Posts & Social Feed
CREATE INDEX IF NOT EXISTS idx_posts_activity_pinned ON public.posts(activity_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_attachments_post ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);

-- Indexes for Assignments & Submissions
CREATE INDEX IF NOT EXISTS idx_assignments_activity ON public.assignments(activity_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_sub ON public.submission_attachments(submission_id);

-- Indexes for Notifications & Audit Logs
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
