'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useParams, useRouter } from 'next/navigation'

type Section = { id: string; name: string; grade_level: number; join_code: string }
type Student = { id: string; full_name: string; lrn: string | null }

export default function ClassroomPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const [section, setSection] = useState<Section | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [sectionId])

  async function loadData() {
    const { data: sec } = await supabase
      .from('sections')
      .select('id, name, grade_level, join_code')
      .eq('id', sectionId)
      .single()
    setSection(sec)

    const { data: studs } = await supabase
      .from('profiles')
      .select('id, full_name, lrn')
      .eq('section_id', sectionId)
      .eq('role', 'student')
      .order('full_name')
    setStudents(studs ?? [])
  }

  function copyCode() {
    if (!section) return
    navigator.clipboard.writeText(section.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{`
        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: #6b6b6b; text-decoration: none;
          font-weight: 300; margin-bottom: 28px;
          transition: color 0.2s;
        }
        .back-link:hover { color: #1b5e30; }

        .page-eyebrow {
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .eyebrow-line { width: 24px; height: 2px; background: #8b1a1a; }
        .eyebrow-text {
          font-size: 11px; font-weight: 600; letter-spacing: 2.5px;
          text-transform: uppercase; color: #8b1a1a;
        }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 700; color: #0d3a1b;
          line-height: 1.05; letter-spacing: -0.3px; margin-bottom: 8px;
        }
        .page-title em { font-style: italic; color: #8b1a1a; }
        .page-grade {
          font-size: 13px; color: #6b6b6b; font-weight: 300; margin-bottom: 32px;
        }

        /* Top row */
        .top-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 16px; margin-bottom: 36px;
        }

        .info-card {
          background: #fff; border: 1px solid rgba(27,94,48,0.15);
          border-radius: 12px; padding: 20px 24px;
        }

        .info-card-label {
          font-size: 10px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #1b5e30; margin-bottom: 8px;
        }

        .info-card-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: #0d3a1b; line-height: 1;
        }

        .info-card-sub {
          font-size: 12px; color: #b0a898; margin-top: 4px; font-weight: 300;
        }

        /* Code card */
        .code-card {
          background: #0d3a1b; border-radius: 12px; padding: 20px 24px;
          position: relative; overflow: hidden;
        }
        .code-card::before {
          content: ''; position: absolute;
          width: 200px; height: 200px; border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.1);
          top: -60px; right: -60px;
        }
        .code-card-label {
          font-size: 10px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
          margin-bottom: 8px; position: relative; z-index: 1;
        }
        .code-card-row {
          display: flex; align-items: center; gap: 12px;
          position: relative; z-index: 1;
        }
        .code-big {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: #e8b84b;
          letter-spacing: 6px; line-height: 1; flex: 1;
        }
        .btn-copy-sm {
          background: rgba(201,148,26,0.15); border: 1px solid rgba(201,148,26,0.3);
          color: #e8b84b; font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; padding: 6px 12px;
          border-radius: 6px; cursor: pointer; transition: all 0.2s;
        }
        .btn-copy-sm:hover, .btn-copy-sm.copied {
          background: rgba(201,148,26,0.3); border-color: rgba(201,148,26,0.5);
        }

        /* Actions row */
        .actions-row {
          display: flex; gap: 12px; margin-bottom: 36px; flex-wrap: wrap;
        }

        .btn-action {
          padding: 11px 22px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          border: 1.5px solid rgba(27,94,48,0.2); background: #fff;
          color: #1b5e30;
        }
        .btn-action:hover {
          background: #0d3a1b; color: #fff; border-color: #0d3a1b;
        }
        .btn-action.primary {
          background: #0d3a1b; color: #fff; border-color: #0d3a1b;
        }
        .btn-action.primary:hover { background: #1b5e30; border-color: #1b5e30; }

        /* Students section */
        .section-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 700; color: #0d3a1b;
          margin-bottom: 16px; display: flex; align-items: center;
          justify-content: space-between;
        }

        .student-count {
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          font-weight: 400; color: #6b6b6b;
        }

        .students-table {
          background: #fff; border: 1px solid rgba(27,94,48,0.15);
          border-radius: 12px; overflow: hidden;
        }

        .students-table-header {
          display: grid; grid-template-columns: 1fr 160px 120px;
          padding: 12px 20px;
          background: #f0e9d8;
          border-bottom: 1px solid rgba(27,94,48,0.1);
          font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: #1b5e30;
        }

        .student-row {
          display: grid; grid-template-columns: 1fr 160px 120px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(27,94,48,0.07);
          align-items: center; transition: background 0.15s;
          text-decoration: none;
        }
        .student-row:last-child { border-bottom: none; }
        .student-row:hover { background: #faf6ee; }

        .student-name {
          font-weight: 500; color: #1a1a1a; font-size: 14px;
        }

        .student-lrn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px; color: #6b6b6b;
        }

        .btn-view {
          background: transparent; border: 1px solid rgba(27,94,48,0.2);
          color: #1b5e30; font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; padding: 5px 12px;
          border-radius: 6px; cursor: pointer; transition: all 0.2s;
          text-decoration: none; display: inline-block;
        }
        .btn-view:hover { background: #1b5e30; color: #fff; border-color: #1b5e30; }

        .empty-students {
          padding: 48px 24px; text-align: center; color: #6b6b6b;
          font-size: 14px; font-weight: 300; line-height: 1.7;
        }

        .empty-students strong { color: #0d3a1b; font-weight: 600; }

        @media (max-width: 768px) {
          .top-row { grid-template-columns: 1fr; }
          .students-table-header,
          .student-row { grid-template-columns: 1fr 100px; }
          .students-table-header > :last-child,
          .student-row > :last-child { display: none; }
        }
      `}</style>

      <a href="/teacher" className="back-link">← Back to Classrooms</a>

      <div className="page-eyebrow">
        <div className="eyebrow-line" />
        <span className="eyebrow-text">Classroom</span>
      </div>
      <h1 className="page-title">
        {section ? section.name : <em>Loading…</em>}
      </h1>
      <div className="page-grade">
        Grade {section?.grade_level} · {students.length} student{students.length !== 1 ? 's' : ''} enrolled
      </div>

      {/* Top info row */}
      <div className="top-row">
        <div className="info-card">
          <div className="info-card-label">Students Enrolled</div>
          <div className="info-card-value">{students.length}</div>
          <div className="info-card-sub">In this section</div>
        </div>

        <div className="info-card">
          <div className="info-card-label">Grade Level</div>
          <div className="info-card-value">{section?.grade_level ?? '—'}</div>
          <div className="info-card-sub">Current grade</div>
        </div>

        <div className="code-card">
          <div className="code-card-label">Student Join Code</div>
          <div className="code-card-row">
            <div className="code-big">{section?.join_code ?? '——'}</div>
            <button
              className={`btn-copy-sm ${copied ? 'copied' : ''}`}
              onClick={copyCode}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-row">
        <a href={`/teacher/${sectionId}/lessons`} className="btn-action primary">
          📚 Manage Lessons
        </a>
        <a href={`/teacher/${sectionId}/report`} className="btn-action">
          📊 View Report
        </a>
      </div>

      {/* Students list */}
<div className="section-heading">
  <span>Students</span>
  <span className="student-count">{students.length} enrolled</span>
</div>
<div className="students-table">
  {students.length === 0 ? (
    <div className="empty-students">
      No students yet. Share the join code <strong>{section?.join_code}</strong> with your class.
    </div>
  ) : (
    <>
      <div className="students-table-header">
        <span>Name</span>
        <span>LRN</span>
        <span>Action</span>
      </div>
      {students.map(s => (
        <a
          key={s.id}
          href={`/teacher/student/${s.id}`}
          className="student-row"
        >
          <span className="student-name">{s.full_name}</span>
          <span className="student-lrn">{s.lrn ?? '—'}</span>
          <span>
            <span className="btn-view">View Profile</span>
          </span>
        </a>
      ))}
    </>
  )}
</div>
    </>
  )
}