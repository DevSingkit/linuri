import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { classify } from "@/lib/classifier";
import { next } from "@/lib/adaptive";
import type { Trend } from "@/types";

export async function POST(req: NextRequest) {
  const { attempt_id } = await req.json();
  const supabase = await createClient();

  // Fetch the completed attempt
  const { data: attempt, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attempt_id)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Get last 5 attempts on this skill+difficulty for trend
  const { data: recent } = await supabase
    .from("attempts")
    .select("score, total")
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id)
    .eq("difficulty", attempt.difficulty)
    .order("done_at", { ascending: false })
    .limit(5);

  const scores = (recent ?? []).map((a) => a.score / a.total);
  const trend: Trend =
    scores.length < 2
      ? "stable"
      : scores[0] > scores[scores.length - 1]
      ? "improving"
      : scores[0] < scores[scores.length - 1]
      ? "declining"
      : "stable";

  // Total attempts on this skill+difficulty
  const { count: attemptCount } = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id)
    .eq("difficulty", attempt.difficulty);

  const accuracy = (attempt.score / attempt.total) * 100;

  // Classify
  const level = classify({
    accuracy,
    attempts: attemptCount ?? 1,
    avgTime: attempt.avg_time,
    trend,
  });

  // Save mastery record
  await supabase.from("mastery").insert({
    student_id: attempt.student_id,
    skill_id: attempt.skill_id,
    attempt_id,
    level,
    accuracy,
    attempt_count: attemptCount ?? 1,
    trend,
  });

  // Get adaptive result
  const adaptive = next(level, attempt.difficulty);

  // Get current regression count
  const { data: progress } = await supabase
    .from("progress")
    .select("regressions")
    .eq("student_id", attempt.student_id)
    .eq("skill_id", attempt.skill_id)
    .single();

  const regressions =
    (progress?.regressions ?? 0) + (adaptive.incrementRegression ? 1 : 0);

  // Upsert progress
  await supabase.from("progress").upsert(
    {
      student_id: attempt.student_id,
      skill_id: attempt.skill_id,
      current_difficulty: adaptive.difficulty,
      regressions,
      flagged: regressions >= 2,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,skill_id" }
  );

  return NextResponse.json({ level, next_difficulty: adaptive.difficulty });
}