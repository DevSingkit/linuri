'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter your join code.'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Invalid join code. Please check with your teacher.')
      setLoading(false)
      return
    }
router.refresh()
router.push('/student')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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

        html, body { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); }

        .shell { display: flex; min-height: 100vh; }

        /* ── LEFT PANEL ── */
        .panel-left {
          width: 440px;
          min-width: 440px;
          background: var(--green-dark);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 48px;
          position: relative;
          overflow: hidden;
        }

        .panel-left::before {
          content: '';
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.07);
          top: -180px; right: -220px;
          pointer-events: none;
        }

        .panel-left::after {
          content: '';
          position: absolute;
          width: 460px; height: 460px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.05);
          bottom: -120px; left: -120px;
          pointer-events: none;
        }

        .left-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 22px;
          width: 100%;
        }

        .logo-ring {
          width: 156px; height: 156px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          box-shadow: 0 0 0 8px rgba(201,148,26,0.07);
          object-fit: cover;
        }

        .school-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--gold-lt);
          line-height: 1.5;
          letter-spacing: 0.3px;
        }

        .gold-divider {
          width: 48px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .linuri-wordmark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          font-weight: 700;
          color: var(--white);
          letter-spacing: 8px;
          line-height: 1;
        }

        .linuri-full {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.5px;
          line-height: 1.8;
        }

        .grade-pill {
          display: inline-block;
          background: rgba(201,148,26,0.12);
          border: 1px solid rgba(201,148,26,0.28);
          color: var(--gold-lt);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 18px;
          border-radius: 20px;
        }

        /* Step indicator */
        .steps {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,148,26,0.1);
        }

        .step.active {
          background: rgba(201,148,26,0.1);
          border-color: rgba(201,148,26,0.3);
        }

        .step-num {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
        }

        .step.done .step-num {
          background: rgba(62,207,142,0.2);
          color: #3ecf8e;
        }

        .step.active .step-num {
          background: var(--gold);
          color: var(--green-dark);
        }

        .step-label {
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          font-weight: 300;
        }

        .step.done .step-label { color: rgba(255,255,255,0.5); }
        .step.active .step-label { color: var(--gold-lt); font-weight: 500; }

        /* ── RIGHT PANEL ── */
        .panel-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 56px;
          background: var(--cream);
          position: relative;
        }

        .panel-right::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          border: 1px solid rgba(27,94,48,0.06);
          top: -160px; right: -160px;
          pointer-events: none;
        }

        .form-wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, var(--green), var(--gold), var(--crimson));
          border-radius: 2px;
          margin-bottom: 40px;
        }

        .form-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .form-eyebrow-line { width: 24px; height: 2px; background: var(--crimson); }

        .form-eyebrow-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--crimson);
        }

        .form-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          font-weight: 700;
          color: var(--green-dark);
          line-height: 1.08;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .form-heading em { font-style: italic; color: var(--crimson); }

        .form-sub {
          font-size: 15px;
          color: var(--text-soft);
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .error-box {
          background: rgba(139,26,26,0.07);
          border: 1px solid rgba(139,26,26,0.22);
          border-left: 3px solid var(--crimson);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--crimson);
          font-size: 13px;
          margin-bottom: 22px;
          line-height: 1.5;
        }

        .field { margin-bottom: 28px; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 9px;
        }

        /* Big code input */
        .code-input {
          width: 100%;
          padding: 18px 20px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--green-dark);
          letter-spacing: 6px;
          text-align: center;
          text-transform: uppercase;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .code-input::placeholder {
          color: #d4ccc0;
          letter-spacing: 4px;
          font-weight: 400;
          font-size: 24px;
        }

        .code-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(27,94,48,0.1);
        }

        .field-hint {
          font-size: 12px;
          color: #b0a898;
          margin-top: 8px;
          text-align: center;
          font-weight: 300;
        }

        .btn-join {
          width: 100%;
          padding: 15px;
          background: var(--green-dark);
          color: var(--white);
          border: none;
          border-radius: 8px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-join:hover:not(:disabled) { background: var(--green); }
        .btn-join:active:not(:disabled) { transform: scale(0.99); }
        .btn-join:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Info card */
        .info-card {
          margin-top: 28px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .info-icon {
          width: 36px; height: 36px;
          background: rgba(27,94,48,0.08);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .info-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--green-dark);
          margin-bottom: 3px;
        }

        .info-desc {
          font-size: 12px;
          color: var(--text-soft);
          font-weight: 300;
          line-height: 1.6;
        }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-soft);
          text-decoration: none;
          font-weight: 300;
          transition: color 0.2s;
        }

        .back-link:hover { color: var(--green); }

        @media (max-width: 900px) {
          .shell { flex-direction: column; }
          .panel-left { width: 100%; min-width: unset; padding: 48px 32px; }
          .logo-ring { width: 110px; height: 110px; }
          .linuri-wordmark { font-size: 38px; }
          .panel-right { padding: 48px 32px; }
        }

        @media (max-width: 480px) {
          .panel-right { padding: 36px 20px; }
          .form-heading { font-size: 32px; }
          .code-input { font-size: 26px; letter-spacing: 4px; }
        }
      `}</style>

      <div className="shell">

        {/* ── LEFT PANEL ── */}
        <div className="panel-left">
          <div className="left-inner">
            <img src="/logo.png" alt="UMCLS Logo" className="logo-ring" />

            <div className="school-name">
              United Methodist Cooperative<br />Learning System, Inc.
            </div>

            <div className="gold-divider" />

            <div>
              <div className="linuri-wordmark">LINURI</div>
              <div className="linuri-full" style={{ marginTop: '10px' }}>
                Literacy and Numeracy<br />Readiness Indicator
              </div>
            </div>

            <div className="grade-pill">Grade 6 · Caloocan City · 2026</div>

            {/* Registration progress steps */}
            <div className="steps">
              <div className="step done">
                <div className="step-num">✓</div>
                <div className="step-label">Create your account</div>
              </div>
              <div className="step active">
                <div className="step-num">2</div>
                <div className="step-label">Enter your class join code</div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-label">Start learning</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="panel-right">
          <div className="form-wrap">

            <div className="accent-bar" />

            <div className="form-eyebrow">
              <div className="form-eyebrow-line" />
              <span className="form-eyebrow-text">Almost there</span>
            </div>

            <h1 className="form-heading">
              Join your<br /><em>class.</em>
            </h1>
            <p className="form-sub">
              Enter the join code your teacher gave you to link your account to your section.
            </p>

            {error && <div className="error-box">{error}</div>}

            <div className="field">
              <label>Class Join Code</label>
              <input
                className="code-input"
                type="text"
                placeholder="ABC123"
                value={code}
                maxLength={8}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
                autoComplete="off"
              />
              <div className="field-hint">Ask your teacher for this code</div>
            </div>

            <button
              className="btn-join"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining…' : 'Join Class'}
            </button>

            <div className="info-card">
              <div className="info-icon">💡</div>
              <div>
                <div className="info-title">Where do I get my join code?</div>
                <div className="info-desc">
                  Your teacher will share a unique code for your section. It is usually 6–8 characters. Contact your teacher if you have not received it yet.
                </div>
              </div>
            </div>

            <a href="/login" className="back-link">
              ← Back to sign in
            </a>

          </div>
        </div>

      </div>
    </>
  )
}