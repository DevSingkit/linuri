'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [fullName, setFullName] = useState('')
  const [lrn, setLrn] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister() {
    setError('')
    if (!fullName || !email || !password || !confirm) { setError('Please fill in all fields.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (role === 'student' && !lrn) { setError('LRN is required for students.'); return }
    if (role === 'student' && lrn.length !== 12) { setError('LRN must be exactly 12 digits.'); return }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          ...(role === 'student' ? { lrn } : {}),
        }
      }
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Teacher goes straight to login
    // Student goes to /join to enter their section join code
    if (role === 'teacher') router.push('/login')
    else router.push('/join')
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
          width: 400px;
          min-width: 400px;
          background: var(--green-dark);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 40px;
          position: relative;
          overflow: hidden;
        }

        .panel-left::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.07);
          top: -160px; right: -200px;
          pointer-events: none;
        }

        .panel-left::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.05);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .left-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
          width: 100%;
        }

        .logo-ring {
          width: 140px; height: 140px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          box-shadow: 0 0 0 8px rgba(201,148,26,0.07);
          object-fit: cover;
        }

        .school-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--gold-lt);
          line-height: 1.5;
        }

        .gold-divider {
          width: 48px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .linuri-wordmark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
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

        /* role indicator — updates with state */
        .role-indicator {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,148,26,0.15);
          border-radius: 10px;
          padding: 16px;
          margin-top: 8px;
        }

        .role-indicator-label {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 6px;
        }

        .role-indicator-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--gold-lt);
        }

        .role-indicator-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
          font-weight: 300;
          line-height: 1.5;
        }

        /* ── RIGHT PANEL ── */
        .panel-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px;
          background: var(--cream);
          position: relative;
          overflow-y: auto;
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
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, var(--green), var(--gold), var(--crimson));
          border-radius: 2px;
          margin-bottom: 36px;
        }

        .form-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
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
          font-size: 38px;
          font-weight: 700;
          color: var(--green-dark);
          line-height: 1.08;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .form-heading em { font-style: italic; color: var(--crimson); }

        .form-sub {
          font-size: 14px;
          color: var(--text-soft);
          font-weight: 300;
          margin-bottom: 28px;
          line-height: 1.6;
        }

        /* Role toggle */
        .role-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 28px;
        }

        .role-btn {
          padding: 12px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--white);
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .role-btn-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-soft);
          display: block;
          margin-bottom: 2px;
          transition: color 0.2s;
        }

        .role-btn-sub {
          font-size: 11px;
          color: #b0a898;
          font-weight: 300;
          transition: color 0.2s;
        }

        .role-btn.active {
          border-color: var(--green);
          background: rgba(27,94,48,0.05);
          box-shadow: 0 0 0 3px rgba(27,94,48,0.08);
        }

        .role-btn.active .role-btn-title { color: var(--green-dark); }
        .role-btn.active .role-btn-sub { color: var(--green); }

        .error-box {
          background: rgba(139,26,26,0.07);
          border: 1px solid rgba(139,26,26,0.22);
          border-left: 3px solid var(--crimson);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--crimson);
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .field { margin-bottom: 18px; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 8px;
        }

        .field input {
          width: 100%;
          padding: 12px 16px;
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

        .field-hint {
          font-size: 11px;
          color: #b0a898;
          margin-top: 5px;
          font-weight: 300;
        }

        .btn-register {
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
          margin-top: 6px;
        }

        .btn-register:hover:not(:disabled) { background: var(--green); }
        .btn-register:active:not(:disabled) { transform: scale(0.99); }
        .btn-register:disabled { opacity: 0.55; cursor: not-allowed; }

        .login-row {
          margin-top: 22px;
          text-align: center;
          font-size: 14px;
          color: var(--text-soft);
          font-weight: 300;
        }

        .login-row a {
          color: var(--green);
          font-weight: 600;
          text-decoration: none;
        }

        .login-row a:hover { text-decoration: underline; }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 32px;
          padding-top: 22px;
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
          .form-heading { font-size: 30px; }
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

            {/* Live role indicator — updates as user selects */}
            <div className="role-indicator">
              <div className="role-indicator-label">Registering as</div>
              <div className="role-indicator-value">
                {role === 'teacher' ? 'Teacher' : 'Student'}
              </div>
              <div className="role-indicator-desc">
                {role === 'teacher'
                  ? 'You will manage lessons, generate questions, and monitor student progress.'
                  : 'You will take quizzes and track your mastery across skills.'}
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
              <span className="form-eyebrow-text">Create Account</span>
            </div>

            <h1 className="form-heading">
              Join<br /><em>LINURI.</em>
            </h1>
            <p className="form-sub">Choose your role and fill in your details to get started.</p>

            {/* Role toggle */}
            <div className="role-toggle">
              <button
                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
                type="button"
              >
                <span className="role-btn-title">Student</span>
                <span className="role-btn-sub">Takes quizzes</span>
              </button>
              <button
                className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => setRole('teacher')}
                type="button"
              >
                <span className="role-btn-title">Teacher</span>
                <span className="role-btn-sub">Manages class</span>
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Juan dela Cruz"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            {/* LRN only shows for students */}
            {role === 'student' && (
              <div className="field">
                <label>LRN</label>
                <input
                  type="text"
                  placeholder="123456789012"
                  value={lrn}
                  maxLength={12}
                  onChange={e => setLrn(e.target.value.replace(/\D/g, ''))}
                />
                <div className="field-hint">12-digit Learner Reference Number</div>
              </div>
            )}

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@umcls.edu.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="field-hint">Minimum 6 characters</div>
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>

            <button
              className="btn-register"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <div className="login-row">
              Already have an account?{' '}
              <a href="/login">Sign in here</a>
            </div>

            <a href="/" className="back-link">← Back to school website</a>

          </div>
        </div>

      </div>
    </>
  )
}