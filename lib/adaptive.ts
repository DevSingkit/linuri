import type { Diff, Mastery } from "@/types";

const ORDER: Diff[] = ["basic", "standard", "advanced"];

interface AdaptiveResult {
  difficulty: Diff;
  incrementRegression: boolean;
}

/**
 * Decides the student's next difficulty level based on mastery classification.
 *
 * mastered   → move up one level (stay at advanced if already there)
 * developing → stay at the same level, retry with same question set
 * needs_help → move down one level (stay at basic if already there)
 *
 * No cross-skill redirection — difficulty moves within the same skill only.
 * A regression is counted whenever the student moves down or stays down.
 */
export function next(level: Mastery, diff: Diff): AdaptiveResult {
  const idx = ORDER.indexOf(diff);

  if (level === "mastered") {
    return {
      difficulty: ORDER[Math.min(idx + 1, ORDER.length - 1)],
      incrementRegression: false,
    };
  }

  if (level === "developing") {
    return {
      difficulty: diff, // same level
      incrementRegression: false,
    };
  }

  // needs_help → step down
  return {
    difficulty: ORDER[Math.max(idx - 1, 0)],
    incrementRegression: true,
  };
}