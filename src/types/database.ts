export type UserRole = 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  username?: string;
  student_id?: string;
  grade_level?: string;
  room?: string;
  academic_year?: string;
  teacher_position?: string;
  department?: string;
  organization?: string;
  avatar_url?: string;
  status: UserStatus;
  password?: string;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentManagementItem {
  id: string;
  username: string;
  student_id: string;
  full_name: string;
  grade_level: string;
  room: string;
  status: string;
  total_points: number;
  password?: string;
  last_login_at?: string | null;
  created_at: string;
}

export interface CsvImportResult {
  success: boolean;
  message: string;
  total_rows: number;
  inserted_count: number;
  skipped_count: number;
  duplicates: string[];
  errors: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'LEADER' | 'MEMBER';
  joined_at: string;
  profile?: Profile;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  start_date?: string;
  end_date?: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  allow_submissions: boolean;
  enable_scoring: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type PostType = 'ANNOUNCEMENT' | 'ASSIGNMENT' | 'MEDIA' | 'DISCUSSION' | 'ACTIVITY' | 'DOCUMENT';

export interface Post {
  id: string;
  activity_id: string;
  author_id: string;
  post_type: PostType;
  title: string;
  content: string;
  is_pinned: boolean;
  allow_comment: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  author?: Profile;
  attachments?: PostAttachment[];
  assignment?: Assignment;
  reactions_count?: {
    heart: number;
    like: number;
    party: number;
    idea: number;
  };
}

export interface PostAttachment {
  id: string;
  post_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  post_id: string;
  activity_id: string;
  max_score: number;
  start_at?: string;
  due_at?: string;
  allow_resubmission: boolean;
  max_files: number;
  allow_text: boolean;
  allow_image: boolean;
  allow_video: boolean;
  allow_document: boolean;
  allow_link: boolean;
  add_individual_score: boolean;
  add_group_score: boolean;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'RETURNED';

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  group_id?: string;
  content?: string;
  link_url?: string;
  status: SubmissionStatus;
  current_version: number;
  score?: number;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  graded_by?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  group?: Group;
}

export interface CodeBatch {
  id: string;
  batch_name: string;
  activity_id: string;
  quantity: number;
  code_length: number;
  points_per_code: number;
  character_set: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXHAUSTED';
  created_by?: string;
  created_at: string;
}

export interface ActivityCode {
  id: string;
  batch_id: string;
  activity_id: string;
  code: string;
  points: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  used_by?: string;
  used_group_id?: string;
  used_at?: string;
  created_at: string;
}

export interface ScoreTransaction {
  id: string;
  user_id: string;
  group_id?: string;
  activity_id: string;
  source_type: 'CODE' | 'ASSIGNMENT' | 'BONUS' | 'ADMIN_ADJUSTMENT';
  source_id?: string;
  points: number;
  score_type: 'INDIVIDUAL' | 'GROUP' | 'BOTH';
  reason?: string;
  created_at: string;
}

export interface UserScoreLeaderboard {
  user_id: string;
  full_name: string;
  student_id?: string;
  avatar_url?: string;
  group_name?: string;
  total_points: number;
  rank?: number;
}

export interface GroupScoreLeaderboard {
  group_id: string;
  name: string;
  avatar_url?: string;
  member_count: number;
  total_points: number;
  rank?: number;
}

export interface CodeRedemptionResult {
  success: boolean;
  message: string;
  points_added?: number;
  individual_score?: {
    previous: number;
    current: number;
  };
  group_score?: {
    has_group: boolean;
    previous: number;
    current: number;
  };
}
