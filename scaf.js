const fs = require("fs");
const path = require("path");

const files = [
  // types
  "types/index.ts",

  // lib
  "lib/db.ts",
  "lib/client.ts",
  "lib/classifier.ts",
  "lib/adaptive.ts",

  // middleware
  "middleware.ts",

  // app root
  "app/layout.tsx",
  "app/page.tsx",

  // auth
  "app/login/page.tsx",
  "app/auth/register/page.tsx",
  "app/join/page.tsx",

  // api routes
  "app/api/questions/route.ts",
  "app/api/classify/route.ts",
  "app/api/join/route.ts",
  "app/api/auth/logout/route.ts",

  // teacher
  "app/teacher/page.tsx",
  "app/teacher/lessons/page.tsx",
  "app/teacher/report/page.tsx",
  "app/teacher/student/[id]/page.tsx",

  // student
  "app/student/page.tsx",
  "app/student/quiz/page.tsx",
  "app/student/quiz/done/page.tsx",
];

const stubs = {
  "middleware.ts": `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // TODO: check auth, redirect to /login if unauthenticated
  // TODO: redirect teacher -> /teacher, student -> /student
  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*"],
};
`,

  "types/index.ts": `export type Role = "teacher" | "student";
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
`,

  "lib/db.ts": `import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
`,

  "lib/client.ts": `import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`,

  "lib/classifier.ts": `import type { Mastery, Trend } from "@/types";

interface Features {
  accuracy: number;   // 0–100
  attempts: number;
  avgTime: number;    // seconds per question
  trend: Trend;
}

export function classify(f: Features): Mastery {
  if (f.accuracy >= 80 && f.trend !== "declining") return "mastered";
  if (f.accuracy < 50 || (f.accuracy < 60 && f.trend === "declining")) return "needs_help";
  return "developing";
}
`,

  "lib/adaptive.ts": `import type { Diff, Mastery } from "@/types";

const ORDER: Diff[] = ["basic", "standard", "advanced"];

interface AdaptiveResult {
  difficulty: Diff;
  skillId: string;
  incrementRegression: boolean;
}

export function next(
  level: Mastery,
  diff: Diff,
  skillId: string,
  prereqId: string | null
): AdaptiveResult {
  const idx = ORDER.indexOf(diff);

  if (level === "mastered") {
    return {
      difficulty: ORDER[Math.min(idx + 1, ORDER.length - 1)],
      skillId,
      incrementRegression: false,
    };
  }

  if (level === "developing") {
    return {
      difficulty: ORDER[Math.max(idx - 1, 0)],
      skillId,
      incrementRegression: true,
    };
  }

  // needs_help
  return {
    difficulty: "basic",
    skillId: prereqId ?? skillId,
    incrementRegression: true,
  };
}
`,

  "app/api/questions/route.ts": `import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { lesson_id, skill_id, skill_name, content } = await req.json();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = \`Generate exactly 15 multiple-choice questions for Grade 6 students about "\${skill_name}".
5 basic, 5 standard, 5 advanced difficulty.
Each question must have 4 options (A-D) and one correct answer.
Return JSON array only:
[{ "difficulty": "basic"|"standard"|"advanced", "stem": "...", "options": ["A","B","C","D"], "correct_index": 0-3 }]

Lesson content:
\${content}\`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/\`\`\`json|\`\`\`/g, "").trim();
  const questions = JSON.parse(text);

  const supabase = createClient();
  const rows = questions.map((q: any) => ({
    lesson_id,
    skill_id,
    difficulty: q.difficulty,
    stem: q.stem,
    options: q.options,
    correct_index: q.correct_index,
    status: "pending",
  }));

  const { error } = await supabase.from("questions").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length });
}
`,

  "app/api/classify/route.ts": `import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { classify } from "@/lib/classifier";
import { next } from "@/lib/adaptive";
import type { Trend } from "@/types";

export async function POST(req: NextRequest) {
  const { attempt_id } = await req.json();
  const supabase = createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attempt_id)
    .single();

  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

  const { data: last5 } = await supabase
    .from("attempts")
    .select("score, total")
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id)
    .order("done_at", { ascending: false })
    .limit(5);

  const scores = (last5 ?? []).map((a) => a.score / a.total);
  const trend: Trend =
    scores.length < 2
      ? "stable"
      : scores[0] > scores[scores.length - 1]
      ? "improving"
      : scores[0] < scores[scores.length - 1]
      ? "declining"
      : "stable";

  const accuracy = (attempt.score / attempt.total) * 100;
  const { data: pastAttempts } = await supabase
    .from("attempts")
    .select("id")
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id);

  const level = classify({
    accuracy,
    attempts: pastAttempts?.length ?? 1,
    avgTime: attempt.avg_time,
    trend,
  });

  await supabase.from("mastery").insert({
    student_id: attempt.student_id,
    skill_id: attempt.skill_id,
    attempt_id,
    level,
    accuracy,
    attempt_count: pastAttempts?.length ?? 1,
    trend,
  });

  const { data: skill } = await supabase
    .from("skills")
    .select("prereq_id")
    .eq("id", attempt.skill_id)
    .single();

  const { data: progress } = await supabase
    .from("progress")
    .select("regressions")
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id)
    .single();

  const adaptive = next(level, attempt.difficulty, attempt.skill_id, skill?.prereq_id ?? null);
  const regressions = (progress?.regressions ?? 0) + (adaptive.incrementRegression ? 1 : 0);

  await supabase.from("progress").upsert(
    {
      student_id: attempt.student_id,
      skill_id: adaptive.skillId,
      difficulty: adaptive.difficulty,
      regressions,
      flagged: regressions >= 2,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,skill_id" }
  );

  return NextResponse.json({ level, adaptive });
}
`,

  "app/api/join/route.ts": `import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: section } = await supabase
    .from("sections")
    .select("id")
    .ilike("join_code", code)
    .single();

  if (!section) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  const { error } = await supabase
    .from("profiles")
    .update({ section_id: section.id })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ section_id: section.id });
}
`,

  "app/api/auth/logout/route.ts": `import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SUPABASE_URL));
}
`,
};

const defaultStub = (filePath) => {
  const name = path.basename(filePath, path.extname(filePath));
  return `// TODO: ${filePath}\nexport default function ${capitalize(name)}() {\n  return <div>${name}</div>;\n}\n`;
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

let created = 0;
let skipped = 0;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(fullPath)) {
    console.log(`  skip  ${file}`);
    skipped++;
    continue;
  }

  const content = stubs[file] ?? defaultStub(file);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`  create  ${file}`);
  created++;
}

console.log(`\nDone. ${created} created, ${skipped} skipped.`);