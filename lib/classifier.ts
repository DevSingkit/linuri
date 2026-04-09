import type { Mastery, Trend } from "@/types";

interface Features {
  accuracy: number;   // 0–100, percentage of correct answers
  attempts: number;   // total attempts on this skill+difficulty
  avgTime: number;    // average seconds per question
  trend: Trend;       // computed from last 5 attempt scores
}

/**
 * Rule-based Decision Tree classifier.
 * Returns a mastery level based on the four performance features.
 *
 * Thresholds are based on synthetic training data.
 * Replace with a trained sklearn model via Python API once real data is collected.
 */
export function classify(f: Features): Mastery {
  // Clearly struggling: low accuracy or declining with borderline accuracy
  if (f.accuracy < 50) return "needs_help";
  if (f.accuracy < 65 && f.trend === "declining") return "needs_help";

  // Clearly mastered: high accuracy and not declining
  if (f.accuracy >= 80 && f.trend !== "declining") return "mastered";

  // Mastered after multiple attempts even with slower improvement
  if (f.accuracy >= 75 && f.attempts >= 3 && f.trend === "improving") return "mastered";

  // Everything else: still developing
  return "developing";
}