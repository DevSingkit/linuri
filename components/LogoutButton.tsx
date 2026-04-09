'use client'

export default function LogoutButton({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
      }}
      style={{
        width: '100%',
        padding: '9px 14px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '6px',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
        ...style,
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
        (e.target as HTMLButtonElement).style.color = '#fff';
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
        (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
      }}
    >
      ⇤ Sign out
    </button>
  )
}