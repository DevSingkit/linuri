'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/client'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [fullName, setFullName] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => { if (data) setFullName(data.full_name) })
    })
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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
          --gold:       #c9941a;
          --gold-lt:    #e8b84b;
          --gold-pale:  #f5e6c0;
          --cream:      #faf6ee;
          --cream2:     #f0e9d8;
          --white:      #ffffff;
          --text:       #1a1a1a;
          --text-soft:  #6b6b6b;
          --border:     rgba(27,94,48,0.15);
          --sidebar-w:  240px;
        }

        html, body { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--text); }

        .shell { display: flex; min-height: 100vh; }

        /* ── SIDEBAR ── */
        .sidebar {
          width: var(--sidebar-w);
          min-width: var(--sidebar-w);
          background: var(--green-dark);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          border-right: 1px solid rgba(201,148,26,0.15);
          transition: width 0.2s;
          overflow: hidden;
        }

        /* Decorative ring */
        .sidebar::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          border: 1px solid rgba(201,148,26,0.06);
          bottom: -120px; right: -120px;
          pointer-events: none;
        }

        .sidebar-top {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(201,148,26,0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .sidebar-logo {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid var(--gold);
          object-fit: cover;
          flex-shrink: 0;
        }

        .sidebar-brand {
          overflow: hidden;
        }

        .sidebar-wordmark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--white);
          letter-spacing: 3px;
          white-space: nowrap;
        }

        .sidebar-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 1px;
          white-space: nowrap;
          margin-top: 1px;
        }

        /* User block */
        .sidebar-user {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(201,148,26,0.1);
          flex-shrink: 0;
        }

        .sidebar-user-label {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .sidebar-user-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--gold-lt);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-role-pill {
          display: inline-block;
          margin-top: 6px;
          background: rgba(201,148,26,0.12);
          border: 1px solid rgba(201,148,26,0.25);
          color: var(--gold-lt);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 12px 8px 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 400;
          transition: all 0.15s;
          margin-bottom: 2px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: var(--white);
        }

        .nav-item.active {
          background: rgba(201,148,26,0.12);
          color: var(--gold-lt);
          border: 1px solid rgba(201,148,26,0.2);
        }

        .nav-icon {
          font-size: 15px;
          flex-shrink: 0;
          width: 18px;
          text-align: center;
        }

        .nav-label { white-space: nowrap; }

        /* Sidebar bottom */
        .sidebar-bottom {
          padding: 16px 12px;
          border-top: 1px solid rgba(201,148,26,0.1);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .btn-logout:hover {
          background: rgba(139,26,26,0.2);
          border-color: rgba(139,26,26,0.4);
          color: #f26d6d;
        }

        /* ── MAIN CONTENT ── */
        .main {
          margin-left: var(--sidebar-w);
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Topbar inside main */
        .topbar {
          background: var(--white);
          border-bottom: 1px solid var(--border);
          padding: 0 40px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .topbar-breadcrumb {
          font-size: 13px;
          color: var(--text-soft);
          font-weight: 300;
        }

        .topbar-breadcrumb strong {
          color: var(--green-dark);
          font-weight: 600;
        }

        .content { flex: 1; padding: 40px; }

        @media (max-width: 768px) {
          .sidebar { width: 0; min-width: 0; }
          .main { margin-left: 0; }
          .content { padding: 24px 20px; }
        }
      `}</style>

      <div className="shell">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <img src="/logo.png" alt="UMCLS" className="sidebar-logo" />
            <div className="sidebar-brand">
              <div className="sidebar-wordmark">LINURI</div>
              <div className="sidebar-sub">Teacher Portal</div>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-user-label">Signed in as</div>
            <div className="sidebar-user-name">{fullName || '—'}</div>
            <div className="sidebar-role-pill">Teacher</div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Main</div>

            <a href="/teacher" className={`nav-item ${pathname === '/teacher' ? 'active' : ''}`}>
              <span className="nav-icon">🏫</span>
              <span className="nav-label">My Classrooms</span>
            </a>

            <div className="nav-section-label" style={{ marginTop: '500px' }}>Account</div>

            <button className="nav-item btn-logout" onClick={handleLogout}>
              <span className="nav-icon">→</span>
              <span className="nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <div className="content">
            {children}
          </div>
        </div>

      </div>
    </>
  )
}