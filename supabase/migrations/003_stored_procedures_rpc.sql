-- ===================================================================
-- AI TRAINING MANAGEMENT, GAMIFICATION & ASSIGNMENT SYSTEM
-- Migration 003: Stored Procedures & Atomic RPC Functions
-- ===================================================================

-- 1. Atomic Code Redemption (Prevents Race Conditions & Double-Spending)
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
    -- 1. Format and sanitize code (trim and uppercase)
    v_clean_code := UPPER(TRIM(p_code));

    IF LENGTH(v_clean_code) = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสกิจกรรม');
    END IF;

    -- 2. Verify User Status
    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลผู้ใช้งาน');
    END IF;

    IF v_user_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
    END IF;

    -- 3. Lock Code Row for Concurrency Protection (SELECT ... FOR UPDATE)
    SELECT * INTO v_code_record
    FROM public.activity_codes
    WHERE code = v_clean_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบรหัสนี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
    END IF;

    -- 4. Check Code Status
    IF v_code_record.status = 'USED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'รหัสนี้ถูกใช้งานไปแล้ว');
    ELSIF v_code_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'รหัสนี้ไม่สามารถใช้งานได้ (หมดอายุหรือถูกปิด)');
    END IF;

    -- 5. Verify Activity Status
    SELECT * INTO v_activity_record
    FROM public.activities
    WHERE id = v_code_record.activity_id;

    IF NOT FOUND OR v_activity_record.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'message', 'กิจกรรมนี้ปิดแล้วหรือไม่พร้อมรับรหัส');
    END IF;

    IF NOT v_activity_record.enable_scoring THEN
        RETURN jsonb_build_object('success', false, 'message', 'ระบบปิดรับคะแนนสำหรับกิจกรรมนี้ชั่วคราว');
    END IF;

    -- 6. Check if User belongs to a Group
    SELECT group_id INTO v_group_id
    FROM public.group_members
    WHERE user_id = p_user_id
    LIMIT 1;

    -- 7. Fetch Previous User Score
    SELECT COALESCE(total_points, 0.00) INTO v_prev_user_score
    FROM public.user_scores
    WHERE user_id = p_user_id;

    v_new_user_score := v_prev_user_score + v_code_record.points;

    -- 8. Fetch Previous Group Score (if any)
    IF v_group_id IS NOT NULL THEN
        SELECT COALESCE(total_points, 0.00) INTO v_prev_group_score
        FROM public.group_scores
        WHERE group_id = v_group_id;

        v_new_group_score := v_prev_group_score + v_code_record.points;
    END IF;

    -- 9. Insert Score Transaction (Ledger)
    INSERT INTO public.score_transactions (
        user_id,
        group_id,
        activity_id,
        source_type,
        source_id,
        points,
        score_type,
        reason
    ) VALUES (
        p_user_id,
        v_group_id,
        v_code_record.activity_id,
        'CODE',
        v_code_record.id,
        v_code_record.points,
        CASE WHEN v_group_id IS NOT NULL THEN 'BOTH' ELSE 'INDIVIDUAL' END,
        'กรอกรหัสรับคะแนน: ' || v_clean_code
    );

    -- 10. Upsert User Scores
    INSERT INTO public.user_scores (user_id, total_points, activity_id, updated_at)
    VALUES (p_user_id, v_new_user_score, v_code_record.activity_id, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET total_points = EXCLUDED.total_points, updated_at = NOW();

    -- 11. Upsert Group Scores (if group exists)
    IF v_group_id IS NOT NULL THEN
        INSERT INTO public.group_scores (group_id, total_points, activity_id, updated_at)
        VALUES (v_group_id, v_new_group_score, v_code_record.activity_id, NOW())
        ON CONFLICT (group_id)
        DO UPDATE SET total_points = EXCLUDED.total_points, updated_at = NOW();
    END IF;

    -- 12. Mark Code as USED
    UPDATE public.activity_codes
    SET status = 'USED',
        used_by = p_user_id,
        used_group_id = v_group_id,
        used_at = NOW()
    WHERE id = v_code_record.id;

    -- 13. Write Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_user_id,
        'CODE_REDEEMED',
        'activity_codes',
        v_code_record.id,
        jsonb_build_object(
            'code', v_clean_code,
            'points', v_code_record.points,
            'group_id', v_group_id
        )
    );

    -- 14. Create Notification for User
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        p_user_id,
        '🎉 ได้รับคะแนนสำเร็จ!',
        'คุณได้รับ +' || v_code_record.points::TEXT || ' คะแนน จากการกรอกรหัส ' || v_clean_code,
        'SCORE'
    );

    -- 15. Return Success Payload
    RETURN jsonb_build_object(
        'success', true,
        'message', 'ถูกต้อง! คุณได้รับ +' || v_code_record.points::TEXT || ' คะแนน',
        'points_added', v_code_record.points,
        'individual_score', jsonb_build_object(
            'previous', v_prev_user_score,
            'current', v_new_user_score
        ),
        'group_score', jsonb_build_object(
            'has_group', (v_group_id IS NOT NULL),
            'previous', v_prev_group_score,
            'current', v_new_group_score
        )
    );
