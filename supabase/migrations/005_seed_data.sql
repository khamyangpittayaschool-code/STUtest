-- ===================================================================
-- AI TRAINING MANAGEMENT, GAMIFICATION & ASSIGNMENT SYSTEM
-- Migration 005: Initial Seed Data
-- ===================================================================

-- 1. Insert Initial AI Training Activity
INSERT INTO public.activities (
    id,
    title,
    description,
    cover_image_url,
    start_date,
    end_date,
    status,
    allow_submissions,
    enable_scoring
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'อบรมการประยุกต์ใช้ AI ในการเรียนรู้และการสร้างสรรค์',
    'กิจกรรมอบรมเชิงปฏิบัติการ การประยุกต์ใช้เทคโนโลยีปัญญาประดิษฐ์ (Generative AI: Gemini, ChatGPT, Claude และ NotebookLM) สำหรับโรงเรียน เพื่อเสริมทักษะในศตวรรษที่ 21',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    '2026-09-26 08:30:00+07',
    '2026-09-26 16:30:00+07',
    'ACTIVE',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sample Code Batch
INSERT INTO public.code_batches (
    id,
    batch_name,
    activity_id,
    quantity,
    code_length,
    points_per_code,
    character_set,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Gemini Challenge 01 (ชุดรหัสกิจกรรมรอบเช้า)',
    'a0000000-0000-0000-0000-000000000001',
    100,
    5,
    10.00,
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Ready-to-Test Activity Codes (for initial testing)
INSERT INTO public.activity_codes (batch_id, activity_id, code, points, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'K7X2M', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Q9R4Z', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'VJ3P8', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'N6T8W', 10.00, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'C4Y9K', 10.00, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;
