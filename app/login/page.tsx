'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
  if (!email || !password) { setError('Please fill in all fields.'); return }
  setLoading(true)
  setError('')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { setError(error.message); setLoading(false); return }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    setError('Account found but no profile exists. Contact your administrator.')
    setLoading(false)
    return
  }

  // Refresh the router first so middleware picks up the new session cookie
  router.refresh()

  if (profile.role === 'teacher') router.replace('/teacher')
  else if (profile.role === 'student') router.replace('/student')
  else {
    setError(`Unknown role "${profile.role}". Contact your administrator.`)
    setLoading(false)
  }
}
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:      #1b5e30;
          --green-dark: #0d3a1b;
          --green-mid:  #2d7a45;
          --crimson:    #8b1a1a;
          --crimson-lt: #b02020;
          --gold:       #c9941a;
          --gold-lt:    #e8b84b;
          --gold-pale:  #f5e6c0;
          --cream:      #faf6ee;
          --cream2:     #f0e9d8;
          --white:      #ffffff;
          --text:       #1a1a1a;
          --text-soft:  #6b6b6b;
          --border:     rgba(27,94,48,0.15);
        }

        html, body { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); }

        .shell {
          display: flex;
          min-height: 100vh;
        }

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

        .stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 100%;
          margin-top: 6px;
        }

        .stat-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,148,26,0.12);
          border-radius: 8px;
          padding: 14px 8px;
          text-align: center;
        }

        .stat-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gold-lt);
          line-height: 1;
        }

        .stat-l {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
          letter-spacing: 0.3px;
        }

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

        /* subtle decorative circle top-right, matching hero style */
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

        /* Gold-green-crimson accent bar — same gradient as page.tsx footer strip */
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

        .form-eyebrow-line {
          width: 24px; height: 2px;
          background: var(--crimson);
        }

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

        .form-heading em {
          font-style: italic;
          color: var(--crimson);
        }

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

        .field { margin-bottom: 22px; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 9px;
        }

        .field input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: var(--text);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .field input::placeholder { color: #b8b0a4; }

        .field input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(27,94,48,0.1);
        }

        .field input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px var(--white) inset;
          -webkit-text-fill-color: var(--text);
        }

        .btn-signin {
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
          margin-top: 4px;
        }

        .btn-signin:hover:not(:disabled) { background: var(--green); }
        .btn-signin:active:not(:disabled) { transform: scale(0.99); }
        .btn-signin:disabled { opacity: 0.55; cursor: not-allowed; }

        .register-row {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: var(--text-soft);
          font-weight: 300;
        }

        .register-row a {
          color: var(--green);
          font-weight: 600;
          text-decoration: none;
        }

        .register-row a:hover { text-decoration: underline; }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-soft);
          text-decoration: none;
          font-weight: 300;
          transition: color 0.2s;
        }

        .back-link:hover { color: var(--green); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .shell { flex-direction: column; }
          .panel-left { width: 100%; min-width: unset; padding: 48px 32px; }
          .logo-ring { width: 120px; height: 120px; }
          .linuri-wordmark { font-size: 40px; }
          .panel-right { padding: 48px 32px; }
        }

        @media (max-width: 480px) {
          .panel-right { padding: 40px 24px; }
          .form-heading { font-size: 32px; }
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

            <div className="stat-row">
              {[
                { n: '3', l: 'Subjects' },
                { n: 'AI', l: 'Powered' },
                { n: 'K–12', l: 'School' },
              ].map(s => (
                <div key={s.l} className="stat-box">
                  <div className="stat-n">{s.n}</div>
                  <div className="stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="panel-right">
          <div className="form-wrap">

            <div className="accent-bar" />

            <div className="form-eyebrow">
              <div className="form-eyebrow-line" />
              <span className="form-eyebrow-text">Secure Access</span>
            </div>

            <h1 className="form-heading">
              Welcome<br /><em>back.</em>
            </h1>
            <p className="form-sub">Sign in to your LINURI account to continue.</p>

            {error && <div className="error-box">{error}</div>}

            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@umcls.edu.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              className="btn-signin"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="register-row">
              No account yet?{' '}
              <a href="/auth/register">Create one here</a>
            </div>

            <a href="/" className="back-link">
              ← Back to school website
            </a>

          </div>
        </div>

      </div>
    </>
  )
}