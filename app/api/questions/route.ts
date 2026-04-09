import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { createClient } from '@/lib/db'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ],
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { lesson_id, file_data, extra_content } = body

  const supabase = await createClient()

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*, skills(name)')
    .eq('id', lesson_id)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { content, count_basic, count_standard, count_advanced, skills } = lesson
  const skillName = (skills as { name: string }).name

  console.log('[questions] skill:', skillName, '| counts:', count_basic, count_standard, count_advanced)
  console.log('[questions] file attached:', !!file_data, file_data ? `(${file_data.mimeType})` : '')
  console.log('[questions] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY)

  // ── Build the prompt text ──────────────────────────────────────────────
  const promptText = `You are a Grade 6 quiz generator in the Philippines.
Generate multiple-choice questions about the skill "${skillName}" based on the lesson content provided${file_data ? ' (see attached file)' : ''}.
Generate exactly:
- ${count_basic} basic questions (simple recall, straightforward)
- ${count_standard} standard questions (application, moderate thinking)
- ${count_advanced} advanced questions (analysis, higher-order thinking)
Each question must have exactly 4 answer choices and one correct answer.
Return a JSON array only. No explanation, no markdown, no backticks. Just the raw JSON array.
Format:
[{ "difficulty": "basic" | "standard" | "advanced", "stem": "...", "options": ["A","B","C","D"], "correct_index": 0 }]
${
  // Include text content if: no file attached, OR extra_content was provided alongside the file
  !file_data && content
    ? `\nLesson content:\n${content}`
    : extra_content
    ? `\nAdditional context from teacher:\n${extra_content}`
    : ''
}`

  // ── Build Gemini content parts ─────────────────────────────────────────
  // Parts array: always starts with the prompt text.
  // If a file is attached and it's base64 (PDF or image), add it as inline_data.
  // If it's extracted text (docx / txt), append it directly to the prompt.
  let rawText = ''

  try {
    console.log('[questions] calling Gemini...')

    let result

    if (file_data) {
      if (file_data.isBase64) {
        // PDF or image — send as inline multimodal part
        result = await model.generateContent([
          promptText,
          {
            inlineData: {
              mimeType: file_data.mimeType,
              data: file_data.data,
            },
          },
        ])
      } else {
        // docx or txt — text was already extracted client-side; append to prompt
        const combinedPrompt = `${promptText}\n\nLesson content (extracted from ${file_data.fileName}):\n${file_data.data}`
        result = await model.generateContent(combinedPrompt)
      }
    } else {
      // No file — use text content from DB (original behaviour)
      result = await model.generateContent(promptText)
    }

    rawText = result.response.text()
    console.log('[questions] Gemini raw response:', rawText.slice(0, 300))

    const text = rawText.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(text)
    console.log('[questions] parsed', questions.length, 'questions')

    const counts = { basic: 0, standard: 0, advanced: 0 }
    for (const q of questions) {
      if (counts[q.difficulty as keyof typeof counts] !== undefined) {
        counts[q.difficulty as keyof typeof counts]++
      }
    }

    const rows = questions.map((q: {
      difficulty: string
      stem: string
      options: string[]
      correct_index: number
    }) => ({
      lesson_id,
      skill_id: lesson.skill_id,
      difficulty: q.difficulty,
      stem: q.stem,
      options: q.options,
      correct_index: q.correct_index,
      status: 'pending',
    }))

    const { error: insertError } = await supabase.from('questions').insert(rows)
    if (insertError) {
      console.error('[questions] insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length, counts })

  } catch (err) {
    console.error('[questions] caught error:', String(err))
    console.error('[questions] raw at time of error:', rawText.slice(0, 500))
    return NextResponse.json(
      { error: 'Gemini generation or parsing failed', detail: String(err), raw: rawText },
      { status: 500 }
    )
  }
}