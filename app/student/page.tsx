import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function StudentDashboard() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { async get(name: string) { return (await cookieStore).get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, section_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') redirect('/login');
  if (!profile.section_id) redirect('/join');

  const { data: section } = await supabase
    .from('sections')
    .select('name, grade_level')
    .eq('id', profile.section_id)
    .single();

  const { data: skills } = await supabase
    .from('skills')
    .select(`id, name, subject, order_index, progress!left(current_difficulty, regressions, flagged)`)
    .eq('section_id', profile.section_id)
    .order('order_index');

  const skillIds = skills?.map((s: any) => s.id) ?? [];
  const { data: masteryRows } = skillIds.length > 0
    ? await supabase
        .from('mastery')
        .select('skill_id, level, accuracy, attempt_count, updated_at')
        .eq('student_id', user.id)
        .in('skill_id', skillIds)
        .order('updated_at', { ascending: false })
    : { data: [] };

  const masteryMap: Record<string, any> = {};
  for (const row of masteryRows ?? []) {
    if (!masteryMap[row.skill_id]) masteryMap[row.skill_id] = row;
  }

  const grouped: Record<string, any[]> = {};
  for (const skill of skills ?? []) {
    const sub = skill.subject ?? 'Other';
    if (!grouped[sub]) grouped[sub] = [];
    const prog = Array.isArray(skill.progress) ? skill.progress[0] : skill.progress;
    grouped[sub].push({ ...skill, progress: prog ?? null, mastery: masteryMap[skill.id] ?? null });
  }

  const subjectOrder = ['English', 'Mathematics', 'Science'];
  const subjects = [
    ...subjectOrder.filter(s => grouped[s]),
    ...Object.keys(grouped).filter(s => !subjectOrder.includes(s)),
  ];

  const firstName = profile.full_name?.split(' ')[0] ?? 'Student';

  const subjectColors: Record<string, { accent: string; light: string; icon: string }> = {
    English:     { accent: '#8b1a1a', light: 'rgba(139,26,26,0.08)',  icon: 'Aa' },
    Mathematics: { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)',   icon: '∑'  },
    Science:     { accent: '#c9941a', light: 'rgba(201,148,26,0.08)', icon: '⚗'  },
  };

  const diffLabel: Record<string, string> = { basic: 'Basic', standard: 'Standard', advanced: 'Advanced' };
  const diffColor: Record<string, string>  = { basic: '#1b5e30', standard: '#c9941a', advanced: '#8b1a1a' };
  const diffBg: Record<string, string>     = { basic: 'rgba(27,94,48,0.1)', standard: 'rgba(201,148,26,0.1)', advanced: 'rgba(139,26,26,0.1)' };
  const masteryColor: Record<string, string> = { mastered: '#1b5e30', developing: '#c9941a', needs_help: '#8b1a1a' };
  const masteryLabel: Record<string, string> = { mastered: 'Mastered', developing: 'Developing', needs_help: 'Needs Help' };

  const totalSkills   = skills?.length ?? 0;
  const masteredCount = Object.values(masteryMap).filter((m: any) => m.level === 'mastered').length;
  const flaggedCount  = (skills ?? []).filter((s: any) => {
    const p = Array.isArray(s.progress) ? s.progress[0] : s.progress;
    return p?.flagged;
  }).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root {
          --green:#1b5e30; --green-dark:#0d3a1b; --crimson:#8b1a1a;
          --gold:#c9941a; --gold-lt:#e8b84b; --cream:#faf6ee;
          --cream2:#f0e9d8; --white:#ffffff; --text:#1a1a1a;
          --text-soft:#6b6b6b; --border:rgba(27,94,48,0.15);
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--text);}
        .layout{display:flex;min-height:100vh;}
        .sidebar{width:260px;min-width:260px;background:var(--green-dark);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;}
        .sb-top{padding:28px 24px 24px;border-bottom:1px solid rgba(255,255,255,0.08);}
        .sb-logo{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .sb-logo img{width:36px;height:36px;border-radius:6px;object-fit:contain;}
        .sb-wordmark{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:var(--gold-lt);letter-spacing:1px;}
        .sb-school{font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5;}
        .sb-profile{padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);}
        .sb-avatar{width:44px;height:44px;border-radius:50%;background:rgba(201,148,26,0.25);border:1px solid rgba(201,148,26,0.4);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--gold-lt);margin-bottom:10px;}
        .sb-name{font-size:14px;font-weight:500;color:#fff;}
        .sb-meta{font-size:12px;color:rgba(255,255,255,0.45);margin-top:2px;}
        .sb-role{display:inline-block;margin-top:8px;background:rgba(201,148,26,0.18);border:1px solid rgba(201,148,26,0.35);color:var(--gold-lt);font-size:11px;padding:2px 8px;border-radius:4px;}
        .sb-nav{padding:14px 0;flex:1;}
        .nav-lbl{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.28);padding:10px 24px 4px;}
        .nav-a{display:flex;align-items:center;gap:10px;padding:8px 24px;color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none;border-left:2px solid transparent;transition:all 0.15s;}
        .nav-a:hover{color:#fff;background:rgba(255,255,255,0.04);}
        .nav-a.active{color:var(--gold-lt);border-left-color:var(--gold);background:rgba(201,148,26,0.08);}
        .nav-ic{font-size:13px;width:18px;text-align:center;}
        .sb-bottom{padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);}
        .main{flex:1;padding:40px 48px;max-width:880px;}
        .ph-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .ph-line{width:20px;height:2px;background:var(--crimson);}
        .ph-eye{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--crimson);}
        .ph-title{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:var(--text);line-height:1.2;}
        .ph-title em{color:var(--crimson);font-style:italic;}
        .ph-sub{font-size:14px;color:var(--text-soft);margin-top:5px;}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:28px 0 40px;}
        .sc{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:18px 20px;position:relative;overflow:hidden;}
        .sc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
        .sc.g::before{background:linear-gradient(90deg,var(--green),var(--gold));}
        .sc.o::before{background:linear-gradient(90deg,var(--gold),var(--gold-lt));}
        .sc.r::before{background:linear-gradient(90deg,var(--crimson),#c55);}
        .sc-lbl{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-soft);margin-bottom:5px;}
        .sc-val{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:600;color:var(--text);line-height:1;}
        .sc-desc{font-size:12px;color:var(--text-soft);margin-top:4px;}
        .subj-sec{margin-bottom:36px;}
        .subj-hdr{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);}
        .subj-ico{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;}
        .subj-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--text);}
        .subj-ct{font-size:12px;color:var(--text-soft);margin-left:auto;}
        .skills-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:14px;}
        .sk-card{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;gap:10px;}
        .sk-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
        .sk-name{font-size:14px;font-weight:500;color:var(--text);line-height:1.4;}
        .diff-badge{font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;white-space:nowrap;flex-shrink:0;}
        .m-row{display:flex;align-items:center;gap:8px;}
        .m-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
        .m-lbl{font-size:12px;color:var(--text-soft);}
        .acc-txt{font-size:12px;color:var(--text-soft);margin-left:auto;}
        .pbar-wrap{height:4px;background:var(--cream2);border-radius:2px;overflow:hidden;}
        .pbar-fill{height:100%;border-radius:2px;}
        .sk-footer{display:flex;align-items:center;justify-content:space-between;}
        .att-txt{font-size:11px;color:var(--text-soft);}
        .flag-bdg{font-size:11px;background:rgba(139,26,26,0.08);color:var(--crimson);border:1px solid rgba(139,26,26,0.2);padding:2px 7px;border-radius:4px;}
        .quiz-btn{display:block;width:100%;margin-top:2px;background:var(--green-dark);color:var(--cream);border:none;border-radius:6px;padding:9px 14px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;text-align:center;transition:background 0.15s;}
        .quiz-btn:hover{background:var(--green);}
        .empty-state{text-align:center;padding:48px 24px;color:var(--text-soft);font-size:14px;}
        .empty-ico{font-size:32px;margin-bottom:10px;opacity:0.4;}
        @media(max-width:768px){
          .layout{flex-direction:column;}
          .sidebar{width:100%;min-width:unset;height:auto;position:static;}
          .main{padding:24px 20px;}
          .stats{grid-template-columns:repeat(2,1fr);}
          .skills-grid{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sb-top">
            <div className="sb-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="UMCLS" />
              <span className="sb-wordmark">LINURI</span>
            </div>
            <div className="sb-school">United Methodist Cooperative<br />Learning System, Inc.</div>
          </div>
          <div className="sb-profile">
            <div className="sb-avatar">{profile.full_name?.charAt(0).toUpperCase() ?? 'S'}</div>
            <div className="sb-name">{profile.full_name}</div>
            <div className="sb-meta">{section?.name ?? 'Grade 6'}</div>
            <span className="sb-role">Student</span>
          </div>
          <nav className="sb-nav">
            <div className="nav-lbl">Menu</div>
            <a href="/student" className="nav-a active">
              <span className="nav-ic">◈</span> My Skills
            </a>
            <a href="/student/quiz" className="nav-a">
              <span className="nav-ic">◉</span> My Quiz
            </a>
          </nav>
          <div className="sb-bottom">
            <LogoutButton />
          </div>
        </aside>

        <main className="main">
          <div style={{ marginBottom: '28px' }}>
            <div className="ph-eyebrow">
              <div className="ph-line" />
              <span className="ph-eye">Student Dashboard</span>
            </div>
            <h1 className="ph-title">Welcome back, <em>{firstName}</em></h1>
            <p className="ph-sub">{section?.name ?? 'Grade 6'} · {section?.grade_level ?? 'Grade 6'} · S.Y. 2025–2026</p>
          </div>

          <div className="stats">
            <div className="sc g">
              <div className="sc-lbl">Skills Mastered</div>
              <div className="sc-val">{masteredCount}</div>
              <div className="sc-desc">out of {totalSkills} total skills</div>
            </div>
            <div className="sc o">
              <div className="sc-lbl">Subjects</div>
              <div className="sc-val">{subjects.length}</div>
              <div className="sc-desc">active learning areas</div>
            </div>
            <div className="sc r">
              <div className="sc-lbl">Needs Attention</div>
              <div className="sc-val">{flaggedCount}</div>
              <div className="sc-desc">{flaggedCount === 0 ? "You're on track!" : 'skill(s) flagged'}</div>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-ico">📚</div>
              <p>No skills have been added yet.<br />Your teacher will set up lessons soon.</p>
            </div>
          ) : (
            subjects.map((subject) => {
              const col = subjectColors[subject] ?? { accent: '#1b5e30', light: 'rgba(27,94,48,0.08)', icon: '●' };
              return (
                <section className="subj-sec" key={subject}>
                  <div className="subj-hdr">
                    <div className="subj-ico" style={{ background: col.light, color: col.accent }}>{col.icon}</div>
                    <span className="subj-name">{subject}</span>
                    <span className="subj-ct">{grouped[subject].length} skill{grouped[subject].length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="skills-grid">
                    {grouped[subject].map((skill: any) => {
                      const diff    = skill.progress?.current_difficulty ?? 'basic';
                      const level   = skill.mastery?.level ?? null;
                      const acc     = skill.mastery?.accuracy ?? 0;
                      const attCt   = skill.mastery?.attempt_count ?? 0;
                      const flagged = skill.progress?.flagged ?? false;
                      const pct     = level === 'mastered' ? 100
                                    : level === 'developing' ? Math.min(Math.max(acc, 10), 79)
                                    : level === 'needs_help' ? Math.min(acc, 49) : 0;
                      const btnLabel = level === 'mastered' ? 'Practice Again' : level ? 'Continue Quiz' : 'Start Quiz';
                      return (
                        <div className="sk-card" key={skill.id}>
                          <div className="sk-top">
                            <span className="sk-name">{skill.name}</span>
                            <span className="diff-badge" style={{ background: diffBg[diff] ?? diffBg.basic, color: diffColor[diff] ?? '#1b5e30' }}>
                              {diffLabel[diff] ?? diff}
                            </span>
                          </div>
                          {level ? (
                            <>
                              <div className="m-row">
                                <div className="m-dot" style={{ background: masteryColor[level] }} />
                                <span className="m-lbl">{masteryLabel[level]}</span>
                                <span className="acc-txt">{Math.round(acc)}% accuracy</span>
                              </div>
                              <div className="pbar-wrap">
                                <div className="pbar-fill" style={{ width: `${pct}%`, background: masteryColor[level] }} />
                              </div>
                            </>
                          ) : (
                            <div className="m-row">
                              <div className="m-dot" style={{ background: '#ccc' }} />
                              <span className="m-lbl" style={{ color: '#aaa' }}>Not started yet</span>
                            </div>
                          )}
                          <div className="sk-footer">
                            <span className="att-txt">{attCt > 0 ? `${attCt} attempt${attCt !== 1 ? 's' : ''}` : 'No attempts yet'}</span>
                            {flagged && <span className="flag-bdg">⚑ Flagged</span>}
                          </div>
                          <a href={`/student/quiz?skillId=${skill.id}&difficulty=${diff}`} className="quiz-btn">
                            {btnLabel}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}