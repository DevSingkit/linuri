import { createClient } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  await (await supabase).auth.signOut()

  const url = new URL('/login', request.url)
  return NextResponse.redirect(url)
}