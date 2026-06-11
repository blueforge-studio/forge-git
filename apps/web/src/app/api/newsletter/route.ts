import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // TODO: wire to a real newsletter provider (Resend, ConvertKit, etc.)
    console.log('[newsletter] subscription:', email)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
