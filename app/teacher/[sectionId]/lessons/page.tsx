'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/client'
import { useParams } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────
type Lesson = {
  id: string
  title: string
  content: string
  skill_id: string
  count_basic: number
  count_standard: number
  count_advanced: number
  created_at: string
  skills: { name: string; subject: string }
}
type Question = {
  id: string
  lesson_id: string
  skill_id: string
  difficulty: 'basic' | 'standard' | 'advanced'
  stem: string
  options: string[]
  correct_index: number
  status: 'pending' | 'approved' | 'rejected'
}
type FileAttachment = {
  name: string
  type: 'pdf' | 'image' | 'docx' | 'txt'
  mimeType: string
  // for pdf/image: base64 string; for docx/txt: extracted text string
  data: string
  isBase64: boolean
}

const SUBJECTS = ['English', 'Mathematics', 'Science']
const DIFF_ORDER: Array<'basic' | 'standard' | 'advanced'> = ['basic', 'standard', 'advanced']
const DIFF_LABEL: Record<string, string> = { basic: 'Basic', standard: 'Standard', advanced: 'Advanced' }
const DIFF_COLOR: Record<string, string> = { basic: '#1b5e30', standard: '#c9941a', advanced: '#8b1a1a' }
const DIFF_BG: Record<string, string>    = { basic: 'rgba(27,94,48,0.1)', standard: 'rgba(201,148,26,0.1)', advanced: 'rgba(139,26,26,0.1)' }
const SUBJ_COLORS: Record<string, { accent: string; light: string; icon: string }> = {
  English:     { accent: '#8b1a1a', light: 'rgba(139,26,26,0.08)',  icon: 'Aa' },
  Mathematics: { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)',   icon: '∑'  },
  Science:     { accent: '#c9941a', light: 'rgba(201,148,26,0.08)', icon: '⚗'  },
}

const ACCEPTED_TYPES: Record<string, FileAttachment['type']> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

const FILE_ICON: Record<FileAttachment['type'], string> = {
  pdf: '📄', image: '🖼', docx: '📝', txt: '📃',
}

