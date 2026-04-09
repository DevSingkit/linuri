'use client'

export default function LogoutButton({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
      }}
      style={style}
    >
      Sign out
    </button>
  )
}