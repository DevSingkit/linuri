// app/teacher/student/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useParams } from 'next/navigation'

type Profile = {
  id: string
  full_name: string
  lrn: string | null
  section_id: string | null
}

type Section = {
  name: string
  grade_level: string
}

type SkillRow = {
  id: string
  name: string
  subject: string
  order_index: number
  mastery: {
    level: string | null
    accuracy: number
    attempt_count: number
    updated_at: string
  } | null
  progress: {
    current_difficulty: string
    regressions: number
    flagged: boolean
  } | null
}

type HistoryRow = {
  id: string
  skill_id: string
  level: string
  accuracy: number
  attempt_count: number
  trend: string
  difficulty: string
  classified_at: string
}

const subjectOrder = ['English', 'Mathematics', 'Science']

const diffLabel: Record<string, string> = { basic: 'Basic', standard: 'Standard', advanced: 'Advanced' }
const diffColor: Record<string, string>  = { basic: '#1b5e30', standard: '#c9941a', advanced: '#8b1a1a' }
const diffBg: Record<string, string>     = { basic: 'rgba(27,94,48,0.1)', standard: 'rgba(201,148,26,0.1)', advanced: 'rgba(139,26,26,0.1)' }
const masteryColor: Record<string, string> = { mastered: '#1b5e30', developing: '#c9941a', needs_help: '#8b1a1a' }
const masteryLabel: Record<string, string> = { mastered: 'Mastered', developing: 'Developing', needs_help: 'Needs Help' }
const masteryBg: Record<string, string>    = { mastered: 'rgba(27,94,48,0.08)', developing: 'rgba(201,148,26,0.08)', needs_help: 'rgba(139,26,26,0.08)' }
const trendLabel: Record<string, string>   = { improving: 'Improving', stable: 'Stable', declining: 'Declining' }
const trendColor: Record<string, string>   = { improving: '#1b5e30', stable: '#c9941a', declining: '#8b1a1a' }

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [profile, setProfile]   = useState<Profile | null>(null)
  const [section, setSection]   = useState<Section | null>(null)
  const [skills,  setSkills]    = useState<SkillRow[]>([])
  const [history, setHistory]   = useState<HistoryRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)

    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, lrn, section_id')
      .eq('id', id)
      .single()

    if (!prof) { setLoading(false); return }
    setProfile(prof)

    if (prof.section_id) {
      const { data: sec } = await supabase
        .from('sections')
        .select('name, grade_level')
        .eq('id', prof.section_id)
        .single()
      setSection(sec)

      const { data: skillRows } = await supabase
        .from('skills')
        .select('id, name, subject, order_index')
        .eq('section_id', prof.section_id)
        .order('order_index')

      if (skillRows && skillRows.length > 0) {
        const skillIds = skillRows.map((s: any) => s.id)

        const { data: masteryRows } = await supabase
          .from('mastery')
          .select('skill_id, level, accuracy, attempt_count, updated_at')
          .eq('student_id', id)
          .in('skill_id', skillIds)
          .order('updated_at', { ascending: false })

        const masteryMap: Record<string, any> = {}
        for (const row of masteryRows ?? []) {
          if (!masteryMap[row.skill_id]) masteryMap[row.skill_id] = row
        }

        const { data: progressRows } = await supabase
          .from('progress')
          .select('skill_id, current_difficulty, regressions, flagged')
          .eq('student_id', id)
          .in('skill_id', skillIds)

        const progressMap: Record<string, any> = {}
        for (const row of progressRows ?? []) {
          progressMap[row.skill_id] = row
        }

        const merged: SkillRow[] = skillRows.map((s: any) => ({
          ...s,
          mastery:  masteryMap[s.id]  ?? null,
          progress: progressMap[s.id] ?? null,
        }))

        setSkills(merged)

        // Fetch full mastery history for this student across all skills
        const { data: historyRows } = await supabase
          .from('mastery_history')
          .select('id, skill_id, level, accuracy, attempt_count, trend, difficulty, classified_at')
          .eq('student_id', id)
          .in('skill_id', skillIds)
          .order('classified_at', { ascending: false })

        setHistory(historyRows ?? [])
      }
    }

    setLoading(false)
  }

  const grouped: Record<string, SkillRow[]> = {}
  for (const skill of skills) {
    const sub = skill.subject ?? 'Other'
    if (!grouped[sub]) grouped[sub] = []
    grouped[sub].push(skill)
  }
  const subjects = [
    ...subjectOrder.filter(s => grouped[s]),
    ...Object.keys(grouped).filter(s => !subjectOrder.includes(s)),
  ]

  const totalSkills   = skills.length
  const masteredCount = skills.filter(s => s.mastery?.level === 'mastered').length
  const flaggedCount  = skills.filter(s => s.progress?.flagged).length
  const avgAccuracy   = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + (s.mastery?.accuracy ?? 0), 0) / skills.length)
    : 0

  const initials = profile?.full_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  // Build skill name lookup from skills array
  const skillNameMap: Record<string, string> = {}
  for (const s of skills) skillNameMap[s.id] = s.name

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root {
          --green:      #1b5e30;
          --green-dark: #0d3a1b;
          --crimson:    #8b1a1a;
          --gold:       #c9941a;
          --gold-lt:    #e8b84b;
          --cream:      #faf6ee;
          --cream2:     #f0e9d8;
          --white:      #ffffff;
          --text:       #1a1a1a;
          --text-soft:  #6b6b6b;
          --border:     rgba(27,94,48,0.15);
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--text);}

        .back-link{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text-soft);text-decoration:none;font-weight:300;margin-bottom:28px;transition:color 0.2s;}
        .back-link:hover{color:var(--green);}

        .profile-card{
          background:var(--green-dark);border-radius:14px;
          padding:32px 36px;margin-bottom:32px;
          position:relative;overflow:hidden;
          display:flex;align-items:center;gap:28px;
        }
        .profile-card::before{
          content:'';position:absolute;
          width:400px;height:400px;border-radius:50%;
          border:1px solid rgba(201,148,26,0.08);
          top:-150px;right:-100px;pointer-events:none;
        }
        .profile-card::after{
          content:'';position:absolute;
          width:240px;height:240px;border-radius:50%;
          border:1px solid rgba(201,148,26,0.05);
          bottom:-80px;left:200px;pointer-events:none;
        }
        .profile-avatar{
          width:72px;height:72px;border-radius:50%;flex-shrink:0;
          background:rgba(201,148,26,0.2);border:2px solid rgba(201,148,26,0.4);
          display:flex;align-items:center;justify-content:center;
          font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;
          color:var(--gold-lt);position:relative;z-index:1;
        }
        .profile-info{position:relative;z-index:1;flex:1;}
        .profile-eyebrow{display:flex;align-items:center;gap:7px;margin-bottom:6px;}
        .profile-eyebrow-line{width:16px;height:2px;background:var(--gold);}
        .profile-eyebrow-text{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);}
        .profile-name{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:8px;}
        .profile-meta{display:flex;flex-wrap:wrap;gap:10px;}
        .profile-meta-item{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);}
        .profile-meta-item strong{color:rgba(255,255,255,0.8);font-weight:500;}
        .profile-meta-sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.2);}

        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:36px;}
        .sc{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px 18px;position:relative;overflow:hidden;}
        .sc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .sc.g::before{background:linear-gradient(90deg,var(--green),var(--gold));}
        .sc.o::before{background:linear-gradient(90deg,var(--gold),var(--gold-lt));}
        .sc.r::before{background:linear-gradient(90deg,var(--crimson),#c55);}
        .sc.b::before{background:linear-gradient(90deg,#1a6b8b,#2a9bc4);}
        .sc-lbl{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-soft);margin-bottom:4px;}
        .sc-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:var(--text);line-height:1;}
        .sc-desc{font-size:11px;color:var(--text-soft);margin-top:3px;}

        .subj-sec{margin-bottom:32px;}
        .subj-hdr{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);}
        .subj-ico{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;}
        .subj-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--text);}
        .subj-ct{font-size:12px;color:var(--text-soft);margin-left:auto;}

        .skills-table{background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
        .skills-table-header{
          display:grid;grid-template-columns:2fr 120px 100px 80px 90px 80px;
          padding:10px 18px;background:var(--cream2);
          border-bottom:1px solid var(--border);
          font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);
        }
        .skill-row{
          display:grid;grid-template-columns:2fr 120px 100px 80px 90px 80px;
          padding:13px 18px;border-bottom:1px solid rgba(27,94,48,0.07);
          align-items:center;transition:background 0.15s;
        }
        .skill-row:last-child{border-bottom:none;}
        .skill-row:hover{background:var(--cream);}
        .skill-row-name{font-size:13px;font-weight:500;color:var(--text);}

        .mastery-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;}
        .mastery-dot{width:6px;height:6px;border-radius:50%;}
        .diff-badge{font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;display:inline-block;}
        .acc-cell{font-size:13px;color:var(--text);}
        .acc-sub{font-size:11px;color:var(--text-soft);}
        .pbar-wrap{height:4px;background:var(--cream2);border-radius:2px;overflow:hidden;margin-top:4px;}
        .pbar-fill{height:100%;border-radius:2px;}
        .flag-badge{font-size:10px;background:rgba(139,26,26,0.08);color:var(--crimson);border:1px solid rgba(139,26,26,0.2);padding:2px 6px;border-radius:4px;display:inline-block;}
        .ok-badge{font-size:10px;background:rgba(27,94,48,0.08);color:var(--green);border:1px solid rgba(27,94,48,0.2);padding:2px 6px;border-radius:4px;display:inline-block;}
        .not-started{font-size:12px;color:#bbb;font-style:italic;}

        /* MASTERY HISTORY */
        .history-section{margin-top:40px;}
        .history-hdr{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border);}
        .history-hdr-line{width:20px;height:2px;background:var(--crimson);}
        .history-hdr-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--text);}
        .history-hdr-count{font-size:12px;color:var(--text-soft);margin-left:auto;}

        .history-skill-block{margin-bottom:20px;}
        .history-skill-label{
          font-size:11px;font-weight:600;letter-spacing:1.5px;
          text-transform:uppercase;color:var(--green);
          margin-bottom:8px;padding:6px 0;
          border-bottom:1px solid var(--border);
        }

        .history-table{background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
        .history-table-header{
          display:grid;
          grid-template-columns:1.6fr 110px 80px 80px 80px 140px;
          padding:9px 16px;background:var(--cream2);
          border-bottom:1px solid var(--border);
          font-size:10px;font-weight:600;letter-spacing:1.5px;
          text-transform:uppercase;color:var(--green);
        }
        .history-row{
          display:grid;
          grid-template-columns:1.6fr 110px 80px 80px 80px 140px;
          padding:11px 16px;
          border-bottom:1px solid rgba(27,94,48,0.07);
          align-items:center;font-size:12px;
          transition:background 0.15s;
        }
        .history-row:last-child{border-bottom:none;}
        .history-row:hover{background:var(--cream);}

        .history-empty{font-size:13px;color:var(--text-soft);font-style:italic;padding:20px 0;text-align:center;}

        .empty-state{text-align:center;padding:48px 24px;color:var(--text-soft);font-size:14px;}
        .loading-state{text-align:center;padding:80px 24px;color:var(--text-soft);font-size:14px;}

        @media(max-width:900px){
          .stats{grid-template-columns:repeat(2,1fr);}
          .skills-table-header,.skill-row{grid-template-columns:2fr 110px 90px 70px;}
          .skill-row>:nth-child(5),.skill-row>:nth-child(6),
          .skills-table-header>:nth-child(5),.skills-table-header>:nth-child(6){display:none;}
          .history-table-header,.history-row{grid-template-columns:1.6fr 100px 70px 70px 130px;}
          .history-row>:nth-child(4),.history-table-header>:nth-child(4){display:none;}
        }
        @media(max-width:600px){
          .profile-card{flex-direction:column;align-items:flex-start;gap:16px;}
          .stats{grid-template-columns:repeat(2,1fr);}
          .skills-table-header,.skill-row{grid-template-columns:2fr 100px 80px;}
          .skill-row>:nth-child(4),.skills-table-header>:nth-child(4){display:none;}
          .history-table-header,.history-row{grid-template-columns:1.6fr 100px 120px;}
          .history-row>:nth-child(3),.history-table-header>:nth-child(3),
          .history-row>:nth-child(4),.history-table-header>:nth-child(4),
          .history-row>:nth-child(5),.history-table-header>:nth-child(5){display:none;}
        }
      `}</style>

      <a href={`/teacher`} className="back-link">← Back to Classrooms</a>

      {loading ? (
        <div className="loading-state">Loading student profile…</div>
      ) : !profile ? (
        <div className="empty-state">Student not found.</div>
      ) : (
        <>
          {/* PROFILE HEADER */}
          <div className="profile-card">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <div className="profile-eyebrow">
                <div className="profile-eyebrow-line" />
                <span className="profile-eyebrow-text">Student Profile</span>
              </div>
              <div className="profile-name">{profile.full_name}</div>
              <div className="profile-meta">
                {profile.lrn && (
                  <>
                    <span className="profile-meta-item">
                      <span>LRN</span>
                      <strong>{profile.lrn}</strong>
                    </span>
                    <span className="profile-meta-sep" />
                  </>
                )}
                {section && (
                  <>
                    <span className="profile-meta-item">
                      <span>Section</span>
                      <strong>{section.name}</strong>
                    </span>
                    <span className="profile-meta-sep" />
                    <span className="profile-meta-item">
                      <span>Grade</span>
                      <strong>{section.grade_level}</strong>
                    </span>
                  </>
                )}
                {flaggedCount > 0 && (
                  <>
                    <span className="profile-meta-sep" />
                    <span className="profile-meta-item" style={{ color: '#f26d6d' }}>
                      ⚑ <strong style={{ color: '#f26d6d' }}>{flaggedCount} skill{flaggedCount !== 1 ? 's' : ''} flagged</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="stats">
            <div className="sc g">
              <div className="sc-lbl">Skills Mastered</div>
              <div className="sc-val">{masteredCount}</div>
              <div className="sc-desc">out of {totalSkills} total</div>
            </div>
            <div className="sc o">
              <div className="sc-lbl">Avg Accuracy</div>
              <div className="sc-val">{avgAccuracy}%</div>
              <div className="sc-desc">across all skills</div>
            </div>
            <div className="sc r">
              <div className="sc-lbl">Flagged Skills</div>
              <div className="sc-val">{flaggedCount}</div>
              <div className="sc-desc">{flaggedCount === 0 ? 'None — on track' : 'needs attention'}</div>
            </div>
            <div className="sc b">
              <div className="sc-lbl">Total Attempts</div>
              <div className="sc-val">{skills.reduce((sum, s) => sum + (s.mastery?.attempt_count ?? 0), 0)}</div>
              <div className="sc-desc">quiz sessions</div>
            </div>
          </div>

          {/* SKILLS BY SUBJECT */}
          {subjects.length === 0 ? (
            <div className="empty-state">No skills have been added to this section yet.</div>
          ) : (
            subjects.map(subject => {
              const subColors: Record<string, { accent: string; light: string; icon: string }> = {
                English:     { accent: '#8b1a1a', light: 'rgba(139,26,26,0.08)',  icon: 'Aa' },
                Mathematics: { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)',   icon: '∑'  },
                Science:     { accent: '#c9941a', light: 'rgba(201,148,26,0.08)', icon: '⚗'  },
              }
              const col = subColors[subject] ?? { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)', icon: '●' }

              return (
                <div className="subj-sec" key={subject}>
                  <div className="subj-hdr">
                    <div className="subj-ico" style={{ background: col.light, color: col.accent }}>{col.icon}</div>
                    <span className="subj-name">{subject}</span>
                    <span className="subj-ct">{grouped[subject].length} skill{grouped[subject].length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="skills-table">
                    <div className="skills-table-header">
                      <span>Skill</span>
                      <span>Mastery</span>
                      <span>Accuracy</span>
                      <span>Attempts</span>
                      <span>Difficulty</span>
                      <span>Status</span>
                    </div>

                    {grouped[subject].map(skill => {
                      const level   = skill.mastery?.level ?? null
                      const acc     = skill.mastery?.accuracy ?? 0
                      const attCt   = skill.mastery?.attempt_count ?? 0
                      const diff    = skill.progress?.current_difficulty ?? 'basic'
                      const flagged = skill.progress?.flagged ?? false
                      const pct     = level === 'mastered' ? 100
                                    : level === 'developing' ? Math.min(Math.max(acc, 10), 79)
                                    : level === 'needs_help' ? Math.min(acc, 49) : 0

                      return (
                        <div className="skill-row" key={skill.id}>
                          <span className="skill-row-name">{skill.name}</span>

                          {level ? (
                            <span className="mastery-pill" style={{ background: masteryBg[level], color: masteryColor[level] }}>
                              <span className="mastery-dot" style={{ background: masteryColor[level] }} />
                              {masteryLabel[level]}
                            </span>
                          ) : (
                            <span className="not-started">Not started</span>
                          )}

                          {level ? (
                            <div>
                              <div className="acc-cell">{Math.round(acc)}%</div>
                              <div className="pbar-wrap">
                                <div className="pbar-fill" style={{ width: `${pct}%`, background: masteryColor[level] }} />
                              </div>
                            </div>
                          ) : (
                            <span className="not-started">—</span>
                          )}

                          <span className="acc-cell">{attCt > 0 ? attCt : '—'}</span>

                          <span className="diff-badge" style={{ background: diffBg[diff], color: diffColor[diff] }}>
                            {diffLabel[diff]}
                          </span>

                          {flagged
                            ? <span className="flag-badge">⚑ Flagged</span>
                            : <span className="ok-badge">✓ OK</span>
                          }
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}

          {/* MASTERY HISTORY */}
          <div className="history-section">
            <div className="history-hdr">
              <div className="history-hdr-line" />
              <span className="history-hdr-title">Mastery History</span>
              <span className="history-hdr-count">{history.length} classification event{history.length !== 1 ? 's' : ''}</span>
            </div>

            {history.length === 0 ? (
              <div className="history-empty">No classification history yet. History is recorded after each quiz submission.</div>
            ) : (
              skills.map(skill => {
                const skillHistory = history.filter(h => h.skill_id === skill.id)
                if (skillHistory.length === 0) return null
                return (
                  <div className="history-skill-block" key={skill.id}>
                    <div className="history-skill-label">{skill.name} · {skill.subject}</div>
                    <div className="history-table">
                      <div className="history-table-header">
                        <span>Date</span>
                        <span>Mastery</span>
                        <span>Accuracy</span>
                        <span>Attempts</span>
                        <span>Trend</span>
                        <span>Difficulty</span>
                      </div>
                      {skillHistory.map(h => (
                        <div className="history-row" key={h.id}>
                          <span style={{ color: 'var(--text-soft)' }}>
                            {new Date(h.classified_at).toLocaleDateString('en-PH', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <span className="mastery-pill" style={{ background: masteryBg[h.level], color: masteryColor[h.level] }}>
                            <span className="mastery-dot" style={{ background: masteryColor[h.level] }} />
                            {masteryLabel[h.level] ?? h.level}
                          </span>
                          <span style={{ color: 'var(--text)' }}>{Math.round(h.accuracy)}%</span>
                          <span style={{ color: 'var(--text-soft)' }}>{h.attempt_count}</span>
                          <span style={{ color: trendColor[h.trend] ?? 'var(--text-soft)', fontWeight: 500 }}>
                            {trendLabel[h.trend] ?? h.trend}
                          </span>
                          <span className="diff-badge" style={{ background: diffBg[h.difficulty], color: diffColor[h.difficulty] }}>
                            {diffLabel[h.difficulty] ?? h.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </>
  )
}