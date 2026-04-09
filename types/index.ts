export type Role = "teacher" | "student";
export type Subject = "English" | "Mathematics" | "Science";
export type Diff = "basic" | "standard" | "advanced";
export type Mastery = "needs_help" | "developing" | "mastered";
export type Trend = "improving" | "stable" | "declining";
export type QStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  lrn?: string;
  section_id?: string;
  created_at: string;
}

export interface Section {
  id: string;
  teacher_id: string;
  name: string;
  grade_level: string;
  join_code: string;
  created_at: string;
}

export interface Skill {
  id: string;
  subject: Subject;
  name: string;
  prereq_id?: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  skill_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Question {
  id: string;
  lesson_id: string;
  skill_id: string;
  difficulty: Diff;
  stem: string;
  options: string[];
  correct_index: number;
  status: QStatus;
  created_at: string;
}

export interface Attempt {
  id: string;
  student_id: string;
  skill_id: string;
  difficulty: Diff;
  score: number;
  total: number;
  avg_time: number;
  done_at: string;
}

export interface MasteryRecord {
  id: string;
  student_id: string;
  skill_id: string;
  attempt_id: string;
  level: Mastery;
  accuracy: number;
  attempt_count: number;
  trend: Trend;
}

export interface Progress {
  id: string;
  student_id: string;
  skill_id: string;
  difficulty: Diff;
  regressions: number;
  flagged: boolean;
  updated_at: string;
}
