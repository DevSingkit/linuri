import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  )

  const { code } = await request.json()
  console.log('1. Code received:', code)

  if (!code) {
    return NextResponse.json({ error: 'Join code is required.' }, { status: 400 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('2. User:', user?.id ?? 'NULL', '| Auth error:', authError?.message ?? 'none')

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: sections, error: sectionError } = await supabase
    .from('sections')
    .select('id, join_code')
    .eq('join_code', code.trim().toUpperCase())

  console.log('3. Sections found:', JSON.stringify(sections), '| error:', sectionError?.message ?? 'none')

  const section = sections?.[0] ?? null

  if (sectionError || !section) {
    return NextResponse.json({ error: 'Invalid join code. Please check with your teacher.' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ section_id: section.id })
    .eq('id', user.id)

  console.log('4. Update error:', updateError?.message ?? 'none')

  if (updateError) {
    return NextResponse.json({ error: 'Failed to join class. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ section_id: section.id })
}