END;
$$;


-- 2. Server-Side Bulk Code Generator (No duplicate codes, alphabet 32)
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
            INSERT INTO public.activity_codes (
                batch_id,
                activity_id,
                code,
                points,
                status
            ) VALUES (
                p_batch_id,
                p_activity_id,
                v_code,
                p_points,
                'ACTIVE'
            );
            v_generated_count := v_generated_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Skip collision and retry
        END;
    END LOOP;

    RETURN v_generated_count;
END;
$$;


-- 3. Atomic Assignment Grading & Score Integration
CREATE OR REPLACE FUNCTION public.grade_submission(
    p_submission_id UUID,
    p_score NUMERIC,
    p_feedback TEXT,
    p_graded_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub RECORD;
    v_assign RECORD;
    v_user_group UUID;
BEGIN
    -- 1. Find and lock submission
    SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลงาน');
    END IF;

    -- 2. Find assignment
    SELECT * INTO v_assign FROM public.assignments WHERE id = v_sub.assignment_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ไม่พบการมอบหมายงาน');
    END IF;

    -- 3. Check max score boundary
    IF p_score < 0 OR p_score > v_assign.max_score THEN
        RETURN jsonb_build_object('success', false, 'message', 'คะแนนต้องอยู่ระหว่าง 0 ถึง ' || v_assign.max_score::TEXT);
    END IF;

    -- 4. Update Submission
    UPDATE public.submissions
    SET score = p_score,
        feedback = p_feedback,
        status = 'GRADED',
        graded_at = NOW(),
        graded_by = p_graded_by,
        updated_at = NOW()
    WHERE id = p_submission_id;

    -- 5. Individual Score Transaction
    IF v_assign.add_individual_score THEN
        INSERT INTO public.score_transactions (
            user_id,
            group_id,
            activity_id,
            source_type,
            source_id,
            points,
            score_type,
            reason
        ) VALUES (
            v_sub.student_id,
            v_sub.group_id,
            v_assign.activity_id,
            'ASSIGNMENT',
            p_submission_id,
            p_score,
            'INDIVIDUAL',
            'ตรวจงาน: ได้รับคะแนน ' || p_score::TEXT || '/' || v_assign.max_score::TEXT
        );

        -- Upsert user score
        INSERT INTO public.user_scores (user_id, total_points, activity_id, updated_at)
        VALUES (v_sub.student_id, p_score, v_assign.activity_id, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET total_points = public.user_scores.total_points + EXCLUDED.total_points, updated_at = NOW();
    END IF;

    -- 6. Group Score Transaction
    IF v_assign.add_group_score AND v_sub.group_id IS NOT NULL THEN
        INSERT INTO public.score_transactions (
            user_id,
            group_id,
            activity_id,
            source_type,
            source_id,
            points,
            score_type,
            reason
        ) VALUES (
            v_sub.student_id,
            v_sub.group_id,
            v_assign.activity_id,
            'ASSIGNMENT',
            p_submission_id,
            p_score,
            'GROUP',
            'คะแนนกลุ่มจากการส่งงาน: ' || p_score::TEXT
        );

        -- Upsert group score
        INSERT INTO public.group_scores (group_id, total_points, activity_id, updated_at)
        VALUES (v_sub.group_id, p_score, v_assign.activity_id, NOW())
        ON CONFLICT (group_id)
        DO UPDATE SET total_points = public.group_scores.total_points + EXCLUDED.total_points, updated_at = NOW();
    END IF;

    -- 7. Audit Log
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id, details
    ) VALUES (
        p_graded_by, 'SUBMISSION_GRADED', 'submissions', p_submission_id,
        jsonb_build_object('student_id', v_sub.student_id, 'score', p_score, 'feedback', p_feedback)
    );

    -- 8. Student Notification
    INSERT INTO public.notifications (
        user_id, title, message, type, link_url
    ) VALUES (
        v_sub.student_id,
        '📝 งานของคุณได้รับการตรวจแล้ว',
        'คุณได้รับคะแนน ' || p_score::TEXT || '/' || v_assign.max_score::TEXT || ' คะแนน',
        'GRADE',
        '/student/assignments/' || p_submission_id::TEXT
    );

    RETURN jsonb_build_object('success', true, 'message', 'ตรวจงานและบันทึกคะแนนเรียบร้อย');
END;
$$;
