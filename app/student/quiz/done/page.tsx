'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/client';
import LogoutButton from '@/components/LogoutButton';

type ClassifyResult = {
  level: 'needs_help' | 'developing' | 'mastered';
  next_difficulty: 'basic' | 'standard' | 'advanced';
};

type SidebarData = {
  full_name: string;
  section_name: string;
};

const LEVEL_CONFIG = {
  mastered: {
    label: 'Mastered',
    color: 'var(--green)',
    bg: 'rgba(27,94,48,0.08)',
    border: 'rgba(27,94,48,0.2)',
    message: "Excellent work! You've mastered this skill.",
    icon: '✦',
  },
  developing: {
    label: 'Developing',
    color: 'var(--gold)',
    bg: 'rgba(201,148,26,0.08)',
    border: 'rgba(201,148,26,0.2)',
    message: 'Good effort. Keep practising to strengthen this skill.',
    icon: '◈',
  },
  needs_help: {
    label: 'Needs Help',
    color: 'var(--crimson)',
    bg: 'rgba(139,26,26,0.08)',
    border: 'rgba(139,26,26,0.2)',
    message: "Don't give up. Try the easier level to build confidence.",
    icon: '◇',
  },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  advanced: 'Advanced',
};

export default function QuizDonePage() {
  const router = useRouter();
  const params = useSearchParams();
  const attemptId = params.get('attemptId') ?? '';

  const supabase = createClient();

  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [skillId, setSkillId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Sidebar ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSidebar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, section_id')
        .eq('id', user.id)
        .single();
      if (!profile) return;
      let section_name = 'Grade 6';
      if (profile.section_id) {
        const { data: sec } = await supabase
          .from('sections')
          .select('name')
          .eq('id', profile.section_id)
          .single();
        if (sec) section_name = sec.name;
      }
      setSidebar({ full_name: profile.full_name ?? 'Student', section_name });
    }
    loadSidebar();
  }, []);

  // ── Classify + fetch attempt ─────────────────────────────────────
  useEffect(() => {
    if (!attemptId) { setError('Missing attempt ID.'); setLoading(false); return; }

    async function run() {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });

      if (!res.ok) { setError('Failed to classify attempt.'); setLoading(false); return; }
      const classified: ClassifyResult = await res.json();
      setResult(classified);

      const { data: attempt } = await supabase
        .from('attempts')
        .select('score, total, skill_id')
        .eq('id', attemptId)
        .single();

      if (attempt) {
        setScore(attempt.score);
        setTotal(attempt.total);
        setSkillId(attempt.skill_id);
      }

      setLoading(false);
    }

    run();
  }, [attemptId]);

  const cfg = result ? LEVEL_CONFIG[result.level] : null;
  const correct = result ? Math.round((score / 100) * total) : 0;
  const initials = sidebar?.full_name?.charAt(0).toUpperCase() ?? 'S';

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

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--text); }

        /* ── Layout ── */
        .layout { display: flex; min-height: 100vh; }

        /* ── Sidebar — identical to student/page.tsx ── */
        .sidebar { width: 260px; min-width: 260px; background: var(--green-dark); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-top { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sb-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .sb-logo img { width: 36px; height: 36px; border-radius: 6px; object-fit: contain; }
        .sb-wordmark { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--gold-lt); letter-spacing: 1px; }
        .sb-school { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; }
        .sb-profile { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sb-avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(201,148,26,0.25); border: 1px solid rgba(201,148,26,0.4); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 600; color: var(--gold-lt); margin-bottom: 10px; }
        .sb-name { font-size: 14px; font-weight: 500; color: #fff; }
        .sb-meta { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 2px; }
        .sb-role { display: inline-block; margin-top: 8px; background: rgba(201,148,26,0.18); border: 1px solid rgba(201,148,26,0.35); color: var(--gold-lt); font-size: 11px; padding: 2px 8px; border-radius: 4px; }
        .sb-nav { padding: 14px 0; flex: 1; }
        .nav-lbl { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.28); padding: 10px 24px 4px; }
        .nav-a { display: flex; align-items: center; gap: 10px; padding: 8px 24px; color: rgba(255,255,255,0.5); font-size: 13px; text-decoration: none; border-left: 2px solid transparent; transition: all 0.15s; }
        .nav-a:hover { color: #fff; background: rgba(255,255,255,0.04); }
        .nav-a.active { color: var(--gold-lt); border-left-color: var(--gold); background: rgba(201,148,26,0.08); }
        .nav-ic { font-size: 13px; width: 18px; text-align: center; }
        .sb-bottom { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); }

        /* ── Main ── */
        .main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          overflow-y: auto;
        }

        /* ── Done card ── */
        .done-card {
          width: 100%;
          max-width: 520px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(27,94,48,0.07);
        }

        .done-head {
          background: var(--green-dark);
          padding: 28px 32px 24px;
          text-align: center;
        }

        .done-head .wordmark {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 20px;
          display: block;
        }

        .score-ring { width: 120px; height: 120px; margin: 0 auto 12px; position: relative; }
        .score-ring svg { transform: rotate(-90deg); }
        .score-ring circle { fill: none; stroke-width: 8; stroke-linecap: round; }
        .score-ring .bg { stroke: rgba(255,255,255,0.1); }
        .score-ring .fg { transition: stroke-dashoffset 1s ease; }
        .score-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-pct { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; color: var(--white); line-height: 1; }
        .score-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-top: 2px; }
        .score-sub { font-size: 13px; color: rgba(255,255,255,0.5); }

        .done-body { padding: 28px 32px 32px; }

        .accent-bar { width: 40px; height: 3px; background: linear-gradient(90deg, var(--green) 0%, var(--gold) 50%, var(--crimson) 100%); border-radius: 99px; margin: 0 auto 20px; }

        .mastery-badge { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 10px; margin-bottom: 16px; border: 1px solid; }
        .mastery-icon { font-size: 22px; flex-shrink: 0; }
        .mastery-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
        .mastery-msg { font-size: 13px; color: var(--text-soft); line-height: 1.5; }

        .next-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--cream); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 24px; }
        .next-row .lbl { font-size: 12px; color: var(--text-soft); }
        .next-row .val { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 600; color: var(--green-dark); }

        .btn-primary { display: block; width: 100%; padding: 14px; background: var(--green-dark); color: var(--white); border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; text-align: center; margin-bottom: 10px; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.88; }
        .btn-ghost { display: block; width: 100%; padding: 13px; background: transparent; color: var(--text-soft); border: 1px solid var(--border); border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; text-align: center; transition: border-color 0.15s, color 0.15s; }
        .btn-ghost:hover { border-color: var(--green); color: var(--green); }

        /* ── State screens ── */
        .state-screen { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; text-align: center; padding: 24px; }
        .state-screen p { color: var(--text-soft); font-size: 14px; }
        .spinner { width: 36px; height: 36px; border: 3px solid var(--cream2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .layout { flex-direction: column; }
          .sidebar { width: 100%; min-width: unset; height: auto; position: static; }
          .main { padding: 24px 20px; align-items: flex-start; }
        }
      `}</style>

      <div className="layout">
        {/* ── Sidebar ── */}
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
            <div className="sb-avatar">{initials}</div>
            <div className="sb-name">{sidebar?.full_name ?? '—'}</div>
            <div className="sb-meta">{sidebar?.section_name ?? 'Grade 6'}</div>
            <span className="sb-role">Student</span>
          </div>
          <nav className="sb-nav">
            <div className="nav-lbl">Menu</div>
            <a href="/student" className="nav-a">
              <span className="nav-ic">◈</span> My Skills
            </a>
            <a href="/student/quiz" className="nav-a active">
              <span className="nav-ic">◉</span> My Quiz
            </a>
          </nav>
          <div className="sb-bottom">
            <LogoutButton />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <p>Calculating results…</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-screen">
              <p style={{ color: 'var(--crimson)' }}>{error}</p>
              <button className="btn-primary" onClick={() => router.push('/student')} style={{ maxWidth: 200 }}>
                Back to Dashboard
              </button>
            </div>
          )}

          {!loading && !error && result && cfg && (
            <div className="done-card">
              {/* Header — score ring */}
              <div className="done-head">
                <span className="wordmark">LINURI</span>
                <div className="score-ring">
                  {(() => {
                    const r = 52;
                    const circ = 2 * Math.PI * r;
                    const offset = circ - (score / 100) * circ;
                    const strokeColor =
                      score >= 80 ? '#3ecf8e'
                      : score >= 65 ? 'var(--gold-lt)'
                      : '#f26d6d';
                    return (
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle className="bg" cx="60" cy="60" r={r} />
                        <circle
                          className="fg"
                          cx="60" cy="60" r={r}
                          strokeDasharray={circ}
                          strokeDashoffset={offset}
                          style={{ stroke: strokeColor }}
                        />
                      </svg>
                    );
                  })()}
                  <div className="score-num">
                    <span className="score-pct">{score}%</span>
                    <span className="score-label">Score</span>
                  </div>
                </div>
                <p className="score-sub">{correct} out of {total} correct</p>
              </div>

              {/* Body */}
              <div className="done-body">
                <div className="accent-bar" />

                <div
                  className="mastery-badge"
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  <span className="mastery-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
                  <div>
                    <div className="mastery-label" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="mastery-msg">{cfg.message}</div>
                  </div>
                </div>

                <div className="next-row">
                  <span className="lbl">Next difficulty</span>
                  <span className="val">{DIFFICULTY_LABEL[result.next_difficulty]}</span>
                </div>

                <button
                  className="btn-primary"
                  onClick={() =>
                    router.push(`/student/quiz?skillId=${skillId}&difficulty=${result.next_difficulty}`)
                  }
                >
                  Practice Again
                </button>
                <button className="btn-ghost" onClick={() => router.push('/student')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}