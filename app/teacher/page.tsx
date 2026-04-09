'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

type Section = {
  id: string
  name: string
  grade_level: number
  join_code: string
}

export default function TeacherDashboard() {
  const [sections, setSections] = useState<Section[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('6')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadSections() }, [])

  async function loadSections() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('sections')
      .select('id, name, grade_level, join_code')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
    setSections(data ?? [])
  }

  function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  async function handleCreate() {
    if (!sectionName.trim()) { setError('Section name is required.'); return }
    setCreating(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let code = ''
    let unique = false
    while (!unique) {
      code = generateCode()
      const { data } = await supabase.from('sections').select('id').eq('join_code', code).single()
      if (!data) unique = true
    }

    const { error: err } = await supabase.from('sections').insert({
      teacher_id: user.id,
      name: sectionName.trim(),
      grade_level: parseInt(gradeLevel),
      join_code: code,
    })

    if (err) { setError('Failed to create. Try again.'); setCreating(false); return }

    setSectionName('')
    setGradeLevel('6')
    setShowCreate(false)
    setCreating(false)
    loadSections()
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <style>{`
        .page-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .eyebrow-line { width: 24px; height: 2px; background: #8b1a1a; }
        .eyebrow-text {
          font-size: 11px; font-weight: 600; letter-spacing: 2.5px;
          text-transform: uppercase; color: #8b1a1a;
        }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 700; color: #0d3a1b;
          line-height: 1.05; letter-spacing: -0.3px; margin-bottom: 32px;
        }
        .page-title em { font-style: italic; color: #8b1a1a; }

        .page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 32px;
          flex-wrap: wrap; gap: 16px;
        }

        .btn-primary {
          background: #0d3a1b; color: #fff; border: none;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600; padding: 12px 24px;
          cursor: pointer; transition: background 0.2s; white-space: nowrap;
        }
        .btn-primary:hover { background: #1b5e30; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Create form */
        .create-card {
          background: #fff; border: 1px solid rgba(27,94,48,0.15);
          border-top: 3px solid #1b5e30; border-radius: 12px;
          padding: 28px 32px; margin-bottom: 32px;
        }
        .create-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 700; color: #0d3a1b; margin-bottom: 20px;
        }
        .create-fields {
          display: grid; grid-template-columns: 1fr 160px;
          gap: 16px; margin-bottom: 20px;
        }
        .field label {
          display: block; font-size: 11px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase;
          color: #1b5e30; margin-bottom: 8px;
        }
        .field input, .field select {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid rgba(27,94,48,0.15); border-radius: 8px;
          background: #faf6ee; font-family: 'DM Sans', sans-serif;
          font-size: 15px; color: #1a1a1a; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus, .field select:focus {
          border-color: #1b5e30; box-shadow: 0 0 0 3px rgba(27,94,48,0.1);
          background: #fff;
        }
        .create-actions { display: flex; gap: 10px; }
        .btn-cancel {
          background: transparent; border: 1.5px solid rgba(27,94,48,0.15);
          color: #6b6b6b; font-family: 'DM Sans', sans-serif;
          font-size: 14px; padding: 11px 20px; border-radius: 8px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { border-color: #8b1a1a; color: #8b1a1a; }

        .error-box {
          background: rgba(139,26,26,0.07); border: 1px solid rgba(139,26,26,0.22);
          border-left: 3px solid #8b1a1a; border-radius: 8px;
          padding: 10px 14px; color: #8b1a1a; font-size: 13px; margin-bottom: 14px;
        }

        /* Empty */
        .empty {
          text-align: center; padding: 80px 40px;
          background: #fff; border: 1px solid rgba(27,94,48,0.15);
          border-radius: 16px;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 700; color: #0d3a1b; margin-bottom: 8px;
        }
        .empty-desc {
          font-size: 14px; color: #6b6b6b; font-weight: 300;
          margin-bottom: 24px; line-height: 1.7;
        }

        /* Grid */
        .sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Classroom card */
        .classroom-card {
          background: #fff; border: 1px solid rgba(27,94,48,0.15);
          border-radius: 14px; overflow: hidden;
          transition: transform 0.18s, box-shadow 0.18s;
          cursor: pointer; text-decoration: none; display: block;
        }
        .classroom-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(27,94,48,0.12);
        }

        .card-header {
          background: #0d3a1b; padding: 24px 24px 20px;
          position: relative; overflow: hidden;
        }
        .card-header::before {
          content: ''; position: absolute;
          width: 220px; height: 220px; border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.1);
          top: -70px; right: -70px;
        }
        .card-header::after {
          content: ''; position: absolute;
          width: 120px; height: 120px; border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.07);
          bottom: -40px; left: -20px;
        }

        .card-grade {
          font-size: 10px; font-weight: 600; letter-spacing: 2.5px;
          text-transform: uppercase; color: #e8b84b;
          margin-bottom: 6px; position: relative; z-index: 1;
        }

        .card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; font-weight: 700; color: #fff;
          line-height: 1.2; position: relative; z-index: 1;
        }

        .card-arrow {
          position: absolute; top: 20px; right: 20px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(201,148,26,0.15);
          border: 1px solid rgba(201,148,26,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #e8b84b;
          z-index: 1;
        }

        .card-body { padding: 18px 24px 20px; }

        .code-label {
          font-size: 10px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #1b5e30; margin-bottom: 8px;
        }

        .code-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }

        .code-display {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 700; color: #0d3a1b;
          letter-spacing: 6px; line-height: 1; flex: 1;
        }

        .btn-copy {
          background: #f0e9d8; border: 1px solid rgba(27,94,48,0.15);
          color: #1b5e30; font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; padding: 6px 12px;
          border-radius: 6px; cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-copy:hover { background: #1b5e30; color: #fff; border-color: #1b5e30; }
        .btn-copy.copied { background: #1b5e30; color: #fff; border-color: #1b5e30; }

        .card-divider { height: 1px; background: rgba(27,94,48,0.1); margin-bottom: 14px; }

        .card-hint {
          font-size: 12px; color: #b0a898; font-weight: 300;
          display: flex; align-items: center; gap: 6px;
        }

        @media (max-width: 640px) {
          .create-fields { grid-template-columns: 1fr; }
          .page-title { font-size: 30px; }
        }
      `}</style>

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">Teacher Dashboard</span>
          </div>
          <h1 className="page-title">My <em>Classrooms</em></h1>
        </div>
        {!showCreate && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Classroom
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="create-card">
          <div className="create-title">New Classroom</div>
          {error && <div className="error-box">{error}</div>}
          <div className="create-fields">
            <div className="field">
              <label>Section Name</label>
              <input
                type="text"
                placeholder="e.g. Grade 6 – Sampaguita"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Grade</label>
              <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="create-actions">
            <button className="btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create Classroom'}
            </button>
            <button className="btn-cancel" onClick={() => { setShowCreate(false); setError('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.length === 0 && !showCreate ? (
        <div className="empty">
          <div className="empty-icon">🏫</div>
          <div className="empty-title">No classrooms yet</div>
          <div className="empty-desc">
            Create your first classroom to get a join code you can share with your students.
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Classroom
          </button>
        </div>
      ) : (
        <div className="sections-grid">
          {sections.map(sec => (
            <div
              key={sec.id}
              className="classroom-card"
              onClick={() => router.push(`/teacher/${sec.id}`)}
            >
              <div className="card-header">
                <div className="card-grade">Grade {sec.grade_level}</div>
                <div className="card-name">{sec.name}</div>
                <div className="card-arrow">→</div>
              </div>
              <div className="card-body">
                <div className="code-label">Student Join Code</div>
                <div className="code-row">
                  <div className="code-display">{sec.join_code}</div>
                  <button
                    className={`btn-copy ${copied === sec.join_code ? 'copied' : ''}`}
                    onClick={e => { e.stopPropagation(); copyCode(sec.join_code) }}
                  >
                    {copied === sec.join_code ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="card-divider" />
                <div className="card-hint">
                  <span>→ Click card to open classroom</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}