// ── Component ──────────────────────────────────────────────────────────────
export default function LessonsPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // data
  const [lessons,   setLessons]   = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading,   setLoading]   = useState(true)

  // UI state
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [showForm,       setShowForm]       = useState(false)
  const [formStep,       setFormStep]       = useState<'details' | 'review'>('details')
  const [dragOver,       setDragOver]       = useState(false)

  // form fields
  const [subject,      setSubject]      = useState('English')
  const [skillInput,   setSkillInput]   = useState('')
  const [lessonTitle,  setLessonTitle]  = useState('')
  const [content,      setContent]      = useState('')
  const [countBasic,   setCountBasic]   = useState(5)
  const [countStd,     setCountStd]     = useState(5)
  const [countAdv,     setCountAdv]     = useState(5)

  // file attachment
  const [attachment,     setAttachment]     = useState<FileAttachment | null>(null)
  const [fileProcessing, setFileProcessing] = useState(false)
  const [fileError,      setFileError]      = useState('')

  // generation state
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState('')
  const [pendingQs,   setPendingQs]   = useState<Question[]>([])
  const [selected,    setSelected]    = useState<Record<string, boolean>>({})
  const [saving,      setSaving]      = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  useEffect(() => { loadData() }, [sectionId])

  async function loadData() {
    setLoading(true)
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('*, skills(name, subject)')
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false })
    setLessons(lessonRows ?? [])

    if (lessonRows && lessonRows.length > 0) {
      const lessonIds = lessonRows.map((l: Lesson) => l.id)
      const { data: qRows } = await supabase
        .from('questions')
        .select('id, lesson_id, skill_id, difficulty, stem, options, correct_index, status')
        .in('lesson_id', lessonIds)
      setQuestions(qRows ?? [])
    }
    setLoading(false)
  }

  // ── File processing ────────────────────────────────────────────────────
  async function processFile(file: File) {
    setFileError('')
    setFileProcessing(true)
    setAttachment(null)

    const mimeType = file.type
    const fileType = ACCEPTED_TYPES[mimeType]

    if (!fileType) {
      setFileError('Unsupported file type. Please upload a PDF, Word (.docx), image, or plain text file.')
      setFileProcessing(false)
      return
    }

    try {
      if (fileType === 'pdf' || fileType === 'image') {
        // Read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // strip data URL prefix → get raw base64
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        setAttachment({ name: file.name, type: fileType, mimeType, data: base64, isBase64: true })

      } else if (fileType === 'txt') {
        const text = await file.text()
        setAttachment({ name: file.name, type: 'txt', mimeType: 'text/plain', data: text, isBase64: false })

      } else if (fileType === 'docx') {
        // Dynamically load mammoth from CDN
        const mammoth = await loadMammoth()
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setAttachment({ name: file.name, type: 'docx', mimeType: 'text/plain', data: result.value, isBase64: false })
      }
    } catch (err) {
      setFileError('Failed to read file: ' + String(err))
    }

    setFileProcessing(false)
  }

  // Load mammoth.js from CDN dynamically
  async function loadMammoth(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ((window as any).mammoth) { resolve((window as any).mammoth); return }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
      script.onload = () => resolve((window as any).mammoth)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function removeAttachment() {
    setAttachment(null)
    setFileError('')
  }

  // ── Create lesson ──────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!skillInput.trim())  { setGenError('Please enter a skill name.'); return }
    if (!lessonTitle.trim()) { setGenError('Please enter a lesson title.'); return }
    if (!attachment && !content.trim()) {
      setGenError('Please upload a lesson file or enter lesson content.')
      return
    }
    if (countBasic + countStd + countAdv === 0) {
      setGenError('Question counts must total more than 0.')
      return
    }

    setGenerating(true)
    setGenError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGenError('Not authenticated.'); setGenerating(false); return }

    const { data: existingSkills } = await supabase
      .from('skills')
      .select('order_index')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: false })
      .limit(1)
    const nextOrder = ((existingSkills?.[0]?.order_index ?? 0) + 1)

    const { data: skillRow, error: skillErr } = await supabase
      .from('skills')
      .insert({ teacher_id: user.id, section_id: sectionId, subject, name: skillInput.trim(), order_index: nextOrder })
      .select('id')
      .single()

    if (skillErr || !skillRow) {
      setGenError('Failed to create skill: ' + (skillErr?.message ?? 'unknown'))
      setGenerating(false)
      return
    }

    const { data: lessonRow, error: lessonErr } = await supabase
      .from('lessons')
      .insert({
        teacher_id: user.id,
        section_id: sectionId,
        skill_id: skillRow.id,
        title: lessonTitle.trim(),
        content: content.trim() || (attachment?.isBase64 ? '[file attachment]' : attachment?.data ?? ''),
        count_basic: countBasic,
        count_standard: countStd,
        count_advanced: countAdv,
      })
      .select('id')
      .single()

    if (lessonErr || !lessonRow) {
      setGenError('Failed to create lesson: ' + (lessonErr?.message ?? 'unknown'))
      setGenerating(false)
      return
    }

    // Build request body — include file attachment if present
    const requestBody: Record<string, any> = { lesson_id: lessonRow.id }
    if (attachment) {
      requestBody.file_data = {
        data: attachment.data,
        mimeType: attachment.mimeType,
        isBase64: attachment.isBase64,
        fileName: attachment.name,
      }
    }
    // If there's also manual content alongside a file, send it too
    if (content.trim() && attachment) {
      requestBody.extra_content = content.trim()
    }

    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
    const json = await res.json()

    if (!res.ok) {
      setGenError(json.error ?? 'Question generation failed.')
      setGenerating(false)
      return
    }

    const { data: qRows } = await supabase
      .from('questions')
      .select('id, lesson_id, skill_id, difficulty, stem, options, correct_index, status')
      .eq('lesson_id', lessonRow.id)

    const generated = qRows ?? []
    setPendingQs(generated)

    const sel: Record<string, boolean> = {}
    for (const q of generated) sel[q.id] = true
    setSelected(sel)

    setFormStep('review')
    setGenerating(false)
  }

  // ── Approve ────────────────────────────────────────────────────────────
  async function handleApprove() {
    setSaving(true)
    const approvedIds = pendingQs.filter(q =>  selected[q.id]).map(q => q.id)
    const rejectedIds = pendingQs.filter(q => !selected[q.id]).map(q => q.id)
    if (approvedIds.length > 0) await supabase.from('questions').update({ status: 'approved' }).in('id', approvedIds)
    if (rejectedIds.length > 0) await supabase.from('questions').update({ status: 'rejected' }).in('id', rejectedIds)
    await loadData()
    resetForm()
    setSaving(false)
  }

  function resetForm() {
    setShowForm(false)
    setFormStep('details')
    setSubject('English')
    setSkillInput('')
    setLessonTitle('')
    setContent('')
    setCountBasic(5)
    setCountStd(5)
    setCountAdv(5)
    setGenError('')
    setAttachment(null)
    setFileError('')
    setPendingQs([])
    setSelected({})
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete(lessonId: string) {
    if (!confirm('Delete this lesson and all its questions? This cannot be undone.')) return
    setDeletingId(lessonId)
    const lesson = lessons.find(l => l.id === lessonId)
    const skillId = lesson?.skill_id
    await supabase.from('questions').delete().eq('lesson_id', lessonId)
    await supabase.from('lessons').delete().eq('id', lessonId)
    if (skillId) await supabase.from('skills').delete().eq('id', skillId)
    await loadData()
    setDeletingId(null)
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  function getQsForLesson(lessonId: string) { return questions.filter(q => q.lesson_id === lessonId) }
  function approvedCount(lessonId: string, diff: string) {
    return questions.filter(q => q.lesson_id === lessonId && q.difficulty === diff && q.status === 'approved').length
  }
  function toggleSelect(id: string) { setSelected(prev => ({ ...prev, [id]: !prev[id] })) }
  function toggleAll(diff: 'basic' | 'standard' | 'advanced') {
    const tier = pendingQs.filter(q => q.difficulty === diff)
    const allSelected = tier.every(q => selected[q.id])
    const update = { ...selected }
    for (const q of tier) update[q.id] = !allSelected
    setSelected(update)
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root{
          --green:#1b5e30;--green-dark:#0d3a1b;--crimson:#8b1a1a;
          --gold:#c9941a;--gold-lt:#e8b84b;--cream:#faf6ee;
          --cream2:#f0e9d8;--white:#ffffff;--text:#1a1a1a;
          --text-soft:#6b6b6b;--border:rgba(27,94,48,0.15);
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--text);}

        .back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text-soft);text-decoration:none;font-weight:300;margin-bottom:28px;transition:color 0.2s;}
        .back-link:hover{color:var(--green);}

        .page-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;gap:16px;flex-wrap:wrap;}
        .ph-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .ph-line{width:20px;height:2px;background:var(--crimson);}
        .ph-eye{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--crimson);}
        .ph-title{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--text);line-height:1.2;}
        .ph-title em{color:var(--crimson);font-style:italic;}
        .ph-sub{font-size:14px;color:var(--text-soft);margin-top:5px;}

        .btn-new{display:inline-flex;align-items:center;gap:8px;background:var(--green-dark);color:var(--cream);border:none;border-radius:8px;padding:11px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:background 0.15s;white-space:nowrap;text-decoration:none;}
        .btn-new:hover{background:var(--green);}

        .form-card{background:var(--white);border:1px solid var(--border);border-radius:12px;margin-bottom:32px;overflow:hidden;}
        .form-card-header{background:var(--green-dark);padding:20px 28px;display:flex;align-items:center;justify-content:space-between;}
        .form-card-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff;}
        .form-card-body{padding:28px;}

        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .form-grid-full{grid-column:1/-1;}

        .field{margin-bottom:0;}
        .field label{display:block;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);margin-bottom:8px;}
        .field input,.field textarea,.field select{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:7px;background:var(--cream);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
        .field input:focus,.field textarea:focus,.field select:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(27,94,48,0.1);}
        .field textarea{resize:vertical;min-height:100px;line-height:1.6;}

        /* FILE UPLOAD */
        .upload-zone{
          border:2px dashed var(--border);border-radius:10px;
          padding:28px 20px;text-align:center;cursor:pointer;
          transition:border-color 0.2s,background 0.2s;
          background:var(--cream);
        }
        .upload-zone:hover,.upload-zone.drag-over{
          border-color:var(--green);background:rgba(27,94,48,0.04);
        }
        .upload-icon{font-size:28px;margin-bottom:8px;display:block;}
        .upload-title{font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px;}
        .upload-sub{font-size:12px;color:var(--text-soft);}
        .upload-sub span{color:var(--green);font-weight:500;text-decoration:underline;cursor:pointer;}

        .file-preview{
          display:flex;align-items:center;gap:12px;
          background:rgba(27,94,48,0.05);border:1.5px solid rgba(27,94,48,0.2);
          border-radius:8px;padding:12px 16px;
        }
        .file-preview-icon{font-size:22px;flex-shrink:0;}
        .file-preview-info{flex:1;min-width:0;}
        .file-preview-name{font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .file-preview-type{font-size:11px;color:var(--green);margin-top:2px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;}
        .file-remove{background:none;border:none;color:var(--text-soft);cursor:pointer;font-size:16px;padding:4px;border-radius:4px;transition:color 0.15s;flex-shrink:0;}
        .file-remove:hover{color:var(--crimson);}
        .file-processing{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--cream);border:1.5px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-soft);}
        .file-processing-spinner{animation:spin 0.8s linear infinite;display:inline-block;font-size:14px;}
        .file-error-box{background:rgba(139,26,26,0.06);border:1px solid rgba(139,26,26,0.2);border-radius:7px;padding:10px 14px;color:var(--crimson);font-size:12px;margin-top:8px;}

        .content-divider{display:flex;align-items:center;gap:10px;margin:16px 0 0;}
        .content-divider-line{flex:1;height:1px;background:var(--border);}
        .content-divider-text{font-size:11px;color:var(--text-soft);font-weight:500;letter-spacing:0.5px;white-space:nowrap;}

        .counts-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
        .count-field{text-align:center;}
        .count-field label{display:block;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;}
        .count-field label.basic-lbl{color:var(--green);}
        .count-field label.std-lbl{color:var(--gold);}
        .count-field label.adv-lbl{color:var(--crimson);}
        .count-input{width:100%;padding:12px;text-align:center;border:1.5px solid var(--border);border-radius:7px;background:var(--cream);font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:var(--text);outline:none;transition:border-color 0.2s;}
        .count-input:focus{border-color:var(--green);}

        .error-box{background:rgba(139,26,26,0.07);border:1px solid rgba(139,26,26,0.22);border-left:3px solid var(--crimson);border-radius:7px;padding:11px 16px;color:var(--crimson);font-size:13px;margin-top:16px;}

        .form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid var(--border);}
        .btn-cancel{background:transparent;border:1.5px solid var(--border);color:var(--text-soft);border-radius:7px;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;}
        .btn-cancel:hover{border-color:var(--green);color:var(--green);}
        .btn-generate{background:var(--green-dark);color:var(--cream);border:none;border-radius:7px;padding:10px 24px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:background 0.15s;}
        .btn-generate:hover:not(:disabled){background:var(--green);}
        .btn-generate:disabled{opacity:0.55;cursor:not-allowed;}

        .review-header{margin-bottom:20px;}
        .review-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--text);margin-bottom:4px;}
        .review-sub{font-size:13px;color:var(--text-soft);}

        .tier-section{margin-bottom:24px;}
        .tier-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-radius:8px;margin-bottom:12px;}
        .tier-header-left{display:flex;align-items:center;gap:10px;}
        .tier-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:4px;}
        .tier-count{font-size:12px;color:var(--text-soft);}
        .tier-toggle-all{font-size:12px;font-weight:500;cursor:pointer;text-decoration:underline;background:none;border:none;color:var(--text-soft);padding:0;}
        .tier-toggle-all:hover{color:var(--green-dark);}

        .q-card{background:var(--cream);border:1.5px solid var(--border);border-radius:9px;padding:16px 18px;margin-bottom:10px;display:flex;gap:14px;align-items:flex-start;transition:border-color 0.15s,background 0.15s;cursor:pointer;}
        .q-card.selected{background:var(--white);border-color:var(--green);}
        .q-card.rejected-card{opacity:0.45;}
        .q-checkbox{width:18px;height:18px;border-radius:4px;flex-shrink:0;border:1.5px solid var(--border);background:var(--white);display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all 0.15s;}
        .q-card.selected .q-checkbox{background:var(--green-dark);border-color:var(--green-dark);}
        .q-checkbox-tick{color:#fff;font-size:11px;font-weight:700;}
        .q-body{flex:1;}
        .q-stem{font-size:13px;font-weight:500;color:var(--text);margin-bottom:10px;line-height:1.5;}
        .q-options{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
        .q-option{font-size:12px;color:var(--text-soft);padding:5px 9px;border-radius:5px;background:rgba(0,0,0,0.03);}
        .q-option.correct{background:rgba(27,94,48,0.1);color:var(--green);font-weight:500;}

        .approve-bar{background:var(--cream2);border-top:1px solid var(--border);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .approve-summary{font-size:13px;color:var(--text-soft);}
        .approve-summary strong{color:var(--text);}
        .btn-approve{background:var(--green-dark);color:var(--cream);border:none;border-radius:7px;padding:10px 28px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s;}
        .btn-approve:hover:not(:disabled){background:var(--green);}
        .btn-approve:disabled{opacity:0.55;cursor:not-allowed;}

        .lessons-list{display:flex;flex-direction:column;gap:14px;}
        .lesson-card{background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;}
        .lesson-card-top{display:flex;align-items:center;gap:16px;padding:18px 22px;cursor:pointer;transition:background 0.15s;}
        .lesson-card-top:hover{background:var(--cream);}
        .lesson-subj-ico{width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}
        .lesson-info{flex:1;}
        .lesson-title{font-size:14px;font-weight:500;color:var(--text);}
        .lesson-skill{font-size:12px;color:var(--text-soft);margin-top:2px;}
        .lesson-counts{display:flex;gap:8px;align-items:center;}
        .lc-pill{font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;}
        .lesson-chevron{color:var(--text-soft);font-size:12px;transition:transform 0.2s;}
        .lesson-chevron.open{transform:rotate(180deg);}

        .lesson-expanded{border-top:1px solid var(--border);padding:20px 22px;}
        .exp-tier{margin-bottom:20px;}
        .exp-tier-title{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);}
        .exp-q-card{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:8px;}
        .exp-q-card.approved{border-color:rgba(27,94,48,0.3);background:rgba(27,94,48,0.03);}
        .exp-q-card.rejected{opacity:0.4;}
        .exp-q-stem{font-size:13px;font-weight:500;color:var(--text);margin-bottom:8px;line-height:1.5;}
        .exp-q-options{display:grid;grid-template-columns:1fr 1fr;gap:4px;}
        .exp-q-option{font-size:12px;color:var(--text-soft);padding:4px 8px;border-radius:4px;background:rgba(0,0,0,0.03);}
        .exp-q-option.correct{background:rgba(27,94,48,0.1);color:var(--green);font-weight:500;}
        .exp-q-status{display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;margin-top:8px;}
        .status-approved{background:rgba(27,94,48,0.1);color:var(--green);}
        .status-rejected{background:rgba(139,26,26,0.08);color:var(--crimson);}
        .status-pending{background:rgba(201,148,26,0.1);color:var(--gold);}
        .no-questions{font-size:13px;color:var(--text-soft);font-style:italic;padding:8px 0;}

        .empty-state{text-align:center;padding:64px 24px;color:var(--text-soft);}
        .empty-ico{font-size:36px;margin-bottom:12px;opacity:0.35;}
        .empty-txt{font-size:14px;line-height:1.7;}
        .loading-state{text-align:center;padding:80px 24px;color:var(--text-soft);font-size:14px;}

        .generating-overlay{text-align:center;padding:40px 24px;}
        .generating-spinner{font-size:28px;animation:spin 1.2s linear infinite;display:inline-block;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .generating-text{font-size:14px;color:var(--text-soft);margin-top:12px;}

        @media(max-width:768px){
          .form-grid{grid-template-columns:1fr;}
          .q-options,.exp-q-options{grid-template-columns:1fr;}
          .lesson-counts{display:none;}
        }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      <a href={`/teacher/${sectionId}`} className="back-link">← Back to Classroom</a>

      {/* PAGE HEADER */}
      <div className="page-top">
        <div>
          <div className="ph-eyebrow">
            <div className="ph-line" />
            <span className="ph-eye">Lesson Management</span>
          </div>
          <h1 className="ph-title">Lessons & <em>Questions</em></h1>
          <p className="ph-sub">Create lessons, generate AI questions, and approve them for students.</p>
        </div>
        {!showForm && (
          <button className="btn-new" onClick={() => { setShowForm(true); setFormStep('details') }}>
            + New Lesson
          </button>
        )}
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="form-card">
          <div className="form-card-header">
            <span className="form-card-title">
              {formStep === 'details' ? 'Create New Lesson' : 'Review Generated Questions'}
            </span>
            {formStep === 'details' && (
              <button
                className="btn-cancel"
                style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>

          {/* STEP 1 — DETAILS */}
          {formStep === 'details' && (
            generating ? (
              <div className="generating-overlay">
                <div className="generating-spinner">⚙</div>
                <div className="generating-text">Gemini is reading your file and generating questions…</div>
              </div>
            ) : (
              <div className="form-card-body">
                <div className="form-grid">

                  {/* Subject */}
                  <div className="field">
                    <label>Subject</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Skill name */}
                  <div className="field">
                    <label>Target Skill</label>
                    <input
                      type="text"
                      placeholder="e.g. Reading Comprehension"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                    />
                  </div>

                  {/* Lesson title */}
                  <div className="field form-grid-full">
                    <label>Lesson Title</label>
                    <input
                      type="text"
                      placeholder="e.g. How Evaporation Works"
                      value={lessonTitle}
                      onChange={e => setLessonTitle(e.target.value)}
                    />
                  </div>

                  {/* FILE UPLOAD */}
                  <div className="form-grid-full">
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '10px' }}>
                      Lesson File
                    </div>

                    {fileProcessing ? (
                      <div className="file-processing">
                        <span className="file-processing-spinner">⚙</span>
                        Reading file…
                      </div>
                    ) : attachment ? (
                      <div className="file-preview">
                        <span className="file-preview-icon">{FILE_ICON[attachment.type]}</span>
                        <div className="file-preview-info">
                          <div className="file-preview-name">{attachment.name}</div>
                          <div className="file-preview-type">
                            {attachment.type === 'docx' ? 'Word Document' :
                             attachment.type === 'pdf'  ? 'PDF' :
                             attachment.type === 'image'? 'Image' : 'Plain Text'}
                            {' '}· ready for Gemini
                          </div>
                        </div>
                        <button className="file-remove" onClick={removeAttachment} title="Remove file">✕</button>
                      </div>
                    ) : (
                      <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <span className="upload-icon">📎</span>
                        <div className="upload-title">Drop your lesson file here</div>
                        <div className="upload-sub">
                          or <span>browse to upload</span> · PDF, Word (.docx), image, or .txt
                        </div>
                      </div>
                    )}

                    {fileError && <div className="file-error-box">{fileError}</div>}
                  </div>

                  {/* Optional content textarea */}
                  <div className="form-grid-full">
                    <div className="content-divider">
                      <div className="content-divider-line" />
                      <span className="content-divider-text">
                        {attachment ? 'add extra context (optional)' : 'or type content manually'}
                      </span>
                      <div className="content-divider-line" />
                    </div>
                  </div>

                  <div className="field form-grid-full">
                    <label style={{ color: attachment ? 'var(--text-soft)' : 'var(--green)' }}>
                      Lesson Content {attachment ? '(optional — supplements the file)' : ''}
                    </label>
                    <textarea
                      placeholder={
                        attachment
                          ? 'Optional: add extra notes or context alongside the uploaded file…'
                          : 'Paste or type the lesson content that Gemini will use to generate questions…'
                      }
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>

                  {/* Question counts */}
                  <div className="form-grid-full">
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '12px' }}>
                      Questions per Difficulty
                    </div>
                    <div className="counts-row">
                      <div className="count-field">
                        <label className="basic-lbl">Basic</label>
                        <input className="count-input" type="number" min={0} max={20} value={countBasic} onChange={e => setCountBasic(Number(e.target.value))} />
                      </div>
                      <div className="count-field">
                        <label className="std-lbl">Standard</label>
                        <input className="count-input" type="number" min={0} max={20} value={countStd} onChange={e => setCountStd(Number(e.target.value))} />
                      </div>
                      <div className="count-field">
                        <label className="adv-lbl">Advanced</label>
                        <input className="count-input" type="number" min={0} max={20} value={countAdv} onChange={e => setCountAdv(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>

                {genError && <div className="error-box">{genError}</div>}

                <div className="form-actions">
                  <button className="btn-cancel" onClick={resetForm}>Cancel</button>
                  <button
                    className="btn-generate"
                    onClick={handleGenerate}
                    disabled={generating || fileProcessing}
                  >
                    {fileProcessing ? 'Processing file…' : 'Generate Questions with AI'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* STEP 2 — REVIEW */}
          {formStep === 'review' && (
            <>
              <div className="form-card-body" style={{ paddingBottom: 0 }}>
                <div className="review-header">
                  <div className="review-title">{lessonTitle}</div>
                  <div className="review-sub">
                    {skillInput} · {subject} · {pendingQs.length} questions generated —
                    select which ones to approve per tier.
                  </div>
                </div>

                {DIFF_ORDER.map(diff => {
                  const tier = pendingQs.filter(q => q.difficulty === diff)
                  if (tier.length === 0) return null
                  const selCount = tier.filter(q => selected[q.id]).length
                  return (
                    <div className="tier-section" key={diff}>
                      <div className="tier-header" style={{ background: DIFF_BG[diff] }}>
                        <div className="tier-header-left">
                          <span className="tier-badge" style={{ background: DIFF_BG[diff], color: DIFF_COLOR[diff] }}>
                            {DIFF_LABEL[diff]}
                          </span>
                          <span className="tier-count">{selCount} of {tier.length} selected</span>
                        </div>
                        <button className="tier-toggle-all" onClick={() => toggleAll(diff)}>
                          {tier.every(q => selected[q.id]) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>

                      {tier.map((q, i) => (
                        <div
                          key={q.id}
                          className={`q-card ${selected[q.id] ? 'selected' : 'rejected-card'}`}
                          onClick={() => toggleSelect(q.id)}
                        >
                          <div className="q-checkbox">
                            {selected[q.id] && <span className="q-checkbox-tick">✓</span>}
                          </div>
                          <div className="q-body">
                            <div className="q-stem">{i + 1}. {q.stem}</div>
                            <div className="q-options">
                              {(q.options as string[]).map((opt, oi) => (
                                <div key={oi} className={`q-option ${oi === q.correct_index ? 'correct' : ''}`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              <div className="approve-bar">
                <div className="approve-summary">
                  <strong>{Object.values(selected).filter(Boolean).length}</strong> of {pendingQs.length} questions will be approved and sent to students.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-cancel" onClick={resetForm}>Discard</button>
                  <button className="btn-approve" onClick={handleApprove} disabled={saving}>
                    {saving ? 'Saving…' : 'Approve & Publish'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* LESSONS LIST */}
      {loading ? (
        <div className="loading-state">Loading lessons…</div>
      ) : lessons.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-ico">📖</div>
          <div className="empty-txt">No lessons yet.<br />Create your first lesson to start generating questions.</div>
        </div>
      ) : (
        <div className="lessons-list">
          {lessons.map(lesson => {
            const col = SUBJ_COLORS[(lesson.skills as any)?.subject ?? ''] ?? SUBJ_COLORS.Science
            const isOpen = expandedLesson === lesson.id
            const lqs = getQsForLesson(lesson.id)
            const skillName = (lesson.skills as any)?.name ?? '—'
            const subjName  = (lesson.skills as any)?.subject ?? '—'

            return (
              <div className="lesson-card" key={lesson.id}>
                <div className="lesson-card-top" onClick={() => setExpandedLesson(isOpen ? null : lesson.id)}>
                  <div className="lesson-subj-ico" style={{ background: col.light, color: col.accent }}>
                    {col.icon}
                  </div>
                  <div className="lesson-info">
                    <div className="lesson-title">{lesson.title}</div>
                    <div className="lesson-skill">{subjName} · {skillName}</div>
                  </div>
                  <div className="lesson-counts">
                    {DIFF_ORDER.map(diff => {
                      const cnt = approvedCount(lesson.id, diff)
                      return (
                        <span key={diff} className="lc-pill" style={{ background: DIFF_BG[diff], color: DIFF_COLOR[diff] }}>
                          {cnt} {DIFF_LABEL[diff]}
                        </span>
                      )
                    })}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(lesson.id) }}
                    disabled={deletingId === lesson.id}
                    style={{
                      background: 'none', border: '1px solid rgba(139,26,26,0.2)',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                      color: 'var(--crimson)', fontSize: '12px', fontFamily: "'DM Sans',sans-serif",
                      opacity: deletingId === lesson.id ? 0.5 : 1, flexShrink: 0,
                    }}
                  >
                    {deletingId === lesson.id ? '…' : 'Delete'}
                  </button>
                  <span className={`lesson-chevron ${isOpen ? 'open' : ''}`}>▼</span>
                </div>

                {isOpen && (
                  <div className="lesson-expanded">
                    {lqs.length === 0 ? (
                      <div className="no-questions">No questions found for this lesson.</div>
                    ) : (
                      DIFF_ORDER.map(diff => {
                        const tier = lqs.filter(q => q.difficulty === diff)
                        if (tier.length === 0) return null
                        return (
                          <div className="exp-tier" key={diff}>
                            <div className="exp-tier-title">
                              <span style={{ background: DIFF_BG[diff], color: DIFF_COLOR[diff], padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                {DIFF_LABEL[diff]}
                              </span>
                              <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>
                                {tier.filter(q => q.status === 'approved').length} approved · {tier.filter(q => q.status === 'pending').length} pending · {tier.filter(q => q.status === 'rejected').length} rejected
                              </span>
                            </div>
                            {tier.map((q, i) => (
                              <div key={q.id} className={`exp-q-card ${q.status}`}>
                                <div className="exp-q-stem">{i + 1}. {q.stem}</div>
                                <div className="exp-q-options">
                                  {(q.options as string[]).map((opt, oi) => (
                                    <div key={oi} className={`exp-q-option ${oi === q.correct_index ? 'correct' : ''}`}>
                                      {String.fromCharCode(65 + oi)}. {opt}
                                    </div>
                                  ))}
                                </div>
                                <span className={`exp-q-status status-${q.status}`}>
                                  {q.status === 'approved' ? '✓ Approved' : q.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}