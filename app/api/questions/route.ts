import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { lesson_id } = await req.json();
  const supabase = await createClient(); // ← await required

  // Fetch lesson + skill name + counts
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*, skills(name)")
    .eq("id", lesson_id)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const { content, count_basic, count_standard, count_advanced, skills } = lesson;
  const skillName = (skills as any).name;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a Grade 6 quiz generator in the Philippines.
Generate multiple-choice questions about the skill "${skillName}" based on the lesson content below.
Generate exactly:
- ${count_basic} basic questions (simple recall, straightforward)
- ${count_standard} standard questions (application, moderate thinking)
- ${count_advanced} advanced questions (analysis, higher-order thinking)
Each question must have exactly 4 answer choices and one correct answer.
Return a JSON array only. No explanation, no markdown, no backticks. Just the raw JSON array.
Format:
[{ "difficulty": "basic" | "standard" | "advanced", "stem": "...", "options": ["A","B","C","D"], "correct_index": 0 }]
Lesson content:
${content}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const questions = JSON.parse(text);

    // Validate counts
    const counts = { basic: 0, standard: 0, advanced: 0 };
    for (const q of questions) {
      if (counts[q.difficulty as keyof typeof counts] !== undefined) {
        counts[q.difficulty as keyof typeof counts]++;
      }
    }

    const rows = questions.map((q: any) => ({
      lesson_id,
      skill_id: lesson.skill_id,
      difficulty: q.difficulty,
      stem: q.stem,
      options: q.options,
      correct_index: q.correct_index,
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("questions").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ inserted: rows.length, counts });
  } catch (err) {
    return NextResponse.json(
      { error: "Gemini generation or parsing failed", detail: String(err) },
      { status: 500 }
    );
  }
}