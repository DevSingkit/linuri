'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/client';
import LogoutButton from '@/components/LogoutButton';

const SECONDS_PER_QUESTION = 60;

type Question = {
  id: string;
  stem: string;
  options: string[];
  correct_index: number;
};

type Answer = {
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  time_spent: number;
};

type SidebarData = {
  full_name: string;
  section_name: string;
};

export default function QuizPage() {
  const router = useRouter();
  const params = useSearchParams();
  const skillId = params.get('skillId') ?? '';
  const difficulty = (params.get('difficulty') ?? 'basic') as 'basic' | 'standard' | 'advanced';

  const supabase = createClient();

  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const questionStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load sidebar profile ────────────────────────────────────────
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

  // ── Load questions ──────────────────────────────────────────────
  useEffect(() => {
    if (!skillId) return;
    async function load() {
      setLoading(true);
      const countCol =
        difficulty === 'basic' ? 'count_basic'
        : difficulty === 'standard' ? 'count_standard'
        : 'count_advanced';

      const { data: lesson } = await supabase
        .from('lessons')
        .select(`id, ${countCol}`)
        .eq('skill_id', skillId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const limit: number = lesson?.[countCol as keyof typeof lesson] ?? 10;

      const { data: rows, error: qErr } = await supabase
        .from('questions')
        .select('id, stem, options, correct_index')
        .eq('skill_id', skillId)
        .eq('difficulty', difficulty)
        .eq('status', 'approved')
        .limit(limit);

      if (qErr || !rows || rows.length === 0) {
        setError('No approved questions found for this skill and difficulty.');
        setLoading(false);
        return;
      }

      setQuestions(rows as Question[]);
      setLoading(false);
    }
    load();
  }, [skillId, difficulty]);

  // ── Timer ────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    const q = questions[current];
    const record: Answer = {
      question_id: q.id,
      selected_index: -1,
      is_correct: false,
      time_spent: SECONDS_PER_QUESTION,
    };
    const next = [...answers, record];
    setAnswers(next);
    setSelected(null);

    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
      questionStartRef.current = Date.now();
    } else {
      submitQuiz(next);
    }
  }, [current, questions, answers]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return SECONDS_PER_QUESTION;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [current, loading, questions.length]);

  // ── Submit quiz ─────────────────────────────────────────────────
  async function submitQuiz(finalAnswers: Answer[]) {
    setSubmitting(true);
    clearInterval(timerRef.current!);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const correct = finalAnswers.filter(a => a.is_correct).length;
    const total = finalAnswers.length;
    const score = Math.round((correct / total) * 100);
    const avg_time = Math.round(
      finalAnswers.reduce((s, a) => s + a.time_spent, 0) / total
    );

    const { data: attempt, error: aErr } = await supabase
      .from('attempts')
      .insert({ student_id: user.id, skill_id: skillId, difficulty, score, total, avg_time })
      .select('id')
      .single();

    if (aErr || !attempt) {
      setError('Failed to save attempt. Please try again.');
      setSubmitting(false);
      return;
    }

    const answerRows = finalAnswers.map(a => ({
      attempt_id: attempt.id,
      question_id: a.question_id,
      selected_index: a.selected_index,
      is_correct: a.is_correct,
      time_spent: a.time_spent,
    }));

    await supabase.from('answers').insert(answerRows);
    router.push(`/student/quiz/done?attemptId=${attempt.id}`);
  }

  // ── Choose answer ───────────────────────────────────────────────
  function choose(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    clearInterval(timerRef.current!);

    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    const q = questions[current];
    const record: Answer = {
      question_id: q.id,
      selected_index: idx,
      is_correct: idx === q.correct_index,
      time_spent: elapsed,
    };

    const next = [...answers, record];
    setAnswers(next);

    setTimeout(() => {
      setSelected(null);
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setTimeLeft(SECONDS_PER_QUESTION);
        questionStartRef.current = Date.now();
      } else {
        submitQuiz(next);
      }
    }, 900);
  }

  // ── Derived ─────────────────────────────────────────────────────
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;
  const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const timerColor = timeLeft > 20 ? 'var(--green)' : timeLeft > 10 ? 'var(--gold)' : 'var(--crimson)';
  const q = questions[current];
  const difficultyLabel: Record<string, string> = { basic: 'Basic', standard: 'Standard', advanced: 'Advanced' };
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

        /* ── Main quiz area ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 48px 64px;
          overflow-y: auto;
        }

        /* Top progress bar row */
        .top-bar {
          width: 100%;
          max-width: 680px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }

        .top-bar .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          flex-shrink: 0;
        }

        .progress-track {
          flex: 1;
          height: 5px;
          background: var(--cream2);
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green) 0%, var(--gold) 100%);
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        .q-count {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-soft);
          flex-shrink: 0;
          min-width: 52px;
          text-align: right;
        }

        /* ── Quiz card ── */
        .quiz-card {
          width: 100%;
          max-width: 680px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(27,94,48,0.07);
        }

        .card-head {
          background: var(--green-dark);
          padding: 20px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .difficulty-pill {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
          border: 1px solid var(--gold);
          color: var(--gold-lt);
        }

        .timer-wrap { display: flex; align-items: center; gap: 10px; }
        .timer-ring { position: relative; width: 48px; height: 48px; }
        .timer-ring svg { transform: rotate(-90deg); }
        .timer-ring circle { fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.5s; }
        .timer-ring .bg { stroke: rgba(255,255,255,0.1); }
        .timer-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 600; color: var(--gold-lt); }

        .card-body { padding: 32px 28px 28px; }

        .q-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--crimson); margin-bottom: 10px; }
        .q-stem { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; line-height: 1.5; color: var(--text); margin-bottom: 28px; }

        .options { display: flex; flex-direction: column; gap: 10px; }

        .option-btn {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 10px;
          border: 1.5px solid var(--border); background: var(--cream);
          cursor: pointer; text-align: left;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text);
        }
        .option-btn:hover:not(:disabled) { border-color: var(--green); background: rgba(27,94,48,0.04); transform: translateX(2px); }
        .option-btn:disabled { cursor: default; }
        .option-btn.correct { border-color: var(--green); background: rgba(27,94,48,0.08); }
        .option-btn.wrong { border-color: var(--crimson); background: rgba(139,26,26,0.06); }

        .option-letter {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--cream2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: var(--text-soft);
          flex-shrink: 0; transition: background 0.15s, color 0.15s;
        }
        .option-btn.correct .option-letter { background: var(--green); color: var(--white); border-color: var(--green); }
        .option-btn.wrong .option-letter { background: var(--crimson); color: var(--white); border-color: var(--crimson); }

        /* ── State screens ── */
        .state-screen {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 12px; text-align: center; padding: 24px;
        }
        .state-screen h2 { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--green-dark); }
        .state-screen p { color: var(--text-soft); font-size: 14px; }

        .spinner { width: 36px; height: 36px; border: 3px solid var(--cream2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .accent-bar { width: 48px; height: 3px; background: linear-gradient(90deg, var(--green) 0%, var(--gold) 50%, var(--crimson) 100%); border-radius: 99px; margin: 0 auto 8px; }

        .back-btn {
          margin-top: 16px; padding: 10px 24px;
          background: var(--green-dark); color: #fff;
          border: none; border-radius: 8px;
          cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px;
        }
        .back-btn:hover { background: var(--green); }

        @media (max-width: 768px) {
          .layout { flex-direction: column; }
          .sidebar { width: 100%; min-width: unset; height: auto; position: static; }
          .main { padding: 24px 20px; }
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

        {/* ── Main content ── */}
        <main className="main">
          {loading && (
            <div className="state-screen">
              <div className="spinner" />
              <p>Loading questions…</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-screen">
              <div className="accent-bar" />
              <h2>Oops</h2>
              <p>{error}</p>
              <button className="back-btn" onClick={() => router.push('/student')}>
                Back to Dashboard
              </button>
            </div>
          )}

          {submitting && (
            <div className="state-screen">
              <div className="spinner" />
              <p>Saving your answers…</p>
            </div>
          )}

          {!loading && !error && !submitting && q && (
            <>
              {/* Progress row */}
              <div className="top-bar">
                <span className="page-title">Quiz</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="q-count">{current + 1} / {questions.length}</span>
              </div>

              {/* Card */}
              <div className="quiz-card">
                <div className="card-head">
                  <span className="difficulty-pill">{difficultyLabel[difficulty]}</span>
                  <div className="timer-wrap">
                    <div className="timer-ring">
                      {(() => {
                        const r = 20;
                        const circ = 2 * Math.PI * r;
                        const offset = circ - (timerPct / 100) * circ;
                        return (
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            <circle className="bg" cx="24" cy="24" r={r} />
                            <circle
                              className="fg"
                              cx="24" cy="24" r={r}
                              strokeDasharray={circ}
                              strokeDashoffset={offset}
                              style={{ stroke: timerColor }}
                            />
                          </svg>
                        );
                      })()}
                      <span className="timer-num">{timeLeft}</span>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="q-label">Question {current + 1}</div>
                  <p className="q-stem">{q.stem}</p>
                  <div className="options">
                    {(q.options as string[]).map((opt, i) => {
                      let cls = 'option-btn';
                      if (selected !== null) {
                        if (i === q.correct_index) cls += ' correct';
                        else if (i === selected) cls += ' wrong';
                      }
                      return (
                        <button
                          key={i}
                          className={cls}
                          disabled={selected !== null}
                          onClick={() => choose(i)}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}