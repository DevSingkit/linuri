// app/teacher/[sectionId]/report/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useParams } from 'next/navigation'

type Section = { id: string; name: string; grade_level: string }
type Student = { id: string; full_name: string; lrn: string | null }
type Skill   = { id: string; name: string; subject: string; order_index: number }

type StudentMastery = {
  student_id: string
  skill_id: string
  level: string
  accuracy: number
  attempt_count: number
}

type StudentProgress = {
  student_id: string
  skill_id: string
  current_difficulty: string
  regressions: number
  flagged: boolean
}

const subjectOrder = ['English', 'Mathematics', 'Science']
const subjectColors: Record<string, { accent: string; light: string; icon: string }> = {
  English:     { accent: '#8b1a1a', light: 'rgba(139,26,26,0.08)',  icon: 'Aa' },
  Mathematics: { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)',   icon: '∑'  },
  Science:     { accent: '#c9941a', light: 'rgba(201,148,26,0.08)', icon: '⚗'  },
}

export default function SectionReportPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const supabase = createClient()

  const [section,   setSection]   = useState<Section | null>(null)
  const [students,  setStudents]  = useState<Student[]>([])
  const [skills,    setSkills]    = useState<Skill[]>([])
  const [masteries, setMasteries] = useState<StudentMastery[]>([])
  const [progresses,setProgresses]= useState<StudentProgress[]>([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'students' | 'skills'>('students')

  useEffect(() => { loadData() }, [sectionId])

  async function loadData() {
    setLoading(true)

    const { data: sec } = await supabase
      .from('sections')
      .select('id, name, grade_level')
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

    const { data: skillRows } = await supabase
      .from('skills')
      .select('id, name, subject, order_index')
      .eq('section_id', sectionId)
      .order('order_index')
    setSkills(skillRows ?? [])

    if (studs && studs.length > 0 && skillRows && skillRows.length > 0) {
      const studentIds = studs.map((s: Student) => s.id)
      const skillIds   = skillRows.map((s: Skill) => s.id)

      // Latest mastery per student per skill
      const { data: masteryRows } = await supabase
        .from('mastery')
        .select('student_id, skill_id, level, accuracy, attempt_count, updated_at')
        .in('student_id', studentIds)
        .in('skill_id', skillIds)
        .order('updated_at', { ascending: false })

      // Deduplicate — keep latest per student+skill
      const seen = new Set<string>()
      const deduped: StudentMastery[] = []
      for (const row of masteryRows ?? []) {
        const key = `${row.student_id}:${row.skill_id}`
        if (!seen.has(key)) { seen.add(key); deduped.push(row) }
      }
      setMasteries(deduped)

      const { data: progRows } = await supabase
        .from('progress')
        .select('student_id, skill_id, current_difficulty, regressions, flagged')
        .in('student_id', studentIds)
        .in('skill_id', skillIds)
      setProgresses(progRows ?? [])
    }

    setLoading(false)
  }

  // Helper: get mastery for a student+skill
  function getMastery(studentId: string, skillId: string) {
    return masteries.find(m => m.student_id === studentId && m.skill_id === skillId) ?? null
  }
  function getProgress(studentId: string, skillId: string) {
    return progresses.find(p => p.student_id === studentId && p.skill_id === skillId) ?? null
  }

  // Per-student stats
  const studentStats = students.map(student => {
    const masteredSkills = skills.filter(sk => getMastery(student.id, sk.id)?.level === 'mastered').length
    const totalAttempted = skills.filter(sk => getMastery(student.id, sk.id) !== null).length
    const flaggedSkills  = skills.filter(sk => getProgress(student.id, sk.id)?.flagged).length
    const accuracies     = skills.map(sk => getMastery(student.id, sk.id)?.accuracy ?? null).filter(a => a !== null) as number[]
    const avgAccuracy    = accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0
    const masteryPct     = skills.length > 0 ? Math.round((masteredSkills / skills.length) * 100) : 0
    const isReady        = skills.length > 0 && masteredSkills >= Math.ceil(skills.length * 0.75)
    return { student, masteredSkills, totalAttempted, flaggedSkills, avgAccuracy, masteryPct, isReady }
  })

  // Per-skill stats
  const skillStats = skills.map(skill => {
    const attempted  = students.filter(st => getMastery(st.id, skill.id) !== null).length
    const mastered   = students.filter(st => getMastery(st.id, skill.id)?.level === 'mastered').length
    const developing = students.filter(st => getMastery(st.id, skill.id)?.level === 'developing').length
    const needsHelp  = students.filter(st => getMastery(st.id, skill.id)?.level === 'needs_help').length
    const flagged    = students.filter(st => getProgress(st.id, skill.id)?.flagged).length
    const masteryPct = students.length > 0 ? Math.round((mastered / students.length) * 100) : 0
    return { skill, attempted, mastered, developing, needsHelp, flagged, masteryPct }
  })

  // Section summary
  const readyCount    = studentStats.filter(s => s.isReady).length
  const flaggedCount  = studentStats.filter(s => s.flaggedSkills > 0).length
  const sectionAvgAcc = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.avgAccuracy, 0) / studentStats.length)
    : 0
  const overallReadyPct = students.length > 0 ? Math.round((readyCount / students.length) * 100) : 0

  // Group skills by subject for skill breakdown
  const grouped: Record<string, typeof skillStats> = {}
  for (const ss of skillStats) {
    const sub = ss.skill.subject ?? 'Other'
    if (!grouped[sub]) grouped[sub] = []
    grouped[sub].push(ss)
  }
  const subjects = [
    ...subjectOrder.filter(s => grouped[s]),
    ...Object.keys(grouped).filter(s => !subjectOrder.includes(s)),
  ]

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

        /* PAGE HEADER */
        .ph-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .ph-line{width:20px;height:2px;background:var(--crimson);}
        .ph-eye{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--crimson);}
        .ph-title{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--text);line-height:1.2;margin-bottom:5px;}
        .ph-title em{color:var(--crimson);font-style:italic;}
        .ph-sub{font-size:14px;color:var(--text-soft);margin-bottom:32px;}

        /* READINESS BANNER */
        .readiness-banner{
          background:var(--green-dark);border-radius:14px;
          padding:28px 32px;margin-bottom:28px;
          display:flex;align-items:center;gap:32px;
          position:relative;overflow:hidden;
        }
        .readiness-banner::before{
          content:'';position:absolute;width:350px;height:350px;border-radius:50%;
          border:1px solid rgba(201,148,26,0.08);top:-120px;right:-80px;pointer-events:none;
        }
        .rb-main{position:relative;z-index:1;flex:1;}
        .rb-eyebrow{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;}
        .rb-pct{font-family:'Cormorant Garamond',serif;font-size:56px;font-weight:700;color:var(--gold-lt);line-height:1;}
        .rb-label{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;}
        .rb-bar-wrap{flex:2;position:relative;z-index:1;}
        .rb-bar-label{font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:8px;}
        .rb-bar-track{height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;}
        .rb-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--green),var(--gold-lt));transition:width 0.6s ease;}
        .rb-counts{display:flex;gap:24px;margin-top:12px;}
        .rb-count{font-size:12px;color:rgba(255,255,255,0.5);}
        .rb-count strong{color:#fff;font-weight:500;}

        /* STAT CARDS */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px;}
        .sc{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px 18px;position:relative;overflow:hidden;}
        .sc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .sc.g::before{background:linear-gradient(90deg,var(--green),var(--gold));}
        .sc.o::before{background:linear-gradient(90deg,var(--gold),var(--gold-lt));}
        .sc.r::before{background:linear-gradient(90deg,var(--crimson),#c55);}
        .sc.b::before{background:linear-gradient(90deg,#1a6b8b,#2a9bc4);}
        .sc-lbl{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-soft);margin-bottom:4px;}
        .sc-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:var(--text);line-height:1;}
        .sc-desc{font-size:11px;color:var(--text-soft);margin-top:3px;}

        /* TABS */
        .tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:1px solid var(--border);}
        .tab-btn{padding:10px 20px;background:transparent;border:none;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:var(--text-soft);cursor:pointer;margin-bottom:-1px;transition:all 0.15s;}
        .tab-btn:hover{color:var(--text);}
        .tab-btn.active{color:var(--green-dark);border-bottom-color:var(--green-dark);font-weight:600;}

        /* STUDENT TABLE */
        .report-table{background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:32px;}
        .report-table-header{
          display:grid;grid-template-columns:2fr 130px 100px 80px 100px 90px;
          padding:10px 18px;background:var(--cream2);
          border-bottom:1px solid var(--border);
          font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);
        }
        .report-row{
          display:grid;grid-template-columns:2fr 130px 100px 80px 100px 90px;
          padding:13px 18px;border-bottom:1px solid rgba(27,94,48,0.07);
          align-items:center;transition:background 0.15s;text-decoration:none;color:inherit;
        }
        .report-row:last-child{border-bottom:none;}
        .report-row:hover{background:var(--cream);}
        .rr-name{font-size:13px;font-weight:500;color:var(--text);}
        .rr-lrn{font-size:11px;color:var(--text-soft);margin-top:1px;}

        .mastery-bar-wrap{display:flex;align-items:center;gap:8px;}
        .mastery-bar-track{flex:1;height:5px;background:var(--cream2);border-radius:3px;overflow:hidden;}
        .mastery-bar-fill{height:100%;border-radius:3px;}
        .mastery-bar-pct{font-size:11px;color:var(--text-soft);white-space:nowrap;}

        .ready-badge{font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px;display:inline-block;}
        .ready-yes{background:rgba(27,94,48,0.1);color:var(--green);border:1px solid rgba(27,94,48,0.2);}
        .ready-no{background:rgba(139,26,26,0.08);color:var(--crimson);border:1px solid rgba(139,26,26,0.15);}

        .flag-badge{font-size:11px;background:rgba(139,26,26,0.08);color:var(--crimson);border:1px solid rgba(139,26,26,0.2);padding:2px 7px;border-radius:4px;display:inline-block;}
        .ok-badge{font-size:11px;background:rgba(27,94,48,0.08);color:var(--green);border:1px solid rgba(27,94,48,0.15);padding:2px 7px;border-radius:4px;display:inline-block;}

        /* SKILL BREAKDOWN */
        .subj-sec{margin-bottom:28px;}
        .subj-hdr{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);}
        .subj-ico{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;}
        .subj-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--text);}

        .skill-breakdown-table{background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
        .sbt-header{
          display:grid;grid-template-columns:2fr 110px 90px 90px 90px 80px;
          padding:10px 18px;background:var(--cream2);border-bottom:1px solid var(--border);
          font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);
        }
        .sbt-row{
          display:grid;grid-template-columns:2fr 110px 90px 90px 90px 80px;
          padding:12px 18px;border-bottom:1px solid rgba(27,94,48,0.07);align-items:center;
        }
        .sbt-row:last-child{border-bottom:none;}
        .sbt-name{font-size:13px;font-weight:500;color:var(--text);}

        .donut-wrap{display:flex;align-items:center;gap:8px;}
        .donut-pct{font-size:13px;font-weight:500;}
        .donut-bar-track{width:60px;height:5px;background:var(--cream2);border-radius:3px;overflow:hidden;}
        .donut-bar-fill{height:100%;border-radius:3px;background:var(--green);}

        .pill{display:inline-block;font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;min-width:28px;text-align:center;}
        .pill-green{background:rgba(27,94,48,0.1);color:var(--green);}
        .pill-amber{background:rgba(201,148,26,0.1);color:var(--gold);}
        .pill-red{background:rgba(139,26,26,0.08);color:var(--crimson);}
        .pill-gray{background:rgba(107,107,107,0.08);color:var(--text-soft);}

        .empty-state{text-align:center;padding:48px 24px;color:var(--text-soft);font-size:14px;}
        .loading-state{text-align:center;padding:80px 24px;color:var(--text-soft);font-size:14px;}

        @media(max-width:900px){
          .stats{grid-template-columns:repeat(2,1fr);}
          .readiness-banner{flex-direction:column;gap:16px;}
          .report-table-header,.report-row{grid-template-columns:2fr 110px 80px 80px;}
          .report-row>:nth-child(5),.report-row>:nth-child(6),
          .report-table-header>:nth-child(5),.report-table-header>:nth-child(6){display:none;}
          .sbt-header,.sbt-row{grid-template-columns:2fr 90px 70px 70px;}
          .sbt-row>:nth-child(5),.sbt-row>:nth-child(6),
          .sbt-header>:nth-child(5),.sbt-header>:nth-child(6){display:none;}
        }
      `}</style>

      <a href={`/teacher/${sectionId}`} className="back-link">← Back to Classroom</a>

      {loading ? (
        <div className="loading-state">Loading report…</div>
      ) : (
        <>
          {/* PAGE HEADER */}
          <div style={{ marginBottom: '28px' }}>
            <div className="ph-eyebrow">
              <div className="ph-line" />
              <span className="ph-eye">Section Report</span>
            </div>
            <h1 className="ph-title">
              {section?.name ?? 'Section'} — <em>Readiness</em>
            </h1>
            <p className="ph-sub">
              {section?.grade_level ?? 'Grade 6'} · {students.length} student{students.length !== 1 ? 's' : ''} · {skills.length} skill{skills.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* READINESS BANNER */}
          <div className="readiness-banner">
            <div className="rb-main">
              <div className="rb-eyebrow">Section Readiness</div>
              <div className="rb-pct">{overallReadyPct}%</div>
              <div className="rb-label">of students are Ready</div>
            </div>
            <div className="rb-bar-wrap">
              <div className="rb-bar-label">Overall progress — {readyCount} of {students.length} students ready</div>
              <div className="rb-bar-track">
                <div className="rb-bar-fill" style={{ width: `${overallReadyPct}%` }} />
              </div>
              <div className="rb-counts">
                <span className="rb-count">✓ Ready: <strong>{readyCount}</strong></span>
                <span className="rb-count">✗ Not Ready: <strong>{students.length - readyCount}</strong></span>
                <span className="rb-count">⚑ Flagged: <strong>{flaggedCount}</strong></span>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="stats">
            <div className="sc g">
              <div className="sc-lbl">Students Enrolled</div>
              <div className="sc-val">{students.length}</div>
              <div className="sc-desc">in this section</div>
            </div>
            <div className="sc o">
              <div className="sc-lbl">Avg Accuracy</div>
              <div className="sc-val">{sectionAvgAcc}%</div>
              <div className="sc-desc">across all students</div>
            </div>
            <div className="sc r">
              <div className="sc-lbl">Flagged Students</div>
              <div className="sc-val">{flaggedCount}</div>
              <div className="sc-desc">{flaggedCount === 0 ? 'None — great!' : 'need attention'}</div>
            </div>
            <div className="sc b">
              <div className="sc-lbl">Total Skills</div>
              <div className="sc-val">{skills.length}</div>
              <div className="sc-desc">across all subjects</div>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students ({students.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              Skills Breakdown ({skills.length})
            </button>
          </div>

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            students.length === 0 ? (
              <div className="empty-state">No students enrolled in this section yet.</div>
            ) : (
              <div className="report-table">
                <div className="report-table-header">
                  <span>Student</span>
                  <span>Mastery</span>
                  <span>Avg Accuracy</span>
                  <span>Attempted</span>
                  <span>Status</span>
                  <span>Flags</span>
                </div>
                {studentStats.map(({ student, masteredSkills, totalAttempted, flaggedSkills, avgAccuracy, masteryPct, isReady }) => {
                  const barColor = masteryPct >= 75 ? '#1b5e30' : masteryPct >= 40 ? '#c9941a' : '#8b1a1a'
                  return (
                    <a
                      key={student.id}
                      href={`/teacher/student/${student.id}`}
                      className="report-row"
                    >
                      <div>
                        <div className="rr-name">{student.full_name}</div>
                        {student.lrn && <div className="rr-lrn">{student.lrn}</div>}
                      </div>
                      <div className="mastery-bar-wrap">
                        <div className="mastery-bar-track">
                          <div className="mastery-bar-fill" style={{ width: `${masteryPct}%`, background: barColor }} />
                        </div>
                        <span className="mastery-bar-pct">{masteredSkills}/{skills.length}</span>
                      </div>
                      <span style={{ fontSize: '13px' }}>{avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}</span>
                      <span style={{ fontSize: '13px' }}>{totalAttempted > 0 ? `${totalAttempted}/${skills.length}` : '—'}</span>
                      <span className={`ready-badge ${isReady ? 'ready-yes' : 'ready-no'}`}>
                        {isReady ? '✓ Ready' : '✗ Not Ready'}
                      </span>
                      <span>
                        {flaggedSkills > 0
                          ? <span className="flag-badge">⚑ {flaggedSkills}</span>
                          : <span className="ok-badge">✓ OK</span>
                        }
                      </span>
                    </a>
                  )
                })}
              </div>
            )
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            skills.length === 0 ? (
              <div className="empty-state">No skills have been added to this section yet.</div>
            ) : (
              subjects.map(subject => {
                const col = subjectColors[subject] ?? { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)', icon: '●' }
                return (
                  <div className="subj-sec" key={subject}>
                    <div className="subj-hdr">
                      <div className="subj-ico" style={{ background: col.light, color: col.accent }}>{col.icon}</div>
                      <span className="subj-name">{subject}</span>
                    </div>
                    <div className="skill-breakdown-table">
                      <div className="sbt-header">
                        <span>Skill</span>
                        <span>Mastered</span>
                        <span>Developing</span>
                        <span>Needs Help</span>
                        <span>Not Started</span>
                        <span>Flagged</span>
                      </div>
                      {grouped[subject].map(({ skill, mastered, developing, needsHelp, flagged, masteryPct, attempted }) => {
                        const notStarted = students.length - attempted
                        return (
                          <div className="sbt-row" key={skill.id}>
                            <div>
                              <div className="sbt-name">{skill.name}</div>
                              <div className="donut-wrap" style={{ marginTop: '4px' }}>
                                <div className="donut-bar-track">
                                  <div className="donut-bar-fill" style={{ width: `${masteryPct}%` }} />
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>{masteryPct}% mastered</span>
                              </div>
                            </div>
                            <span className="pill pill-green">{mastered}</span>
                            <span className="pill pill-amber">{developing}</span>
                            <span className="pill pill-red">{needsHelp}</span>
                            <span className="pill pill-gray">{notStarted}</span>
                            <span>
                              {flagged > 0
                                ? <span className="flag-badge">⚑ {flagged}</span>
                                : <span className="ok-badge">✓</span>
                              }
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )
          )}
        </>
      )}
    </>
  )
}